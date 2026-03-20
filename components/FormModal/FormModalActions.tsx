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
        <div className="mt-4 flex gap-3">
            {mode === "edit" && (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isBusy || deleteDisabled}
                    title={deleteDisabled ? deleteTooltip : labels?.delete ?? "Xóa"}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={18} />
                    {labels?.delete ?? "Xóa"}
                </button>
            )}

            <button
                type="submit"
                disabled={isBusy || !isValid}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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