"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  X,
  PackagePlus,
  ListPlus,
  DollarSign,
  Pencil,
  CheckCircle2,
  Link2,
  Sheet,
  ChevronDown,
} from "lucide-react";
import type { Product } from "@/types/types";
import type { BulkImportAction } from "@/types/service.types";

// ─── Types ──────────────────────────────────────────────────────────────────

type ImportStage = "upload" | "analyze" | "confirm";
type UploadTab = "csv" | "gsheet";

interface CsvRow {
  name: string;
  spec: string;
  unit: string;
  price: number;
  basePrice: number;
}

interface AnalyzedRow extends CsvRow {
  action: BulkImportAction;
  currentPrice?: number;
  currentBasePrice?: number;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
}

// ─── CSV Header Mapping ─────────────────────────────────────────────────────

const HEADER_MAP: Record<string, keyof CsvRow> = {
  "tên sản phẩm": "name",
  "quy cách": "spec",
  "đơn vị tính": "unit",
  "giá bán": "price",
  "giá nhập": "basePrice",
};

const HEADER_LABELS: Record<keyof CsvRow, string> = {
  name: "Tên sản phẩm",
  spec: "Quy cách",
  unit: "Đơn vị tính",
  price: "Giá bán",
  basePrice: "Giá nhập",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Robust CSV line splitter that handles:
 * 1. Double quoted fields: "Like, this"
 * 2. Escaped quotes: "He said ""Hello"""
 */
function splitCsvLine(line: string) {
  const result: string[] = [];
  let curValue = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ""
        curValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(curValue);
      curValue = "";
    } else {
      curValue += char;
    }
  }
  result.push(curValue);
  return result;
}

function parseCSV(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["File CSV trống hoặc chỉ có header"], totalLines: 0 };
  }

  // Tìm cột dựa trên header (case-insensitive)
  const headers = splitCsvLine(lines[0]).map((h) => normalize(h));
  const colIndices: Record<string, number> = {};
  const missingHeaders: string[] = [];

  for (const [headerText, field] of Object.entries(HEADER_MAP)) {
    const idx = headers.findIndex((h) => h === headerText);
    if (idx === -1) {
      if (field !== "basePrice") {
        missingHeaders.push(HEADER_LABELS[field as keyof CsvRow]);
      }
    } else {
      colIndices[field] = idx;
    }
  }

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [`Thiếu cột bắt buộc: ${missingHeaders.join(", ")}. Các cột cần có: Tên sản phẩm, Quy cách, Đơn vị tính, Giá bán`],
      totalLines: 0,
    };
  }

  const errors: string[] = [];
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const name = cols[colIndices.name]?.trim() || "";
    const spec = cols[colIndices.spec]?.trim() || "";
    const unit = cols[colIndices.unit]?.trim() || "";
    const priceStr = cols[colIndices.price]?.trim() || "";
    const price = Number(priceStr);
    const basePriceStr = colIndices.basePrice !== undefined ? cols[colIndices.basePrice]?.trim() : "";
    const basePrice = basePriceStr ? Number(basePriceStr) : 0;

    // Bỏ qua dòng hoàn toàn trống
    if (!name && !spec && !unit && !priceStr) continue;

    let hasError = false;
    if (!name) { errors.push(`Dòng ${i + 1}: Tên sản phẩm trống`); hasError = true; }
    if (!spec) { errors.push(`Dòng ${i + 1}: Quy cách trống`); hasError = true; }
    if (!unit) { errors.push(`Dòng ${i + 1}: Đơn vị tính trống`); hasError = true; }
    if (!priceStr || isNaN(price) || price < 0) {
      errors.push(`Dòng ${i + 1}: Giá bán không hợp lệ "${priceStr}"`);
      hasError = true;
    }

    if (!hasError) {
      rows.push({ name, spec, unit, price, basePrice: isNaN(basePrice) ? 0 : basePrice });
    }
  }

  return { rows, errors, totalLines: lines.length - 1 };
}

