import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { Search, Plus, Filter, BookOpen, Download, MoreHorizontal } from 'lucide-react';

type Book = {
  id: string;
  judul: string;
  pengarang: string;
  penerbit: string;
  jenis: string;
  jumlah: number;
  sumber: string;
};

// Data CSV Dummy (Reference)
const initialBooks: Book[] = [
  { id: '1', judul: 'Dasar Desain Grafis kelas X', pengarang: '-', penerbit: 'Erlangga', jenis: 'Non Fiksi', jumlah: 20, sumber: 'BOS' },
  { id: '2', judul: 'Pemrograman Dasar kelas X', pengarang: '-', penerbit: 'Erlangga', jenis: 'Non Fiksi', jumlah: 20, sumber: 'BOS' },
  { id: '3', judul: 'Komputer dan Jaringan Dasar kelas X', pengarang: '-', penerbit: 'Erlangga', jenis: 'Non Fiksi', jumlah: 20, sumber: 'BOS' },
  { id: '4', judul: 'Sistem Komputer kelas X', pengarang: '-', penerbit: 'Erlangga', jenis: 'Non Fiksi', jumlah: 0, sumber: 'BOS' },
  { id: '5', judul: 'Teknologi Layanan Jaringan kelas XII', pengarang: 'M. Rizal', penerbit: 'Bumi Aksara', jenis: 'Non Fiksi', jumlah: 5, sumber: 'BOS' },
  { id: '6', judul: 'Pekerjaan Dasar Teknik Otomotif', pengarang: '-', penerbit: '-', jenis: 'Non Fiksi', jumlah: 20, sumber: 'BOS' },
  { id: '7', judul: 'Pemeliharaan Mesin Kendaraan Ringan XII', pengarang: '-', penerbit: '-', jenis: 'Non Fiksi', jumlah: 20, sumber: 'BOS' },
];

export default function Books() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBooks = initialBooks.filter(book => 
    book.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.penerbit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadTemplate = () => {
    const headers = "No,Judul Buku,Penyusun/Pengarang,Penerbit,Jenis Buku,Jumlah,Sumber\n";
    const sampleRow = "1,Buku Contoh,Budi Santoso,Erlangga,Fiksi,10,BOS\n";
    const csvContent = headers + sampleRow;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_data_buku.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Template CSV</span>
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
              placeholder="Cari judul buku atau penerbit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600">
            <Filter className="w-4 h-4" />
            Filter Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">No</th>
                <th className="px-6 py-4 font-semibold">Judul Buku</th>
                <th className="px-6 py-4 font-semibold">Penerbit</th>
                <th className="px-6 py-4 font-semibold">Jenis</th>
                <th className="px-6 py-4 font-semibold">Stok & Status</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBooks.map((book, idx) => (
                <tr key={book.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-gray-500 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 line-clamp-1">{book.judul}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{book.pengarang !== '-' ? book.pengarang : 'Tanpa Pengarang'}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{book.penerbit}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      {book.jenis}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-700 w-6">{book.jumlah}</span>
                      {book.jumlah === 0 ? (
                        <span className="badge badge-destructive">Habis</span>
                      ) : book.jumlah < 10 ? (
                        <span className="badge badge-warning">Terbatas</span>
                      ) : (
                        <span className="badge badge-success">Tersedia</span>
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
              
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Buku tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Menampilkan {filteredBooks.length} dari {initialBooks.length} buku</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 font-medium" disabled>Sebelumnya</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 font-medium">Selanjutnya</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
