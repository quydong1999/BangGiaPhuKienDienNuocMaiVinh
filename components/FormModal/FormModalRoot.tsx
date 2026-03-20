import type { FormModalRootProps } from "./types";
import { FormModalHeader } from "./FormModalHeader";
import { FormModalBody } from "./FormModalBody";
import { FormModalActions } from "./FormModalActions";

function FormModalRoot({
    isOpen,
    onClose,
    isPending,
    isCompressing = false,
    children,
}: FormModalRootProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
                {children}
            </div>
        </div>
    );
}

// Compound component namespace
export const FormModal = Object.assign(FormModalRoot, {
    Header: FormModalHeader,
    Body: FormModalBody,
    Actions: FormModalActions,
});