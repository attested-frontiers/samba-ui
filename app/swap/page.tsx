'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signalIntent, fulfillAndOnramp } from '@/lib/contract-api';
// import { useAccount, useDisconnect } from 'wagmi';
// import { useContracts } from '@/context/contracts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import useExtensionProxyProofs from '@/hooks/useExtensionProxyProofs';
import { formatDecimalString, platformToVerifier, checkExtensionVersion } from '@/lib/utils';
import {
  PaymentPlatforms,
  QuoteRequest,
  QuoteResponse,
  ZKP2PCurrencies,
} from '@/lib/types/intents';
import { parseUnits } from 'viem';
import { deposit } from 'viem/zksync';
import { ExtensionRequestMetadata } from '@/lib/types';
import { metadata } from '../layout';

// Constants for proof polling
const PROOF_FETCH_INTERVAL = 2000; // 2 seconds
const PROOF_GENERATION_TIMEOUT = 600000; // 60 seconds

const currencies = [
  { code: 'USD', name: 'US Dollar', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', country: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧' },
];

const paymentMethods = [
  { id: 'venmo', name: 'Venmo', logo: '💙', availableCurrencies: ['USD'] },
  {
    id: 'revolut',
    name: 'Revolut',
    logo: '🔵',
    // availableCurrencies: ['USD', 'EUR', 'GBP'],
    availableCurrencies: ['USD'], // Temporarily limiting to USD
  },
];

