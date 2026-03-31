import { X } from "lucide-react";
import type { FormModalHeaderProps } from "./types";

export function FormModalHeader({ title, onClose, disabled }: FormModalHeaderProps) {
    return (
        <div className="flex justify-between items-center p-5 sticky top-0 bg-white z-20 border-b border-slate-100 shrink-0">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <button
                onClick={onClose}
                type="button"
                disabled={disabled}
                className="p-1 hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <X size={20} />
            </button>
        </div>
    );
}