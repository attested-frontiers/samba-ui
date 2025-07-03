'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SwapState, SwapAction } from '../types/swap';

const initialState: SwapState = {
  form: {
    fromCurrency: 'USD',
    toCurrency: 'USD',
    fromMethod: 'venmo',
    toMethod: 'revolut',
    amount: '3.00',
    onrampRecipient: 'Ian-Brighton',
    offrampRecipient: 'ibrighton',
  },
  execution: {
    step: 1,
    progress: 0,
    isProcessing: false,
    isPaymentFound: false,
    isCancelingIntent: false,
    onrampIntentHash: '0x00a8e4a16b87c1ef98e11ca99dcb7f0c0ca0ca0464e26f89fb16b8dc4b25c6f7',
    paymentTriggerError: '',
    submissionError: '',
  },
  modals: {
    showExecutionModal: false,
    showConnectionModal: false,
    showInstallModal: false,
    showVersionModal: false,
  },
  proof: {
    proofIndex: null,
    proofStatus: 'idle',
    triggerProofFetchPolling: false,
    paymentProof: null,
    intervalId: null,
  },
  quote: {
    depositTarget: null,
    isGettingQuote: false,
  },
  errors: {},
  currentStep: 1,
  continuedIntent: false,
};

function swapReducer(state: SwapState, action: SwapAction): SwapState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        form: { ...state.form, ...action.payload },
      };
    case 'SET_EXECUTION_STATE':
      return {
        ...state,
        execution: { ...state.execution, ...action.payload },
      };
    case 'SET_MODAL_STATE':
      return {
        ...state,
        modals: { ...state.modals, ...action.payload },
      };
    case 'SET_PROOF_STATE':
      return {
        ...state,
        proof: { ...state.proof, ...action.payload },
      };
    case 'SET_QUOTE_STATE':
      return {
        ...state,
        quote: { ...state.quote, ...action.payload },
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'SET_CONTINUED_INTENT':
      return {
        ...state,
        continuedIntent: action.payload,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface SwapContextType {
  state: SwapState;
  dispatch: React.Dispatch<SwapAction>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

export function SwapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(swapReducer, initialState);

  return (
    <SwapContext.Provider value={{ state, dispatch }}>
      {children}
    </SwapContext.Provider>
  );
}

export function useSwap() {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useSwap must be used within a SwapProvider');
  }
  return context;
}