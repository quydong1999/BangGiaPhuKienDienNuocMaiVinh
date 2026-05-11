import { Plus, Save, Trash2 } from "lucide-react";
import type { FormModalActionsProps } from "./types";

export function FormModalActions({
    mode,
    isPending,
    isCompressing = false,
    isValid,
    onDelete,
    deleteDisabled = false,
    deleteTooltip,
    labels,
}: FormModalActionsProps) {
    const isBusy = isPending || isCompressing;

    const Spinner = () => (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
    );

    return (
        <div className="mt-auto pt-4 flex gap-3 sticky bottom-0 z-20 bg-white pb-5 px-5 -mx-5 -mb-5 border-t border-slate-100">
            {mode === "edit" && (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isBusy || deleteDisabled}
                    title={deleteDisabled ? deleteTooltip : labels?.delete ?? "Xóa"}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={18} />
                    {labels?.delete ?? "Xóa"}
                </button>
            )}

            <button
                type="submit"
                disabled={isBusy || !isValid}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-medium hover:bg-teal-700 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isBusy ? (
                    <Spinner />
                ) : mode === "edit" ? (
                    <>
                        <Save size={18} />
                        {labels?.update ?? "Cập nhật"}
                    </>
                ) : (
                    <>
                        <Plus size={18} />
                        {labels?.create ?? "Thêm mới"}
                    </>
                )}
            </button>
        </div>
    );
}