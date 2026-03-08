import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockTransactions, mockCategories } from '@/data/mockData';
import { FileBarChart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type ReportType = 'borrow' | 'return' | 'late' | 'popular';

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('borrow');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getFilteredData = () => {
    let data = [...mockTransactions];
    if (dateFrom) data = data.filter(t => t.borrowDate >= dateFrom);
    if (dateTo) data = data.filter(t => t.borrowDate <= dateTo);

    switch (reportType) {
      case 'borrow': return data;
      case 'return': return data.filter(t => t.status === 'returned');
      case 'late': return data.filter(t => t.status === 'late');
      case 'popular': return data;
      default: return data;
    }
  };

  const data = getFilteredData();

  const handleExport = (format: 'pdf' | 'excel') => {
    toast.success(`Laporan berhasil diexport ke ${format.toUpperCase()}`);
  };

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    if (s === 'returned') return 'bg-success/10 text-success border-success/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Laporan</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExport('pdf')}><Download className="w-4 h-4 mr-1" /> PDF</Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('excel')}><Download className="w-4 h-4 mr-1" /> Excel</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Jenis Laporan</label>
            <Select value={reportType} onValueChange={v => setReportType(v as ReportType)}>
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
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Sampai Tanggal</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
          </div>
        </div>

        <div className="data-table-wrapper">
          <div className="p-3 border-b flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {reportType === 'borrow' ? 'Laporan Peminjaman' : reportType === 'return' ? 'Laporan Pengembalian' : reportType === 'late' ? 'Laporan Keterlambatan' : 'Buku Populer'}
            </span>
            <Badge variant="outline" className="text-xs ml-auto">{data.length} data</Badge>
          </div>
          <div className="overflow-x-auto">
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
                {data.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{t.borrowerName}</td>
                    <td className="p-3 text-foreground">{t.bookTitle}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.type === 'regular' ? 'Reguler' : 'Pelajaran'}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.borrowDate}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                        {t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
