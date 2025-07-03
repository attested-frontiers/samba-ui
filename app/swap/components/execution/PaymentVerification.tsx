import { CheckCircle, Clock } from 'lucide-react';
import { useExecutionFlow } from '../../hooks/useExecutionFlow';

export function PaymentVerification() {
  const { execution } = useExecutionFlow();

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
        {execution.isPaymentFound ? (
          <CheckCircle className="w-8 h-8 text-green-600" />
        ) : (
          <Clock className="w-8 h-8 text-orange-600 animate-pulse" />
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {execution.isPaymentFound ? 'Payment Verified!' : 'Verifying Payment...'}
        </h3>
        <p className="text-gray-600 mt-2">
          {execution.isPaymentFound
            ? 'Your payment has been successfully verified and confirmed.'
            : 'Please complete the payment in your payment app. We are monitoring for the transaction.'
          }
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Status: {execution.isPaymentFound ? 'Payment confirmed' : 'Waiting for payment...'}
        </p>
      </div>
    </div>
  );
}