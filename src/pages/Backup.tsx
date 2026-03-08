import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockBooks, mockStudents, mockTeachers, mockClasses, mockCategories, mockTransactions } from '@/data/mockData';
import { Database, Download, HardDrive, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const Backup = () => {
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const backupAll = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mockBooks), 'Buku');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mockStudents), 'Siswa');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mockTeachers), 'Guru');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mockClasses), 'Kelas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mockCategories), 'Kategori');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mockTransactions), 'Transaksi');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    XLSX.writeFile(wb, `backup_perpustakaan_${dateStr}.xlsx`);

    setLastBackup(now.toLocaleString('id-ID'));
    toast.success('Backup lengkap berhasil diunduh');
  };

  const backupJSON = () => {
    const allData = {
      books: mockBooks,
      students: mockStudents,
      teachers: mockTeachers,
      classes: mockClasses,
      categories: mockCategories,
      transactions: mockTransactions,
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
    { label: 'Data Buku', data: mockBooks, filename: 'data_buku', sheet: 'Buku', count: mockBooks.length, icon: '📚' },
    { label: 'Data Siswa', data: mockStudents, filename: 'data_siswa', sheet: 'Siswa', count: mockStudents.length, icon: '👨‍🎓' },
    { label: 'Data Guru', data: mockTeachers, filename: 'data_guru', sheet: 'Guru', count: mockTeachers.length, icon: '👩‍🏫' },
    { label: 'Data Kelas', data: mockClasses, filename: 'data_kelas', sheet: 'Kelas', count: mockClasses.length, icon: '🏫' },
    { label: 'Data Kategori', data: mockCategories, filename: 'data_kategori', sheet: 'Kategori', count: mockCategories.length, icon: '📁' },
    { label: 'Data Transaksi', data: mockTransactions, filename: 'data_transaksi', sheet: 'Transaksi', count: mockTransactions.length, icon: '📖' },
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
                    <p className="text-xs text-muted-foreground">{t.count} data</p>
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
      </div>
    </AppLayout>
  );
};

export default Backup;
