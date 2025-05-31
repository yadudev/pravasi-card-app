import React from 'react';
import Shopping from '../../assets/Shopping';
import Healthcare from '../../assets/Healthcare';
import Travel from '../../assets/Travel';
import Dining from '../../assets/Dining';

const CategoryCard = ({
  category,
  onClick,
  className = '',
  isActive = false,
}) => {
  const iconComponents = {
    Shopping: Shopping,
    Healthcare: Healthcare,
    Travel: Travel,
    Dining: Dining,
  };

  const IconComponent = iconComponents[category.iconName];

  if (!IconComponent) {
    console.error('Icon not found:', category.iconName);
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center transition-transform hover:scale-105 ${className}
      ${isActive ? 'scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="w-full h-full flex items-center justify-center">
        <IconComponent className="w-auto h-auto" />
      </div>
    </div>
  );
};

export default CategoryCard;
