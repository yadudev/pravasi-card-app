import React from 'react';

const StepIndicator = ({ 
  steps, 
  currentStep, 
  orientation = 'horizontal',
  className = '' 
}) => {
  return (
    <div className={`
      ${className}
    `}>
      {/* Circles and Lines Row */}
      <div className="flex items-center justify-center mb-12">
        {steps.map((step, index) => (
          <React.Fragment key={step.step}>
            {/* Step Circle */}
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold
              ${index + 1 <= currentStep 
                ? 'bg-[#222158] border-[#AFDCFF99] border-2 border-solid text-white' 
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {step.step}
            </div>

            {/* Connecting Line between circles */}
            {index < steps.length - 1 && (
              <div className="w-24 lg:w-32 xl:w-48 border-t-2 border-dotted border-[#222158] mx-4"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content Row */}
      <div className="flex justify-center items-start">
        {steps.map((step, index) => (
          <div key={`content-${step.step}`} className="w-74 px-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">{step.title}</h3>
              <p className="text-[#707070] leading-relaxed text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;