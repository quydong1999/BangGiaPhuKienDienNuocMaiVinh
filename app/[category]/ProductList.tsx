'use client';

import { useState, useMemo } from 'react';
import type { Product, FilterField, VisibleField } from '@/types/types';
import { PendingProductSkeleton } from '@/components/PendingSkeletons';

interface ProductListProps {
  data: Product[];
  filterField: FilterField | null;
  visibleFields: readonly VisibleField[];
  categoryId: string;
}

export default function ProductList({ data, filterField, visibleFields, categoryId }: ProductListProps) {
  const [selectedField, setSelectedField] = useState<string>('Tất cả');

  // Extract unique product names
  const uniqueData = useMemo(() => {
    if (!filterField) {
      return ['Tất cả'];
    }
    const _data = new Set(data.map(item => item[filterField]));
    return ['Tất cả', ...Array.from(_data)];
  }, [data, filterField]);

  // Filter data based on selected name
  const filteredData = useMemo(() => {
    if (!filterField || selectedField === 'Tất cả') return data;
    return data.filter(item => item[filterField] === selectedField);
  }, [data, selectedField, filterField]);

  const fieldLabels: Record<VisibleField, string> = {
    name: 'Tên',
    spec: 'Quy cách',
    unit: 'Đơn vị',
    priceSell: 'Giá bán',
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="sticky top-14 z-10 bg-slate-50 pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterField && (
          <>
            <label
              htmlFor="product-filter"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Lọc theo tên sản phẩm
            </label>
            <div className="flex gap-2">
              <select
                id="product-filter"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className={`block w-full border border-slate-300 shadow-sm py-3 px-4 text-base focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-white`}
              >
                {uniqueData.map(item => (
                  <option key={item} value={item ?? ""}>{item}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="mt-2 flex justify-between items-center text-sm">
          <span className="text-slate-500">
            Hiển thị {filteredData.length} sản phẩm
          </span>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                {visibleFields.map((field) => (
                  <th
                    key={field}
                    className={
                      field === 'priceSell'
                        ? 'px-4 py-3 text-right'
                        : 'px-4 py-3'
                    }
                  >
                    {fieldLabels[field]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((item, index) => (
                <tr
                  key={`${item._id}-${index}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {visibleFields.map((field) => {
                    const value = item[field as VisibleField];

                    if (field === 'spec') {
                      return (
                        <td key={field} className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-800`}
                          >
                            {value}
                          </span>
                        </td>
                      );
                    }


                    return (
                      <td
                        key={field}
                        className={
                          field === 'priceSell' ?
                            'px-4 py-3 text-right font-bold text-slate-900' : 'px-4 py-3 font-medium text-slate-900'
                        }
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <PendingProductSkeleton 
                categoryId={categoryId} 
                layout="table" 
                visibleFieldsCount={visibleFields.length} 
              />
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
