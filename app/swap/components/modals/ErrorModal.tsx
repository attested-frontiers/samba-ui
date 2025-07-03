import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorModal({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  onRetry 
}: ErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-red-600'>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='text-center py-4'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <AlertCircle className='w-8 h-8 text-red-600' />
            </div>
            <p className='text-gray-600 mb-4'>
              {message}
            </p>
            <div className='flex gap-2'>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className='flex-1'
              >
                Close
              </Button>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className='flex-1 bg-red-600 hover:bg-red-700 text-white'
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}