import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'action' | 'outline';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  icon,
  className = '',
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-mipana-mediumBlue hover:bg-[#038a9e] text-white focus:ring-mipana-mediumBlue",
    secondary: "bg-mipana-darkBlue hover:bg-[#011e45] text-white focus:ring-mipana-darkBlue",
    action: "bg-mipana-orange hover:bg-[#d9550a] text-white focus:ring-mipana-orange shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    outline: "border-2 border-mipana-mediumBlue text-mipana-mediumBlue hover:bg-mipana-mediumBlue/10 bg-transparent"
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
