import { useCallback, useEffect, useRef } from 'react';
import { useSwap } from '../components/SwapProvider';
import { signalIntent, fulfillAndOnramp } from '@/lib/contract-api';
import { useAuth } from '@/context/AuthContext';

export function useExecutionFlow() {
  const { state, dispatch } = useSwap();
  const { user } = useAuth();
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateExecutionState = useCallback((updates: Partial<typeof state.execution>) => {
    dispatch({ type: 'SET_EXECUTION_STATE', payload: updates });
  }, [dispatch]);

  const updateModalState = useCallback((updates: Partial<typeof state.modals>) => {
    dispatch({ type: 'SET_MODAL_STATE', payload: updates });
  }, [dispatch]);

  const handleTriggerPayment = useCallback(async () => {
    if (!user?.uid) return;

    updateExecutionState({ 
      step: 1, 
      progress: 20, 
      isProcessing: true,
      paymentTriggerError: '' 
    });

    try {
      const response = await signalIntent({
        depositorAddress: user.uid,
        onrampRecipient: state.form.onrampRecipient,
        offrampRecipient: state.form.offrampRecipient,
        amount: state.form.amount,
        fromCurrency: state.form.fromCurrency,
        toCurrency: state.form.toCurrency,
        fromMethod: state.form.fromMethod,
        toMethod: state.form.toMethod,
      });

      updateExecutionState({ 
        step: 2, 
        progress: 40, 
        isProcessing: false,
        onrampIntentHash: response 
      });

      dispatch({ type: 'SET_PROOF_STATE', payload: { triggerProofFetchPolling: true } });
    } catch (error) {
      updateExecutionState({ 
        isProcessing: false,
        paymentTriggerError: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [user?.uid, state.form, updateExecutionState, dispatch]);

  const handleFinalizeOrder = useCallback(async () => {
    if (!user?.uid || !state.execution.onrampIntentHash || !state.proof.paymentProof) {
      return;
    }

    updateExecutionState({ 
      step: 4, 
      progress: 80, 
      isProcessing: true,
      submissionError: '' 
    });

    try {
      await fulfillAndOnramp({
        intentHash: state.execution.onrampIntentHash,
        proof: state.proof.paymentProof,
        depositorAddress: user.uid,
        onrampRecipient: state.form.onrampRecipient,
        offrampRecipient: state.form.offrampRecipient,
        amount: state.form.amount,
        fromCurrency: state.form.fromCurrency,
      });

      updateExecutionState({ 
        step: 5, 
        progress: 100, 
        isProcessing: false 
      });

      submissionTimeoutRef.current = setTimeout(() => {
        updateModalState({ showExecutionModal: false });
        dispatch({ type: 'RESET_STATE' });
      }, 3000);
    } catch (error) {
      updateExecutionState({ 
        isProcessing: false,
        submissionError: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [user?.uid, state.execution.onrampIntentHash, state.proof.paymentProof, state.form, updateExecutionState, updateModalState, dispatch]);

  const startExecution = useCallback(() => {
    updateModalState({ showExecutionModal: true });
    updateExecutionState({ step: 1, progress: 0 });
  }, [updateModalState, updateExecutionState]);

  const cancelExecution = useCallback(() => {
    updateModalState({ showExecutionModal: false });
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }
  }, [updateModalState]);

  useEffect(() => {
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    };
  }, []);

  return {
    execution: state.execution,
    modals: state.modals,
    handleTriggerPayment,
    handleFinalizeOrder,
    startExecution,
    cancelExecution,
    updateExecutionState,
    updateModalState,
  };
}