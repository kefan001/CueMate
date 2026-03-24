import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title?: string;
  children?: ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="close"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-zinc-950 border border-zinc-800/60 p-5 shadow-2xl"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {title ? (
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-semibold text-white">{title}</div>
                <button
                  onClick={onClose}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  关闭
                </button>
              </div>
            ) : null}
            {children}
            <div className="h-safe-bottom" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

