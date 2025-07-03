import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useExtensionConnection } from '../../hooks/useExtensionConnection';

export function InstallationModal() {
  const { modals, handleInstallExtension, updateModalState } = useExtensionConnection();

  return (
    <Dialog 
      open={modals.showInstallModal} 
      onOpenChange={(open) => updateModalState({ showInstallModal: open })}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-blue-600'>
            PeerAuth Extension Required
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='text-center py-4'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold'>
                !
              </div>
            </div>
            <p className='text-gray-600 mb-4'>
              This app requires the PeerAuth extension to be installed. Please install to continue.
            </p>
            <Button
              onClick={handleInstallExtension}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              Install PeerAuth Extension
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}