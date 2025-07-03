import { useCallback } from 'react';
import { useSwap } from '../components/SwapProvider';
import { currencies, paymentMethods } from '../types/swap';

export function useSwapForm() {
  const { state, dispatch } = useSwap();

  const updateFormData = useCallback((data: Partial<typeof state.form>) => {
    dispatch({ type: 'SET_FORM_DATA', payload: data });
  }, [dispatch]);

  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, [dispatch]);

  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  }, [dispatch]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!state.form.amount || parseFloat(state.form.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!state.form.onrampRecipient) {
      errors.onrampRecipient = 'Onramp recipient is required';
    }
    
    if (!state.form.offrampRecipient) {
      errors.offrampRecipient = 'Offramp recipient is required';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  }, [state.form, setErrors]);

  const getAvailableCurrencies = useCallback((methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.availableCurrencies : [];
  }, []);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      setCurrentStep(state.currentStep + 1);
    }
  }, [state.currentStep, validateForm, setCurrentStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(Math.max(1, state.currentStep - 1));
  }, [state.currentStep, setCurrentStep]);

  return {
    formData: state.form,
    currentStep: state.currentStep,
    errors: state.errors,
    currencies,
    paymentMethods,
    updateFormData,
    setCurrentStep,
    validateForm,
    getAvailableCurrencies,
    handleNext,
    handlePrevious,
  };
}