import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface ExecutionStepsProps {
  currentStep: number;
  steps: Array<{
    id: number;
    label: string;
    description?: string;
  }>;
  className?: string;
}

export function ExecutionSteps({ currentStep, steps, className = "" }: ExecutionStepsProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        
        return (
          <div key={step.id} className="flex items-center space-x-4">
            {/* Step Indicator */}
            <div className="flex-shrink-0">
              {status === 'completed' ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              ) : status === 'current' ? (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white animate-pulse" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">{step.id}</span>
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <h3 className={`font-medium ${
                status === 'current' 
                  ? 'text-blue-600' 
                  : status === 'completed' 
                  ? 'text-green-600' 
                  : 'text-gray-500'
              }`}>
                {step.label}
              </h3>
              {step.description && (
                <p className="text-sm text-gray-500 mt-1">{step.description}</p>
              )}
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className="flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}