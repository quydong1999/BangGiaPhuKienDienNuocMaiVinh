import type { FormModalRootProps } from "./types";
import { FormModalHeader } from "./FormModalHeader";
import { FormModalBody } from "./FormModalBody";
import { FormModalActions } from "./FormModalActions";

import { motion } from "framer-motion";

function FormModalRoot({
    isOpen,
    onClose,
    isPending,
    isCompressing = false,
    children,
}: FormModalRootProps) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-white shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

// Compound component namespace
export const FormModal = Object.assign(FormModalRoot, {
    Header: FormModalHeader,
    Body: FormModalBody,
    Actions: FormModalActions,
});