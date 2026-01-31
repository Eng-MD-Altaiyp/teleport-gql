import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const iconColors = {
        danger: 'text-red-500',
        warning: 'text-amber-500',
        info: 'text-blue-500',
    };

    const buttonColors = {
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        info: 'bg-blue-500 hover:bg-blue-600 text-white',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="relative w-[90%] max-w-[400px] bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColors[type]} bg-current/10 shrink-0`}>
                        <AlertCircle size={18} className={iconColors[type]} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${buttonColors[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
