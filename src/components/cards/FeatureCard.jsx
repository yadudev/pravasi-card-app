import React from 'react';
import Card from '../ui/Card';

const FeatureCard = ({ 
  icon: IconComponent, 
  title, 
  description, 
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-white text-gray-900 rounded-3xl',
    dark: 'bg-white/10 backdrop-blur-sm text-white border-0',
    primary: 'bg-blue-50 text-blue-900 border border-blue-200'
  };

  return (
    <Card className={`p-8 ${variants[variant]} ${className}`}>
      {/* Icon and Title Row */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${variant === 'dark' ? 'bg-indigo-600' : 'bg-[#3D3C96]'}
          `}>
            <IconComponent 
              size={24} 
              className="text-white" 
            />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
      </div>
      
      {/* Description - Full Width Below */}
      <div className="w-full">
        <p className={`font-medium text-sm text-justify leading-relaxed ${
          variant === 'dark' ? 'text-white/90' : 'text-[#707070]'
        }`}>
          {description}
        </p>
      </div>
    </Card>
  );
};

export default FeatureCard;