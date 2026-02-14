import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    const variants = {
        initial: { opacity: 0, y: -20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.9 }
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-500/90 text-white shadow-emerald-500/20';
            case 'error':
                return 'bg-red-500/90 text-white shadow-red-500/20';
            case 'warning':
                return 'bg-amber-500/90 text-white shadow-amber-500/20';
            default:
                return 'bg-blue-500/90 text-white shadow-blue-500/20';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertTriangle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 min-w-[320px] max-w-[90vw]"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                    <div className={`absolute inset-0 rounded-2xl ${getTypeStyles()} opacity-10`} />
                    <div className={`relative p-2 rounded-full ${getTypeStyles()}`}>
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-sm md:text-base text-brand-dark dark:text-white drop-shadow-sm">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-black/5 transition-colors text-brand-dark/50 hover:text-brand-dark"
                    >
                        <X size={16} />
                    </button>

                    {/* Progress Bar Animation */}
                    <motion.div
                        className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: duration / 1000, ease: "linear" }}
                        style={{ originX: 0 }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
