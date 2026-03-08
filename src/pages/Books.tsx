import { useState, useRef } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockBooks, mockCategories } from '@/data/mockData';
import { Book } from '@/lib/types';
import { Search, Plus, Edit, Trash2, BookOpen, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const Books = () => {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [importPreview, setImportPreview] = useState<Book[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const perPage = 6;

  const filtered = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.isbn.includes(search);
    const matchCat = categoryFilter === 'all' || b.categoryId === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    toast.success('Buku berhasil dihapus');
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Book = {
      id: editBook?.id || `b${Date.now()}`,
      title: form.get('title') as string,
      author: form.get('author') as string,
      publisher: form.get('publisher') as string,
      year: parseInt(form.get('year') as string),
      isbn: form.get('isbn') as string,
      categoryId: form.get('categoryId') as string,
      stock: parseInt(form.get('stock') as string),
      available: parseInt(form.get('available') as string),
      shelfLocation: form.get('shelfLocation') as string,
    };
    if (editBook) {
      setBooks(prev => prev.map(b => b.id === editBook.id ? data : b));
      toast.success('Buku berhasil diperbarui');
    } else {
      setBooks(prev => [...prev, data]);
      toast.success('Buku berhasil ditambahkan');
    }
    setDialogOpen(false);
    setEditBook(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        const imported: Book[] = jsonData.map((row, i) => ({
          id: `imp${Date.now()}_${i}`,
          title: String(row['Judul'] || row['title'] || ''),
          author: String(row['Penulis'] || row['author'] || ''),
          publisher: String(row['Penerbit'] || row['publisher'] || ''),
          year: parseInt(row['Tahun'] || row['year'] || '2024'),
          isbn: String(row['ISBN'] || row['isbn'] || ''),
          categoryId: 'c1',
          stock: parseInt(row['Stok'] || row['stock'] || '1'),
          available: parseInt(row['Tersedia'] || row['available'] || row['Stok'] || row['stock'] || '1'),
          shelfLocation: String(row['Rak'] || row['shelf'] || row['shelfLocation'] || ''),
        })).filter(b => b.title.trim() !== '');

        if (imported.length === 0) {
          toast.error('File tidak memiliki data yang valid');
          return;
        }

        setImportPreview(imported);
        setImportDialogOpen(true);
      } catch {
        toast.error('Gagal membaca file. Pastikan format benar.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const confirmImport = () => {
    setBooks(prev => [...prev, ...importPreview]);
    toast.success(`${importPreview.length} buku berhasil diimport`);
    setImportPreview([]);
    setImportDialogOpen(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      { Judul: 'Contoh Buku', Penulis: 'Nama Penulis', Penerbit: 'Nama Penerbit', Tahun: 2024, ISBN: '978-xxx-xxx', Stok: 10, Tersedia: 10, Rak: 'A-01' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_import_buku.xlsx');
    toast.success('Template berhasil diunduh');
  };

  const getCategoryName = (id: string) => mockCategories.find(c => c.id === id)?.name || '-';

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Buku</h1>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Import Excel/CSV
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditBook(null); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="gradient"><Plus className="w-4 h-4 mr-1" /> Tambah Buku</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editBook ? 'Edit Buku' : 'Tambah Buku Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-3">
                  <div><label className="text-sm font-medium">Judul</label><Input name="title" defaultValue={editBook?.title} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium">Penulis</label><Input name="author" defaultValue={editBook?.author} required /></div>
                    <div><label className="text-sm font-medium">Penerbit</label><Input name="publisher" defaultValue={editBook?.publisher} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium">Tahun</label><Input name="year" type="number" defaultValue={editBook?.year || 2024} required /></div>
                    <div><label className="text-sm font-medium">ISBN</label><Input name="isbn" defaultValue={editBook?.isbn} required /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Kategori</label>
                    <select name="categoryId" defaultValue={editBook?.categoryId || 'c1'} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-sm font-medium">Stok</label><Input name="stock" type="number" defaultValue={editBook?.stock || 1} required /></div>
                    <div><label className="text-sm font-medium">Tersedia</label><Input name="available" type="number" defaultValue={editBook?.available || 1} required /></div>
                    <div><label className="text-sm font-medium">Rak</label><Input name="shelfLocation" defaultValue={editBook?.shelfLocation} required /></div>
                  </div>
                  <Button type="submit" variant="gradient" className="w-full">{editBook ? 'Simpan Perubahan' : 'Tambah Buku'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Import Preview Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Pratinjau Import — {importPreview.length} buku
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-2 font-medium text-muted-foreground">Judul</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Penulis</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">ISBN</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 20).map(b => (
                    <tr key={b.id} className="border-b">
                      <td className="p-2 font-medium text-foreground">{b.title}</td>
                      <td className="p-2 text-muted-foreground">{b.author}</td>
                      <td className="p-2 text-muted-foreground font-mono text-xs">{b.isbn}</td>
                      <td className="p-2 text-center">{b.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 20 && <p className="text-xs text-muted-foreground p-2">...dan {importPreview.length - 20} buku lainnya</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Batal</Button>
              <Button variant="gradient" onClick={confirmImport}>Import {importPreview.length} Buku</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari buku..." className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {mockCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={downloadTemplate} className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Template
          </Button>
        </div>

        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Judul</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Penulis</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Kategori</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">ISBN</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Stok</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Tersedia</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Rak</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{b.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{b.author}</td>
                    <td className="p-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{getCategoryName(b.categoryId)}</Badge></td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground font-mono text-xs">{b.isbn}</td>
                    <td className="p-3 text-center font-medium">{b.stock}</td>
                    <td className="p-3 text-center">
                      <span className={b.available > 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>{b.available}</span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{b.shelfLocation}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditBook(b); setDialogOpen(true); }}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <p className="text-xs text-muted-foreground">{filtered.length} buku ditemukan</p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Books;
