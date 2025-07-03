import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import { useExecutionFlow } from '../../hooks/useExecutionFlow';

export function PaymentTrigger() {
  const { execution, handleTriggerPayment } = useExecutionFlow();

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        {execution.isProcessing ? (
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        ) : (
          <Play className="w-8 h-8 text-blue-600" />
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {execution.isProcessing ? 'Starting Payment...' : 'Ready to Start Payment'}
        </h3>
        <p className="text-gray-600 mt-2">
          {execution.isProcessing 
            ? 'Initializing the payment process. This may take a moment.'
            : 'Click the button below to begin the payment process.'
          }
        </p>
      </div>

      {!execution.isProcessing && (
        <Button
          onClick={handleTriggerPayment}
          size="lg"
          className="mt-4"
        >
          Start Payment
        </Button>
      )}
    </div>
  );
}