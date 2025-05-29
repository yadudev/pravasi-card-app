import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="w-full h-full border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;