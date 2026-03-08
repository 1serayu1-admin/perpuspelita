import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Database, Download, HardDrive, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const Backup = () => {
  const { data: books, loading: l1 } = useSchoolData<any>('books');
  const { data: students, loading: l2 } = useSchoolData<any>('students');
  const { data: teachers, loading: l3 } = useSchoolData<any>('teachers');
  const { data: classes, loading: l4 } = useSchoolData<any>('classes');
  const { data: categories, loading: l5 } = useSchoolData<any>('categories');
  const { data: borrowings, loading: l6 } = useSchoolData<any>('borrowings');
  const { data: borrowRequests } = useSchoolData<any>('borrow_requests');
  const { data: activityLogs } = useSchoolData<any>('activity_logs');

  const loading = l1 || l2 || l3 || l4 || l5 || l6;
  const [lastBackup, setLastBackup] = useState<string | null>(null);

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
              <h1 className="page-title">Backup Data</h1>
              <p className="text-sm text-muted-foreground">Unduh dan amankan seluruh data perpustakaan</p>
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
              <p className="text-xs text-accent-foreground font-medium mb-1">💡 Tips Backup</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Lakukan backup secara rutin minimal seminggu sekali</li>
                <li>• Simpan file backup di tempat yang aman (cloud drive, USB, dll)</li>
                <li>• Backup JSON menyimpan data dengan format yang lebih lengkap</li>
                <li>• Backup Excel lebih mudah dibuka dan dilihat langsung</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Backup;
