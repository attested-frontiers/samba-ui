import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useExtensionConnection } from '../../hooks/useExtensionConnection';

export function ConnectionModal() {
  const { modals, handleConnect, updateModalState } = useExtensionConnection();

  return (
    <Dialog 
      open={modals.showConnectionModal} 
      onOpenChange={(open) => updateModalState({ showConnectionModal: open })}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-red-600'>
            PeerAuth Connection Denied
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='text-center py-4'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <div className='w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-lg font-bold'>
                !
              </div>
            </div>
            <p className='text-gray-600 mb-4'>
              PeerAuth connection denied, please connect
            </p>
            <Button
              onClick={handleConnect}
              className='w-full bg-red-600 hover:bg-red-700 text-white'
            >
              Connect PeerAuth
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}