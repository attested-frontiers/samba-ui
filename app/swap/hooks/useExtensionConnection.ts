import { useCallback, useEffect } from 'react';
import { useSwap } from '../components/SwapProvider';
import useExtensionProxyProofs from '@/hooks/useExtensionProxyProofs';
import { checkExtensionVersion } from '@/lib/utils';

export function useExtensionConnection() {
  const { state, dispatch } = useSwap();
  const { 
    isConnectionApproved,
    isSidebarInstalled,
    sideBarVersion,
    requestConnection 
  } = useExtensionProxyProofs();

  const updateModalState = useCallback((updates: Partial<typeof state.modals>) => {
    dispatch({ type: 'SET_MODAL_STATE', payload: updates });
  }, [dispatch]);

  // Handle connection approval state changes
  useEffect(() => {
    if (isConnectionApproved === null) {
      requestConnection();
    } else if (isConnectionApproved === false) {
      updateModalState({ showConnectionModal: true });
    } else if (isConnectionApproved === true) {
      updateModalState({ showConnectionModal: false });
    }
  }, [isConnectionApproved, requestConnection, updateModalState]);

  // Handle extension version compatibility
  useEffect(() => {
    if (isSidebarInstalled && sideBarVersion) {
      const isCompatible = checkExtensionVersion(sideBarVersion);
      if (!isCompatible) {
        updateModalState({ showVersionModal: true });
      }
    }
  }, [isSidebarInstalled, sideBarVersion, updateModalState]);

  // Handle extension installation check
  useEffect(() => {
    if (isSidebarInstalled === false) {
      const timer = setTimeout(() => {
        updateModalState({ showInstallModal: true });
      }, 5000);
      return () => clearTimeout(timer);
    } else if (isSidebarInstalled === true) {
      updateModalState({ showInstallModal: false });
    }
  }, [isSidebarInstalled, updateModalState]);

  const handleConnect = useCallback(() => {
    requestConnection();
  }, [requestConnection]);

  const handleInstallExtension = useCallback(() => {
    window.open('https://chromewebstore.google.com/detail/peerauth-authenticate-and/ijpgccednehjpeclfcllnjjcmiohdjih', '_blank');
  }, []);

  return {
    isConnectionApproved,
    isSidebarInstalled,
    sideBarVersion,
    modals: state.modals,
    handleConnect,
    handleInstallExtension,
    updateModalState,
  };
}