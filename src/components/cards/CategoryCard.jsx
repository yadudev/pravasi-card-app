import React from 'react';
import ShoppingIcon from '../../assets/icons/ShoppingIcon';
import HealthcareIcon from '../../assets/icons/HealthcareIcon';
import TravelIcon from '../../assets/icons/TravelIcon';
import DiningIcon from '../../assets/icons/DiningIcon';

const CategoryCard = ({
  category,
  onClick,
  className = '',
  isActive = false,
}) => {
  const iconComponents = {
    Shopping: ShoppingIcon,
    Healthcare: HealthcareIcon,
    Travel: TravelIcon,
    Dining: DiningIcon,
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
