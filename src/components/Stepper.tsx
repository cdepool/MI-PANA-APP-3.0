
import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full px-4 mb-8">
      {steps.map((stepLabel, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={index} className="flex flex-col items-center relative z-10 w-full">
            {/* Connecting Line */}
            {index !== 0 && (
              <div 
                className={`absolute top-4 right-[50%] w-full h-0.5 -z-10 transition-colors duration-300 ${
                  index <= currentStep ? 'bg-mipana-mediumBlue' : 'bg-gray-200 dark:bg-gray-700'
                }`} 
              />
            )}

            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'bg-mipana-mediumBlue border-mipana-mediumBlue text-white' 
                  : isCurrent 
                    ? 'bg-white dark:bg-gray-800 border-mipana-mediumBlue text-mipana-mediumBlue shadow-[0_0_0_4px_rgba(4,138,191,0.2)]' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-300'
              }`}
            >
              {isCompleted ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
            </div>
            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors duration-300 ${
              isCurrent ? 'text-mipana-mediumBlue' : 'text-gray-400'
            }`}>
              {stepLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