function analyzeImport(csvRows: CsvRow[], existingProducts: Product[]): AnalyzedRow[] {
  // Build lookup: Map<normalizedName, { specs: Map<normalizedSpec, Map<normalizedUnit, {price, basePrice}>> }>
  const productMap = new Map<string, { specs: Map<string, Map<string, { price: number, basePrice: number }>> }>();

  for (const product of existingProducts) {
    const specMap = new Map<string, Map<string, { price: number, basePrice: number }>>();
    for (const spec of product.specs) {
      const priceMap = new Map<string, { price: number, basePrice: number }>();
      for (const p of spec.prices) {
        priceMap.set(normalize(p.unit), { price: p.price, basePrice: p.basePrice || 0 });
      }
      specMap.set(normalize(spec.name), priceMap);
    }
    productMap.set(normalize(product.name), { specs: specMap });
  }

  return csvRows.map((row) => {
    const productInfo = productMap.get(normalize(row.name));
    if (!productInfo) return { ...row, action: "new_product" as const };

    const specMap = productInfo.specs;
    const priceMap = specMap.get(normalize(row.spec));
    if (!priceMap) return { ...row, action: "new_spec" as const };

    const existing = priceMap.get(normalize(row.unit));
    const existingPrice = existing?.price;
    const existingBasePrice = existing?.basePrice ?? 0;

    if (existingPrice === undefined) {
      return { ...row, action: "new_price" as const, currentBasePrice: 0 };
    }

    const priceChanged = existingPrice !== row.price;
    const basePriceChanged = existingBasePrice !== row.basePrice;

    if (priceChanged || basePriceChanged) {
      return {
        ...row,
        action: "update_price" as const,
        currentPrice: existingPrice,
        currentBasePrice: existingBasePrice
      };
    }

    return { ...row, action: "unchanged" as const };
  });
}

