"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  required?: boolean;
}

export function Combobox({ 
  options, 
  value, 
  onChange, 
  placeholder = "Chọn hoặc nhập mới...", 
  label,
  className = "",
  required = false
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync searchTerm when value props changes from outside
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If user typed something but didn't select, we keep what they typed
        // which allows for "new" values not in the list
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (opt: string) => {
    onChange(opt);
    setSearchTerm(opt);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
          {label}
        </label>
      )}
      
      <div className="relative group">
        <input
          type="text"
          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium placeholder:text-slate-300"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          required={required}
        />
        
        <div className="absolute right-0 top-0 h-full flex items-center pr-2 gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => { onChange(""); setSearchTerm(""); }}
              className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleDropdown}
            className={`p-1 text-slate-400 hover:text-emerald-600 transition-all ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between group
                    ${opt === value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}
                  `}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                  {opt === value && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-slate-400">
              <Search size={20} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs">Không tìm thấy kết quả khớp</p>
              <p className="text-[10px] mt-1 italic">Nhập mới: "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
