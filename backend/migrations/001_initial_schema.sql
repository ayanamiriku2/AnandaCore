-- AnandaCore Database Schema
-- Yayasan Kasih Ananda Internal Platform
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- CORE: Users, Roles, Permissions
-- ============================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================
-- MASTER DATA
-- ============================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES document_categories(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE letter_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE program_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cooperation_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participant_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROGRAMS & ACTIVITIES
-- ============================================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300) NOT NULL,
    program_type_id UUID REFERENCES program_types(id),
    description TEXT,
    objectives TEXT,
    target_audience TEXT,
    department_id UUID REFERENCES departments(id),
    pic_user_id UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    budget_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_programs_status ON programs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_dept ON programs(department_id);

CREATE TABLE program_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(100) DEFAULT 'anggota',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(program_id, user_id)
);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id),
    activity_type_id UUID REFERENCES activity_types(id),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    location_id UUID REFERENCES locations(id),
    location_detail TEXT,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    pic_user_id UUID REFERENCES users(id),
    target_participants INT,
    actual_participants INT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    has_proposal BOOLEAN DEFAULT false,
    has_attendance BOOLEAN DEFAULT false,
    has_documentation BOOLEAN DEFAULT false,
    has_report BOOLEAN DEFAULT false,
    has_evaluation BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_activities_program ON activities(program_id);
CREATE INDEX idx_activities_date ON activities(activity_date);
CREATE INDEX idx_activities_status ON activities(status) WHERE deleted_at IS NULL;

-- ============================================================
-- DOCUMENT ARCHIVE
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    document_number VARCHAR(200),
    document_date DATE,
    archive_date DATE DEFAULT CURRENT_DATE,
    department_id UUID REFERENCES departments(id),
    program_id UUID REFERENCES programs(id),
    category_id UUID REFERENCES document_categories(id),
    confidentiality VARCHAR(50) NOT NULL DEFAULT 'internal',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    retention_type VARCHAR(50) DEFAULT '5_tahun',
    retention_until DATE,
    custom_review_date DATE,
    description TEXT,
    internal_notes TEXT,
    file_path TEXT,
    file_name VARCHAR(500),
    file_size BIGINT,
    file_mime VARCHAR(200),
    thumbnail_path TEXT,
    current_version INT DEFAULT 1,
    verification_status VARCHAR(50) DEFAULT 'belum_diverifikasi',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES users(id),
    responsible_user_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_dept ON documents(department_id);
CREATE INDEX idx_documents_status ON documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_search ON documents USING gin(
    to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(document_number, '') || ' ' || coalesce(description, ''))
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(500),
    file_size BIGINT,
    file_mime VARCHAR(200),
    change_notes TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_versions ON document_versions(document_id, version_number);

CREATE TABLE document_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

CREATE TABLE document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    related_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) DEFAULT 'terkait',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEDIA / DOCUMENTATION BACKUP
-- ============================================================

