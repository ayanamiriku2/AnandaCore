-- AnandaCore Seed Data
-- Yayasan Kasih Ananda - Realistic Indonesian Foundation Data
-- ============================================================

-- Roles
INSERT INTO roles (id, name, display_name, description, is_system) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'super_admin', 'Super Admin', 'Akses penuh ke semua modul dan fitur sistem', true),
  ('a0000000-0000-0000-0000-000000000002', 'pimpinan', 'Pimpinan Yayasan', 'Akses dashboard eksekutif dan persetujuan', true),
  ('a0000000-0000-0000-0000-000000000003', 'admin_yayasan', 'Admin Yayasan', 'Administrasi umum yayasan', true),
  ('a0000000-0000-0000-0000-000000000004', 'admin_program', 'Admin Program', 'Pengelolaan program dan kegiatan', true),
  ('a0000000-0000-0000-0000-000000000005', 'admin_arsip', 'Admin Arsip', 'Pengelolaan arsip dan dokumen', true),
  ('a0000000-0000-0000-0000-000000000006', 'admin_surat', 'Admin Surat', 'Pengelolaan surat masuk dan keluar', true),
  ('a0000000-0000-0000-0000-000000000007', 'admin_mitra', 'Admin Mitra / BKK', 'Pengelolaan hubungan mitra dan kemitraan', true),
  ('a0000000-0000-0000-0000-000000000008', 'dokumentasi', 'Staff Dokumentasi', 'Upload dan pengelolaan dokumentasi kegiatan', true),
  ('a0000000-0000-0000-0000-000000000009', 'viewer', 'Viewer / Auditor', 'Akses baca saja untuk audit dan peninjauan', true)
ON CONFLICT (name) DO NOTHING;

-- Permissions
INSERT INTO permissions (module, action, description) VALUES
  ('dashboard', 'view', 'Melihat dashboard utama'),
  ('users', 'view', 'Melihat daftar pengguna'),
  ('users', 'create', 'Membuat pengguna baru'),
  ('users', 'update', 'Mengubah data pengguna'),
  ('users', 'delete', 'Menghapus pengguna'),
  ('documents', 'view', 'Melihat arsip dokumen'),
  ('documents', 'create', 'Mengunggah dokumen baru'),
  ('documents', 'update', 'Mengubah dokumen'),
  ('documents', 'delete', 'Menghapus dokumen'),
  ('documents', 'verify', 'Memverifikasi dokumen'),
  ('letters', 'view', 'Melihat daftar surat'),
  ('letters', 'create', 'Membuat surat'),
  ('letters', 'update', 'Mengubah surat'),
  ('letters', 'disposition', 'Membuat disposisi surat'),
  ('programs', 'view', 'Melihat program'),
  ('programs', 'create', 'Membuat program'),
  ('programs', 'update', 'Mengubah program'),
  ('activities', 'view', 'Melihat kegiatan'),
  ('activities', 'create', 'Membuat kegiatan'),
  ('activities', 'update', 'Mengubah kegiatan'),
  ('partners', 'view', 'Melihat data mitra'),
  ('partners', 'create', 'Menambah mitra'),
  ('partners', 'update', 'Mengubah data mitra'),
  ('beneficiaries', 'view', 'Melihat data peserta/alumni'),
  ('beneficiaries', 'create', 'Menambah peserta'),
  ('beneficiaries', 'update', 'Mengubah data peserta'),
  ('tasks', 'view', 'Melihat tugas'),
  ('tasks', 'create', 'Membuat tugas'),
  ('tasks', 'update', 'Mengubah tugas'),
  ('assets', 'view', 'Melihat aset'),
  ('assets', 'create', 'Menambah aset'),
  ('assets', 'update', 'Mengubah aset'),
  ('media', 'view', 'Melihat media dan dokumentasi'),
  ('media', 'create', 'Mengunggah media'),
  ('reports', 'view', 'Melihat laporan'),
  ('reports', 'generate', 'Membuat laporan'),
  ('audit', 'view', 'Melihat audit log'),
  ('settings', 'view', 'Melihat pengaturan'),
  ('settings', 'update', 'Mengubah pengaturan')
ON CONFLICT (module, action) DO NOTHING;

-- Users (password: AnandaCore2026!)
-- Argon2id hash for 'AnandaCore2026!' generated with default params (m=65536,t=3,p=4)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'admin@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Ahmad Rizki Pratama', '081234567890', true),
  ('b0000000-0000-0000-0000-000000000002', 'siti.nurhaliza@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Siti Nurhaliza Putri', '081234567891', true),
  ('b0000000-0000-0000-0000-000000000003', 'budi.santoso@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Budi Santoso', '081234567892', true),
  ('b0000000-0000-0000-0000-000000000004', 'dewi.lestari@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Dewi Lestari Wardani', '081234567893', true),
  ('b0000000-0000-0000-0000-000000000005', 'agus.setiawan@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Agus Setiawan', '081234567894', true),
  ('b0000000-0000-0000-0000-000000000006', 'rina.wijaya@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Rina Wijaya', '081234567895', true),
  ('b0000000-0000-0000-0000-000000000007', 'hendra.gunawan@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Hendra Gunawan', '081234567896', true),
  ('b0000000-0000-0000-0000-000000000008', 'maya.puspita@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Maya Puspita Sari', '081234567897', true),
  ('b0000000-0000-0000-0000-000000000009', 'farhan.hidayat@anandacore.io', '$argon2id$v=19$m=65536,t=3,p=4$2EYANN6KE9pNrvueLh9HDw$rlK864hzJpdIAROT12JoH47gc7DHCkbdfpYNER89qdc', 'Farhan Hidayat', '081234567898', true)
