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
  const { data: books, loading: isLoading, refetch } = useSchoolData('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSeeSource = role === 'admin' || role === 'global_super_admin';
  const canManageBooks = role === 'admin' || role === 'global_super_admin';

  const filteredBooks = useMemo(() => {
    return books.filter((book: any) => 
      (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.publisher || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [books, searchTerm]);

  const handleDownloadTemplate = () => {
    // Simple format (backward compatible)
    const simpleHeaders = "No,Judul Buku,Penyusun/Pengarang,Penerbit,Jenis Buku,Jumlah,Sumber\n";
    const simpleSampleRows = [
      "1,Dasar Desain Grafis kelas X,Tim Pengajar,Erlangga,Non Fiksi,20,BOS",
      "2,Matematika untuk SMA Kelas XI,Dr. Ahmad Wijaya,Gramedia,Fiksi,15,Dana BOS",
      "3,Fisika Dasar,Prof. Budi Santoso,Andi Offset,Non Fiksi,10,Donasi"
    ].join('\n');
    
    // Inventarisasi format (support untuk file Dapodik/sekolah)
    const inventarisasiHeader = `\n\n# FORMAT INVENTARISASI (Dapodik/Format Sekolah):\n# Bisa juga upload file dengan kolom:\n# Nomor,Judul Buku,Penyusun/Pengarang,Penerbit,Tahun Terbit,Fiksi,Non Fiksi,Banyak Buku,BOS,DAK,Lainnya\n#\n# Catatan:\n# - "Judul Buku" wajib diisi\n# - "Banyak Buku" adalah jumlah stok\n# - "Fiksi/Non Fiksi" diisi ? atau V untuk menandai jenis buku\n# - "BOS/DAK/Lainnya" untuk sumber dana`;
    
    const csvContent = simpleHeaders + simpleSampleRows + inventarisasiHeader;
    
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

        // Use current user from AuthContext
        if (!authUser) throw new Error('User not authenticated');
        const user = authUser;

        // Get school_id from AuthContext or fallback to profile lookup
        let schoolId = authUser?.schoolId;
        
        if (!schoolId) {
          // FIX: Skip profile lookup for hardcoded users (non-UUID IDs like 'admin-perpus-001')
          // Only query profiles if user.id looks like a valid UUID
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
          
          if (isValidUUID) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('school_id')
                .eq('user_id', user.id)
                .maybeSingle();

              if (profile?.school_id) {
                schoolId = profile.school_id;
              }
            } catch (err) {
              console.log('Profile lookup failed:', err);
            }
          } else {
            console.log('Skipping profile lookup for hardcoded user:', user.id);
          }
          
          // If still no schoolId, try to get first school from database
          if (!schoolId) {
            try {
              const { data: firstSchool } = await supabase
                .from('schools')
                .select('id')
                .limit(1)
                .maybeSingle();
              schoolId = firstSchool?.id;
            } catch (err) {
              console.log('Schools query failed:', err);
            }
          }
        }

        if (!schoolId) {
          console.warn('No school_id found, using null (global access)');
          // Allow upload without school_id - will be null in database
        }

        // Check for existing books by title
        const titlesToCheck = data.map((row: any) => 
          (row['Judul Buku'] || row['Judul'] || 'Tanpa Judul').trim()
        ).filter(t => t !== 'Tanpa Judul');
        
        const { data: existingBooks } = await supabase
          .from('books')
          .select('title')
          .in('title', titlesToCheck);
          
        const existingTitles = new Set(existingBooks?.map(b => b.title) || []);
        
        if (existingTitles.size > 0) {
          const confirmReplace = window.confirm(
            `Ditemukan ${existingTitles.size} buku dengan judul yang sudah ada:\n` +
            Array.from(existingTitles).slice(0, 5).join(', ') +
            (existingTitles.size > 5 ? `... dan ${existingTitles.size - 5} lainnya` : '') +
            `\n\nApakah Anda ingin:` +
            `\n- Klik "OK" untuk mengganti data lama dengan data baru` +
            `\n- Klik "Cancel" untuk melewati data yang sudah ada`
          );
          
          if (confirmReplace) {
            // Delete existing books
            const { error: deleteError } = await supabase
              .from('books')
              .delete()
              .in('title', Array.from(existingTitles));
            if (deleteError) {
              toast.error('Gagal menghapus data lama: ' + deleteError.message);
            } else {
              toast.success(`${existingTitles.size} data lama dihapus`);
            }
          }
        }

        // Process books with proper field mapping
        // Support both old template format and new inventarisasi format
        const booksToInsert = data.map((row: any) => {
          // DEBUG: Log all available keys
          console.log('CSV Row keys:', Object.keys(row));
          console.log('CSV Row values:', row);
          
          // Try multiple possible column names for each field (case insensitive)
          const getValue = (keys: string[]) => {
            for (const key of keys) {
              // Try exact match first
              if (row[key] !== undefined && row[key] !== '') return row[key];
              // Try case insensitive
              const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') return row[foundKey];
            }
            return '';
          };
          
          const stock = parseInt(getValue(['Jumlah', 'Banyak Buku', 'Banyak', 'jumlah', 'banyak buku', 'banyak'])) || 0;
          
          // Determine category type from various possible column names
          let categoryType = 'Non Fiksi';
          const jenisVal = getValue(['Jenis Buku', 'Fiksi', 'Non Fiksi', 'jenis buku', 'fiksi', 'non fiksi']);
          if (jenisVal === '?' || jenisVal === 'V' || jenisVal?.toLowerCase().includes('fiksi')) {
            categoryType = jenisVal.includes('Non') ? 'Non Fiksi' : 'Fiksi';
          }
          
          // Get source (sumber) - BOS, DAK, or Lainnya
          let source = '-';
          if (getValue(['BOS', 'bos'])) source = 'BOS';
          else if (getValue(['DAK', 'dak'])) source = 'DAK';
          else if (getValue(['Lainnya', 'lainnya'])) source = 'Lainnya';
          else if (getValue(['Sumber', 'sumber'])) source = getValue(['Sumber', 'sumber']);
          
          const title = getValue(['Judul Buku', 'Judul', 'judul buku', 'judul']);
          const author = getValue(['Penyusun/Pengarang', 'Penyusun', 'Pengarang', 'penyusun/pengarang', 'penyusun', 'pengarang']);
          const publisher = getValue(['Penerbit', 'penerbit']);
          const year = parseInt(getValue(['Tahun Terbit', 'Tahun', 'tahun terbit', 'tahun'])) || new Date().getFullYear();
          
          console.log('Parsed values:', { title, author, publisher, year, stock });
          
          return {
            categoryType, // frontend-only, stripped before insert
            // DB-valid fields only below:
            school_id: schoolId || null, // Ensure null if undefined
            title: title.trim() || 'Tanpa Judul',
            author: author.trim() || '-',
            publisher: publisher.trim() || '-',
            year,
            isbn: '',
            shelf_location: '',
            stock,
            available: stock,
          };
        });

        // Handle categories for each book, then build clean DB payload
        const processedBooks = [];
        for (const book of booksToInsert) {
          const { categoryType, ...dbFields } = book; // strip frontend-only field

          let categoryId: string | null = null;
          
          // Only try to find/create category if we have a valid school_id
          if (schoolId && schoolId !== 'undefined') {
            try {
              const { data: existingCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('name', categoryType)
                .eq('school_id', schoolId)
                .limit(1)
                .maybeSingle();

              if (existingCategory) {
                categoryId = existingCategory.id;
              } else {
                const { data: newCat, error: catError } = await supabase
                  .from('categories')
                  .insert({ name: categoryType, school_id: schoolId })
                  .select('id')
                  .single();
                if (catError) {
                  console.warn('Failed to create category:', catError);
                } else {
                  categoryId = newCat?.id ?? null;
                }
              }
            } catch (catErr) {
              console.warn('Category lookup/creation failed:', catErr);
            }
          }

          // Explicit whitelist — only columns that exist in DB schema
          processedBooks.push({
            school_id: dbFields.school_id,
            title: dbFields.title,
            author: dbFields.author,
            publisher: dbFields.publisher,
            year: dbFields.year,
            isbn: dbFields.isbn,
            shelf_location: dbFields.shelf_location,
            stock: dbFields.stock,
            available: dbFields.available,
            category_id: categoryId,
          });
        }

        const { error } = await supabase.from('books').insert(processedBooks);
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast.success(`Berhasil mengimpor ${processedBooks.length} buku!`);
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
          
          {canManageBooks && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="hidden sm:inline">Upload CSV</span>
            </button>
          )}

          {canManageBooks && (
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Template</span>
            </button>
          )}
          
          {canManageBooks && (
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30">
              <Plus className="w-4 h-4" />
              <span>Tambah Buku</span>
            </button>
          )}
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
