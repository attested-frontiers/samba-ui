import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExtensionConnection } from '../../hooks/useExtensionConnection';

export function VersionModal() {
  const { modals, sideBarVersion, updateModalState } = useExtensionConnection();

  return (
    <Dialog 
      open={modals.showVersionModal} 
      onOpenChange={(open) => updateModalState({ showVersionModal: open })}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-amber-600'>
            PeerAuth Version Incompatible
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='text-center py-4'>
            <div className='w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <div className='w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-lg font-bold'>
                !
              </div>
            </div>
            <p className='text-gray-600 mb-2'>
              Your current PeerAuth version is <strong>{sideBarVersion}</strong>.
            </p>
            <p className='text-gray-600'>
              Please update your PeerAuth extension to the latest version.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}