ON CONFLICT (email) DO NOTHING;

-- User Roles
INSERT INTO user_roles (user_id, role_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (id, name, code, description) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Administrasi Umum', 'ADM', 'Divisi administrasi umum dan tata usaha yayasan'),
  ('c0000000-0000-0000-0000-000000000002', 'Program dan Kegiatan', 'PRG', 'Divisi perencanaan dan pelaksanaan program'),
  ('c0000000-0000-0000-0000-000000000003', 'Dokumentasi dan Arsip', 'DOK', 'Divisi pengelolaan dokumentasi dan kearsipan'),
  ('c0000000-0000-0000-0000-000000000004', 'Kemitraan dan Hubungan Kelembagaan', 'KMT', 'Divisi hubungan mitra dan kerja sama kelembagaan'),
  ('c0000000-0000-0000-0000-000000000005', 'Keuangan dan Aset', 'KEU', 'Divisi keuangan, aset, dan inventaris'),
  ('c0000000-0000-0000-0000-000000000006', 'Sumber Daya Manusia', 'SDM', 'Divisi pengelolaan SDM dan relawan'),
  ('c0000000-0000-0000-0000-000000000007', 'Pimpinan', 'PMP', 'Pimpinan yayasan dan dewan pengurus')
ON CONFLICT (code) DO NOTHING;

-- Document Categories
INSERT INTO document_categories (id, name, code, description) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Legalitas Yayasan', 'LEG', 'Akta pendirian, SK kemenkumham, NPWP, dll'),
  ('d0000000-0000-0000-0000-000000000002', 'Proposal Kegiatan', 'PRO', 'Proposal pelaksanaan kegiatan'),
  ('d0000000-0000-0000-0000-000000000003', 'Laporan Kegiatan', 'LPJ', 'Laporan pertanggungjawaban kegiatan'),
  ('d0000000-0000-0000-0000-000000000004', 'Surat Keputusan', 'SK', 'Surat keputusan internal yayasan'),
  ('d0000000-0000-0000-0000-000000000005', 'MoU / Perjanjian', 'MOU', 'Dokumen kerja sama dan perjanjian'),
  ('d0000000-0000-0000-0000-000000000006', 'Administrasi Keuangan', 'KEU', 'Laporan keuangan, bukti transaksi'),
  ('d0000000-0000-0000-0000-000000000007', 'Data Peserta', 'PES', 'Dokumen terkait peserta dan penerima manfaat'),
  ('d0000000-0000-0000-0000-000000000008', 'Dokumentasi Foto/Video', 'MED', 'Arsip media dokumentasi kegiatan'),
  ('d0000000-0000-0000-0000-000000000009', 'Sertifikat', 'SER', 'Sertifikat pelatihan, penghargaan, dll'),
  ('d0000000-0000-0000-0000-000000000010', 'Regulasi dan Kebijakan', 'REG', 'SOP, kebijakan internal, pedoman kerja')
ON CONFLICT (code) DO NOTHING;

-- Letter Classifications
INSERT INTO letter_classifications (id, name, code, description) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Undangan', 'UND', 'Surat undangan kegiatan atau rapat'),
  ('e0000000-0000-0000-0000-000000000002', 'Permohonan', 'PMH', 'Surat permohonan bantuan atau kerja sama'),
  ('e0000000-0000-0000-0000-000000000003', 'Pemberitahuan', 'PBR', 'Surat pemberitahuan dan edaran'),
  ('e0000000-0000-0000-0000-000000000004', 'Laporan', 'LPR', 'Surat pelaporan kegiatan'),
  ('e0000000-0000-0000-0000-000000000005', 'Keputusan', 'KEP', 'Surat keputusan resmi'),
  ('e0000000-0000-0000-0000-000000000006', 'Rekomendasi', 'REK', 'Surat rekomendasi'),
  ('e0000000-0000-0000-0000-000000000007', 'Tugas', 'TGS', 'Surat tugas dan penugasan'),
  ('e0000000-0000-0000-0000-000000000008', 'Keterangan', 'KET', 'Surat keterangan'),
  ('e0000000-0000-0000-0000-000000000009', 'Pengantar', 'PGT', 'Surat pengantar')
ON CONFLICT (code) DO NOTHING;

-- Activity Types
INSERT INTO activity_types (name, description) VALUES
  ('Pelatihan', 'Kegiatan pelatihan dan pengembangan kapasitas'),
  ('Seminar', 'Seminar dan diskusi panel'),
  ('Bakti Sosial', 'Kegiatan bakti sosial dan pengabdian masyarakat'),
  ('Workshop', 'Workshop praktik dan keterampilan'),
  ('Kunjungan Kerja', 'Kunjungan kerja ke mitra atau lokasi binaan'),
  ('Rapat Internal', 'Rapat koordinasi internal yayasan'),
  ('Pendampingan', 'Kegiatan pendampingan peserta'),
  ('Penggalangan Dana', 'Kegiatan fundraising'),
  ('Distribusi Bantuan', 'Kegiatan distribusi bantuan'),
  ('Monitoring dan Evaluasi', 'Kegiatan monitoring dan evaluasi program');

-- Program Types
INSERT INTO program_types (name, description) VALUES
  ('Program Beasiswa', 'Program pemberian beasiswa pendidikan'),
  ('Pemberdayaan Masyarakat', 'Program pemberdayaan ekonomi dan sosial masyarakat'),
  ('Pelatihan Kerja', 'Program pelatihan keterampilan kerja'),
  ('Bantuan Sosial', 'Program bantuan sosial langsung'),
  ('Pendidikan Non-Formal', 'Program pendidikan luar sekolah'),
  ('Kesehatan Masyarakat', 'Program kesehatan dan gizi masyarakat'),
  ('Pengembangan Anak', 'Program tumbuh kembang anak');

-- Asset Categories
INSERT INTO asset_categories (id, name, code, description) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Elektronik', 'ELK', 'Perangkat elektronik: komputer, printer, dll'),
  ('f0000000-0000-0000-0000-000000000002', 'Furniture', 'FRN', 'Meja, kursi, lemari, rak'),
  ('f0000000-0000-0000-0000-000000000003', 'Kendaraan', 'KDR', 'Mobil, motor operasional'),
  ('f0000000-0000-0000-0000-000000000004', 'Perlengkapan Kantor', 'PKT', 'ATK, alat tulis, perlengkapan'),
  ('f0000000-0000-0000-0000-000000000005', 'Peralatan Kegiatan', 'PKG', 'Sound system, projektor, tenda'),
  ('f0000000-0000-0000-0000-000000000006', 'Bangunan', 'BGN', 'Gedung dan bangunan milik yayasan')
ON CONFLICT (code) DO NOTHING;

-- Locations
INSERT INTO locations (id, name, address, city, province) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Kantor Pusat Yayasan Kasih Ananda', 'Jl. Merdeka No. 45, Kel. Sukamaju', 'Bandung', 'Jawa Barat'),
  ('10000000-0000-0000-0000-000000000002', 'Balai Pelatihan Ananda', 'Jl. Pendidikan No. 12, Kel. Cikutra', 'Bandung', 'Jawa Barat'),
  ('10000000-0000-0000-0000-000000000003', 'Pos Layanan Garut', 'Jl. Pahlawan No. 8', 'Garut', 'Jawa Barat'),
  ('10000000-0000-0000-0000-000000000004', 'Aula Serbaguna', 'Jl. Merdeka No. 45 (Lantai 2)', 'Bandung', 'Jawa Barat'),
  ('10000000-0000-0000-0000-000000000005', 'Gudang Bantuan', 'Jl. Industri No. 20', 'Bandung', 'Jawa Barat');

-- Tags
INSERT INTO tags (name, color) VALUES
  ('penting', '#EF4444'),
  ('rahasia', '#7C3AED'),
  ('arsip-permanen', '#3B82F6'),
  ('kedaluwarsa', '#F59E0B'),
  ('beasiswa', '#10B981'),
  ('legalitas', '#6366F1'),
  ('laporan-tahunan', '#8B5CF6'),
  ('kemitraan', '#06B6D4'),
  ('internal', '#6B7280'),
  ('draft', '#9CA3AF')
ON CONFLICT (name) DO NOTHING;

-- Cooperation Types
INSERT INTO cooperation_types (name, description) VALUES
  ('Pelatihan dan Sertifikasi', 'Kerja sama pelatihan dan sertifikasi kompetensi'),
  ('Penempatan Kerja', 'Kerja sama penempatan kerja lulusan'),
  ('CSR dan Donasi', 'Kerja sama program CSR dan donasi'),
  ('Magang dan Prakerin', 'Kerja sama magang dan praktik kerja industri'),
  ('Beasiswa', 'Kerja sama program beasiswa'),
  ('Pendampingan Teknis', 'Kerja sama pendampingan dan konsultasi teknis'),
  ('Pengadaan dan Logistik', 'Kerja sama pengadaan barang dan logistik');

-- Participant Statuses
INSERT INTO participant_statuses (name, description, color) VALUES
  ('Aktif', 'Peserta aktif mengikuti program', '#10B981'),
  ('Alumni', 'Sudah menyelesaikan program', '#3B82F6'),
  ('Lulus', 'Lulus seleksi/program', '#8B5CF6'),
  ('Mengundurkan Diri', 'Mengundurkan diri dari program', '#F59E0B'),
  ('Non-Aktif', 'Tidak aktif sementara', '#6B7280'),
  ('Ditempatkan', 'Sudah ditempatkan di mitra/perusahaan', '#06B6D4'),
  ('Menunggu Penempatan', 'Menunggu penempatan kerja', '#F97316');

-- Programs
INSERT INTO programs (id, name, program_type_id, description, objectives, target_audience, department_id, pic_user_id, start_date, end_date, status, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Program Beasiswa Anak Binaan 2026', (SELECT id FROM program_types WHERE name = 'Program Beasiswa' LIMIT 1),
   'Program pemberian beasiswa pendidikan untuk anak-anak dari keluarga kurang mampu di wilayah Bandung dan sekitarnya.',
   'Meningkatkan akses pendidikan bagi anak-anak dari keluarga prasejahtera',
   'Anak usia sekolah SD-SMA dari keluarga kurang mampu', 'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000004', '2026-01-01', '2026-12-31', 'aktif', 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Pelatihan Digital Dasar untuk Masyarakat', (SELECT id FROM program_types WHERE name = 'Pelatihan Kerja' LIMIT 1),
   'Program pelatihan keterampilan digital dasar termasuk penggunaan komputer, internet, dan media sosial untuk usaha.',
   'Membekali masyarakat dengan keterampilan digital untuk meningkatkan produktivitas',
   'Masyarakat umum usia produktif', 'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000005', '2026-02-01', '2026-08-31', 'aktif', 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Bantuan Sosial Ramadan 1447 H', (SELECT id FROM program_types WHERE name = 'Bantuan Sosial' LIMIT 1),
   'Program distribusi paket bantuan sosial selama bulan Ramadan kepada keluarga kurang mampu.',
   'Meringankan beban masyarakat kurang mampu selama bulan Ramadan',
   'Keluarga prasejahtera di wilayah binaan', 'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000003', '2026-03-01', '2026-04-15', 'aktif', 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Pemberdayaan Ekonomi Perempuan', (SELECT id FROM program_types WHERE name = 'Pemberdayaan Masyarakat' LIMIT 1),
   'Program pelatihan kewirausahaan dan pendampingan usaha untuk ibu-ibu di wilayah binaan.',
   'Meningkatkan kemandirian ekonomi perempuan melalui kewirausahaan',
   'Ibu rumah tangga dan perempuan di wilayah binaan', 'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000004', '2026-01-15', '2026-12-31', 'aktif', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Activities
INSERT INTO activities (program_id, name, description, location_id, activity_date, pic_user_id, target_participants, status, has_proposal, has_documentation, has_report, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Seleksi Penerima Beasiswa Gelombang 1', 'Proses seleksi administratif dan wawancara calon penerima beasiswa.', '10000000-0000-0000-0000-000000000001', '2026-01-15', 'b0000000-0000-0000-0000-000000000004', 50, 'selesai', true, true, true, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'Penyerahan Beasiswa Semester 1', 'Penyerahan bantuan beasiswa semester pertama kepada penerima manfaat.', '10000000-0000-0000-0000-000000000004', '2026-02-10', 'b0000000-0000-0000-0000-000000000004', 40, 'selesai', true, true, true, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Workshop Pengenalan Komputer', 'Workshop pengenalan dasar komputer dan internet untuk peserta baru.', '10000000-0000-0000-0000-000000000002', '2026-02-20', 'b0000000-0000-0000-0000-000000000005', 30, 'selesai', true, true, false, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Pelatihan Media Sosial untuk UMKM', 'Pelatihan penggunaan media sosial untuk pemasaran produk UMKM.', '10000000-0000-0000-0000-000000000002', '2026-03-15', 'b0000000-0000-0000-0000-000000000005', 25, 'berjalan', true, false, false, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Distribusi Paket Sembako Ramadan', 'Distribusi paket sembako kepada 200 keluarga di wilayah Bandung Selatan.', '10000000-0000-0000-0000-000000000005', '2026-03-20', 'b0000000-0000-0000-0000-000000000003', 200, 'disetujui', true, false, false, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Buka Puasa Bersama Anak Yatim', 'Kegiatan buka puasa bersama dengan anak-anak yatim dari panti asuhan mitra.', '10000000-0000-0000-0000-000000000004', '2026-03-25', 'b0000000-0000-0000-0000-000000000008', 100, 'draft', true, false, false, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Seminar Kewirausahaan Perempuan', 'Seminar motivasi dan pengenalan kewirausahaan untuk perempuan.', '10000000-0000-0000-0000-000000000004', '2026-02-05', 'b0000000-0000-0000-0000-000000000004', 50, 'selesai', true, true, true, 'b0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Pelatihan Membuat Kue dan Roti', 'Pelatihan praktik membuat kue dan roti untuk usaha rumahan.', '10000000-0000-0000-0000-000000000002', '2026-03-10', 'b0000000-0000-0000-0000-000000000004', 20, 'berjalan', true, false, false, 'b0000000-0000-0000-0000-000000000001');

-- Documents
INSERT INTO documents (title, document_number, document_date, department_id, category_id, confidentiality, status, retention_type, description, verification_status, uploaded_by, created_by) VALUES
  ('Akta Pendirian Yayasan Kasih Ananda', 'LEG/001/2020', '2020-03-15', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'rahasia', 'terverifikasi', 'permanen', 'Akta notaris pendirian yayasan di hadapan notaris Ibu Ratna Dewi, SH.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('SK Kemenkumham Yayasan Kasih Ananda', 'LEG/002/2020', '2020-05-20', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'rahasia', 'terverifikasi', 'permanen', 'Surat keputusan pengesahan badan hukum yayasan dari Kemenkumham.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('Proposal Beasiswa Anak Binaan 2026', 'PRO/001/2026', '2026-01-05', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'internal', 'aktif', '5_tahun', 'Proposal lengkap program beasiswa anak binaan tahun 2026.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004'),
  ('LPJ Kegiatan Seminar Parenting Desember 2025', 'LPJ/012/2025', '2025-12-20', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'internal', 'terverifikasi', '5_tahun', 'Laporan pertanggungjawaban kegiatan seminar parenting yang dilaksanakan bulan Desember 2025.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004'),
  ('Laporan Keuangan Semester 1 Tahun 2025', 'KEU/001/2025', '2025-07-15', 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', 'rahasia', 'terverifikasi', '5_tahun', 'Laporan keuangan yayasan periode Januari-Juni 2025.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'),
  ('SOP Pengarsipan Dokumen', 'REG/001/2024', '2024-06-01', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000010', 'internal', 'aktif', 'permanen', 'Standar operasional prosedur pengelolaan arsip dokumen yayasan.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005'),
  ('Rekap Data Penerima Beasiswa 2025', 'PES/001/2025', '2025-12-30', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000007', 'internal', 'aktif', '5_tahun', 'Rekapitulasi data seluruh penerima beasiswa tahun 2025.', 'belum_diverifikasi', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004'),
  ('Proposal Pelatihan Digital 2026', 'PRO/002/2026', '2026-01-10', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'internal', 'aktif', '3_tahun', 'Proposal program pelatihan digital dasar untuk masyarakat.', 'terverifikasi', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005');

-- Letters (Surat Masuk)
INSERT INTO letters (letter_type, agenda_number, letter_number, letter_date, received_date, sender, subject, classification_id, status, department_id, created_by, created_by_user_id) VALUES
  ('masuk', 'SM/001/2026', '045/DIKBUD/I/2026', '2026-01-10', '2026-01-12', 'Dinas Pendidikan dan Kebudayaan Kota Bandung', 'Undangan Musyawarah Pendidikan Non-Formal', 'e0000000-0000-0000-0000-000000000001', 'diterima', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006'),
  ('masuk', 'SM/002/2026', '012/CSR/TLK/I/2026', '2026-01-15', '2026-01-17', 'PT Telkom Indonesia', 'Penawaran Kerja Sama Program CSR Pelatihan Digital', 'e0000000-0000-0000-0000-000000000002', 'ditindaklanjuti', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006'),
  ('masuk', 'SM/003/2026', '089/DINSOS/II/2026', '2026-02-01', '2026-02-03', 'Dinas Sosial Provinsi Jawa Barat', 'Permohonan Data Penerima Bantuan Sosial', 'e0000000-0000-0000-0000-000000000002', 'diterima', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006'),
  ('masuk', 'SM/004/2026', '005/PA-KASIH/II/2026', '2026-02-10', '2026-02-12', 'Panti Asuhan Kasih Ibu', 'Permohonan Kerja Sama Kegiatan Ramadan', 'e0000000-0000-0000-0000-000000000002', 'diterima', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006'),
  ('masuk', 'SM/005/2026', '023/BNI-CSR/II/2026', '2026-02-15', '2026-02-17', 'Bank BNI Cabang Bandung', 'Konfirmasi Sponsorship Kegiatan Pelatihan', 'e0000000-0000-0000-0000-000000000003', 'selesai', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006');

-- Letters (Surat Keluar)
INSERT INTO letters (letter_type, agenda_number, letter_number, letter_date, sent_date, recipient, subject, classification_id, status, department_id, created_by, created_by_user_id) VALUES
  ('keluar', 'SK/001/2026', '001/YKA/I/2026', '2026-01-05', '2026-01-06', 'Dinas Sosial Kota Bandung', 'Permohonan Rekomendasi Kegiatan Bakti Sosial', 'e0000000-0000-0000-0000-000000000002', 'terkirim', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006'),
  ('keluar', 'SK/002/2026', '002/YKA/I/2026', '2026-01-10', '2026-01-11', 'SMK Negeri 1 Bandung', 'Undangan Seminar Kewirausahaan Perempuan', 'e0000000-0000-0000-0000-000000000001', 'terkirim', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006'),
  ('keluar', 'SK/003/2026', '003/YKA/II/2026', '2026-02-01', '2026-02-02', 'PT Telkom Indonesia', 'Tanggapan Penawaran Kerja Sama CSR', 'e0000000-0000-0000-0000-000000000004', 'terkirim', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007'),
  ('keluar', 'SK/004/2026', '004/YKA/III/2026', '2026-03-01', '2026-03-02', 'Seluruh Mitra Yayasan', 'Undangan Buka Puasa Bersama', 'e0000000-0000-0000-0000-000000000001', 'draft', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007');

-- Partners
INSERT INTO partners (id, name, partner_type, industry, address, city, province, website, email, phone, description, pipeline_status, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'PT Telkom Indonesia', 'perusahaan', 'Telekomunikasi', 'Jl. Japati No. 1', 'Bandung', 'Jawa Barat', 'https://telkom.co.id', 'csr@telkom.co.id', '022-4520888', 'BUMN telekomunikasi, mitra CSR program pelatihan digital.', 'aktif', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000002', 'Bank BNI Cabang Bandung', 'perusahaan', 'Perbankan', 'Jl. Asia Afrika No. 124', 'Bandung', 'Jawa Barat', 'https://bni.co.id', 'csr.bandung@bni.co.id', '022-4232456', 'Mitra sponsor kegiatan pelatihan dan beasiswa.', 'aktif', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000003', 'SMK Negeri 1 Bandung', 'sekolah', 'Pendidikan', 'Jl. Wastukancana No. 3', 'Bandung', 'Jawa Barat', NULL, 'info@smkn1bandung.sch.id', '022-4207951', 'Sekolah mitra untuk penempatan magang dan prakerin.', 'aktif', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000004', 'Rumah Zakat', 'lembaga', 'Filantropi', 'Jl. Turangga No. 33', 'Bandung', 'Jawa Barat', 'https://rumahzakat.org', 'info@rumahzakat.org', '022-7208606', 'Lembaga filantropi, kerja sama program bantuan sosial.', 'dihubungi', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000005', 'Panti Asuhan Kasih Ibu', 'lembaga', 'Sosial', 'Jl. Cibaduyut Raya No. 15', 'Bandung', 'Jawa Barat', NULL, 'pantikasih@gmail.com', '022-5400123', 'Panti asuhan mitra untuk kegiatan sosial dan distribusi bantuan.', 'aktif', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000006', 'Dinas Pendidikan Kota Bandung', 'instansi', 'Pemerintahan', 'Jl. Jend. Ahmad Yani No. 239', 'Bandung', 'Jawa Barat', NULL, 'disdik@bandung.go.id', '022-7271172', 'Instansi pemerintah pemda bidang pendidikan.', 'aktif', 'b0000000-0000-0000-0000-000000000007');

-- Partner Contacts
INSERT INTO partner_contacts (partner_id, name, position, email, phone, is_primary) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Ir. Bambang Suharno', 'Manager CSR', 'bambang.s@telkom.co.id', '081200001111', true),
  ('30000000-0000-0000-0000-000000000002', 'Andi Pradana', 'Staf Hubungan Masyarakat', 'andi.p@bni.co.id', '081200002222', true),
  ('30000000-0000-0000-0000-000000000003', 'Drs. Ujang Hermawan', 'Kepala Sekolah', 'ujang.h@smkn1bandung.sch.id', '081200003333', true),
  ('30000000-0000-0000-0000-000000000004', 'Fitri Handayani', 'Koordinator Program', 'fitri.h@rumahzakat.org', '081200004444', true),
  ('30000000-0000-0000-0000-000000000005', 'Ibu Yanti Sumarni', 'Pengurus Panti', 'yanti.s@gmail.com', '081200005555', true);

-- Partnership Agreements
INSERT INTO partnership_agreements (partner_id, agreement_number, title, start_date, end_date, status, notes, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'MOU/001/2025', 'MoU Kerja Sama Program Pelatihan Digital', '2025-06-01', '2027-05-31', 'aktif', 'Kerja sama penyediaan fasilitas dan instruktur pelatihan IT dasar.', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000002', 'MOU/002/2025', 'Sponsorship Kegiatan Pelatihan 2025-2026', '2025-01-01', '2026-12-31', 'aktif', 'Sponsorship dana untuk kegiatan pelatihan dan seminar.', 'b0000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000003', 'MOU/003/2024', 'Kerja Sama Magang dan Prakerin', '2024-07-01', '2026-06-30', 'aktif', 'Kerja sama penempatan peserta magang di lingkungan sekolah.', 'b0000000-0000-0000-0000-000000000007');

-- Beneficiaries
INSERT INTO beneficiaries (full_name, gender, birth_date, birth_place, address, city, province, phone, email, education_level, school_origin, status_id, registered_at, created_by) VALUES
  ('Rina Aprilia', 'Perempuan', '2008-04-12', 'Bandung', 'Jl. Cikutra No. 45, RT 05/RW 03', 'Bandung', 'Jawa Barat', '081300001111', NULL, 'SMP', 'SMP Negeri 7 Bandung', (SELECT id FROM participant_statuses WHERE name = 'Aktif' LIMIT 1), '2025-01-10', 'b0000000-0000-0000-0000-000000000004'),
  ('Muhammad Fadli', 'Laki-laki', '2007-09-23', 'Bandung', 'Jl. Sukajadi No. 12', 'Bandung', 'Jawa Barat', '081300002222', NULL, 'SMA', 'SMA Negeri 3 Bandung', (SELECT id FROM participant_statuses WHERE name = 'Aktif' LIMIT 1), '2025-01-10', 'b0000000-0000-0000-0000-000000000004'),
  ('Sari Dewi Rahayu', 'Perempuan', '2006-12-05', 'Garut', 'Jl. Pahlawan No. 78', 'Garut', 'Jawa Barat', '081300003333', 'sari.d@gmail.com', 'SMK', 'SMK Negeri 1 Garut', (SELECT id FROM participant_statuses WHERE name = 'Alumni' LIMIT 1), '2024-06-15', 'b0000000-0000-0000-0000-000000000004'),
  ('Ahmad Rizal', 'Laki-laki', '2009-02-18', 'Bandung', 'Jl. Braga No. 33', 'Bandung', 'Jawa Barat', '081300004444', NULL, 'SD', 'SD Negeri Coblong 1', (SELECT id FROM participant_statuses WHERE name = 'Aktif' LIMIT 1), '2025-08-20', 'b0000000-0000-0000-0000-000000000004'),
  ('Nisa Ramadhani', 'Perempuan', '2005-01-30', 'Cimahi', 'Jl. Baros No. 55', 'Cimahi', 'Jawa Barat', '081300005555', 'nisa.r@gmail.com', 'SMA', 'SMA Negeri 1 Cimahi', (SELECT id FROM participant_statuses WHERE name = 'Ditempatkan' LIMIT 1), '2024-01-05', 'b0000000-0000-0000-0000-000000000004'),
  ('Dian Permata', 'Perempuan', '1990-07-14', 'Bandung', 'Jl. Dago No. 200', 'Bandung', 'Jawa Barat', '081300006666', 'dian.p@gmail.com', 'SMA', 'SMA Negeri 5 Bandung', (SELECT id FROM participant_statuses WHERE name = 'Aktif' LIMIT 1), '2026-01-20', 'b0000000-0000-0000-0000-000000000004'),
  ('Yusuf Alamsyah', 'Laki-laki', '2007-11-08', 'Sumedang', 'Jl. Prabu Geusan Ulun No. 10', 'Sumedang', 'Jawa Barat', '081300007777', NULL, 'SMP', 'SMP Negeri 1 Sumedang', (SELECT id FROM participant_statuses WHERE name = 'Aktif' LIMIT 1), '2025-07-01', 'b0000000-0000-0000-0000-000000000004'),
  ('Putri Anggraeni', 'Perempuan', '2006-05-22', 'Bandung', 'Jl. Setiabudi No. 150', 'Bandung', 'Jawa Barat', '081300008888', 'putri.a@gmail.com', 'SMK', 'SMK Negeri 4 Bandung', (SELECT id FROM participant_statuses WHERE name = 'Menunggu Penempatan' LIMIT 1), '2025-03-10', 'b0000000-0000-0000-0000-000000000004');

-- Tasks
INSERT INTO tasks (title, description, assigned_to, department_id, priority, status, due_date, created_by, assigned_by) VALUES
  ('Persiapan Distribusi Paket Ramadan', 'Koordinasi logistik untuk distribusi 200 paket sembako di wilayah Bandung Selatan.', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'urgent', 'dikerjakan', '2026-03-18 17:00:00+07', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('Finalisasi MoU dengan Rumah Zakat', 'Review dan finalisasi draft MoU kerja sama program bantuan sosial bersama.', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'tinggi', 'dikerjakan', '2026-03-25 17:00:00+07', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('Upload Dokumentasi Kegiatan Februari', 'Unggah foto dan video kegiatan bulan Februari ke sistem arsip.', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'normal', 'belum_mulai', '2026-03-15 17:00:00+07', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005'),
  ('Rekap Surat Masuk Bulan Februari', 'Buat rekapitulasi seluruh surat masuk bulan Februari 2026.', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'normal', 'selesai', '2026-03-05 17:00:00+07', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'),
  ('Verifikasi Dokumen Proposal Pelatihan', 'Verifikasi kelengkapan dan kesesuaian dokumen proposal pelatihan digital.', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'normal', 'menunggu_review', '2026-03-20 17:00:00+07', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('Update Data Penerima Beasiswa Gelombang 2', 'Input data penerima beasiswa gelombang 2 ke sistem.', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'normal', 'belum_mulai', '2026-04-01 17:00:00+07', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');

-- Assets
INSERT INTO assets (name, asset_code, category_id, location_id, department_id, responsible_user_id, acquisition_date, condition, status, description, created_by) VALUES
  ('Laptop ASUS VivoBook 15', 'ELK-001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '2024-03-15', 'baik', 'aktif', 'Laptop kerja untuk administrasi umum.', 'b0000000-0000-0000-0000-000000000001'),
  ('Printer HP LaserJet Pro', 'ELK-002', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '2024-03-15', 'baik', 'aktif', 'Printer warna untuk pencetakan dokumen dan surat.', 'b0000000-0000-0000-0000-000000000001'),
  ('Proyektor Epson EB-X41', 'PKG-001', 'f0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', '2023-06-01', 'baik', 'aktif', 'Proyektor untuk presentasi kegiatan dan pelatihan.', 'b0000000-0000-0000-0000-000000000001'),
  ('Sound System Portable JBL', 'PKG-002', 'f0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', '2024-01-10', 'baik', 'aktif', 'Sound system portable untuk kegiatan lapangan.', 'b0000000-0000-0000-0000-000000000001'),
  ('Kamera Canon EOS 3000D', 'ELK-003', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000008', '2023-08-20', 'baik', 'aktif', 'Kamera DSLR untuk dokumentasi kegiatan.', 'b0000000-0000-0000-0000-000000000001'),
  ('Meja Kerja Staff (Set)', 'FRN-001', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '2022-01-15', 'baik', 'aktif', 'Set meja kerja untuk 6 staff kantor.', 'b0000000-0000-0000-0000-000000000001'),
  ('Motor Honda Beat (Operasional)', 'KDR-001', 'f0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '2024-05-01', 'baik', 'aktif', 'Motor operasional untuk kegiatan lapangan.', 'b0000000-0000-0000-0000-000000000001');

-- Memos
INSERT INTO memos (title, content, department_id, priority, is_pinned, created_by) VALUES
  ('Jadwal Rapat Koordinasi Mingguan', 'Rapat koordinasi mingguan dilaksanakan setiap hari Senin pukul 09.00 WIB di ruang rapat kantor pusat. Seluruh koordinator divisi diharapkan hadir.', 'c0000000-0000-0000-0000-000000000007', 'normal', true, 'b0000000-0000-0000-0000-000000000002'),
  ('Pengumpulan Laporan Bulanan', 'Seluruh divisi diminta mengumpulkan laporan bulanan paling lambat tanggal 5 setiap bulan ke divisi administrasi.', 'c0000000-0000-0000-0000-000000000001', 'tinggi', false, 'b0000000-0000-0000-0000-000000000003'),
  ('Persiapan Kegiatan Ramadan 2026', 'Dimohon seluruh tim mempersiapkan rencana kegiatan Ramadan termasuk logistik, undangan, dan dokumentasi.', 'c0000000-0000-0000-0000-000000000002', 'urgent', true, 'b0000000-0000-0000-0000-000000000002');

-- Announcements
INSERT INTO announcements (title, content, priority, is_active, created_by) VALUES
  ('Peringatan Hari Jadi Yayasan ke-6', 'Dalam rangka Hari Jadi Yayasan Kasih Ananda ke-6 pada tanggal 15 Maret 2026, seluruh keluarga besar yayasan diundang untuk menghadiri acara syukuran.', 'normal', true, 'b0000000-0000-0000-0000-000000000002'),
  ('Pemberlakuan SOP Baru Pengarsipan', 'Mulai 1 April 2026, seluruh dokumen wajib diunggah ke sistem AnandaCore dengan metadata lengkap sesuai SOP baru.', 'tinggi', true, 'b0000000-0000-0000-0000-000000000001');

-- Notifications
INSERT INTO notifications (user_id, title, message, notification_type, is_read) VALUES
  ('b0000000-0000-0000-0000-000000000003', 'Tugas baru: Persiapan Distribusi Paket Ramadan', 'Anda mendapat tugas baru dengan prioritas urgent. Batas waktu: 18 Maret 2026.', 'task_assigned', false),
  ('b0000000-0000-0000-0000-000000000007', 'MoU hampir habis masa berlaku', 'MoU dengan SMK Negeri 1 Bandung akan berakhir pada 30 Juni 2026. Segera lakukan perpanjangan.', 'mou_expiry', false),
  ('b0000000-0000-0000-0000-000000000005', 'Dokumen menunggu verifikasi', 'Terdapat 2 dokumen baru yang menunggu verifikasi di modul arsip.', 'document_review', false),
  ('b0000000-0000-0000-0000-000000000008', 'Tugas baru: Upload dokumentasi', 'Silakan unggah dokumentasi kegiatan bulan Februari ke sistem.', 'task_assigned', false),
  ('b0000000-0000-0000-0000-000000000001', 'Laporan bulanan belum lengkap', 'Divisi Kemitraan belum mengumpulkan laporan bulanan Februari.', 'report_missing', false);

-- Settings
INSERT INTO settings (key, value, value_type, description) VALUES
  ('app.name', 'AnandaCore', 'string', 'Nama aplikasi'),
  ('app.org_name', 'Yayasan Kasih Ananda', 'string', 'Nama organisasi'),
  ('app.domain', 'anandacore.io', 'string', 'Domain aplikasi'),
  ('app.timezone', 'Asia/Jakarta', 'string', 'Zona waktu default'),
  ('app.language', 'id', 'string', 'Bahasa default'),
  ('retention.default_years', '5', 'number', 'Default masa retensi dokumen (tahun)'),
  ('backup.auto_enabled', 'true', 'boolean', 'Backup otomatis aktif'),
  ('backup.schedule', 'daily', 'string', 'Jadwal backup: daily, weekly, monthly'),
  ('upload.max_size_mb', '100', 'number', 'Ukuran maksimum upload file (MB)'),
  ('notification.email_enabled', 'false', 'boolean', 'Notifikasi email aktif')
ON CONFLICT (key) DO NOTHING;

-- Backup Logs (sample)
INSERT INTO backup_logs (backup_type, source, destination, file_count, total_size, status, started_at, completed_at, initiated_by) VALUES
  ('full_backup', 'documents', 's3://anandacore-backup/2026-03-01', 156, 524288000, 'completed', '2026-03-01 02:00:00+07', '2026-03-01 02:15:00+07', 'b0000000-0000-0000-0000-000000000001'),
  ('incremental', 'media_assets', 's3://anandacore-backup/2026-03-10', 45, 1073741824, 'completed', '2026-03-10 02:00:00+07', '2026-03-10 02:30:00+07', 'b0000000-0000-0000-0000-000000000001'),
  ('full_backup', 'all', 's3://anandacore-backup/2026-03-15', 320, 2147483648, 'completed', '2026-03-15 02:00:00+07', '2026-03-15 03:00:00+07', 'b0000000-0000-0000-0000-000000000001');

-- Audit Logs (sample)
INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, new_values, ip_address) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'create', 'users', 'user', 'b0000000-0000-0000-0000-000000000002', '{"email": "siti.nurhaliza@anandacore.io"}', '192.168.1.10'),
  ('b0000000-0000-0000-0000-000000000006', 'create', 'letters', 'letter', NULL, '{"subject": "Undangan Musyawarah Pendidikan Non-Formal"}', '192.168.1.15'),
  ('b0000000-0000-0000-0000-000000000004', 'create', 'documents', 'document', NULL, '{"title": "Proposal Beasiswa Anak Binaan 2026"}', '192.168.1.12'),
  ('b0000000-0000-0000-0000-000000000007', 'create', 'partners', 'partner', '30000000-0000-0000-0000-000000000001', '{"name": "PT Telkom Indonesia"}', '192.168.1.16'),
  ('b0000000-0000-0000-0000-000000000001', 'update', 'settings', 'setting', NULL, '{"key": "backup.auto_enabled", "value": "true"}', '192.168.1.10');
