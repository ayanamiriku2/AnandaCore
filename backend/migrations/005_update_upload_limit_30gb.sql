-- ============================================================
-- 005_update_upload_limit_30gb.sql
-- Safe for existing production DBs: updates runtime setting only
-- ============================================================

INSERT INTO settings (key, value, value_type, description)
VALUES (
  'upload.max_size_mb',
  '30720',
  'number',
  'Ukuran maksimum upload file (MB)'
)
ON CONFLICT (key)
DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description;
