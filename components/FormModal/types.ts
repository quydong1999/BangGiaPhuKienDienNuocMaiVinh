import { ReactNode } from "react";

export interface FormModalRootProps {
    isOpen: boolean;
    onClose: () => void;
    isPending: boolean;
    isCompressing?: boolean;
    children: ReactNode;
}

export interface FormModalHeaderProps {
    title: string;
    onClose: () => void;
    disabled?: boolean;
}

export interface FormModalBodyProps {
    children: ReactNode;
    onSubmit: React.SubmitEventHandler<HTMLFormElement>;
    submitError?: string | null;
}

export interface FormModalActionsProps {
    mode: "create" | "edit";
    isPending: boolean;
    isCompressing?: boolean;
    isValid: boolean;
    onDelete?: () => void;
    deleteDisabled?: boolean;
    deleteTooltip?: string;
    labels?: {
        create?: string;   // default: "Thêm mới"
        update?: string;   // default: "Cập nhật"
        delete?: string;   // default: "Xóa"
    };
}