import type { FormModalBodyProps } from "./types";

export function FormModalBody({ children, onSubmit, submitError }: FormModalBodyProps) {
    return (
        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
            {submitError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-200">
                    {submitError}
                </div>
            )}
            {children}
        </form>
    );
}