import React from 'react';
import InstagramIcon from '../../assets/icons/InstagramIcon';
import FacebookIcon from '../../assets/icons/FacebookIcon';
import TwitterIcon from '../../assets/icons/TwitterIcon'

const SocialLinks = ({ 
  variant = 'dark', 
  size = 'md',
  className = ''
}) => {
  const variants = {
    light: '',
    dark: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const socialIcons = [
    { name: 'facebook', icon: FacebookIcon, url: '#' },
    { name: 'instagram', icon: InstagramIcon, url: '#' },
    { name: 'twitter', icon: TwitterIcon, url: '#' }
  ];

  return (
    <div className={`flex space-x-4 ${className}`}>
      {socialIcons.map(({ name, icon: IconComponent, url }) => (
        <a
          key={name}
          href={url}
          className={`
            ${sizes[size]} 
            ${variants[variant]} 
            rounded-full 
            flex 
            items-center 
            justify-center 
            transition-all 
            duration-200
            transform
          `}
          aria-label={`Follow us on ${name}`}
        >
          <IconComponent size={iconSizes[size]} />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
