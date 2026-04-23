'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionEvent {
  _id: string;
  gateway: string;
  transactionDate: string;
  accountNumber: string | null;
  amountIn: number;
  amountOut: number;
  code: string | null;
  transactionContent: string | null;
  referenceNumber: string | null;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * TransactionNotifier
 * 
 * Client component lắng nghe SSE từ /api/sse/transactions.
 * Khi nhận event "new-transaction":
 * 1. Hiển thị Sonner toast
 * 2. Dispatch custom event "new-transaction" để các component khác (TransactionsClient) tự refresh
 */
export default function TransactionNotifier() {
  const { data: session, status } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Chỉ kết nối SSE khi đã đăng nhập
    if (status !== 'authenticated' || !session?.user) return;

    let mounted = true;

    function connect() {
      if (!mounted) return;
      
      // Cleanup previous connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource('/api/sse/transactions');
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        console.log('✅ SSE connected for transaction notifications');
      });

      es.addEventListener('new-transaction', (event) => {
        try {
          const data: TransactionEvent = JSON.parse(event.data);
          const isIncoming = data.amountIn > 0;
          const amount = isIncoming ? data.amountIn : data.amountOut;

          // Hiển thị toast notification
          toast.custom(
            () => (
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-[360px] max-w-[90vw]">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isIncoming 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {isIncoming ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800">
                      {isIncoming ? 'Nhận tiền' : 'Chuyển tiền'} — {data.gateway}
                    </p>
                    <p className={`text-lg font-black mt-0.5 ${
                      isIncoming ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {isIncoming ? '+' : '-'}{formatVND(amount)}
                    </p>
                    {data.transactionContent && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {data.transactionContent}
                      </p>
                    )}
                    {data.code && (
                      <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 mt-1">
                        Mã: {data.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ),
            {
              duration: 8000,
              position: 'top-right',
            }
          );

          // Dispatch custom event để các component khác có thể listen
          window.dispatchEvent(new CustomEvent('new-transaction', { detail: data }));
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      es.onerror = () => {
        console.warn('⚠️ SSE connection lost, reconnecting in 5s...');
        es.close();
        eventSourceRef.current = null;

        // Auto-reconnect sau 5 giây
        if (mounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      mounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [status, session]);

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          padding: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        },
      }}
    />
  );
}
