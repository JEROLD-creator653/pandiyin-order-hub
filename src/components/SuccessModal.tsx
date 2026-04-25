import { CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  ctaLabel?: string;
}

export default function SuccessModal({
  open,
  onClose,
  title = 'Payment Successful',
  message,
  ctaLabel = 'Continue',
}: SuccessModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-[90vw] max-w-md relative overflow-hidden rounded-3xl border-2 border-border bg-background shadow-[0_20px_60px_-12px_hsl(150,20%,12%,0.25)]">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary/40" />

              <button
                onClick={onClose}
                className="absolute right-4 top-5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-6 pb-6 pt-6 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>

                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2 text-center">
                  {title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] text-center">
                  {message}
                </p>

                <button
                  onClick={onClose}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-10 py-3 text-sm font-display font-semibold tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
