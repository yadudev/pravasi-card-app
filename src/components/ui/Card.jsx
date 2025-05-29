import React from 'react';
import { clsx } from 'clsx';

const Card = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  hover = false,
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const roundedStyles = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  return (
    <div
      className={clsx(
        'bg-white',
        paddingStyles[padding],
        shadowStyles[shadow],
        roundedStyles[rounded],
        hover && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;