import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex w-full items-center text-sm text-slate-500 py-3 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                >
                  {index === 0 && item.label === 'Trang chủ' ? <Home size={16} className="mb-[2px]" /> : null}
                  <span className={index === 0 && item.label === 'Trang chủ' ? 'hidden sm:inline-block' : ''}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className={`flex items-center gap-1.5 ${isLast ? 'text-slate-900 font-medium' : ''}`}>
                  {index === 0 && item.label === 'Trang chủ' ? <Home size={16} className="mb-[2px]" /> : null}
                  <span className={index === 0 && item.label === 'Trang chủ' ? 'hidden sm:inline-block' : ''}>
                    {item.label}
                  </span>
                </span>
              )}
              
              {!isLast && (
                <ChevronRight size={16} className="mx-1 sm:mx-2 text-slate-400 flex-shrink-0 mb-[2px]" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
