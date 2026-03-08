import { useState, useRef } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { supabase } from '@/integrations/supabase/client';
import { Database, Download, HardDrive, FileSpreadsheet, CheckCircle, Loader2, Upload, AlertTriangle } from 'lucide-react';
import { sanitizeRestoreRow } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const RESTORE_TABLES = ['categories', 'books', 'classes', 'students', 'teachers', 'borrowings', 'borrow_requests'] as const;

const TABLE_LABELS: Record<string, string> = {
  categories: 'Kategori',
  books: 'Buku',
  classes: 'Kelas',
  students: 'Siswa',
  teachers: 'Guru',
  borrowings: 'Peminjaman',
  borrow_requests: 'Pengajuan',
  borrowRequests: 'Pengajuan',
  activityLogs: 'Log Aktivitas',
};

const Backup = () => {
  const { user } = useAuth();
  const { data: books, loading: l1, refetch: refetchBooks } = useSchoolData<any>('books');
  const { data: students, loading: l2, refetch: refetchStudents } = useSchoolData<any>('students');
  const { data: teachers, loading: l3, refetch: refetchTeachers } = useSchoolData<any>('teachers');
  const { data: classes, loading: l4, refetch: refetchClasses } = useSchoolData<any>('classes');
  const { data: categories, loading: l5, refetch: refetchCategories } = useSchoolData<any>('categories');
  const { data: borrowings, loading: l6, refetch: refetchBorrowings } = useSchoolData<any>('borrowings');
  const { data: borrowRequests, refetch: refetchRequests } = useSchoolData<any>('borrow_requests');
  const { data: activityLogs } = useSchoolData<any>('activity_logs');

  const loading = l1 || l2 || l3 || l4 || l5 || l6;
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restorePreview, setRestorePreview] = useState<Record<string, any[]> | null>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const backupAll = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(books), 'Buku');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students), 'Siswa');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teachers), 'Guru');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classes), 'Kelas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categories), 'Kategori');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(borrowings), 'Peminjaman');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(borrowRequests), 'Pengajuan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activityLogs), 'Log Aktivitas');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `backup_perpustakaan_${dateStr}.xlsx`);
    setLastBackup(new Date().toLocaleString('id-ID'));
    toast.success('Backup lengkap berhasil diunduh');
  };

  const backupJSON = () => {
    const allData = {
      books, students, teachers, classes, categories,
      borrowings, borrowRequests, activityLogs,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_perpustakaan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastBackup(new Date().toLocaleString('id-ID'));
    toast.success('Backup JSON berhasil diunduh');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Hanya file JSON yang didukung untuk restore');
      return;
    }

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        // Map camelCase keys to snake_case table names
        const mapped: Record<string, any[]> = {};
        const keyMap: Record<string, string> = {
          books: 'books',
          students: 'students',
          teachers: 'teachers',
          classes: 'classes',
          categories: 'categories',
          borrowings: 'borrowings',
          borrowRequests: 'borrow_requests',
          borrow_requests: 'borrow_requests',
        };

        for (const [key, tableName] of Object.entries(keyMap)) {
          if (parsed[key] && Array.isArray(parsed[key]) && parsed[key].length > 0) {
            mapped[tableName] = parsed[key];
          }
        }

        if (Object.keys(mapped).length === 0) {
          toast.error('File tidak mengandung data yang valid');
          return;
        }

        setRestorePreview(mapped);
        setRestoreDialogOpen(true);
      } catch {
        toast.error('File JSON tidak valid');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    if (!restorePreview || !user) return;
    setRestoring(true);

    const schoolId = user.schoolId;
    let successCount = 0;
    let errorCount = 0;

    // Restore order matters (categories before books, classes before students)
    const order: string[] = ['categories', 'classes', 'books', 'students', 'teachers', 'borrowings', 'borrow_requests'];

    for (const table of order) {
      const rows = restorePreview[table];
      if (!rows || rows.length === 0) continue;

      // Clean rows: remove id (let DB generate), set school_id, sanitize fields
      const cleaned = rows.map((row: any) => {
        const { id, created_at, updated_at, ...rest } = row;
        const sanitized = sanitizeRestoreRow(rest);
        return { ...sanitized, school_id: schoolId || rest.school_id };
      });

      // Insert in batches of 50
      for (let i = 0; i < cleaned.length; i += 50) {
        const batch = cleaned.slice(i, i + 50);
        const { error } = await (supabase as any).from(table).insert(batch);
        if (error) {
          console.error(`Restore error on ${table}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }
    }

    // Refetch all data
    await Promise.all([
      refetchBooks(), refetchStudents(), refetchTeachers(),
      refetchClasses(), refetchCategories(), refetchBorrowings(), refetchRequests(),
    ]);

    setRestoring(false);
    setRestoreDialogOpen(false);
    setRestorePreview(null);

    if (errorCount === 0) {
      toast.success(`Restore berhasil! ${successCount} batch data berhasil diimport.`);
    } else {
      toast.warning(`Restore selesai dengan ${errorCount} error. Beberapa data mungkin tidak terimport (duplikat/konflik).`);
    }
  };

  const tables = [
    { label: 'Data Buku', data: books, filename: 'data_buku', sheet: 'Buku', icon: '📚' },
    { label: 'Data Siswa', data: students, filename: 'data_siswa', sheet: 'Siswa', icon: '👨‍🎓' },
    { label: 'Data Guru', data: teachers, filename: 'data_guru', sheet: 'Guru', icon: '👩‍🏫' },
    { label: 'Data Kelas', data: classes, filename: 'data_kelas', sheet: 'Kelas', icon: '🏫' },
    { label: 'Data Kategori', data: categories, filename: 'data_kategori', sheet: 'Kategori', icon: '📁' },
    { label: 'Data Peminjaman', data: borrowings, filename: 'data_peminjaman', sheet: 'Peminjaman', icon: '📖' },
    { label: 'Data Pengajuan', data: borrowRequests, filename: 'data_pengajuan', sheet: 'Pengajuan', icon: '📝' },
    { label: 'Log Aktivitas', data: activityLogs, filename: 'log_aktivitas', sheet: 'Log', icon: '📋' },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-3xl">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Backup & Restore Data</h1>
              <p className="text-sm text-muted-foreground">Unduh, amankan, dan pulihkan data perpustakaan</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Full Backup */}
            <div className="stat-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Backup Lengkap</h3>
                    <p className="text-xs text-muted-foreground">Semua data dalam satu file</p>
                  </div>
                </div>
                {lastBackup && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Terakhir: {lastBackup}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="gradient" onClick={backupAll}>
                  <Download className="w-4 h-4 mr-1" /> Backup Excel (.xlsx)
                </Button>
                <Button variant="outline" onClick={backupJSON}>
                  <Download className="w-4 h-4 mr-1" /> Backup JSON
                </Button>
              </div>
            </div>

            {/* Restore */}
            <div className="stat-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Restore Data</h3>
                  <p className="text-xs text-muted-foreground">Pulihkan data dari file backup JSON</p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Pilih File JSON
                </Button>
              </div>
            </div>

            {/* Per-table export */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Export Per Tabel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tables.map(t => (
                  <div key={t.filename} className="stat-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.data.length} data</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        exportToExcel(t.data, t.filename, t.sheet);
                        toast.success(`${t.label} berhasil diexport`);
                      }}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Export
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="rounded-xl border bg-accent/30 p-4">
              <p className="text-xs text-accent-foreground font-medium mb-1">💡 Tips Backup & Restore</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Lakukan backup secara rutin minimal seminggu sekali</li>
                <li>• Simpan file backup di tempat yang aman (cloud drive, USB, dll)</li>
                <li>• Restore hanya mendukung file JSON dari hasil backup aplikasi ini</li>
                <li>• Data yang di-restore akan ditambahkan, bukan menggantikan data existing</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Restore Preview Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={o => { if (!restoring) { setRestoreDialogOpen(o); if (!o) setRestorePreview(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Konfirmasi Restore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{restoreFileName}</span>
            </p>

            <div className="rounded-lg border divide-y">
              {restorePreview && Object.entries(restorePreview).map(([table, rows]) => (
                <div key={table} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-foreground">{TABLE_LABELS[table] || table}</span>
                  <span className="text-xs text-muted-foreground">{rows.length} data</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Data akan <strong>ditambahkan</strong> ke database. Data yang sudah ada tidak akan dihapus atau ditimpa. Duplikat mungkin terjadi.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setRestoreDialogOpen(false); setRestorePreview(null); }} disabled={restoring}>
                Batal
              </Button>
              <Button variant="gradient" className="flex-1" onClick={executeRestore} disabled={restoring}>
                {restoring ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                {restoring ? 'Memproses...' : 'Restore Sekarang'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Backup;
