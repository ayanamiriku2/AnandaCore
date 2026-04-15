use axum::extract::multipart::Field;

use crate::{errors::AppError, storage::StorageService};

const MULTIPART_PART_SIZE: usize = 8 * 1024 * 1024;

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

            let etag = match storage.upload_part(key, &upload_id, part_number, part_data).await {
                Ok(etag) => etag,
                Err(e) => {
                    let _ = storage.abort_multipart_upload(key, &upload_id).await;
                    return Err(AppError::Internal(format!("Gagal upload part {}: {}", part_number, e)));
                }
            };

            completed_parts.push((part_number, etag));
            part_number += 1;
        }
    }

    if total_size == 0 {
        let _ = storage.abort_multipart_upload(key, &upload_id).await;
        return Err(AppError::Validation("File kosong tidak diizinkan".into()));
    }

    if !buffer.is_empty() {
        let etag = storage
            .upload_part(key, &upload_id, part_number, buffer)
            .await
            .map_err(|e| AppError::Internal(format!("Gagal upload part terakhir: {}", e)))?;
        completed_parts.push((part_number, etag));
    }

    storage
        .complete_multipart_upload(key, &upload_id, completed_parts)
        .await
        .map_err(|e| AppError::Internal(format!("Gagal menyelesaikan multipart upload: {}", e)))?;

    Ok(total_size as i64)
}