// ─── Action Config ──────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<BulkImportAction, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  new_product: { label: "Sản phẩm mới", icon: <PackagePlus size={14} />, color: "text-teal-700", bgColor: "bg-teal-50 border-teal-200" },
  new_spec: { label: "Quy cách mới", icon: <ListPlus size={14} />, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  new_price: { label: "Đơn giá mới", icon: <DollarSign size={14} />, color: "text-violet-700", bgColor: "bg-violet-50 border-violet-200" },
  update_price: { label: "Cập nhật giá", icon: <Pencil size={14} />, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  unchanged: { label: "Không đổi", icon: <CheckCircle2 size={14} />, color: "text-slate-500", bgColor: "bg-slate-50 border-slate-200" },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function BulkImportModal({ isOpen, onClose, categoryId }: BulkImportModalProps) {
  const [stage, setStage] = useState<ImportStage>("upload");
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedCount, setParsedCount] = useState(0);
  const [analyzedRows, setAnalyzedRows] = useState<AnalyzedRow[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterAction, setFilterAction] = useState<BulkImportAction | null>(null);
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());
  const [confirmCode, setConfirmCode] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Google Sheet State ────────────────────────────────────────────────
  const [uploadTab, setUploadTab] = useState<UploadTab>("csv");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetTabs, setSheetTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState("");
  const [isFetchingTabs, setIsFetchingTabs] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStage("upload");
    setCsvRows([]);
    setParseErrors([]);
    setParsedCount(0);
    setAnalyzedRows([]);
    setIsAnalyzing(false);
    setIsImporting(false);
    setImportResult(null);
    setImportError(null);
    setFileName(null);
    setFilterAction(null);
    setExcludedIndices(new Set());
    setConfirmCode(null);
    setConfirmInput("");
    setSheetUrl("");
    setSheetTabs([]);
    setSelectedTab("");
    setIsFetchingTabs(false);
    setIsFetchingData(false);
    setSheetError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ─── File Handling ──────────────────────────────────────────────────────

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      console.error("❌ File không hợp lệ: Chỉ hỗ trợ file CSV (.csv). File đã chọn:", file.name);
      setParseErrors(["Chỉ hỗ trợ file CSV (.csv)"]);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors, totalLines } = parseCSV(text);

      if (errors.length > 0) {
        console.group("❌ Lỗi phân tích file CSV:");
        errors.forEach(err => console.error(err));
        console.groupEnd();
      } else {
        console.log("✅ File CSV hợp lệ. Số dòng:", totalLines);
      }

      setCsvRows(rows);
      setParseErrors(errors);
      setParsedCount(totalLines);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ─── Google Sheet Handlers ──────────────────────────────────────────────

  const handleFetchTabs = async () => {
    if (!sheetUrl.trim()) {
      setSheetError("Vui lòng dán URL Google Sheet.");
      return;
    }
    setIsFetchingTabs(true);
    setSheetError(null);
    setSheetTabs([]);
    setSelectedTab("");
    try {
      const res = await fetch("/api/bulk-import/fetch-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_tabs", url: sheetUrl }),
      });
      const json = await res.json();
      if (!json.success) {
        setSheetError(json.message || "Lỗi khi lấy danh sách tab.");
      } else {
        setSheetTabs(json.tabs);
        if (json.tabs.length > 0) setSelectedTab(json.tabs[0]);
      }
    } catch {
      setSheetError("Lỗi kết nối server.");
    } finally {
      setIsFetchingTabs(false);
    }
  };

  const handleFetchSheetData = async () => {
    if (!selectedTab) return;
    setIsFetchingData(true);
    setSheetError(null);
    try {
      const res = await fetch("/api/bulk-import/fetch-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_data", url: sheetUrl, sheetName: selectedTab }),
      });
      const json = await res.json();
      if (!json.success) {
        setSheetError(json.message || "Lỗi khi đọc dữ liệu.");
      } else {
        // Dùng parseCSV hiện có để xử lý
        const { rows, errors, totalLines } = parseCSV(json.csvText);
        setCsvRows(rows);
        setParseErrors(errors);
        setParsedCount(totalLines);
        setFileName(`Google Sheet — ${selectedTab}`);
      }
    } catch {
      setSheetError("Lỗi kết nối server.");
    } finally {
      setIsFetchingData(false);
    }
  };

  // ─── Analyze ────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/products?categoryId=${categoryId}`);
      const json = await res.json();
      const existingProducts: Product[] = json.data || [];
      const analyzed = analyzeImport(csvRows, existingProducts);
      setAnalyzedRows(analyzed);
      setExcludedIndices(new Set());
      setStage("analyze");
    } catch {
      setParseErrors(["Lỗi khi tải dữ liệu sản phẩm hiện tại"]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Import ─────────────────────────────────────────────────────────────

  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);
    try {
      const selectedRows = analyzedRows.filter((_, i) => !excludedIndices.has(i));
      const res = await fetch("/api/products/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, rows: selectedRows }),
      });
      const json = await res.json();
      if (json.success) {
        setImportResult(json.data);
        setStage("confirm");
      } else {
        setImportError(json.message || "Lỗi không xác định");
      }
    } catch {
      setImportError("Lỗi kết nối server");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Summary Stats ──────────────────────────────────────────────────────

  const stats = {
    new_product: analyzedRows.filter((r) => r.action === "new_product").length,
    new_spec: analyzedRows.filter((r) => r.action === "new_spec").length,
    new_price: analyzedRows.filter((r) => r.action === "new_price").length,
    update_price: analyzedRows.filter((r) => r.action === "update_price").length,
    unchanged: analyzedRows.filter((r) => r.action === "unchanged").length,
  };

  const hasChanges = stats.new_product + stats.new_spec + stats.new_price + stats.update_price > 0;

  // Rows that are actionable (not unchanged) with their original indices
  const actionableRows = analyzedRows
    .map((row, i) => ({ row, originalIndex: i }))
    .filter(({ row }) => row.action !== "unchanged");

  const selectedCount = actionableRows.filter(({ originalIndex }) => !excludedIndices.has(originalIndex)).length;

  // ─── Checkbox Helpers ───────────────────────────────────────────────────

  const visibleRows = actionableRows.filter(({ row }) =>
    filterAction ? row.action === filterAction : true
  );

  const allVisibleChecked = visibleRows.length > 0 && visibleRows.every(({ originalIndex }) => !excludedIndices.has(originalIndex));
  const someVisibleChecked = visibleRows.some(({ originalIndex }) => !excludedIndices.has(originalIndex));

  const toggleAll = () => {
    const next = new Set(excludedIndices);
    if (allVisibleChecked) {
      // Uncheck all visible
      for (const { originalIndex } of visibleRows) next.add(originalIndex);
    } else {
      // Check all visible
      for (const { originalIndex } of visibleRows) next.delete(originalIndex);
    }
    setExcludedIndices(next);
  };

  const toggleRow = (originalIndex: number) => {
    const next = new Set(excludedIndices);
    if (next.has(originalIndex)) {
      next.delete(originalIndex);
    } else {
      next.add(originalIndex);
    }
    setExcludedIndices(next);
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
        className="bg-white shadow-2xl w-full max-w-[95vw] md:max-w-[90vw] xl:max-w-[85vw] max-h-[90vh] flex flex-col overflow-hidden sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Nhập hàng loạt</h2>
              <p className="text-xs text-slate-400">
                {stage === "upload" && "Bước 1/3 — Chọn nguồn dữ liệu"}
                {stage === "analyze" && "Bước 2/3 — Phân tích dữ liệu"}
                {stage === "confirm" && "Bước 3/3 — Kết quả"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex h-1 bg-slate-100 shrink-0">
          <div
            className="bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: stage === "upload" ? "33%" : stage === "analyze" ? "66%" : "100%" }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ─── Stage: Upload ──────────────────────────────────────── */}
          {stage === "upload" && (
            <div className="flex flex-col gap-4">
              {/* Tab Selector: CSV / Google Sheet */}
              {!fileName && (
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setUploadTab("csv"); setSheetError(null); }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      uploadTab === "csv"
                        ? "border-teal-500 text-teal-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Upload size={16} />
                    Tải lên CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUploadTab("gsheet"); setParseErrors([]); }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      uploadTab === "gsheet"
                        ? "border-teal-500 text-teal-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Sheet size={16} />
                    Từ Google Sheet
                  </button>
                </div>
              )}

              {/* ── CSV Upload Tab ──────────────────────────────────────── */}
              {(uploadTab === "csv" || fileName) && (
                <>
                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                      ${isDragging
                        ? "border-teal-400 bg-teal-50"
                        : fileName
                          ? "border-teal-300 bg-teal-50/50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {fileName ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <Check size={24} className="text-teal-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">{fileName}</p>
                        <p className="text-xs text-slate-400">
                          {csvRows.length} dòng hợp lệ / {parsedCount} tổng dòng
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetState();
                          }}
                          className="text-xs text-slate-400 hover:text-red-500 underline mt-1"
                        >
                          Chọn nguồn khác
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Upload size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          Kéo thả file CSV vào đây
                        </p>
                        <p className="text-xs text-slate-400">hoặc nhấn để chọn file</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Google Sheet Tab ────────────────────────────────────── */}
              {uploadTab === "gsheet" && !fileName && (
                <div className="flex flex-col gap-3">
                  {/* URL Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => { setSheetUrl(e.target.value); setSheetError(null); }}
                        placeholder="Dán link Google Sheet tại đây..."
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleFetchTabs}
                      disabled={!sheetUrl.trim() || isFetchingTabs}
                      className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isFetchingTabs ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sheet size={16} />
                      )}
                      Lấy danh sách tab
                    </button>
                  </div>

                  {/* Sheet Error */}
                  {sheetError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <span className="text-sm text-red-600">{sheetError}</span>
                    </div>
                  )}

                  {/* Tab Selector */}
                  {sheetTabs.length > 0 && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 flex flex-col gap-3">
                      <p className="text-xs font-medium text-teal-700">Chọn tab để nhập dữ liệu:</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={selectedTab}
                            onChange={(e) => setSelectedTab(e.target.value)}
                            className="w-full appearance-none px-3 py-2.5 pr-8 border border-teal-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                          >
                            {sheetTabs.map((tab) => (
                              <option key={tab} value={tab}>{tab}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none" />
                        </div>
                        <button
                          onClick={handleFetchSheetData}
                          disabled={!selectedTab || isFetchingData}
                          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {isFetchingData ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              Tải dữ liệu
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {sheetTabs.length} tab tìm thấy trong sheet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Log */}
              {parseErrors.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm font-semibold text-red-700">
                      {parseErrors.length} lỗi phát hiện
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {parseErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {csvRows.length > 0 && parseErrors.length === 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <span className="text-xs font-medium text-slate-500">
                      Xem trước ({Math.min(csvRows.length, 5)} / {csvRows.length} dòng)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Tên SP</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Quy cách</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">ĐVT</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Giá bán</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Giá nhập</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-4 py-2 text-slate-700">{row.name}</td>
                            <td className="px-4 py-2 text-slate-600">{row.spec}</td>
                            <td className="px-4 py-2 text-slate-600">{row.unit}</td>
                            <td className="px-4 py-2 text-right text-slate-700 font-medium">
                              {row.price.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-500 font-medium whitespace-nowrap">
                              {row.basePrice.toLocaleString("vi-VN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvRows.length > 5 && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
                      <span className="text-xs text-slate-400">
                        ...và {csvRows.length - 5} dòng khác
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Stage: Analyze ─────────────────────────────────────── */}
          {stage === "analyze" && (
            <div className="flex flex-col gap-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["new_product", "new_spec", "new_price", "update_price"] as const).map((action) => {
                  const isSelected = filterAction === action;
                  const count = stats[action];
                  return (
                    <button
                      key={action}
                      type="button"
                      disabled={count === 0}
                      onClick={() => setFilterAction(isSelected ? null : action)}
                      className={`
                        flex flex-col items-center gap-1 p-3 rounded-xl border transition-all
                        ${ACTION_CONFIG[action].bgColor}
                        ${count > 0 ? 'cursor-pointer hover:shadow-md' : 'opacity-50 cursor-not-allowed'}
                        ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400 shadow-md scale-[1.03]' : ''}
                      `}
                    >
                      <span className={`${ACTION_CONFIG[action].color}`}>
                        {ACTION_CONFIG[action].icon}
                      </span>
                      <span className={`text-2xl font-bold ${ACTION_CONFIG[action].color}`}>
                        {count}
                      </span>
                      <span className="text-[11px] text-slate-500 text-center leading-tight">
                        {ACTION_CONFIG[action].label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {stats.unchanged > 0 && (
                <p className="text-xs text-slate-400 text-center">
                  + {stats.unchanged} dòng không thay đổi (bỏ qua)
                </p>
              )}

              {!hasChanges && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 text-center">
                  <CheckCircle2 size={32} className="text-teal-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-teal-700">Tất cả dữ liệu đã cập nhật</p>
                  <p className="text-xs text-teal-500 mt-1">Không có thay đổi nào cần thực hiện</p>
                </div>
              )}

              {/* Detail Table */}
              {hasChanges && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <span className="text-xs font-medium text-slate-500">Chi tiết thay đổi</span>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2 w-8">
                            <input
                              type="checkbox"
                              checked={allVisibleChecked}
                              ref={(el) => { if (el) el.indeterminate = someVisibleChecked && !allVisibleChecked; }}
                              onChange={toggleAll}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                            />
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Trạng thái</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Tên SP</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Quy cách</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">ĐVT</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 min-w-[80px]">Giá bán</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 min-w-[80px]">Giá nhập</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map(({ row, originalIndex }) => {
                          const config = ACTION_CONFIG[row.action];
                          const isChecked = !excludedIndices.has(originalIndex);
                          return (
                            <tr key={originalIndex} className={`border-t border-slate-100 hover:bg-slate-50/50 ${!isChecked ? 'opacity-40' : ''}`}>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleRow(originalIndex)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.bgColor} ${config.color}`}>
                                  {config.icon}
                                  {config.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-700 max-w-[150px] truncate">{row.name}</td>
                              <td className="px-3 py-2 text-slate-600">{row.spec}</td>
                              <td className="px-3 py-2 text-slate-600">{row.unit}</td>
                              <td className="px-3 py-2 text-right">
                                {row.action === "update_price" && row.currentPrice !== undefined && row.currentPrice !== row.price ? (
                                  <span className="flex items-center justify-end gap-1">
                                    <span className="text-slate-400 line-through text-[10px]">
                                      {row.currentPrice.toLocaleString("vi-VN")}
                                    </span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="text-amber-700 font-medium">
                                      {row.price.toLocaleString("vi-VN")}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-700 font-medium">
                                    {row.price.toLocaleString("vi-VN")}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.action === "update_price" && row.currentBasePrice !== undefined && row.currentBasePrice !== row.basePrice ? (
                                  <span className="flex items-center justify-end gap-1">
                                    <span className="text-slate-400 line-through text-[10px]">
                                      {row.currentBasePrice.toLocaleString("vi-VN")}
                                    </span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="text-red-700 font-medium whitespace-nowrap">
                                      {row.basePrice.toLocaleString("vi-VN")}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-medium whitespace-nowrap">
                                    {row.basePrice.toLocaleString("vi-VN")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span className="text-sm text-red-600">{importError}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── Stage: Confirm (Result) ────────────────────────────── */}
          {stage === "confirm" && importResult && (
            <div className="flex flex-col items-center gap-5 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center"
              >
                <Check size={32} className="text-teal-600" />
              </motion.div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-800">Nhập thành công!</h3>
                <p className="text-sm text-slate-500 mt-1">Dữ liệu đã được cập nhật vào danh mục</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                {importResult.productsCreated > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <PackagePlus size={18} className="text-teal-600" />
                    <div>
                      <p className="text-lg font-bold text-teal-700">{importResult.productsCreated}</p>
                      <p className="text-[11px] text-teal-600">Sản phẩm mới</p>
                    </div>
                  </div>
                )}
                {importResult.specsAdded > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <ListPlus size={18} className="text-blue-600" />
                    <div>
                      <p className="text-lg font-bold text-blue-700">{importResult.specsAdded}</p>
                      <p className="text-[11px] text-blue-600">Quy cách mới</p>
                    </div>
                  </div>
                )}
                {importResult.pricesAdded > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
                    <DollarSign size={18} className="text-violet-600" />
                    <div>
                      <p className="text-lg font-bold text-violet-700">{importResult.pricesAdded}</p>
                      <p className="text-[11px] text-violet-600">Đơn giá mới</p>
                    </div>
                  </div>
                )}
                {importResult.pricesUpdated > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <Pencil size={18} className="text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-amber-700">{importResult.pricesUpdated}</p>
                      <p className="text-[11px] text-amber-600">Giá cập nhật</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 shrink-0 bg-white">
          {/* Left side */}
          <div>
            {stage === "analyze" && !importResult && (
              <button
                onClick={() => setStage("upload")}
                disabled={isImporting}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {stage === "upload" && (
              <button
                onClick={handleAnalyze}
                disabled={csvRows.length === 0 || parseErrors.length > 0 || isAnalyzing}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    Phân tích
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}

            {stage === "analyze" && !importResult && !confirmCode && (
              <button
                onClick={() => {
                  const code = String(Math.floor(100000 + Math.random() * 900000));
                  setConfirmCode(code);
                  setConfirmInput("");
                }}
                disabled={!hasChanges || selectedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} />
                Xác nhận nhập
              </button>
            )}

            {stage === "analyze" && !importResult && confirmCode && (
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500 shrink-0">
                  Nhập mã <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-sm tracking-widest select-all">{confirmCode}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-24 text-center font-mono text-base tracking-[0.25em] border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={handleImport}
                  disabled={confirmInput !== confirmCode || isImporting}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang nhập...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Nhập
                    </>
                  )}
                </button>
              </div>
            )}

            {stage === "confirm" && (
              <button
                onClick={() => {
                  handleClose();
                  // Reload page to reflect changes
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors"
              >
                <Check size={16} />
                Hoàn tất
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
