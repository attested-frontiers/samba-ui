import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { SwapFormData } from '../../types/swap';

interface SwapReviewCardProps {
  formData: SwapFormData;
  quote: any;
  onBack: () => void;
  onConfirm: () => void;
}

export function SwapReviewCard({ formData, quote, onBack, onConfirm }: SwapReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Transaction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">You Send</div>
              <div className="font-semibold">{formData.amount} {formData.fromCurrency}</div>
              <div className="text-sm text-gray-500">via {formData.fromMethod}</div>
              <div className="text-sm text-gray-500">to {formData.onrampRecipient}</div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="text-center">
              <div className="text-sm text-gray-600">You Receive</div>
              <div className="font-semibold">{formData.amount} {formData.toCurrency}</div>
              <div className="text-sm text-gray-500">via {formData.toMethod}</div>
              <div className="text-sm text-gray-500">to {formData.offrampRecipient}</div>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-medium">Transaction Details</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span>{quote.amount} {quote.fromCurrency}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span>{quote.exchangeRate} {quote.toCurrency}/{quote.fromCurrency}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Fees</span>
                <span>{quote.fees} {quote.fromCurrency}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Time</span>
                <span>{quote.estimatedTime}</span>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{quote.total} {quote.fromCurrency}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1"
          >
            Confirm Transaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}