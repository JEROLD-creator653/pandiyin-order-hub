import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function ErrorModal({
  open,
  onClose,
  title = 'Checkout Issue',
  message,
}: ErrorModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-md border-2 border-destructive/40 bg-foreground text-primary-foreground rounded-2xl shadow-2xl">
        <AlertDialogHeader className="items-center text-center gap-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 border border-destructive/30">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <AlertDialogTitle className="text-lg font-display tracking-tight text-primary-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-primary-foreground/80 leading-relaxed">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center sm:justify-center">
          <AlertDialogAction
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 font-display font-medium tracking-wide shadow-lg"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
