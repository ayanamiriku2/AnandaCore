use anyhow::Result;
use aws_sdk_s3::{
    config::{Credentials, Region},
    primitives::ByteStream,
    types::{CompletedMultipartUpload, CompletedPart},
    Client,
};
use std::path::Path;
use std::time::Duration;

use crate::config::AppConfig;

#[derive(Clone)]
pub struct StorageService {
    client: Client,
    bucket: String,
}

impl StorageService {
    pub async fn new(config: &AppConfig) -> Result<Self> {
        let creds = Credentials::new(
            &config.s3_access_key,
            &config.s3_secret_key,
            None,
            None,
            "env",
        );

        let s3_config = aws_sdk_s3::Config::builder()
            .behavior_version_latest()
            .endpoint_url(&config.s3_endpoint)
            .region(Region::new(config.s3_region.clone()))
            .credentials_provider(creds)
            .force_path_style(true)
            .build();

        let client = Client::from_conf(s3_config);

        // Ensure bucket exists
        let bucket = &config.s3_bucket;
        match client.head_bucket().bucket(bucket).send().await {
            Ok(_) => {}
            Err(_) => {
                client.create_bucket().bucket(bucket).send().await?;
                tracing::info!("Created S3 bucket: {}", bucket);
            }
        }

        Ok(Self {
            client,
            bucket: bucket.clone(),
        })
    }

    pub async fn upload(
        &self,
        key: &str,
        data: Vec<u8>,
        content_type: &str,
    ) -> Result<String> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(ByteStream::from(data))
            .content_type(content_type)
            .send()
            .await?;

        Ok(key.to_string())
    }

    pub async fn upload_from_path(
        &self,
        key: &str,
        path: &Path,
        content_type: &str,
    ) -> Result<String> {
        let body = ByteStream::from_path(path.to_path_buf()).await?;

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(body)
            .content_type(content_type)
            .send()
            .await?;

        Ok(key.to_string())
    }

    pub async fn start_multipart_upload(&self, key: &str, content_type: &str) -> Result<String> {
        let response = self
            .client
            .create_multipart_upload()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type)
            .send()
            .await?;

        Ok(response
            .upload_id()
            .ok_or_else(|| anyhow::anyhow!("S3 tidak mengembalikan upload_id"))?
            .to_string())
    }

    pub async fn upload_part(
        &self,
        key: &str,
        upload_id: &str,
        part_number: i32,
        data: Vec<u8>,
    ) -> Result<String> {
        let response = self
            .client
            .upload_part()
            .bucket(&self.bucket)
            .key(key)
            .upload_id(upload_id)
            .part_number(part_number)
            .body(ByteStream::from(data))
            .send()
            .await?;

        Ok(response
            .e_tag()
            .ok_or_else(|| anyhow::anyhow!("S3 tidak mengembalikan ETag untuk part {}", part_number))?
            .to_string())
    }

    pub async fn complete_multipart_upload(
        &self,
        key: &str,
        upload_id: &str,
        parts: Vec<(i32, String)>,
    ) -> Result<String> {
        let completed_parts = parts
            .into_iter()
            .map(|(part_number, etag)| {
                CompletedPart::builder()
                    .part_number(part_number)
                    .e_tag(etag)
                    .build()
            })
            .collect();

        let multipart_upload = CompletedMultipartUpload::builder()
            .set_parts(Some(completed_parts))
            .build();

        self.client
            .complete_multipart_upload()
            .bucket(&self.bucket)
            .key(key)
            .upload_id(upload_id)
            .multipart_upload(multipart_upload)
            .send()
            .await?;

        Ok(key.to_string())
    }

    pub async fn abort_multipart_upload(&self, key: &str, upload_id: &str) -> Result<()> {
        self.client
            .abort_multipart_upload()
            .bucket(&self.bucket)
            .key(key)
            .upload_id(upload_id)
            .send()
            .await?;

        Ok(())
    }

    pub async fn download(&self, key: &str) -> Result<Vec<u8>> {
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        let data = resp.body.collect().await?.into_bytes().to_vec();
        Ok(data)
    }

    /// For streaming large files without buffering to memory
    pub async fn get_object_stream(&self, key: &str) -> Result<aws_sdk_s3::primitives::ByteStream> {
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        Ok(resp.body)
    }

    pub async fn delete(&self, key: &str) -> Result<()> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;
        Ok(())
    }

    pub async fn get_presigned_url(&self, key: &str, _expires_in: Duration) -> Result<String> {
        // For MinIO/local dev, return a direct URL
        // In production, use presigned URLs via the S3 SDK presigning feature
        Ok(format!("/api/files/{}", key))
    }

    pub fn generate_key(module: &str, filename: &str) -> String {
        let id = uuid::Uuid::new_v4();
        let ext = std::path::Path::new(filename)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin");
        format!("{}/{}.{}", module, id, ext)
    }

    pub fn validate_file_type(mime: &str) -> bool {
        let allowed = [
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/rtf",
            "text/plain",
            "text/csv",
            "text/html",
            "application/json",
            "application/xml",
            "text/xml",
            // Archives
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/vnd.rar",
            "application/x-7z-compressed",
            "application/x-tar",
            "application/gzip",
            "application/x-gzip",
            "application/x-bzip2",
            "application/x-xz",
            // Images
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/bmp",
            "image/tiff",
            "image/heic",
            "image/heif",
            // Video
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/webm",
            "video/x-matroska",
            // Audio
            "audio/mpeg",
            "audio/wav",
            "audio/ogg",
            "audio/mp4",
            "audio/webm",
            "audio/flac",
        ];
        if allowed.contains(&mime) {
            return true;
        }
        // Also allow application/octet-stream for unknown binary files
        mime == "application/octet-stream"
    }

    pub fn max_file_size() -> usize {
        30 * 1024 * 1024 * 1024 // 30GB
    }
}