CREATE TABLE media_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    activity_id UUID REFERENCES activities(id),
    program_id UUID REFERENCES programs(id),
    album_date DATE,
    cover_image_path TEXT,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'aktif',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID REFERENCES media_albums(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES activities(id),
    title VARCHAR(300),
    description TEXT,
    media_type VARCHAR(50) NOT NULL, -- photo, video, poster, scan, document
    file_path TEXT NOT NULL,
    file_name VARCHAR(500),
    file_size BIGINT,
    file_mime VARCHAR(200),
    thumbnail_path TEXT,
    width INT,
    height INT,
    duration_seconds INT,
    is_featured BOOLEAN DEFAULT false,
    upload_status VARCHAR(50) DEFAULT 'completed',
    checksum VARCHAR(128),
    metadata_json JSONB,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_media_album ON media_assets(album_id);
CREATE INDEX idx_media_activity ON media_assets(activity_id);
CREATE INDEX idx_media_type ON media_assets(media_type);

-- ============================================================
-- LETTERS (SURAT MASUK / KELUAR)
-- ============================================================

CREATE TABLE letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_type VARCHAR(20) NOT NULL, -- masuk, keluar
    agenda_number VARCHAR(100),
    letter_number VARCHAR(200),
    letter_date DATE,
    received_date DATE,
    sent_date DATE,
    sender VARCHAR(300),
    recipient VARCHAR(300),
    subject TEXT NOT NULL,
    classification_id UUID REFERENCES letter_classifications(id),
    attachment_count INT DEFAULT 0,
    attachment_notes TEXT,
    file_path TEXT,
    file_name VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'diterima',
    follow_up_status VARCHAR(50) DEFAULT 'belum',
    follow_up_deadline DATE,
    follow_up_notes TEXT,
    responsible_user_id UUID REFERENCES users(id),
    created_by_user_id UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    department_id UUID REFERENCES departments(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_letters_type ON letters(letter_type);
CREATE INDEX idx_letters_date ON letters(letter_date);
CREATE INDEX idx_letters_status ON letters(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_letters_search ON letters USING gin(
    to_tsvector('indonesian', coalesce(subject, '') || ' ' || coalesce(letter_number, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(recipient, ''))
);

CREATE TABLE letter_dispositions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    instruction TEXT,
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'belum_dibaca',
    read_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispositions_letter ON letter_dispositions(letter_id);
CREATE INDEX idx_dispositions_to ON letter_dispositions(to_user_id);

CREATE TABLE letter_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(500),
    file_size BIGINT,
    file_mime VARCHAR(200),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARTNERS / BKK-LIKE MODULE
-- ============================================================

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300) NOT NULL,
    partner_type VARCHAR(100), -- perusahaan, lembaga, sekolah, instansi, ngo
    industry VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    website VARCHAR(300),
    email VARCHAR(255),
    phone VARCHAR(50),
    description TEXT,
    pipeline_status VARCHAR(50) NOT NULL DEFAULT 'prospek_baru',
    relationship_status VARCHAR(50) DEFAULT 'aktif',
    internal_notes TEXT,
    logo_path TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_partners_status ON partners(pipeline_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_partners_search ON partners USING gin(
    to_tsvector('indonesian', coalesce(name, '') || ' ' || coalesce(industry, '') || ' ' || coalesce(city, ''))
);

CREATE TABLE partner_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partnership_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    agreement_number VARCHAR(200),
    title VARCHAR(300) NOT NULL,
    cooperation_type_id UUID REFERENCES cooperation_types(id),
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'aktif',
    file_path TEXT,
    file_name VARCHAR(500),
    reminder_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_agreements_partner ON partnership_agreements(partner_id);
CREATE INDEX idx_agreements_expiry ON partnership_agreements(end_date);

CREATE TABLE partner_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    interaction_type VARCHAR(100), -- telepon, email, kunjungan, rapat, dll
    subject VARCHAR(300),
    description TEXT,
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partner_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    opportunity_type VARCHAR(100), -- kerja, pelatihan, beasiswa, magang
    title VARCHAR(300) NOT NULL,
    description TEXT,
    quota INT,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'dibuka',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BENEFICIARIES / STUDENTS / ALUMNI
-- ============================================================

CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(20),
    gender VARCHAR(20),
    birth_date DATE,
    birth_place VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    education_level VARCHAR(100),
    school_origin VARCHAR(300),
    status_id UUID REFERENCES participant_statuses(id),
    placement_status VARCHAR(100),
    placement_partner_id UUID REFERENCES partners(id),
    photo_path TEXT,
    internal_notes TEXT,
    registered_at DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_beneficiaries_status ON beneficiaries(status_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_beneficiaries_search ON beneficiaries USING gin(
    to_tsvector('indonesian', coalesce(full_name, '') || ' ' || coalesce(school_origin, '') || ' ' || coalesce(city, ''))
);

CREATE TABLE beneficiary_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    title VARCHAR(300),
    file_path TEXT,
    file_name VARCHAR(500),
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id),
    activity_id UUID REFERENCES activities(id),
    role VARCHAR(100) DEFAULT 'peserta',
    status VARCHAR(50) DEFAULT 'terdaftar',
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    certificate_path TEXT
);

CREATE INDEX idx_participation_beneficiary ON participation_records(beneficiary_id);
CREATE INDEX idx_participation_program ON participation_records(program_id);

CREATE TABLE beneficiary_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note_type VARCHAR(50) DEFAULT 'progress',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASKS, MEMOS, ANNOUNCEMENTS
-- ============================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) NOT NULL DEFAULT 'belum_mulai',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    file_path TEXT,
    file_name VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(due_date);

CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    department_id UUID REFERENCES departments(id),
    priority VARCHAR(50) DEFAULT 'normal',
    is_pinned BOOLEAN DEFAULT false,
    file_path TEXT,
    file_name VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE memo_recipients (
    memo_id UUID NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    read_at TIMESTAMPTZ,
    PRIMARY KEY (memo_id, user_id)
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    publish_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ASSETS & INVENTORY
-- ============================================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300) NOT NULL,
    asset_code VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES asset_categories(id),
    location_id UUID REFERENCES locations(id),
    department_id UUID REFERENCES departments(id),
    responsible_user_id UUID REFERENCES users(id),
    acquisition_date DATE,
    acquisition_value DECIMAL(15,2),
    condition VARCHAR(50) DEFAULT 'baik',
    status VARCHAR(50) DEFAULT 'aktif',
    description TEXT,
    photo_path TEXT,
    qr_code VARCHAR(200),
    notes TEXT,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_assets_code ON assets(asset_code);
CREATE INDEX idx_assets_category ON assets(category_id);

CREATE TABLE asset_mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    mutation_type VARCHAR(50) NOT NULL, -- pindah, perbaikan, penghapusan, peminjaman
    from_location_id UUID REFERENCES locations(id),
    to_location_id UUID REFERENCES locations(id),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    reason TEXT,
    mutation_date DATE DEFAULT CURRENT_DATE,
    document_path TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    title VARCHAR(300),
    file_path TEXT NOT NULL,
    file_name VARCHAR(500),
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB,
    file_path TEXT,
    file_name VARCHAR(500),
    file_format VARCHAR(20),
    status VARCHAR(50) DEFAULT 'generated',
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    message TEXT,
    notification_type VARCHAR(100),
    reference_type VARCHAR(100),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- BACKUP & AUDIT
-- ============================================================

CREATE TABLE backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(100) NOT NULL,
    source VARCHAR(200),
    destination VARCHAR(200),
    file_count INT,
    total_size BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    initiated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_backup_status ON backup_logs(status);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_module ON audit_logs(module);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- SETTINGS
-- ============================================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(200) NOT NULL UNIQUE,
    value TEXT,
    value_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SAVED SEARCHES
-- ============================================================

CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    module VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'current_schema'
        UNION
        SELECT unnest(ARRAY[
            'users','roles','departments','document_categories','letter_classifications',
            'activity_types','program_types','asset_categories','locations','cooperation_types',
            'programs','activities','documents','media_albums','media_assets','letters',
            'letter_dispositions','partners','partner_contacts','partnership_agreements',
            'beneficiaries','tasks','memos','announcements','assets'
        ])
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()', t, t);
    END LOOP;
END;
$$;
