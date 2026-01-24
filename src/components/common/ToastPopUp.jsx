import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

const ToastPopUp = ({ message, setToastPopUp, type = 'success' }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                setToastPopUp(false);
            }, 300);
        }, 2500);
        return () => {
            clearTimeout(timer);
        };
    }, [setToastPopUp]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={20} className="text-white" />;
            case 'error':
                return <XCircle size={20} className="text-white" />;
            case 'warning':
                return <AlertCircle size={20} className="text-white" />;
            case 'info':
                return <Info size={20} className="text-white" />;
            default:
                return <CheckCircle2 size={20} className="text-white" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-[#3182F6]';
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-amber-500';
            case 'info':
                return 'bg-gray-700';
            default:
                return 'bg-[#3182F6]';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`fixed bottom-6 left-0 right-0 mx-auto z-[9999] ${getBgColor()} text-white px-4 py-3 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md`}
                >
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <p className="text-sm font-medium flex-1 text-center">
                            {message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ToastPopUp;
