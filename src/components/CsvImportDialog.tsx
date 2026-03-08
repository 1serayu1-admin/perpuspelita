import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  columns: { key: string; label: string; required?: boolean }[];
  onImport: (rows: Record<string, string>[]) => Promise<{ success: number; failed: number }>;
  templateFilename: string;
}

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === ',' || ch === ';') && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

export function CsvImportDialog({ open, onOpenChange, title, columns, onImport, templateFilename }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
  };

  const handleFile = (f: File) => {
    setResult(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length < 2) {
        toast.error('File CSV harus memiliki header dan minimal 1 baris data');
        return;
      }
      // Map CSV headers to column keys
      const csvHeaders = parsed[0].map(h => h.toLowerCase().trim());
      const headerToKey = new Map<number, string>();
      csvHeaders.forEach((csvH, idx) => {
        const col = columns.find(c => c.key === csvH || c.label.toLowerCase() === csvH);
        if (col) headerToKey.set(idx, col.key);
      });

      const rows = parsed.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headerToKey.forEach((key, idx) => { obj[key] = row[idx] || ''; });
        return obj;
      }).filter(row => Object.values(row).some(v => v));
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      const res = await onImport(preview);
      setResult(res);
      if (res.success > 0) toast.success(`${res.success} data berhasil diimport`);
      if (res.failed > 0) toast.error(`${res.failed} data gagal diimport`);
    } catch {
      toast.error('Terjadi kesalahan saat import');
    }
    setImporting(false);
  };

  const downloadTemplate = () => {
    const header = columns.map(c => c.label).join(',');
    const sample = columns.map(c => c.key === 'name' ? 'Contoh Nama' : c.key === 'email' ? 'contoh@email.com' : '').join(',');
    const csv = `${header}\n${sample}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!importing) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-medium">Download Template CSV</p>
              <p className="text-xs text-muted-foreground">
                Kolom: {columns.map(c => c.label).join(', ')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" /> Template
            </Button>
          </div>

          {/* File input */}
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium text-foreground">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Klik atau drag file CSV ke sini</p>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-primary" />
                {preview.length} baris data siap diimport
              </p>
              <div className="max-h-40 overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {columns.map(c => (
                        <th key={c.key} className="p-2 text-left font-medium text-muted-foreground">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {columns.map(c => (
                          <td key={c.key} className="p-2 text-foreground whitespace-nowrap">{row[c.key] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                    {preview.length > 5 && (
                      <tr><td colSpan={columns.length} className="p-2 text-center text-muted-foreground">...dan {preview.length - 5} baris lainnya</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-lg border p-4 bg-muted/20 space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Import Selesai
              </p>
              <p className="text-xs text-muted-foreground">Berhasil: {result.success} | Gagal: {result.failed}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!result ? (
              <Button
                variant="gradient"
                className="w-full"
                disabled={preview.length === 0 || importing}
                onClick={handleImport}
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Mengimport...
                  </span>
                ) : (
                  <>Import {preview.length} Data</>
                )}
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => { onOpenChange(false); reset(); }}>
                Tutup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
