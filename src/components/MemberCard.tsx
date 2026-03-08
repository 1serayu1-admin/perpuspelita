import { useRef } from 'react';
import Barcode from 'react-barcode';
import { useSettings } from '@/contexts/SettingsContext';
import { BookOpen, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MemberCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  id: string; // NIS or NIP
  role: 'Siswa' | 'Guru';
  detail: string; // className or subject
  email: string;
  membershipStart?: string;
  membershipEnd?: string;
  isActive: boolean;
}

export function MemberCard({ open, onOpenChange, name, id, role, detail, email, membershipStart, membershipEnd, isActive }: MemberCardProps) {
  const { settings } = useSettings();
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=500,height=350');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Anggota - ${name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; font-family: 'Segoe UI', sans-serif; }
          @media print {
            body { background: white; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Kartu Anggota Perpustakaan
          </DialogTitle>
        </DialogHeader>

        {/* Card Preview */}
        <div ref={cardRef}>
          <div style={{
            width: '400px',
            minHeight: '240px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
            color: 'white',
            padding: '24px',
            fontFamily: "'Segoe UI', sans-serif",
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px',
              borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px',
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', background: 'white', padding: '2px' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px' }}>📚</span>
                </div>
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>{settings.appName || 'Perpustakaan'}</div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>{settings.schoolName || 'SMA Negeri 1'}</div>
              </div>
              <div style={{ marginLeft: 'auto', background: isActive ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>
                {isActive ? '● Aktif' : '● Nonaktif'}
              </div>
            </div>

            {/* Info */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '2px' }}>{name}</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>
                {role} • {detail}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{email}</div>
            </div>

            {/* Membership dates */}
            {membershipStart && membershipEnd && (
              <div style={{ display: 'flex', gap: '16px', fontSize: '10px', opacity: 0.8, marginBottom: '12px' }}>
                <span>Mulai: {membershipStart}</span>
                <span>Berakhir: {membershipEnd}</span>
              </div>
            )}

            {/* Barcode */}
            <div style={{ background: 'white', borderRadius: '8px', padding: '6px 12px', display: 'inline-block' }}>
              <Barcode
                value={id}
                width={1.5}
                height={40}
                fontSize={11}
                margin={0}
                background="transparent"
                displayValue={true}
              />
            </div>
          </div>
        </div>

        <Button variant="gradient" onClick={handlePrint} className="w-full">
          <Printer className="w-4 h-4 mr-1" /> Cetak Kartu
        </Button>
      </DialogContent>
    </Dialog>
  );
}
