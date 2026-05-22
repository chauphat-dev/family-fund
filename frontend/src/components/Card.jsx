import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Simple utility to merge tailwind classes with clsx
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Card = ({ children, className, interactive = false, ...props }) => {
  return (
    <div 
      className={cn(
        "glass-panel p-6", 
        interactive && "glass-panel-interactive cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
