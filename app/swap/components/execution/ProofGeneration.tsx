import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useProofPolling } from '../../hooks/useProofPolling';

export function ProofGeneration() {
  const { proofState } = useProofPolling();

  const getStatusIcon = () => {
    switch (proofState.proofStatus) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'failed':
      case 'timeout':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Clock className="w-8 h-8 text-blue-600 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (proofState.proofStatus) {
      case 'completed':
        return 'Proof Generated Successfully!';
      case 'failed':
        return 'Proof Generation Failed';
      case 'timeout':
        return 'Proof Generation Timed Out';
      default:
        return 'Generating Proof...';
    }
  };

  const getStatusDescription = () => {
    switch (proofState.proofStatus) {
      case 'completed':
        return 'Your payment proof has been successfully generated and verified.';
      case 'failed':
        return 'There was an issue generating your payment proof. Please try again.';
      case 'timeout':
        return 'Proof generation took longer than expected. Please try again.';
      default:
        return 'Creating a cryptographic proof of your payment. This may take a few moments.';
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        {getStatusIcon()}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {getStatusText()}
        </h3>
        <p className="text-gray-600 mt-2">
          {getStatusDescription()}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Status: {proofState.proofStatus}
          </p>
          {proofState.proofIndex !== null && (
            <p className="text-sm text-gray-600">
              Proof Index: {proofState.proofIndex}
            </p>
          )}
        </div>
      </div>

      {proofState.proofStatus === 'generating' && (
        <div className="text-xs text-gray-500">
          This process may take up to 10 minutes. Please keep this window open.
        </div>
      )}
    </div>
  );
}