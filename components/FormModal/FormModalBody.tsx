import type { FormModalBodyProps } from "./types";

export function FormModalBody({ children, onSubmit, submitError }: FormModalBodyProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-y-auto relative">
            <div className="flex flex-col gap-4 p-5 min-h-full">
                {submitError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-200">
                        {submitError}
                    </div>
                )}
                {children}
            </div>
        </form>
    );
}