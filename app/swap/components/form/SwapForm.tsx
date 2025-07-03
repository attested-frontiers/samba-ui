import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { useSwapForm } from '../../hooks/useSwapForm';
import { useQuoteManagement } from '../../hooks/useQuoteManagement';
import { CurrencySelector } from './CurrencySelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { AmountInput } from './AmountInput';
import { RecipientInput } from './RecipientInput';
import { QuoteDisplay } from './QuoteDisplay';
import { SwapReviewCard } from './SwapReviewCard';

export function SwapForm() {
  const { 
    formData, 
    currentStep, 
    errors, 
    updateFormData, 
    getAvailableCurrencies, 
    handleNext, 
    handlePrevious 
  } = useSwapForm();
  
  const { quote, getQuote } = useQuoteManagement();

  const handleGetQuote = async () => {
    try {
      await getQuote();
    } catch (error) {
      console.error('Failed to get quote:', error);
    }
  };

  const handleSwapDirection = () => {
    updateFormData({
      fromCurrency: formData.toCurrency,
      toCurrency: formData.fromCurrency,
      fromMethod: formData.toMethod,
      toMethod: formData.fromMethod,
      onrampRecipient: formData.offrampRecipient,
      offrampRecipient: formData.onrampRecipient,
    });
  };

  if (currentStep === 2) {
    return (
      <SwapReviewCard
        formData={formData}
        quote={quote.depositTarget}
        onBack={handlePrevious}
        onConfirm={handleNext}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* From Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">From</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CurrencySelector
                value={formData.fromCurrency}
                onChange={(value) => updateFormData({ fromCurrency: value })}
                availableCurrencies={getAvailableCurrencies(formData.fromMethod)}
              />
            </div>
            <div>
              <PaymentMethodSelector
                value={formData.fromMethod}
                onChange={(value) => updateFormData({ fromMethod: value })}
                availableCurrencies={[formData.fromCurrency]}
              />
            </div>
          </div>
          <AmountInput
            value={formData.amount}
            onChange={(value) => updateFormData({ amount: value })}
            currency={formData.fromCurrency}
            error={errors.amount}
          />
          <RecipientInput
            value={formData.onrampRecipient}
            onChange={(value) => updateFormData({ onrampRecipient: value })}
            label="From Recipient"
            placeholder="Enter sender username"
            error={errors.onrampRecipient}
          />
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwapDirection}
            className="rounded-full"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">To</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CurrencySelector
                value={formData.toCurrency}
                onChange={(value) => updateFormData({ toCurrency: value })}
                availableCurrencies={getAvailableCurrencies(formData.toMethod)}
              />
            </div>
            <div>
              <PaymentMethodSelector
                value={formData.toMethod}
                onChange={(value) => updateFormData({ toMethod: value })}
                availableCurrencies={[formData.toCurrency]}
              />
            </div>
          </div>
          <RecipientInput
            value={formData.offrampRecipient}
            onChange={(value) => updateFormData({ offrampRecipient: value })}
            label="To Recipient"
            placeholder="Enter recipient username"
            error={errors.offrampRecipient}
          />
        </div>

        {/* Quote Display */}
        <QuoteDisplay
          quote={quote.depositTarget}
          isLoading={quote.isGettingQuote}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetQuote}
            disabled={quote.isGettingQuote}
            className="flex-1"
          >
            Get Quote
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!quote.depositTarget}
            className="flex-1"
          >
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}