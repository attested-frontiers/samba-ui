import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface QuoteDisplayProps {
  quote: any;
  isLoading: boolean;
  className?: string;
}

export function QuoteDisplay({ quote, isLoading, className = "" }: QuoteDisplayProps) {
  if (isLoading) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Getting quote...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 text-sm">
            No quote available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="font-medium">{quote.amount} {quote.fromCurrency}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Exchange Rate</span>
            <span className="font-medium">{quote.exchangeRate} {quote.toCurrency}/{quote.fromCurrency}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Fees</span>
            <span className="font-medium">{quote.fees} {quote.fromCurrency}</span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total</span>
              <span className="font-bold text-lg">{quote.total} {quote.fromCurrency}</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            Estimated time: {quote.estimatedTime}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}