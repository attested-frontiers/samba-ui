import { SwapFormData } from '../types/swap';

export function validateSwapForm(formData: SwapFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!formData.onrampRecipient) {
    errors.onrampRecipient = 'Onramp recipient is required';
  }
  
  if (!formData.offrampRecipient) {
    errors.offrampRecipient = 'Offramp recipient is required';
  }

  if (formData.fromMethod === formData.toMethod) {
    errors.methods = 'Source and destination methods must be different';
  }

  return errors;
}

export function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `0.00 ${currency}`;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculateEstimatedTime(fromMethod: string, toMethod: string): string {
  // Simple estimation based on payment methods
  const times = {
    venmo: 2,
    revolut: 3,
  };
  
  const fromTime = times[fromMethod as keyof typeof times] || 5;
  const toTime = times[toMethod as keyof typeof times] || 5;
  
  const totalMinutes = Math.max(fromTime, toTime);
  
  if (totalMinutes <= 5) {
    return `${totalMinutes}-${totalMinutes + 2} minutes`;
  } else {
    return `${totalMinutes}-${totalMinutes + 5} minutes`;
  }
}

export function generateMockQuote(formData: SwapFormData) {
  const amount = parseFloat(formData.amount);
  const fees = amount * 0.01; // 1% fee
  const total = amount + fees;
  
  return {
    amount: formData.amount,
    fromCurrency: formData.fromCurrency,
    toCurrency: formData.toCurrency,
    exchangeRate: 1.0, // 1:1 for same currency
    fees: fees.toFixed(2),
    total: total.toFixed(2),
    estimatedTime: calculateEstimatedTime(formData.fromMethod, formData.toMethod),
  };
}