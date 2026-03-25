-- ============================================================
-- 003_enhancements.sql — Additive schema improvements
-- Safe for production: only ADDs columns/tables, never drops or renames
-- ============================================================

-- 1. Add title to letter_attachments (used by handler but missing from schema)
ALTER TABLE letter_attachments ADD COLUMN IF NOT EXISTS title VARCHAR(300);

-- 2. Add follow-up fields to partner_interactions
ALTER TABLE partner_interactions ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE partner_interactions ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- 3. Enrich partner_opportunities for BKK workflow
ALTER TABLE partner_opportunities ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE partner_opportunities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE partner_opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Add indexes for common filter patterns
CREATE INDEX IF NOT EXISTS idx_letters_type_status ON letters (letter_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents (category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_program ON activities (program_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities (activity_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries (status_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks (assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks (due_date) WHERE deleted_at IS NULL AND status != 'selesai';
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets (category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners (partner_type, pipeline_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs (module, created_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_album ON media_assets (album_id) WHERE deleted_at IS NULL;

-- ============================================================
-- Seed data for partner_opportunities (BKK feature)
-- ============================================================
INSERT INTO partner_opportunities (partner_id, opportunity_type, title, description, quota, deadline, status, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'magang', 'Program Magang IT Telkom Digital', 'Kesempatan magang di divisi Digital Technology PT Telkom Indonesia selama 3 bulan.', 5, '2026-06-30', 'dibuka', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000001', 'pelatihan', 'Pelatihan Cloud Computing', 'Pelatihan gratis cloud computing dasar untuk alumni binaan.', 20, '2026-04-15', 'dibuka', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000002', 'beasiswa', 'Beasiswa Pendidikan BNI 2026', 'Beasiswa pendidikan tinggi dari program CSR BNI.', 3, '2026-03-31', 'ditutup', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000003', 'kerja', 'Tenaga Pengajar Honorer SMK', 'Lowongan guru honorer bidang multimedia di SMKN 1 Bandung.', 2, '2026-05-01', 'dibuka', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000004', 'pelatihan', 'Workshop Kewirausahaan Sosial', 'Workshop kewirausahaan sosial bekerja sama dengan Rumah Zakat.', 15, '2026-07-01', 'dibuka', 'b0000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;
