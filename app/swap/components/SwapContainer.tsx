'use client';

import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SwapProvider } from './SwapProvider';
import { SwapForm } from './form/SwapForm';
import { ExecutionModal } from './execution/ExecutionModal';
import { ConnectionModal } from './modals/ConnectionModal';
import { InstallationModal } from './modals/InstallationModal';
import { VersionModal } from './modals/VersionModal';
import { useSwapForm } from '../hooks/useSwapForm';
import { useExecutionFlow } from '../hooks/useExecutionFlow';
import { useProofPolling } from '../hooks/useProofPolling';
import { useExtensionConnection } from '../hooks/useExtensionConnection';

function SwapInterfaceInner() {
  const { user, loading, signOut } = useAuth();
  const { currentStep } = useSwapForm();
  const { startExecution, execution, handleFinalizeOrder } = useExecutionFlow();
  const { proofState } = useProofPolling();
  const { isConnectionApproved } = useExtensionConnection();
  // Auto-finalize when reaching final execution step
  useEffect(() => {
    if (execution.step === 4 && 
        !execution.isProcessing && 
        !execution.submissionError && 
        execution.onrampIntentHash && 
        proofState.paymentProof) {
      handleFinalizeOrder();
    }
  }, [execution.step, execution.isProcessing, execution.submissionError, execution.onrampIntentHash, proofState.paymentProof, handleFinalizeOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to continue
          </h1>
          <p className="text-gray-600">
            You need to be authenticated to use the swap interface.
          </p>
        </div>
      </div>
    );
  }

  const handleConfirmTransaction = () => {
    if (currentStep === 3) {
      startExecution();
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Swap Interface
              </h1>
              <p className="text-gray-600 mt-2">
                Swap between different payment methods securely
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {user.email || user.uid?.slice(0, 8) + '...'}
                </span>
              </div>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <SwapForm />
            
            {currentStep === 3 && (
              <div className="text-center">
                <Button
                  onClick={handleConfirmTransaction}
                  size="lg"
                  className="px-8"
                >
                  Start Transaction
                </Button>
              </div>
            )}
          </div>

          {/* Modals */}
          <ExecutionModal />
          <ConnectionModal />
          <InstallationModal />
          <VersionModal />
        </div>
      </div>
    </TooltipProvider>
  );
}

export function SwapContainer() {
  return (
    <SwapProvider>
      <SwapInterfaceInner />
    </SwapProvider>
  );
}