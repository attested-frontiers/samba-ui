import { Button } from '@/components/ui/button';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { useExecutionFlow } from '../../hooks/useExecutionFlow';

export function TransactionSubmission() {
  const { execution, handleFinalizeOrder } = useExecutionFlow();

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
        {execution.isProcessing ? (
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        ) : execution.step === 5 ? (
          <CheckCircle className="w-8 h-8 text-green-600" />
        ) : (
          <Send className="w-8 h-8 text-purple-600" />
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {execution.isProcessing 
            ? 'Submitting to Blockchain...' 
            : execution.step === 5 
            ? 'Transaction Submitted!' 
            : 'Ready to Submit'
          }
        </h3>
        <p className="text-gray-600 mt-2">
          {execution.isProcessing
            ? 'Submitting your proof to the blockchain. This may take a moment.'
            : execution.step === 5
            ? 'Your transaction has been successfully submitted to the blockchain.'
            : 'Your proof is ready. Click below to submit the transaction to the blockchain.'
          }
        </p>
      </div>

      {execution.onrampIntentHash && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Intent Hash: {execution.onrampIntentHash.slice(0, 10)}...{execution.onrampIntentHash.slice(-8)}
          </p>
        </div>
      )}

      {!execution.isProcessing && execution.step !== 5 && (
        <Button
          onClick={handleFinalizeOrder}
          size="lg"
          className="mt-4"
        >
          Submit Transaction
        </Button>
      )}
    </div>
  );
}