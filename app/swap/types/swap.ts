export interface SwapFormData {
  fromCurrency: string;
  toCurrency: string;
  fromMethod: string;
  toMethod: string;
  amount: string;
  onrampRecipient: string;
  offrampRecipient: string;
}

export interface SwapExecutionState {
  step: number;
  progress: number;
  isProcessing: boolean;
  isPaymentFound: boolean;
  isCancelingIntent: boolean;
  onrampIntentHash: string | null;
  paymentTriggerError: string;
  submissionError: string;
}

export interface SwapModalState {
  showExecutionModal: boolean;
  showConnectionModal: boolean;
  showInstallModal: boolean;
  showVersionModal: boolean;
}

export interface SwapProofState {
  proofIndex: number | null;
  proofStatus: 'idle' | 'generating' | 'completed' | 'failed' | 'timeout';
  triggerProofFetchPolling: boolean;
  paymentProof: any;
  intervalId: NodeJS.Timeout | null;
}

export interface SwapQuoteState {
  depositTarget: any | null;
  isGettingQuote: boolean;
}

export interface SwapState {
  form: SwapFormData;
  execution: SwapExecutionState;
  modals: SwapModalState;
  proof: SwapProofState;
  quote: SwapQuoteState;
  errors: Record<string, string>;
  currentStep: number;
  continuedIntent: boolean;
}

export type SwapAction = 
  | { type: 'SET_FORM_DATA'; payload: Partial<SwapFormData> }
  | { type: 'SET_EXECUTION_STATE'; payload: Partial<SwapExecutionState> }
  | { type: 'SET_MODAL_STATE'; payload: Partial<SwapModalState> }
  | { type: 'SET_PROOF_STATE'; payload: Partial<SwapProofState> }
  | { type: 'SET_QUOTE_STATE'; payload: Partial<SwapQuoteState> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_CONTINUED_INTENT'; payload: boolean }
  | { type: 'RESET_STATE' };

export const currencies = [
  { code: 'USD', name: 'US Dollar', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', country: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧' },
];

export const paymentMethods = [
  { id: 'venmo', name: 'Venmo', logo: '💙', availableCurrencies: ['USD'] },
  {
    id: 'revolut',
    name: 'Revolut',
    logo: '🔵',
    availableCurrencies: ['USD'],
  },
];

export const PROOF_FETCH_INTERVAL = 2000;
export const PROOF_GENERATION_TIMEOUT = 600000;