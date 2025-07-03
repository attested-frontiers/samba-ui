import { useCallback, useEffect, useRef } from 'react';
import { useSwap } from '../components/SwapProvider';
import useExtensionProxyProofs from '@/hooks/useExtensionProxyProofs';
import { platformToVerifier } from '@/lib/utils';
import { PROOF_FETCH_INTERVAL, PROOF_GENERATION_TIMEOUT } from '../types/swap';

export function useProofPolling() {
  const { state, dispatch } = useSwap();
  const proofTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    extensionProofs, 
    fetchPaymentProof, 
    clearProofs 
  } = useExtensionProxyProofs();

  const updateProofState = useCallback((updates: Partial<typeof state.proof>) => {
    dispatch({ type: 'SET_PROOF_STATE', payload: updates });
  }, [dispatch]);

  const updateExecutionState = useCallback((updates: Partial<typeof state.execution>) => {
    dispatch({ type: 'SET_EXECUTION_STATE', payload: updates });
  }, [dispatch]);

  const showBrowserNotification = useCallback((title: string, options: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }, []);

  const pollForProof = useCallback(async (paymentMethod: string) => {
    try {
      const verifier = platformToVerifier(paymentMethod as any);
      await fetchPaymentProof(verifier);
    } catch (error) {
      console.error('Error fetching payment proof:', error);
    }
  }, [fetchPaymentProof]);

  // Handle proof status updates from extension
  useEffect(() => {
    if (extensionProofs && extensionProofs.length > 0) {
      const latestProof = extensionProofs[extensionProofs.length - 1];
      
      if (latestProof.status === 'completed' && latestProof.proof) {
        updateProofState({ 
          proofStatus: 'completed',
          paymentProof: latestProof.proof,
          proofIndex: latestProof.index 
        });
        
        updateExecutionState({ 
          step: 3, 
          progress: 60, 
          isPaymentFound: true 
        });
        
        showBrowserNotification('Payment Proof Generated! 🎉', {
          body: 'Your payment proof has been successfully generated.',
          icon: '/samba-logo.png',
        });
      } else if (latestProof.status === 'failed') {
        updateProofState({ proofStatus: 'failed' });
        showBrowserNotification('Payment Proof Generation Failed ❌', {
          body: 'There was an issue generating your payment proof.',
          icon: '/samba-logo.png',
        });
      }
    }
  }, [extensionProofs, updateProofState, updateExecutionState, showBrowserNotification]);

  // Start proof polling
  useEffect(() => {
    if (state.proof.triggerProofFetchPolling && state.proof.proofStatus === 'idle') {
      updateProofState({ proofStatus: 'generating' });
      
      const intervalId = setInterval(() => {
        pollForProof(state.form.fromMethod);
      }, PROOF_FETCH_INTERVAL);
      
      updateProofState({ intervalId });

      proofTimeoutRef.current = setTimeout(() => {
        clearInterval(intervalId);
        updateProofState({ 
          triggerProofFetchPolling: false,
          proofStatus: 'timeout',
          intervalId: null 
        });
        
        showBrowserNotification('Payment Proof Generation Timed Out ⏱️', {
          body: 'The proof generation took longer than expected. Please try again.',
          icon: '/samba-logo.png',
        });
      }, PROOF_GENERATION_TIMEOUT);

      return () => {
        clearInterval(intervalId);
        if (proofTimeoutRef.current) {
          clearTimeout(proofTimeoutRef.current);
        }
      };
    }
  }, [state.proof.triggerProofFetchPolling, state.proof.proofStatus, state.form.fromMethod, pollForProof, updateProofState, showBrowserNotification]);

  // Cleanup when proof status changes
  useEffect(() => {
    if (state.proof.proofStatus !== 'generating' && state.proof.intervalId) {
      clearInterval(state.proof.intervalId);
      updateProofState({ 
        intervalId: null,
        triggerProofFetchPolling: false 
      });
      
      if (proofTimeoutRef.current) {
        clearTimeout(proofTimeoutRef.current);
        proofTimeoutRef.current = null;
      }
    }
  }, [state.proof.proofStatus, state.proof.intervalId, updateProofState]);

  return {
    proofState: state.proof,
    pollForProof,
    clearProofs,
    extensionProofs,
  };
}