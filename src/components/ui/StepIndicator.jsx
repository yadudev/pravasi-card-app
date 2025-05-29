import React from 'react';

const StepIndicator = ({ 
  steps, 
  currentStep, 
  orientation = 'horizontal',
  className = '' 
}) => {
  return (
    <div className={`
      flex 
      ${orientation === 'horizontal' ? 'flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8' : 'flex-col space-y-8'}
      ${className}
    `}>
      {steps.map((step, index) => (
        <div key={step.step} className="flex flex-col items-center max-w-sm relative">
          {/* Step Circle */}
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-6
            ${index + 1 <= currentStep 
              ? 'bg-indigo-900 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {step.step}
          </div>
          
          {/* Connecting Line (only for horizontal and not last item) */}
          {orientation === 'horizontal' && index < steps.length - 1 && (
            <div className="hidden md:block absolute top-10 left-full w-32 border-t-2 border-dotted border-gray-300 z-0"></div>
          )}
          
          {/* Step Content */}
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
            <p className="text-gray-600 leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
