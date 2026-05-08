import { useState, useMemo, useRef } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { getSupabase } from '@/integrations/supabase/client';
import { Search, Plus, Filter, BookOpen, Download, MoreHorizontal, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Book } from '@/lib/types';

export default function Books() {
  const { role, user: authUser } = useAuth();
  const { data: books, isLoading, refetch } = useSchoolData('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSeeSource = role === 'admin' || role === 'global_super_admin';

  const filteredBooks = useMemo(() => {
    return books.filter((book: any) => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [books, searchTerm]);

  const handleDownloadTemplate = () => {
    const headers = "No,Judul Buku,Penyusun/Pengarang,Penerbit,Jenis Buku,Jumlah,Sumber\n";
    const sampleRow = "1,Dasar Desain Grafis kelas X,-,Erlangga,Non Fiksi,20,BOS\n";
    const csvContent = headers + sampleRow;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_data_buku_perpustakaan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error('File CSV kosong');
          return;
        }

        const supabase = getSupabase();
        if (!supabase) throw new Error('Database connection failed');

        // Get school_id and category_id
        const { data: school } = await supabase.from('schools').select('id').limit(1).single();
        let { data: category } = await supabase.from('categories').select('id').eq('name', 'Non Fiksi').limit(1).single();
        
        if (!category) {
          const { data: newCat } = await supabase.from('categories').insert({ name: 'Non Fiksi', school_id: school?.id }).select().single();
          category = newCat;
        }

        const booksToInsert = data.map((row: any) => ({
          school_id: school?.id,
          title: row['Judul Buku'] || row['judul'] || 'Tanpa Judul',
          author: row['Penyusun/Pengarang'] || row['pengarang'] || '-',
          publisher: row['Penerbit'] || row['penerbit'] || '-',
          category_id: category?.id,
          stock: parseInt(row['Jumlah'] || row['jumlah'] || '0'),
          available: parseInt(row['Jumlah'] || row['jumlah'] || '0'),
          source: row['Sumber'] || row['sumber'] || '-',
        }));

        const { error } = await supabase.from('books').insert(booksToInsert);
        
        if (error) throw error;

        toast.success(`Berhasil mengimpor ${booksToInsert.length} buku!`);
        refetch();
      } catch (err: any) {
        console.error('Upload error:', err);
        toast.error('Gagal mengimpor file: ' + err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            Katalog Buku
          </h1>
          <p className="text-gray-500 mt-1">Kelola data buku perpustakaan, stok, dan kategori.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Template</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30">
            <Plus className="w-4 h-4" />
            <span>Tambah Buku</span>
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari judul, pengarang, atau penerbit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600">
            <Filter className="w-4 h-4" />
            Filter Kategori
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">No</th>
                <th className="px-6 py-4 font-semibold">Judul Buku</th>
                <th className="px-6 py-4 font-semibold text-center">Penerbit</th>
                {canSeeSource && <th className="px-6 py-4 font-semibold text-center">Sumber</th>}
                <th className="px-6 py-4 font-semibold text-center">Stok</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={canSeeSource ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-gray-400">Memuat data buku...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBooks.map((book: any, idx: number) => (
                <tr key={book.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-gray-500 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 line-clamp-1">{book.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{book.author || 'Tanpa Pengarang'}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-center">{book.publisher || '-'}</td>
                  {canSeeSource && (
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                        {book.source || '-'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-bold text-gray-700 w-6">{book.stock}</span>
                      {book.stock === 0 ? (
                        <span className="badge badge-destructive">Habis</span>
                      ) : book.stock < 5 ? (
                        <span className="badge badge-warning">Tipis</span>
                      ) : (
                        <span className="badge badge-success">Ada</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {!isLoading && filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={canSeeSource ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    Buku tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Menampilkan {filteredBooks.length} dari {books.length} buku</span>
        </div>
      </div>
    </AppLayout>
  );
}
