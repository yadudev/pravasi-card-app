import React from 'react';
import { Plane } from 'lucide-react';
import ShoppingBagIcon from '../../assets/icons/ShoppingBagIcon';
import ShieldPlusIcon from '../../assets/icons/ShieldPlusIcon';
import DiningIcon from '../../assets/icons/DiningIcon';

const CategoryCard = ({
  category,
  onClick,
  className = '',
  isActive = false,
}) => {
  const iconComponents = {
    Shopping: ShoppingBagIcon,
    Healthcare: ShieldPlusIcon,
    Travel: Plane,
    Dining: DiningIcon,
  };

  const IconComponent = iconComponents[category.iconName];

  if (!IconComponent) {
    console.error('Icon not found:', category.iconName);
    return null;
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer group 
        transition-all duration-300 ease-out font-figtree
        ${category.color || 'bg-indigo-950'}
        hover:scale-102 shadow-lg hover:shadow-xl
        h-[85px] flex items-center p-6
        ${className}
      `}
      onClick={onClick}
    >
      {/* Content - Horizontal Layout */}
      <div className="relative z-10 flex items-center w-full">
        {/* Icon Section */}
        <div className="flex-shrink-0 mr-6">
          <div className="p-4 border rounded-full text-white">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Category Name */}
        <div className="flex-1">
          <h3 className="text-[#AFDCFF] font-medium text-2xl transition-colors leading-tight">
            {category.name}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
