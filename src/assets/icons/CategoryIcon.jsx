import React from 'react';

const CategoryIcon = ({
  width = 29,
  height = 29,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M17.5 10.5C19.1569 10.5 20.5 9.15685 20.5 7.5C20.5 5.84315 19.1569 4.5 17.5 4.5C15.8431 4.5 14.5 5.84315 14.5 7.5C14.5 9.15685 15.8431 10.5 17.5 10.5Z"
        stroke="#4C4C4C"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.5 20.5C9.15685 20.5 10.5 19.1569 10.5 17.5C10.5 15.8431 9.15685 14.5 7.5 14.5C5.84315 14.5 4.5 15.8431 4.5 17.5C4.5 19.1569 5.84315 20.5 7.5 20.5Z"
        stroke="#4C4C4C"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14.5 14.5H20.5V19.5C20.5 19.7652 20.3946 20.0196 20.2071 20.2071C20.0196 20.3946 19.7652 20.5 19.5 20.5H15.5C15.2348 20.5 14.9804 20.3946 14.7929 20.2071C14.6054 20.0196 14.5 19.7652 14.5 19.5V14.5ZM4.5 4.5H10.5V9.5C10.5 9.76522 10.3946 10.0196 10.2071 10.2071C10.0196 10.3946 9.76522 10.5 9.5 10.5H5.5C5.23478 10.5 4.98043 10.3946 4.79289 10.2071C4.60536 10.0196 4.5 9.76522 4.5 9.5V4.5Z"
        stroke="#4C4C4C"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
export default CategoryIcon;
