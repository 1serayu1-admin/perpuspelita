import { useState, useMemo } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { FileBarChart, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type ReportType = 'borrow' | 'return' | 'late' | 'popular';

const Reports = () => {
  const { data: borrowings, loading } = useSchoolData<any>('borrowings');
  const { data: books } = useSchoolData<any>('books');
  const [reportType, setReportType] = useState<ReportType>('borrow');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filteredData = useMemo(() => {
    let data = [...borrowings];
    if (dateFrom) data = data.filter(t => t.borrow_date >= dateFrom);
    if (dateTo) data = data.filter(t => t.borrow_date <= dateTo);

    switch (reportType) {
      case 'return': return data.filter(t => t.status === 'returned');
      case 'late': return data.filter(t => t.status === 'late');
      case 'popular': {
        const bookCount = new Map<string, { title: string; count: number }>();
        data.forEach(t => {
          const existing = bookCount.get(t.book_id || t.book_title) || { title: t.book_title, count: 0 };
          existing.count++;
          bookCount.set(t.book_id || t.book_title, existing);
        });
        return Array.from(bookCount.values())
          .sort((a, b) => b.count - a.count)
          .map((item, i) => ({ id: `pop-${i}`, book_title: item.title, count: item.count }));
      }
      default: return data;
    }
  }, [borrowings, reportType, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginated = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = (format: 'excel') => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    let exportData: any[];
    if (reportType === 'popular') {
      exportData = filteredData.map((d: any, i: number) => ({
        'No': i + 1,
        'Judul Buku': d.book_title,
        'Jumlah Peminjaman': d.count,
      }));
    } else {
      exportData = filteredData.map((t: any, i: number) => ({
        'No': i + 1,
        'Peminjam': t.borrower_name,
        'Buku': t.book_title,
        'Jenis': t.type === 'regular' ? 'Reguler' : 'Pelajaran',
        'Tgl Pinjam': t.borrow_date,
        'Batas Kembali': (t.due_date || '').split('T')[0],
        'Tgl Kembali': t.return_date || '-',
        'Status': t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat',
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    const reportName = reportType === 'borrow' ? 'Peminjaman' : reportType === 'return' ? 'Pengembalian' : reportType === 'late' ? 'Keterlambatan' : 'Buku_Populer';
    XLSX.writeFile(wb, `Laporan_${reportName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Laporan berhasil diexport ke Excel');
  };

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    if (s === 'returned') return 'bg-success/10 text-success border-success/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const reportLabels: Record<ReportType, string> = {
    borrow: 'Laporan Peminjaman',
    return: 'Laporan Pengembalian',
    late: 'Laporan Keterlambatan',
    popular: 'Buku Populer',
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Laporan</h1>
          <Button size="sm" variant="outline" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-1" /> Export Excel
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Jenis Laporan</label>
            <Select value={reportType} onValueChange={v => { setReportType(v as ReportType); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="borrow">Peminjaman</SelectItem>
                <SelectItem value="return">Pengembalian</SelectItem>
                <SelectItem value="late">Keterlambatan</SelectItem>
                <SelectItem value="popular">Buku Populer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Dari Tanggal</label>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Sampai Tanggal</label>
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-40" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="data-table-wrapper">
            <div className="p-3 border-b flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{reportLabels[reportType]}</span>
              <Badge variant="outline" className="text-xs ml-auto">{filteredData.length} data</Badge>
            </div>
            <div className="overflow-x-auto">
              {reportType === 'popular' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground w-12">No</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Judul Buku</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Jumlah Peminjaman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-muted-foreground text-sm">Belum ada data</td></tr>
                    ) : paginated.map((d: any, i: number) => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-muted-foreground">{(page - 1) * perPage + i + 1}</td>
                        <td className="p-3 font-medium text-foreground">{d.book_title}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">{d.count}x</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Peminjam</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Jenis</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tgl Pinjam</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Belum ada data</td></tr>
                    ) : paginated.map((t: any) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-foreground">{t.borrower_name}</td>
                        <td className="p-3 text-foreground">{t.book_title}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{t.type === 'regular' ? 'Reguler' : 'Pelajaran'}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{t.borrow_date}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                            {t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <p className="text-xs text-muted-foreground">{filteredData.length} data</p>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>{i + 1}</Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reports;
