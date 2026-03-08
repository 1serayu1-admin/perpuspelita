import { createContext, useContext, useState, ReactNode } from 'react';
import { BorrowRequest, RequestStatus } from '@/lib/types';

interface BorrowRequestContextType {
  requests: BorrowRequest[];
  addRequest: (req: Omit<BorrowRequest, 'id' | 'requestDate' | 'status'>) => void;
  updateRequestStatus: (id: string, status: RequestStatus, reviewedBy: string, rejectionReason?: string) => void;
  getPendingCount: () => number;
}

const BorrowRequestContext = createContext<BorrowRequestContextType | undefined>(undefined);

const initialRequests: BorrowRequest[] = [
  {
    id: 'req1',
    requesterId: 's1',
    requesterName: 'Andi Pratama',
    requesterRole: 'siswa',
    bookId: 'b3',
    bookTitle: 'Laskar Pelangi',
    reason: 'Untuk tugas Bahasa Indonesia',
    requestDate: '2024-03-08',
    status: 'pending',
    className: 'X IPA 1',
  },
  {
    id: 'req2',
    requesterId: 's3',
    requesterName: 'Citra Dewi',
    requesterRole: 'siswa',
    bookId: 'b4',
    bookTitle: 'Bumi Manusia',
    reason: 'Ingin membaca novel sastra',
    requestDate: '2024-03-07',
    status: 'approved',
    className: 'X IPA 2',
    reviewedBy: 'Ibu Sari',
    reviewedAt: '2024-03-07',
  },
  {
    id: 'req3',
    requesterId: 't1',
    requesterName: 'Pak Budi',
    requesterRole: 'guru',
    bookId: 'b5',
    bookTitle: 'Kamus Besar Bahasa Indonesia',
    reason: 'Referensi mengajar',
    requestDate: '2024-03-06',
    status: 'pending',
    duration: 14,
  },
];

export function BorrowRequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<BorrowRequest[]>(initialRequests);

  const addRequest = (req: Omit<BorrowRequest, 'id' | 'requestDate' | 'status'>) => {
    const newReq: BorrowRequest = {
      ...req,
      id: `req${Date.now()}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    setRequests(prev => [newReq, ...prev]);
  };

  const updateRequestStatus = (id: string, status: RequestStatus, reviewedBy: string, rejectionReason?: string) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status, reviewedBy, reviewedAt: new Date().toISOString().split('T')[0], rejectionReason }
          : r
      )
    );
  };

  const getPendingCount = () => requests.filter(r => r.status === 'pending').length;

  return (
    <BorrowRequestContext.Provider value={{ requests, addRequest, updateRequestStatus, getPendingCount }}>
      {children}
    </BorrowRequestContext.Provider>
  );
}

export function useBorrowRequests() {
  const ctx = useContext(BorrowRequestContext);
  if (!ctx) throw new Error('useBorrowRequests must be used within BorrowRequestProvider');
  return ctx;
}
