'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/types/types';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface ProductListProps {
  data: Product[];
  themeColor: 'emerald' | 'blue' | 'yellow';
  filterField: 'name' | 'spec';
}

export default function ProductList({ data, themeColor, filterField }: ProductListProps) {
  const [selectedField, setSelectedField] = useState<string>('Tất cả');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Extract unique product names
  const uniqueData = useMemo(() => {
    const _data = new Set(data.map(item => item[filterField]));
    return ['Tất cả', ...Array.from(_data)];
  }, [data]);

  const handleSpeechResult = (text: string) => {
    setSpeechError(null);
    const lowerText = text.toLowerCase();

    // Find best match
    let bestMatch = 'Tất cả';
    let maxMatchScore = 0;

    for (const item of uniqueData) {
      if (item === 'Tất cả') continue;

      const lowerItem = item.toLowerCase();
      if (lowerItem === lowerText) {
        bestMatch = item;
        break;
      }

      // Simple partial match logic
      if (lowerItem.includes(lowerText) || lowerText.includes(lowerItem)) {
        const score = Math.min(lowerItem.length, lowerText.length) / Math.max(lowerItem.length, lowerText.length);
        if (score > maxMatchScore) {
          maxMatchScore = score;
          bestMatch = item;
        }
      }
    }

    if (bestMatch !== 'Tất cả') {
      setSelectedField(bestMatch);
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
    if (selectedField === 'Tất cả') return data;
    return data.filter(item => item[filterField] === selectedField);
  }, [data, selectedField]);

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
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      focus: 'focus:ring-yellow-500 focus:border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
      micActive: 'bg-yellow-100 text-yellow-600 animate-pulse',
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
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className={`block w-full rounded-xl border border-slate-300 shadow-sm py-3 px-4 text-base ${theme.focus} transition-shadow bg-white`}
          >
            {uniqueData.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          {isSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex-shrink-0 flex items-center justify-center w-12 rounded-xl transition-colors ${isListening ? theme.micActive : theme.micInactive
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
