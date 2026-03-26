-- ============================================================
-- 004_nested_albums.sql — Add parent_album_id for nested folders
-- ============================================================

ALTER TABLE media_albums ADD COLUMN IF NOT EXISTS parent_album_id UUID REFERENCES media_albums(id);
CREATE INDEX IF NOT EXISTS idx_media_albums_parent ON media_albums (parent_album_id) WHERE deleted_at IS NULL;
