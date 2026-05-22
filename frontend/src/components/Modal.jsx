import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from './Card';

const Modal = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={cn(
        "relative w-full max-w-md glass-panel p-0 overflow-hidden flex flex-col max-h-[90vh]",
        className
      )}>
        <div className="flex items-center justify-between p-6 border-b border-border-light bg-bg-card">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
