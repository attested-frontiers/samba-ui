import { useContext } from 'react';

import { ExtensionProxyProofsContext } from '@/context/reclaim';

const useExtensionProxyProofs = () => {
  return { ...useContext(ExtensionProxyProofsContext) };
};

export default useExtensionProxyProofs;