const FacebookIcon = ({ 
  fill = "#AFDCFF", 
  width = 29, 
  height = 29, 
  className = "",
  ...props 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M29 14.49C29 6.48747 22.5081 0.000106812 14.5 0.000106812C6.49187 0.000106812 0 6.48747 0 14.49C0 21.7224 5.30244 27.7169 12.2344 28.804V18.6785H8.55273V14.49H12.2344V11.2977C12.2344 7.66619 14.3991 5.66024 17.7112 5.66024C19.2977 5.66024 20.957 5.94324 20.957 5.94324V9.50913H19.1286C17.3274 9.50913 16.7656 10.6261 16.7656 11.772V14.49H20.7871L20.1442 18.6785H16.7656V28.804C23.6976 27.7169 29 21.7224 29 14.49Z"
        fill={fill}
      />
    </svg>
  );
};

export default FacebookIcon