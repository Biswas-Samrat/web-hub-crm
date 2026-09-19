import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal — bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            className={`
              fixed z-50 bg-white
              bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh] overflow-y-auto
              sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
              sm:rounded-2xl sm:w-full sm:${sizes[size]}
              shadow-modal
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-surface-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-surface-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-100 text-surface-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
