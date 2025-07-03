import { CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExecutionFlow } from '../../hooks/useExecutionFlow';

export function CompletionScreen() {
  const { execution } = useExecutionFlow();

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          Transaction Completed!
        </h3>
        <p className="text-gray-600 mt-2">
          Your swap has been successfully processed and completed.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-800">
            Transaction Summary
          </p>
          <div className="text-sm text-green-700 space-y-1">
            <p>✓ Payment verified</p>
            <p>✓ Proof generated</p>
            <p>✓ Transaction submitted</p>
            <p>✓ Blockchain confirmed</p>
          </div>
        </div>
      </div>

      {execution.onrampIntentHash && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Transaction Hash:</p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-mono text-gray-800 break-all">
              {execution.onrampIntentHash}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Open block explorer or copy hash
              navigator.clipboard.writeText(execution.onrampIntentHash || '');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Copy Hash
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-500">
        This window will close automatically in a few seconds.
      </div>
    </div>
  );
}