use axum::extract::multipart::Field;
use std::time::Duration;

use crate::{errors::AppError, storage::StorageService};

// 32MB per part - larger parts = fewer HTTP requests, better for large files
const MULTIPART_PART_SIZE: usize = 32 * 1024 * 1024;
const MAX_RETRIES: u32 = 3;

pub async fn stream_field_to_storage(
    field: &mut Field<'_>,
    storage: &StorageService,
    key: &str,
    content_type: &str,
    max_upload_size: usize,
) -> Result<i64, AppError> {
    let upload_id = storage
        .start_multipart_upload(key, content_type)
        .await
        .map_err(|e| AppError::Internal(format!("Gagal memulai multipart upload: {}", e)))?;

    let mut total_size = 0usize;
    let mut part_number = 1i32;
    let mut buffer = Vec::with_capacity(MULTIPART_PART_SIZE * 2);
    let mut completed_parts = Vec::new();

    loop {
        let chunk = match field.chunk().await {
            Ok(chunk) => chunk,
            Err(e) => {
                let _ = storage.abort_multipart_upload(key, &upload_id).await;
                return Err(AppError::BadRequest(format!("Gagal membaca file: {}", e)));
            }
        };

        let Some(chunk) = chunk else {
            break;
        };

        total_size += chunk.len();
        if total_size > max_upload_size {
            let _ = storage.abort_multipart_upload(key, &upload_id).await;
            return Err(AppError::Validation("Ukuran file melebihi batas maksimum".into()));
        }

        buffer.extend_from_slice(&chunk);

        while buffer.len() >= MULTIPART_PART_SIZE {
            let remaining = buffer.split_off(MULTIPART_PART_SIZE);
            let part_data = std::mem::replace(&mut buffer, remaining);

            let etag = retry_upload_part(storage, key, &upload_id, part_number, part_data).await?;
            
            tracing::debug!("Part {} uploaded successfully (part_number={})", part_number, part_number);
            completed_parts.push((part_number, etag));
            part_number += 1;
        }
    }

    if total_size == 0 {
        let _ = storage.abort_multipart_upload(key, &upload_id).await;
        return Err(AppError::Validation("File kosong tidak diizinkan".into()));
    }

    if !buffer.is_empty() {
        let etag = retry_upload_part(storage, key, &upload_id, part_number, buffer).await?;
        tracing::debug!("Final part {} uploaded successfully", part_number);
        completed_parts.push((part_number, etag));
    }

    storage
        .complete_multipart_upload(key, &upload_id, completed_parts)
        .await
        .map_err(|e| AppError::Internal(format!("Gagal menyelesaikan multipart upload: {}", e)))?;

    tracing::info!("Upload selesai: key={}, total_size={}MB, total_parts={}", key, total_size / 1024 / 1024, part_number - 1);
    Ok(total_size as i64)
}

// Retry logic dengan exponential backoff untuk handle timeout/transient errors
async fn retry_upload_part(
    storage: &StorageService,
    key: &str,
    upload_id: &str,
    part_number: i32,
    data: Vec<u8>,
) -> Result<String, AppError> {
    let mut retry_count = 0;
    let part_size_mb = data.len() / 1024 / 1024;
    
    loop {
        match storage.upload_part(key, upload_id, part_number, data.clone()).await {
            Ok(etag) => {
                if retry_count > 0 {
                    tracing::info!("Part {} uploaded after {} retries", part_number, retry_count);
                }
                return Ok(etag);
            }
            Err(e) => {
                retry_count += 1;
                if retry_count >= MAX_RETRIES {
                    tracing::error!("Part {} failed after {} retries: {}", part_number, retry_count, e);
                    let _ = storage.abort_multipart_upload(key, upload_id).await;
                    return Err(AppError::Internal(format!(
                        "Gagal upload part {} ({} MB) setelah {} percobaan: {}",
                        part_number, part_size_mb, retry_count, e
                    )));
                }
                
                // Exponential backoff: 1s, 2s, 4s
                let backoff = Duration::from_secs(u64::pow(2, retry_count as u32 - 1));
                tracing::warn!("Part {} failed (attempt {}), retrying in {:?}: {}", part_number, retry_count, backoff, e);
                tokio::time::sleep(backoff).await;
            }
        }
    }
}