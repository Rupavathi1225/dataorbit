import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const Popup = ({ isOpen, onClose, title, children }: PopupProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative min-w-[320px] max-w-md rounded-lg border border-popup-border bg-popup-bg p-6 shadow-popup backdrop-blur-[20px]">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title */}
              {title && (
                <h2 className="mb-4 pr-8 text-xl font-semibold text-foreground">
                  {title}
                </h2>
              )}

              {/* Content */}
              <div className="text-muted-foreground">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Popup;