export default function SwapInterface() {
  const { user, loading, signOut } = useAuth();
  // const { address } = useAccount();
  // const { samba } = useContSracts();
  // const { disconnect } = useDisconnect();

  // Temporary placeholder values for web3 functionality
  const [currentStep, setCurrentStep] = useState(1);
  const [proofIndex, setProofIndex] = useState<number | null>(null);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('USD');
  const [fromMethod, setFromMethod] = useState('venmo');
  const [toMethod, setToMethod] = useState('revolut');
  const [amount, setAmount] = useState('3.00');
  const [depositTarget, setDepositTarget] = useState<QuoteResponse | null>(
    null
  );
  const [onrampRecipient, setOnrampRecipient] = useState('Ian-Brighton');
  const [offrampRecipient, setOfframpRecipient] = useState('ibrighton');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executionStep, setExecutionStep] = useState(1);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentFound, setIsPaymentFound] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [onrampIntentHash, setOnrampIntentHash] = useState<string | null>(
    '0x00a8e4a16b87c1ef98e11ca99dcb7f0c0ca0ca0464e26f89fb16b8dc4b25c6f7'
  );
  const [isCancelingIntent, setIsCancelingIntent] = useState(false);
  const [paymentTriggerError, setPaymentTriggerError] = useState<string>('');
  const [submissionError, setSubmissionError] = useState<string>('');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [userWrapperContract, setUserWrapperContract] = useState<string | null>(null);
  const [continuedIntent, setContinuedIntent] = useState<boolean>(false);
  const [showContinuingBanner, setShowContinuingBanner] = useState<boolean>(false);
  const [isCancelingExistingIntent, setIsCancelingExistingIntent] = useState<boolean>(false);

  // Proof management state
  const [proofStatus, setProofStatus] = useState<
    'idle' | 'generating' | 'success' | 'error' | 'error_intent' | 'timeout'
  >('idle');
  const [triggerProofFetchPolling, setTriggerProofFetchPolling] =
    useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const proofTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isSidebarInstalled,
    sideBarVersion,
    refetchExtensionVersion,
    openNewTab,
    isConnectionApproved,
    requestConnection,
    openSidebar,
    platformMetadata,
    paymentProof,
    generatePaymentProof,
    fetchPaymentProof,
    resetProofState,
  } = useExtensionProxyProofs();

  const exchangeRate = useMemo(() => {
    if (!depositTarget) return 0;
    return (
      1 / Number(formatDecimalString(depositTarget.intent.conversionRate, 18))
    ).toFixed(2);
  }, [depositTarget]);

  const recipientAmount = formatDecimalString(
    depositTarget?.intent.tokenAmount || '0'
  );

  const getAvailableCurrencies = (paymentMethod: string) => {
    const method = paymentMethods.find((m) => m.id === paymentMethod);
    return method ? method.availableCurrencies : [];
  };

  const getOtherPaymentMethod = (currentMethod: string) => {
    return currentMethod === 'venmo' ? 'revolut' : 'venmo';
  };

  // Browser notification utility
  const showBrowserNotification = async (
    title: string,
    options: NotificationOptions
  ) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
      }
    }
  };

  // Contract management utility
  const ensureWrapperContract = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/contract/wrapper', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.wrapperContract;
      } else {
        const errorData = await response.json();
        console.error('Failed to ensure wrapper contract:', errorData);
        return null;
      }
    } catch (error) {
      console.error('Error ensuring wrapper contract:', error);
      return null;
    }
  };

  // Check for existing intent
  const checkExistingIntent = async (): Promise<any | null> => {
    if (!user) return null;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/contract/signal', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Found existing intent:', data.intent);
        return data.intent;
      } else if (response.status === 404) {
        console.log('ℹ️ No existing intent found for user');
        return null;
      } else {
        console.error('Error checking existing intent');
        return null;
      }
    } catch (error) {
      console.error('Error checking existing intent:', error);
      return null;
    }
  };

  // Cancel existing intent handler
  const handleCancelExistingIntent = async () => {
    if (!user) return;

    setIsCancelingExistingIntent(true);
    setErrors({}); // Clear any existing errors

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/intents/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Success: show toast and exit modal
        console.log('✅ Intent canceled successfully');
        
        // Show success notification
        showBrowserNotification('Transfer Canceled', {
          body: 'Your existing transfer has been canceled successfully.',
          icon: '/samba-logo.png',
        });

        // Clear continuation state and exit modal
        setContinuedIntent(false);
        setShowContinuingBanner(false);
        setShowExecutionModal(false);
        setExecutionStep(1);
        setExecutionProgress(0);
        setCurrentStep(1);
        setOnrampIntentHash(null);

        console.log('📋 Modal closed and state cleared after intent cancellation');
      } else {
        // Error: show error message
        const errorData = await response.json();
        console.error('❌ Failed to cancel intent:', errorData);
        setErrors({ general: errorData.error || 'Failed to cancel transfer' });
      }
    } catch (error: any) {
      console.error('❌ Error canceling intent:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsCancelingExistingIntent(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || Number.parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (Number.parseFloat(amount) < 0.1) {
      newErrors.amount = 'Minimum amount is $0.10';
    }

    if (Number.parseFloat(amount) > 10000) {
      newErrors.amount = 'Maximum amount is $10,000.00';
    }

    if (!offrampRecipient.trim()) {
      newErrors.recipient = 'Please enter recipient name';
    }

    // Check if currencies are valid for their respective payment methods
    const fromMethodCurrencies = getAvailableCurrencies(fromMethod);
    const toMethodCurrencies = getAvailableCurrencies(toMethod);

    if (!fromMethodCurrencies.includes(fromCurrency)) {
      newErrors.currency = `${fromCurrency} is not available for ${paymentMethods.find((m) => m.id === fromMethod)?.name
        }`;
    }

    if (!toMethodCurrencies.includes(toCurrency)) {
      newErrors.currency = `${toCurrency} is not available for ${paymentMethods.find((m) => m.id === toMethod)?.name
        }`;
    }

    // Ensure we're swapping between different methods
    if (fromMethod === toMethod) {
      newErrors.currency = 'You must swap between Venmo and Revolut';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFromMethodChange = (newMethod: string) => {
    setFromMethod(newMethod);
    setToMethod(getOtherPaymentMethod(newMethod));
    requestConnection(); // HERE

    // Update currencies to valid ones for the new methods
    const newFromCurrencies = getAvailableCurrencies(newMethod);
    const newToCurrencies = getAvailableCurrencies(
      getOtherPaymentMethod(newMethod)
    );

    if (!newFromCurrencies.includes(fromCurrency)) {
      setFromCurrency(newFromCurrencies[0]);
    }

    if (!newToCurrencies.includes(toCurrency)) {
      setToCurrency(newToCurrencies[0]);
    }
  };

  const handleFromCurrencyChange = (newCurrency: string) => {
    setFromCurrency(newCurrency);

    // If both methods support the same currency, make sure to currencies are different
    const toCurrencies = getAvailableCurrencies(toMethod);
    if (toCurrencies.includes(newCurrency) && newCurrency === toCurrency) {
      const otherCurrency = toCurrencies.find((c) => c !== newCurrency);
      if (otherCurrency) {
        setToCurrency(otherCurrency);
      }
    }
  };

  const handleToCurrencyChange = (newCurrency: string) => {
    setToCurrency(newCurrency);

    // If both methods support the same currency, make sure from currencies are different
    const fromCurrencies = getAvailableCurrencies(fromMethod);
    if (fromCurrencies.includes(newCurrency) && newCurrency === fromCurrency) {
      const otherCurrency = fromCurrencies.find((c) => c !== newCurrency);
      if (otherCurrency) {
        setFromCurrency(otherCurrency);
      }
    }
  };

  const handleSwapSections = () => {
    // Swap currencies
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);

    // Swap payment methods
    const tempMethod = fromMethod;
    setFromMethod(toMethod);
    setToMethod(tempMethod);

    // Request connection for the new fromMethod
    requestConnection();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleAmountBlur = () => {
    let value = amount;

    // If empty, set to 0.00
    if (!value || value.trim() === '') {
      setAmount('0.00');
      return;
    }

    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // If value starts with decimal, add leading 0
    if (value.startsWith('.')) {
      value = '0' + value;
    }

    // If there's a decimal point, ensure exactly 2 decimal places
    if (value.includes('.')) {
      const [whole, decimal] = value.split('.');
      if (decimal.length === 1) {
        value = whole + '.' + decimal + '0';
      } else if (decimal.length > 2) {
        value = whole + '.' + decimal.slice(0, 2);
      }
    } else {
      // If no decimal point, add .00
      value = value + '.00';
    }

    setAmount(value);
  };

  const handleReviewTransaction = async () => {
    setIsGettingQuote(true);
    
    // Ensure we have both the quote and the contract
    const [quoteData, contractAddress] = await Promise.all([
      // Get quote
      (async () => {
        const request: QuoteRequest = {
          paymentPlatform: fromMethod as PaymentPlatforms,
          amount: parseUnits(amount, 6).toString(),
          fiatCurrency: fromCurrency as ZKP2PCurrencies,
          user: '0x1234567890123456789012345678901234567890' as `0x${string}`, // Placeholder address
        };
        const token = await user?.getIdToken();
        const response = await fetch('/api/deposits/quote', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error preparing swap:', errorData);
          throw new Error(errorData.error || 'Failed to prepare swap');
        }
        return (await response.json()) as QuoteResponse;
      })(),
      // Ensure contract exists
      (async () => {
        if (userWrapperContract) {
          return userWrapperContract;
        }
        // If contract is still null, try to get it
        const contract = await ensureWrapperContract();
        if (contract) {
          setUserWrapperContract(contract);
          console.log('✅ User wrapper contract set during quote:', contract);
        }
        return contract;
      })()
    ]);

    try {
      if (!contractAddress) {
        throw new Error('Failed to ensure wrapper contract exists');
      }

      setDepositTarget(quoteData);
      if (fromMethod === 'venmo') {
        setOnrampRecipient(quoteData.details.depositData.venmoUsername!);
      } else if (fromMethod === 'revolut') {
        setOnrampRecipient(quoteData.details.depositData.revolutUsername!);
      }
    } catch (error) {
      console.error('Error preparing swap:', error);
      setErrors({ general: 'Quote not found. Try a different amount.' });
      return;
    } finally {
      setIsGettingQuote(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (validateForm()) {
        handleReviewTransaction();
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Start execution modal
      setShowExecutionModal(true);
      setExecutionStep(1);
      setExecutionProgress(0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepAcknowledge = () => {
    setExecutionStep(3);
    setExecutionProgress(20);
    handleTriggerProof();
  };

  const handlePaymentTriggerSuccess = () => {
    setProofStatus('success');
    setExecutionStep(2);
    setExecutionProgress(10);
  };

  const handlePaymentTriggerError = (error: string) => {
    if (error.includes('Account has unfulfilled intent')) {
      setProofStatus('error_intent');
      setPaymentTriggerError('Payment intent already exists. Please cancel');
    } else {
      setProofStatus('error');
      setPaymentTriggerError('Failed to trigger payment. Please try again.');
    }
  };

  const cancelIntent = async () => {
    setIsCancelingIntent(true);
    try {
      // TODO: Replace with backend API call
      // await samba.cancelIntent(
      //   '0x27a0a07aaa46344ef6d9f13f9b2f1140840f21b6e017fd04ec6828b467a6ade9' as `0x${string}`
      // );
      console.log('Cancel intent - to be implemented with backend API');
      setProofStatus('idle');
      setPaymentTriggerError('');
    } catch (error) {
      console.error('Failed to cancel intent:', error);
    } finally {
      setIsCancelingIntent(false);
    }
  };

  const handleFinalizeOrder = async () => {
    setIsProcessing(true);
    setSubmissionError('');
    if (!onrampIntentHash || !paymentProof) {
      console.log('onramp intent hash', onrampIntentHash);
      console.log('payment proof', paymentProof);
      console.error('Missing onramp intent hash or payment proof');
      setSubmissionError(
        'Missing payment proof or intent hash. Please try again.'
      );
      setIsProcessing(false);
      return;
    }
    try {
      const returnedDepositId = await fulfillAndOnramp(
        amount,
        depositTarget!.intent.conversionRate,
        onrampIntentHash as `0x${string}`,
        paymentProof.proof,
        toCurrency as ZKP2PCurrencies,
        offrampRecipient,
        toMethod as PaymentPlatforms
      );
      setDepositId(returnedDepositId);
      setExecutionStep(5);
      setExecutionProgress(80);
    } catch (error: any) {
      console.error('fulfillAndOnramp failed', error);

      // Handle different error types from API
      let errorMessage = 'Payment submission failed. Please try again.';

      if (error.message?.includes('Missing or invalid authorization')) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = 'Invalid transaction data. Please try again.';
      } else if (error.message?.includes('Contract error')) {
        errorMessage = 'Blockchain transaction failed. Please try again.';
      } else if (error.message?.includes('Error validating market maker')) {
        errorMessage = 'Invalid recipient. Please check the recipient details.';
      } else if (error.message?.includes('Insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction.';
      } else if (error.message?.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message?.includes('Intent hash not returned')) {
        errorMessage = 'Invalid intent hash. Please restart the transaction.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSubmissionError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowExecutionModal(false);
    setExecutionStep(1);
    setExecutionProgress(0);
    setCurrentStep(1);
    setIsProcessing(false);
    setProofStatus('idle');
    setProofIndex(null);
  };

  // todo: this actually should open payment link byt being coopted
  // to signal intent

  const handleTriggerPayment = async () => {
    setProofStatus('generating');
    setPaymentTriggerError('');

    try {
      // const depositId = 0; // hardcoded for now
      // const depositId = process.env.NEXT_PUBLIC_DEPOSIT_ID
      //   ? parseInt(process.env.NEXT_PUBLIC_DEPOSIT_ID)
      //   : 0;
      if (depositTarget === null) {
        console.error('Deposit target is not set or invalid');
        return;
      }
      const depositId = depositTarget.intent.intent.depositId;
      const verifierAddress = platformToVerifier(
        fromMethod as PaymentPlatforms
      );
      const currency = fromCurrency as ZKP2PCurrencies;
      const intentHash = await signalIntent(
        depositTarget,
        amount,
        verifierAddress,
        currency,
        offrampRecipient,
        fromMethod as PaymentPlatforms,
        offrampRecipient,
        toMethod as PaymentPlatforms
      );
      setOnrampIntentHash(intentHash);
      handlePaymentTriggerSuccess();
    } catch (error: any) {
      console.error('Payment trigger failed:', error);

      // Handle different error types from API
      let errorMessage = 'Unknown error occurred';

      if (error.message?.includes('Missing or invalid authorization')) {
        errorMessage = 'Authentication failed. Please sign in again.';
        setProofStatus('error');
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = 'Invalid transaction data. Please try again.';
        setProofStatus('error');
      } else if (error.message?.includes('Contract error')) {
        errorMessage = 'Blockchain transaction failed. Please try again.';
        setProofStatus('error');
      } else if (error.message?.includes('Account has unfulfilled intent')) {
        errorMessage =
          'Payment intent already exists. Please cancel existing intent.';
        setProofStatus('error_intent');
      } else if (error.message?.includes('Insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction.';
        setProofStatus('error');
      } else if (error.message?.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection.';
        setProofStatus('error');
      } else if (error.message) {
        errorMessage = error.message;
        setProofStatus('error');
      } else {
        setProofStatus('error');
      }

      handlePaymentTriggerError(errorMessage);
    }
  };

  const handleTriggerProof = () => {
    // determine action
    console.log("attempting to open tab")
    let proofAction = {
      platform: '',
      action: '',
    };
    if (fromMethod === 'venmo') {
      proofAction = { platform: 'venmo', action: 'transfer_venmo' };
    } else if (fromMethod === 'revolut') {
      proofAction = { platform: 'revolut', action: 'transfer_revolut' };
    }

    openNewTab(proofAction.action, proofAction.platform);
  };

  const getStepStatus = (step: number) => {
    if (executionStep > step) return 'completed';
    if (executionStep === step) return 'current';
    return 'pending';
  };

  const getPlatformMetadataCount = () => {
    return Object.keys(platformMetadata).length;
  };

  // Helper to get payment method logo as an <img> tag
  const getPaymentMethodLogo = (methodId: string, size = 23) => {
    if (methodId === 'venmo') {
      return (
        <img
          src='/logos/venmo.svg'
          alt='Venmo'
          width={size}
          height={size}
          className='inline-block align-middle'
        />
      );
    }
    if (methodId === 'revolut') {
      return (
        <img
          src='/logos/revolut.svg'
          alt='Revolut'
          width={size}
          height={size}
          className='inline-block align-middle'
        />
      );
    }
    return null;
  };

  // Check for existing intent when user connects
  useEffect(() => {
    const checkForExistingIntent = async () => {
      if (user && !continuedIntent) {
        console.log('🔍 Checking for existing intent for user...');
        const existingIntent = await checkExistingIntent();
        
        if (existingIntent) {
          console.log('🔄 Resuming existing intent:', existingIntent);
          
          // Populate form fields from retrieved intent data
          setAmount(existingIntent.amount);
          setFromMethod(existingIntent.platform);
          setToMethod(existingIntent.toPlatform);
          setFromCurrency(existingIntent.currency);
          setToCurrency(existingIntent.currency); // Same currency for now
          setOfframpRecipient(existingIntent.toRecipient);
          setOnrampRecipient(existingIntent.recipient);
          setOnrampIntentHash(existingIntent.intentHash);
          setContinuedIntent(true);
          
          // Show continuing banner
          setShowContinuingBanner(true);
          
          // Set state to payment step in execution modal
          setShowExecutionModal(true);
          setExecutionStep(2);
          setExecutionProgress(10);
          
          console.log('✅ Form populated and advanced to payment step for existing intent');
        }
      }
    };

    checkForExistingIntent();
  }, [user, continuedIntent]);

  // Auto-check contract when user is available and contract is null
  useEffect(() => {
    const checkContract = async () => {
      if (user && userWrapperContract === null) {
        console.log('🔍 Checking wrapper contract for user...');
        const contract = await ensureWrapperContract();
        if (contract) {
          setUserWrapperContract(contract);
          console.log('✅ User wrapper contract set:', contract);
        }
      }
    };

    checkContract();
  }, [user, userWrapperContract]);

  useEffect(() => {
    const checkPaymentMatch = (): boolean => {
      const metadataArray = platformMetadata[fromMethod]?.metadata || [];
      console.log('🔍 Checking payment match:', {
        fromMethod,
        onrampRecipient,
        amount: `- $${amount}`,
        metadataCount: metadataArray.length,
      });

      console.log("metadata array", metadataArray);

      // match logic per platform
      // todo: probably much more elegant way to do this 
      let match: ExtensionRequestMetadata | undefined = undefined;
      if (fromMethod === 'venmo') {
        match = metadataArray.find(
          (transfer: any) =>
            transfer.recipient &&
            transfer.amount &&
            transfer.recipient.toLowerCase() === onrampRecipient.toLowerCase() &&
            transfer.amount === `- $${amount}`
        );
      } else if (fromMethod === 'revolut') {
        const amountNormalized = parseInt(amount.replace(/\./g, '').replace(/^0+/, '')) * -1;
        match = metadataArray.find(
          (transfer: any) =>
            transfer.recipient &&
            transfer.amount &&
            transfer.recipient.toLowerCase() === onrampRecipient.toLowerCase() &&
            transfer.amount === amountNormalized
        );
      }


      if (match) {
        console.log('✅ Payment match found:', match);
      } else {
        console.log('❌ No payment match found');
      }

      setProofIndex(match ? match.originalIndex : null);
      return match !== undefined;
    };

    setIsPaymentFound(checkPaymentMatch());
  }, [platformMetadata, offrampRecipient, amount, fromMethod]);

  useEffect(() => {
    // fromMethod payment proving
    console.log('proofIndex', proofIndex);
    if (proofIndex !== null && proofIndex >= 0 && onrampIntentHash != null) {
      console.log('🔥 Starting proof generation:', {
        proofIndex,
        onrampIntentHash,
        fromMethod,
      });

      console.log('📡 Starting proof polling for index:', proofIndex);
      setTriggerProofFetchPolling(true);
      setProofStatus('generating');
      const intentHashBigInt = BigInt(onrampIntentHash).toString();
      generatePaymentProof(fromMethod, intentHashBigInt, proofIndex);
    }
  }, [proofIndex, onrampIntentHash]);

  // Step 2: Monitor paymentProof status changes
  useEffect(() => {
    if (!paymentProof) return;

    console.log('📋 Payment proof status update:', paymentProof);

    if (paymentProof.status === 'success') {
      console.log('✅ Payment proof generated successfully!', paymentProof);
      setProofStatus('success');
      setTriggerProofFetchPolling(false);

      // Auto-proceed to next step after 1.5 seconds
      setTimeout(() => {
        setExecutionStep(4);
        setExecutionProgress(40);
      }, 1500);
    } else if (paymentProof.status === 'error') {
      console.log('❌ Payment proof generation failed:', paymentProof);
      setProofStatus('error');
      setTriggerProofFetchPolling(false);
      // Show error notification
    } else {
      console.log('⏳ Payment proof still generating...', paymentProof);
      // keep status "generating"
      setProofStatus('generating');
    }
  }, [paymentProof]);

  // Step 3: Handle proof polling
  useEffect(() => {
    if (triggerProofFetchPolling && fromMethod) {
      console.log(
        '🔄 Starting proof polling every',
        PROOF_FETCH_INTERVAL,
        'ms for method:',
        fromMethod
      );

      if (intervalId) clearInterval(intervalId);

      const id = setInterval(() => {
        console.log('📡 Polling for proof...', fromMethod);
        fetchPaymentProof(fromMethod);
      }, PROOF_FETCH_INTERVAL);
      setIntervalId(id);

      proofTimeoutRef.current = setTimeout(() => {
        console.log(
          '⏰ Proof generation timed out after',
          PROOF_GENERATION_TIMEOUT,
          'ms'
        );
        clearInterval(id);
        setTriggerProofFetchPolling(false);
        setProofStatus('timeout');
        // Show timeout notification
        showBrowserNotification('Payment Proof Generation Timed Out ⏱️', {
          body: 'The proof generation took longer than expected. Please try again.',
          icon: '/samba-logo.png',
        });
      }, PROOF_GENERATION_TIMEOUT);

      return () => {
        console.log('🧹 Cleaning up proof polling interval');
        clearInterval(id);
        if (proofTimeoutRef.current) clearTimeout(proofTimeoutRef.current);
      };
    }
  }, [triggerProofFetchPolling, fromMethod, fetchPaymentProof]);

  // Step 4: Cleanup when proof status changes from generating
  useEffect(() => {
    if (proofStatus !== 'generating' && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setTriggerProofFetchPolling(false);
      if (proofTimeoutRef.current) {
        clearTimeout(proofTimeoutRef.current);
        proofTimeoutRef.current = null;
      }
    }
  }, [proofStatus, intervalId]);

  // Handle connection approval state changes
  useEffect(() => {
    console.log('Connection approval state changed:', isConnectionApproved);
    if (isConnectionApproved === null) {
      // First attempt to connect
      requestConnection();
    } else if (isConnectionApproved === false) {
      // Connection denied, show modal
      setShowConnectionModal(true);
    } else if (isConnectionApproved === true) {
      setShowConnectionModal(false);
    }
  }, [isConnectionApproved, requestConnection]);

  // Handle extension version compatibility
  useEffect(() => {
    if (isSidebarInstalled && sideBarVersion) {
      const isCompatible = checkExtensionVersion(sideBarVersion);
      if (!isCompatible) {
        setShowVersionModal(true);
      }
    }
  }, [isSidebarInstalled, sideBarVersion]);

  // Handle extension installation check
  useEffect(() => {
    if (isSidebarInstalled === false) {
      // Add 5 second delay before showing the modal
      const timer = setTimeout(() => {
        setShowInstallModal(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (isSidebarInstalled === true) {
      // Hide modal when extension is detected
      setShowInstallModal(false);
    }
  }, [isSidebarInstalled]);

  const renderPaymentStatus = () => {
    return isPaymentFound ? 'Found payment' : 'Not found payment';
  };

  const steps = [
    { number: 1, title: 'Details' },
    { number: 2, title: 'Review' },
    { number: 3, title: 'Confirm' },
  ];

  return (
    <TooltipProvider>
      <div className='min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5'>
        {/* Header */}
        <header className='container mx-auto px-4 py-6'>
          <nav className='flex items-center justify-between'>
            <div className='flex items-center space-x-0.5'>
              <img src='/samba-logo.png' alt='Samba' className='w-8 h-8' />
              <span className='text-xl font-bold text-gray-900'>Samba</span>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <User className='h-4 w-4' />
                <span>{user?.email || 'user@example.com'}</span>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => signOut()}
                disabled={loading}
              >
                <LogOut className='h-4 w-4 mr-2' />
                {loading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </nav>
        </header>

        <div className='container mx-auto px-4 py-8 max-w-2xl'>
          {/* Progress Steps */}
          <div className='flex items-center justify-center mb-8'>
            {steps.map((step, index) => (
              <div key={step.number} className='flex items-center'>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.number
                    ? 'bg-primary border-primary text-white'
                    : 'border-gray-300 text-gray-400'
                    }`}
                >
                  {step.number}
                </div>
                <div className='ml-2 mr-8'>
                  <div
                    className={`text-sm font-medium ${currentStep >= step.number
                      ? 'text-primary'
                      : 'text-gray-400'
                      }`}
                  >
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mr-8 ${currentStep > step.number ? 'bg-primary' : 'bg-gray-300'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card className='shadow-xl border-0'>
            <CardHeader>
              <CardTitle className='text-2xl text-center'>
                {currentStep === 1 && 'Enter Swap Details'}
                {currentStep === 2 && 'Review Transaction'}
                {currentStep === 3 && 'Confirm Swap'}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* From Section */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div className='text-2xl'>
                      {getPaymentMethodLogo(fromMethod, 27)}
                    </div>
                    <div>
                      <div className='font-medium'>
                        From:{' '}
                        {paymentMethods.find((m) => m.id === fromMethod)?.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {currencies.find((c) => c.code === fromCurrency)?.flag}{' '}
                        ({fromCurrency})
                      </div>
                    </div>
                  </div>
                  {currentStep === 1 && (
                    <div className='flex space-x-2'>
                      <Select
                        value={fromCurrency}
                        onValueChange={handleFromCurrencyChange}
                      >
                        <SelectTrigger className='w-24'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableCurrencies(fromMethod).map(
                            (currencyCode) => {
                              const currency = currencies.find(
                                (c) => c.code === currencyCode
                              );
                              return currency ? (
                                <SelectItem
                                  key={currency.code}
                                  value={currency.code}
                                >
                                  {currency.flag} {currency.code}
                                </SelectItem>
                              ) : null;
                            }
                          )}
                        </SelectContent>
                      </Select>
                      <Select
                        value={fromMethod}
                        onValueChange={handleFromMethodChange}
                      >
                        <SelectTrigger className='w-32'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {getPaymentMethodLogo(method.id, 19)}{' '}
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Swap Arrow */}
                <div className='flex justify-center'>
                  <button
                    onClick={handleSwapSections}
                    disabled={currentStep !== 1}
                    className='w-10 h-10 bg-gray-100 hover:bg-gray-200 disabled:hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed'
                  >
                    <ArrowUpDown className='h-5 w-5 text-gray-600' />
                  </button>
                </div>

                {/* To Section */}
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div className='text-2xl'>
                      {getPaymentMethodLogo(toMethod, 27)}
                    </div>
                    <div>
                      <div className='font-medium'>
                        To:{' '}
                        {paymentMethods.find((m) => m.id === toMethod)?.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {currencies.find((c) => c.code === toCurrency)?.flag} (
                        {toCurrency})
                      </div>
                    </div>
                  </div>
                  {currentStep === 1 && (
                    <div className='flex space-x-2'>
                      <Select
                        value={toCurrency}
                        onValueChange={handleToCurrencyChange}
                      >
                        <SelectTrigger className='w-24'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableCurrencies(toMethod).map(
                            (currencyCode) => {
                              const currency = currencies.find(
                                (c) => c.code === currencyCode
                              );
                              return currency ? (
                                <SelectItem
                                  key={currency.code}
                                  value={currency.code}
                                >
                                  {currency.flag} {currency.code}
                                </SelectItem>
                              ) : null;
                            }
                          )}
                        </SelectContent>
                      </Select>
                      <div className='w-32 px-3 py-2 bg-gray-100 rounded-md flex items-center text-sm text-gray-600'>
                        {getPaymentMethodLogo(toMethod, 19)}{' '}
                        {paymentMethods.find((m) => m.id === toMethod)?.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errors.currency && (
                <div className='text-red-500 text-sm'>{errors.currency}</div>
              )}

              {/* Amount Section */}
              <div className='space-y-2'>
                <Label htmlFor='amount'>Amount to Send ({fromCurrency})</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
                    $
                  </span>
                  <Input
                    id='amount'
                    type='text'
                    value={amount}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    className='pl-8 pr-16 text-lg'
                    placeholder='0.00'
                    disabled={currentStep !== 1}
                  />
                  <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
                    {fromCurrency}
                  </span>
                </div>
                {errors.amount && (
                  <div className='text-red-500 text-sm'>{errors.amount}</div>
                )}
              </div>

              {/* Offramp Recipient Section */}
              <div className='space-y-2'>
                <Label htmlFor='recipient'>Recipient</Label>
                <Input
                  id='recipient'
                  value={offrampRecipient}
                  onChange={(e) => setOfframpRecipient(e.target.value)}
                  placeholder='Enter recipient name'
                  disabled={currentStep !== 1}
                />
                {errors.recipient && (
                  <div className='text-red-500 text-sm'>{errors.recipient}</div>
                )}
              </div>

              {/* Transaction Summary for Review/Confirm */}
              {currentStep >= 2 && (
                <div className='bg-secondary/10 p-4 rounded-lg space-y-3'>
                  {isGettingQuote ? (
                    <div className='flex items-center justify-center space-x-3 py-4'>
                      <Clock className='h-5 w-5 text-secondary animate-spin' />
                      <span className='text-secondary font-medium'>
                        Getting quote...
                      </span>
                    </div>
                  ) : errors.general ? (
                    <div className='flex items-center justify-center space-x-3 py-4'>
                      <div className='h-5 w-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                        !
                      </div>
                      <span className='text-red-800 font-medium'>
                        {errors.general}
                      </span>
                    </div>
                  ) : (
                    <>
                      <h3 className='font-medium text-secondary'>
                        Transaction Summary
                      </h3>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span>Amount:</span>
                          <span>
                            ${amount} {fromCurrency}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Exchange Rate:</span>
                          <span>
                            1 {fromCurrency} = {exchangeRate} {toCurrency}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Fee:</span>
                          <span>
                            $
                            {(Number(amount) - Number(recipientAmount)).toFixed(
                              2
                            )}
                          </span>
                        </div>
                        <div className='border-t pt-2 flex justify-between font-medium'>
                          <span>Recipient Amount:</span>
                          <span>
                            ${recipientAmount} {fromCurrency}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex space-x-4'>
                {currentStep > 1 && (
                  <Button
                    variant='outline'
                    onClick={handleBack}
                    className='flex-1'
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleContinue}
                  className='flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80'
                >
                  {currentStep === 1 && 'Continue'}
                  {currentStep === 2 && 'Confirm'}
                  {currentStep === 3 && 'Execute Swap'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Execution Modal */}
          <Dialog open={showExecutionModal} onOpenChange={handleCloseModal}>
            <DialogContent
              className='sm:max-w-md'
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className='text-center'>
                  Executing Swap
                </DialogTitle>
              </DialogHeader>

              {/* Continuing Intent Banner */}
              {showContinuingBanner && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-blue-600 rounded-full'></div>
                    <span className='text-blue-800 font-medium text-sm'>Continuing with existing transfer</span>
                  </div>
                  <Button
                    onClick={handleCancelExistingIntent}
                    disabled={isCancelingExistingIntent}
                    variant='outline'
                    size='sm'
                    className='text-red-600 border-red-300 hover:bg-red-50 text-xs px-2 py-1 h-6 disabled:opacity-50'
                  >
                    {isCancelingExistingIntent ? (
                      <div className='flex items-center space-x-1'>
                        <div className='w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin'></div>
                        <span>Canceling...</span>
                      </div>
                    ) : (
                      'Cancel Transfer'
                    )}
                  </Button>
                </div>
              )}

              {/* Error Display */}
              {errors.general && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                  <div className='flex items-center space-x-2'>
                    <div className='h-4 w-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                      !
                    </div>
                    <span className='text-red-800 font-medium text-sm'>Error</span>
                  </div>
                  <p className='text-red-700 text-sm mt-1'>{errors.general}</p>
                </div>
              )}

              <div className='space-y-6'>
                {/* Progress Bar */}
                <div className='space-y-2'>
                  {executionStep === 1 && (
                    <div className='space-y-4'>
                      <div className='w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto'>
                        <ArrowRight className='h-8 w-8 text-secondary' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold mb-2'>
                          Trigger Payment
                        </h3>
                        <p className='text-sm text-gray-600 mb-3 leading-relaxed'>
                          Click the button below to initiate the payment process
                          and generate the necessary intent hash for your
                          transaction.
                        </p>

                        {/* Payment Trigger Button with Tooltip */}
                        <div className='space-y-3'>
                          <div className='flex items-center justify-center space-x-2'>
                            <Button
                              onClick={handleTriggerPayment}
                              disabled={proofStatus === 'generating'}
                              className='w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white'
                            >
                              {proofStatus === 'generating'
                                ? 'Triggering...'
                                : 'Trigger Payment'}
                            </Button>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <button className='w-6 h-6 bg-secondary/20 hover:bg-secondary/30 rounded-full flex items-center justify-center transition-colors aspect-square'>
                                  <span className='text-secondary text-xs font-medium'>
                                    i
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='top' className='max-w-xs'>
                                <p className='text-sm'>
                                  This action will signal your intent to make a
                                  payment and generate a unique hash that will
                                  be used to verify your transaction on the
                                  blockchain. This is the first step in the
                                  secure payment process.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Skip Trigger Button
                          <div className='flex justify-end'>
                            <Button
                              onClick={() => {
                                setExecutionStep(2);
                                setExecutionProgress(10);
                              }}
                              variant='outline'
                              size='sm'
                              className='text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-0.5 h-6 rounded-full'
                            >
                              Skip Trigger
                            </Button>
                          </div> */}

                          {/* Error Message */}
                          {proofStatus.includes('error') && (
                            <div className='bg-red-50 border border-red-200 rounded-lg p-2'>
                              <div className='flex items-center justify-center space-x-2'>
                                <div className='h-3 w-3 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                                  !
                                </div>
                                <span className='text-red-800 font-medium text-xs'>
                                  Payment Trigger Failed
                                </span>
                              </div>
                              <p className='text-red-700 text-xs mt-1 text-center'>
                                {paymentTriggerError}
                              </p>
                              {proofStatus === 'error_intent' && (
                                <div className='flex justify-center mt-2'>
                                  <Button
                                    onClick={cancelIntent}
                                    disabled={isCancelingIntent}
                                    variant='outline'
                                    size='sm'
                                    className='text-red-700 border-red-300 hover:bg-red-50 text-xs px-2 py-0.5 h-6'
                                  >
                                    {isCancelingIntent
                                      ? 'Canceling...'
                                      : 'Cancel Intent'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Success Message */}
                          {proofStatus === 'success' && (
                            <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                              <div className='flex items-center space-x-2'>
                                <CheckCircle className='h-4 w-4 text-green-600' />
                                <span className='text-green-800 font-medium text-sm'>
                                  Payment Triggered Successfully
                                </span>
                              </div>
                              <p className='text-green-700 text-sm mt-1'>
                                Intent hash generated. You can now proceed to
                                send your payment.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {executionStep === 2 && (
                    <div className='space-y-4'>
                      <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto'>
                        <Clock className='h-8 w-8 text-yellow-600' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold mb-2'>
                          Send Payment
                        </h3>
                        <p className='text-sm text-gray-600 mb-3 leading-relaxed'>
                          Please send{' '}
                          <strong>
                            ${amount} {fromCurrency}
                          </strong>{' '}
                          from your{' '}
                          <strong>
                            {
                              paymentMethods.find((m) => m.id === fromMethod)
                                ?.name
                            }
                          </strong>{' '}
                          account to <strong>{onrampRecipient}</strong>
                        </p>
                        <Button
                          onClick={handleStepAcknowledge}
                          className='w-full'
                        >
                          I have sent the payment
                        </Button>
                      </div>
                    </div>
                  )}

                  {executionStep === 3 && (
                    <div className='space-y-4'>
                      <div>
                        <h3 className='text-lg font-semibold mb-2'>
                          Verifying Transfer
                        </h3>
                        <p className='text-sm text-gray-600 mb-3 leading-relaxed'>
                          We're verifying your payment transfer. This usually
                          takes a few seconds...
                        </p>
                        {Object.keys(platformMetadata).length === 0 ? (
                          <div className='flex justify-center items-center'>
                            <Clock className='h-8 w-8 text-yellow-600 animate-spin' />
                          </div>
                        ) : (
                          <div className='space-y-3'>
                            {/* Proof Generation Status */}
                            {proofIndex !== null && (
                              <div className='bg-secondary/10 my-2 p-3 rounded-lg border border-secondary/20'>
                                <div className='flex items-center space-x-2'>
                                  {proofStatus === 'generating' && (
                                    <Clock className='h-4 w-4 text-secondary animate-spin' />
                                  )}
                                  {proofStatus === 'success' && (
                                    <CheckCircle className='h-4 w-4 text-green-600' />
                                  )}
                                  {proofStatus === 'error' && (
                                    <div className='h-4 w-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                                      !
                                    </div>
                                  )}
                                  {proofStatus === 'timeout' && (
                                    <div className='h-4 w-4 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs'>
                                      ⏱
                                    </div>
                                  )}
                                  <span className='font-medium text-sm'>
                                    {proofStatus === 'generating' &&
                                      'Generating Payment Proof...'}
                                    {proofStatus === 'success' &&
                                      'Payment Proof Generated Successfully'}
                                    {proofStatus === 'error' &&
                                      'Payment Proof Generation Failed'}
                                    {proofStatus === 'timeout' &&
                                      'Payment Proof Generation Timed Out'}
                                  </span>
                                </div>
                                {proofStatus === 'generating' && (
                                  <p className='text-xs text-secondary'>
                                    This may take up to 60 seconds...
                                  </p>
                                )}
                                {proofStatus === 'error' && (
                                  <p className='text-xs text-red-600'>
                                    Please try generating the proof again.
                                  </p>
                                )}
                                {proofStatus === 'timeout' && (
                                  <p className='text-xs text-orange-600'>
                                    The proof generation took longer than
                                    expected. Please try again.
                                  </p>
                                )}
                              </div>
                            )}
                            {proofIndex === null && (
                              <div className='bg-red-50 my-2 p-3 rounded-lg border border-red-200'>
                                <div className='flex items-center space-x-2'>
                                  <div className='h-4 w-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                                    !
                                  </div>
                                  <span className='font-medium text-sm text-red-800'>
                                    No Matching Payment Found
                                  </span>
                                </div>
                                <p className='text-xs text-red-700 mt-1'>
                                  Could not find matching proof for{' '}
                                  {onrampRecipient} of value ${amount}. Please
                                  make the payment and try again.
                                </p>
                                <Button
                                  onClick={handleTriggerProof}
                                  className='mt-2 text-xs px-3 py-1 h-auto bg-red-600 hover:bg-red-700 text-white'
                                  size='sm'
                                >
                                  Retry
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {executionStep === 4 && (
                    <div className='space-y-4'>
                      <div className='w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto'>
                        <CheckCircle className='h-8 w-8 text-primary' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold mb-2'>
                          Finalize Order
                        </h3>
                        <p className='text-sm text-gray-600 mb-3 leading-relaxed'>
                          Finalize remittance from {fromMethod} to{' '}
                          {offrampRecipient} on {toMethod} for {amount}
                        </p>

                        {/* Error Message */}
                        {submissionError && (
                          <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-3'>
                            <div className='flex items-center space-x-2'>
                              <div className='h-4 w-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                                !
                              </div>
                              <span className='font-medium text-sm text-red-800'>
                                Submission Failed
                              </span>
                            </div>
                            <p className='text-red-700 text-sm mt-1'>
                              {submissionError}
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={handleFinalizeOrder}
                          disabled={isProcessing}
                          className='w-full'
                        >
                          {isProcessing ? 'Submitting...' : 'Submit'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {executionStep === 5 && (
                    <div className='space-y-4'>
                      <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                        <CheckCircle className='h-8 w-8 text-green-600' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold mb-2 text-green-600'>
                          Transfer Successful!
                        </h3>
                        <p className='text-sm text-gray-600 mb-3 leading-relaxed'>
                          Your swap has been completed successfully.{' '}
                          <strong>{offrampRecipient}</strong> should receive{' '}
                          <strong>
                            {recipientAmount} {toCurrency}
                          </strong>{' '}
                          in their{' '}
                          <strong>
                            {
                              paymentMethods.find((m) => m.id === toMethod)
                                ?.name
                            }
                          </strong>{' '}
                          account.
                        </p>
                        <div className='space-y-2'>
                          {depositId && (
                            <Button
                              onClick={() => window.open(`https://zkp2p.xyz/deposit/${depositId}`, '_blank')}
                              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                            >
                              View Deposit on ZKP2P
                            </Button>
                          )}
                          <Button
                            onClick={handleCloseModal}
                            className='w-full bg-green-600 hover:bg-green-700'
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step Indicators */}
                <div className='flex justify-between text-xs'>
                  {[
                    'Start Payment',
                    'Send Payment',
                    'Verify Transfer',
                    'Submit',
                    'Complete',
                  ].map((label, index) => {
                    const stepNum = index + 1;
                    const status = getStepStatus(stepNum);
                    return (
                      <div
                        key={stepNum}
                        className='flex flex-col items-center space-y-1'
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${status === 'completed'
                            ? 'bg-green-500 text-white'
                            : status === 'current'
                              ? 'bg-secondary text-white'
                              : 'bg-gray-200 text-gray-500'
                            }`}
                        >
                          {status === 'completed' ? '✓' : stepNum}
                        </div>
                        <span
                          className={`text-center ${status === 'current'
                            ? 'text-secondary font-medium'
                            : 'text-gray-500'
                            }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Connection Modal */}
          <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
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
                    onClick={requestConnection}
                    className='w-full bg-red-600 hover:bg-red-700 text-white'
                  >
                    Connect PeerAuth
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Version Incompatibility Modal */}
          <Dialog open={showVersionModal} onOpenChange={setShowVersionModal}>
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

          {/* Extension Installation Modal */}
          <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
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
                    onClick={() => {
                      window.open('https://chromewebstore.google.com/detail/peerauth-authenticate-and/ijpgccednehjpeclfcllnjjcmiohdjih', '_blank');
                    }}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    Install PeerAuth Extension
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
