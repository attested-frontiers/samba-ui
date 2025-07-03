import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useExecutionFlow } from '../../hooks/useExecutionFlow';
import { ExecutionSteps } from './ExecutionSteps';
import { PaymentTrigger } from './PaymentTrigger';
import { PaymentVerification } from './PaymentVerification';
import { ProofGeneration } from './ProofGeneration';
import { TransactionSubmission } from './TransactionSubmission';
import { CompletionScreen } from './CompletionScreen';

const executionSteps = [
  { id: 1, label: 'Start Payment', description: 'Initiate the payment process' },
  { id: 2, label: 'Send Payment', description: 'Complete the payment transfer' },
  { id: 3, label: 'Verify Transfer', description: 'Verify payment completion' },
  { id: 4, label: 'Submit', description: 'Submit proof to blockchain' },
  { id: 5, label: 'Complete', description: 'Transaction completed' },
];

export function ExecutionModal() {
  const { execution, modals, cancelExecution } = useExecutionFlow();

  const renderStepContent = () => {
    switch (execution.step) {
      case 1:
        return <PaymentTrigger />;
      case 2:
        return <PaymentVerification />;
      case 3:
        return <ProofGeneration />;
      case 4:
        return <TransactionSubmission />;
      case 5:
        return <CompletionScreen />;
      default:
        return <PaymentTrigger />;
    }
  };

  return (
    <Dialog open={modals.showExecutionModal} onOpenChange={() => cancelExecution()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Processing Transaction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{execution.progress}%</span>
            </div>
            <Progress value={execution.progress} className="h-2" />
          </div>

          {/* Steps Overview */}
          <ExecutionSteps 
            currentStep={execution.step} 
            steps={executionSteps}
            className="mb-6"
          />

          {/* Step Content */}
          <div className="min-h-[200px]">
            {renderStepContent()}
          </div>

          {/* Error Display */}
          {(execution.paymentTriggerError || execution.submissionError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {execution.paymentTriggerError || execution.submissionError}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={cancelExecution}
              disabled={execution.isProcessing}
            >
              Cancel
            </Button>
            
            {execution.step === 5 && (
              <Button onClick={cancelExecution}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}