'use client';

import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/lib/data';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface ProductListProps {
  data: Product[];
  themeColor: 'emerald' | 'blue';
}

export default function ProductList({ data, themeColor }: ProductListProps) {
  const [selectedName, setSelectedName] = useState<string>('Tất cả');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Extract unique product names
  const uniqueNames = useMemo(() => {
    const names = new Set(data.map(item => item.name));
    return ['Tất cả', ...Array.from(names)];
  }, [data]);

  const handleSpeechResult = (text: string) => {
    setSpeechError(null);
    const lowerText = text.toLowerCase();
    
    // Find best match
    let bestMatch = 'Tất cả';
    let maxMatchScore = 0;

    for (const name of uniqueNames) {
      if (name === 'Tất cả') continue;
      
      const lowerName = name.toLowerCase();
      if (lowerName === lowerText) {
        bestMatch = name;
        break;
      }
      
      // Simple partial match logic
      if (lowerName.includes(lowerText) || lowerText.includes(lowerName)) {
        const score = Math.min(lowerName.length, lowerText.length) / Math.max(lowerName.length, lowerText.length);
        if (score > maxMatchScore) {
          maxMatchScore = score;
          bestMatch = name;
        }
      }
    }

    if (bestMatch !== 'Tất cả') {
      setSelectedName(bestMatch);
    } else {
      setSpeechError(`Không tìm thấy: "${text}"`);
      setTimeout(() => setSpeechError(null), 3000);
    }
  };

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    lang: 'vi-VN',
    onResult: handleSpeechResult,
    onError: (err) => {
      setSpeechError(err);
      setTimeout(() => setSpeechError(null), 3000);
    }
  });

  // Filter data based on selected name
  const filteredData = useMemo(() => {
    if (selectedName === 'Tất cả') return data;
    return data.filter(item => item.name === selectedName);
  }, [data, selectedName]);

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      focus: 'focus:ring-emerald-500 focus:border-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800',
      micActive: 'bg-emerald-100 text-emerald-600 animate-pulse',
      micInactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      focus: 'focus:ring-blue-500 focus:border-blue-500',
      badge: 'bg-blue-100 text-blue-800',
      micActive: 'bg-blue-100 text-blue-600 animate-pulse',
      micInactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }
  };

  const theme = colorClasses[themeColor];

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="sticky top-14 z-10 bg-slate-50 pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <label htmlFor="product-filter" className="block text-sm font-medium text-slate-700 mb-1">
          Lọc theo tên sản phẩm
        </label>
        <div className="flex gap-2">
          <select
            id="product-filter"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className={`block w-full rounded-xl border border-slate-300 shadow-sm py-3 px-4 text-base ${theme.focus} transition-shadow bg-white`}
          >
            {uniqueNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          
          {isSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex-shrink-0 flex items-center justify-center w-12 rounded-xl transition-colors ${
                isListening ? theme.micActive : theme.micInactive
              }`}
              title={isListening ? "Dừng nghe" : "Tìm kiếm bằng giọng nói"}
            >
              {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
        
        <div className="mt-2 flex justify-between items-center text-sm">
          <span className="text-slate-500">
            Hiển thị {filteredData.length} sản phẩm
          </span>
          {isListening && (
            <span className={`font-medium ${theme.text}`}>Đang nghe...</span>
          )}
          {speechError && (
            <span className="text-red-500 font-medium">{speechError}</span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Quy cách</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((item, index) => (
                <tr key={`${item.stt}-${index}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${theme.badge}`}>
                      {item.spec}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{item.priceSell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filteredData.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Không tìm thấy sản phẩm nào.
        </div>
      )}
    </div>
  );
}
