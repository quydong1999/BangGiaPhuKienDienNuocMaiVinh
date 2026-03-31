'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product, FilterField, VisibleField, FlattenedProduct } from '@/types/types';
import { PendingProductSkeleton } from '@/components/PendingSkeletons';
import { formatVND, flattenProducts } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';

interface ProductListProps {
  data: Product[];
  filterField: FilterField | null;
  visibleFields: readonly VisibleField[];
  categoryId: string;
  categoryImageUrl?: string;
}

export default function ProductList({ data = [], filterField, visibleFields, categoryId, categoryImageUrl }: ProductListProps) {
  const [selectedField, setSelectedField] = useState<string>('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameClick = useCallback((item: Product) => {
    const flattened = item as unknown as FlattenedProduct;
    // Single click → open ProductPreview
    dispatch(openModal({
      type: 'productPreview',
      props: { 
        product: item, 
        categoryImageUrl, 
        initialSpec: flattened.spec, 
        initialUnit: flattened.unit 
      }
    }));
  }, [dispatch, categoryImageUrl]);

  const handleNameDoubleClick = useCallback((item: Product) => {
    dispatch(openModal({ type: 'productForm', props: { categoryId, initialData: item } }));
  }, [dispatch, categoryId]);

  const handleCellClick = useCallback((item: Product) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleNameDoubleClick(item);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleNameClick(item);
      }, 250);
    }
  }, [handleNameClick, handleNameDoubleClick]);

  // Reset trang về 1 khi chọn filter
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedField]);

  // Flatten data: Mỗi biến thể (spec + unit) là 1 dòng
  const flattenedData = useMemo(() => {
    const flat = flattenProducts(data);
    return flat.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name, 'vi');
      if (nameCompare !== 0) return nameCompare;
      if (a.spec && b.spec) return a.spec.localeCompare(b.spec, 'vi');
      return 0;
    });
  }, [data]);

  // Extract unique product names for filter
  const uniqueData = useMemo(() => {
    if (!filterField || !data) {
      return ['Tất cả'];
    }
    // Case 'spec': Lấy tất cả các spec name từ tất cả sản phẩm
    if (filterField === 'spec' as any) {
      const specs = new Set<string>();
      data.forEach(p => p.specs?.forEach(s => specs.add(s.name)));
      return ['Tất cả', ...Array.from(specs).sort((a, b) => a.localeCompare(b, 'vi'))];
    }
    const _data = new Set<string>(data.filter(Boolean).map(item => String((item as any)[filterField])));
    return ['Tất cả', ...Array.from(_data).sort((a, b) => a.localeCompare(b, 'vi'))];
  }, [data, filterField]);

  // Filter flattened data based on selected name
  const filteredData = useMemo(() => {
    if (!filterField || selectedField === 'Tất cả') return flattenedData;
    if (filterField === 'spec' as any) {
      return flattenedData.filter((item: FlattenedProduct) => item.spec === selectedField);
    }
    return flattenedData.filter((item: FlattenedProduct) => (item as any)[filterField] === selectedField);
  }, [flattenedData, selectedField, filterField]);

  // Cuộn tới sản phẩm từ URL và chuyển trang thích hợp
  useEffect(() => {
    const productId = searchParams.get('productId');
    if (productId) {
      const index = filteredData.findIndex((p: FlattenedProduct) => p._id === productId);
      // ... (rest of scroll logic stays similar)
      if (index !== -1) {
        const targetPage = Math.floor(index / ITEMS_PER_PAGE) + 1;
        setCurrentPage(targetPage);

        setTimeout(() => {
          const element = document.getElementById(`product-${productId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-emerald-50');
            setTimeout(() => {
              element.classList.remove('bg-emerald-50');
            }, 3000);
          }
        }, 100);
      }
    }
  }, [searchParams, filteredData]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const sortedVisibleFields = useMemo(() => {
    const order: VisibleField[] = ['name', 'spec', 'unit', 'priceSell'];
    return order.filter(field => (visibleFields as VisibleField[]).includes(field));
  }, [visibleFields]);

  const fieldLabels: Record<VisibleField, string> = {
    name: 'Tên',
    spec: 'Quy cách',
    unit: 'Đơn vị',
    priceSell: 'Giá bán',
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <nav aria-label="Bộ lọc sản phẩm" className="sticky top-[102px] sm:top-16 z-10 bg-light-grey pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterField && (
          <>
            <label
              htmlFor="product-filter"
              className="block text-sm font-medium text-slate-700 mb-1 mt-2"
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
      </nav>

      {/* List */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">Bảng danh sách sản phẩm</caption>
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                {sortedVisibleFields.map((field) => (
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
              {paginatedData.map((item: FlattenedProduct, index) => (
                <tr
                  key={`${item._id_variant}`}
                  id={`product-${item._id}`}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleCellClick(item as unknown as Product)}
                >
                  {sortedVisibleFields.map((field, fIndex) => {
                    let value: any = item[field as keyof FlattenedProduct];

                    if (field === 'spec') {
                      value = item.spec;
                      return (
                        <td
                          key={field}
                          className="px-4 py-3"
                        >
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-800`}
                          >
                            {value}
                          </span>
                        </td>
                      );
                    }

                    if (field === 'priceSell') {
                      value = formatVND(item.priceSell);
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
                visibleFieldsCount={sortedVisibleFields.length}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 sm:px-6">

          {/* Thông tin số lượng (Desktop) */}
          <div className="hidden sm:block text-sm text-slate-700">
            Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> trong{' '}
            <span className="font-medium">{filteredData.length}</span> kết quả
          </div>

          {/* Cụm nút chuyển trang (Mobile First) */}
          <nav className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center" aria-label="Pagination">
            {/* Về trang 1 */}
            <button
              onClick={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="p-2 sm:px-3 sm:py-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Trang đầu"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Trang trước */}
            <button
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="p-2 sm:px-3 sm:py-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Trang trước"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Số trang hiện tại */}
            <div className="flex items-center justify-center px-4 py-2 min-w-[3rem] sm:min-w-[4rem]">
              {currentPage} <span className="mx-1 font-normal">/</span> {totalPages}
            </div>

            {/* Trang sau */}
            <button
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="p-2 sm:px-3 sm:py-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Trang sau"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Trang cuối */}
            <button
              onClick={() => {
                setCurrentPage(totalPages);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="p-2 sm:px-3 sm:py-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Trang cuối"
              title="Trang cuối"
            >
              <ChevronsRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </nav>
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Không tìm thấy sản phẩm nào.
        </div>
      )}
    </div>
  );
}
