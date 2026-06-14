
import React, { ButtonHTMLAttributes, useState, useRef, useCallback, useEffect } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  fullWidth?: boolean;
  rippleColor?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  disabled,
  variant = 'primary',
  fullWidth = false,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  ...props
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    // Immediate visual feedback
    createRipple(e);

    // Debounce actual click handler to prevent double-submit (300ms)
    if (debounceRef.current) return;
    
    if (onClick) {
      onClick(e);
    }

    // Set a small lockout period
    debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
    }, 300);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-background border-b-4 border-primary-dark hover:bg-primary-dark active:border-b-0 active:translate-y-1 shadow-lg shadow-primary/20';
      case 'secondary':
        return 'bg-surface text-white border-b-4 border-surface-light hover:bg-surface-light active:border-b-0 active:translate-y-1 shadow-lg';
      case 'danger':
        return 'bg-red-600 text-white border-b-4 border-red-800 hover:bg-red-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-red-600/20';
      case 'outline':
        return 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 active:scale-95';
      case 'ghost':
        return 'bg-transparent text-white/80 hover:text-white hover:bg-white/10 active:scale-95';
      default:
        return 'bg-primary text-background';
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          relative overflow-hidden font-bold font-heading rounded-xl transition-all duration-100 ease-out
          ${fullWidth ? 'w-full' : ''}
          ${getVariantClasses()}
          ${disabled || isLoading ? 'opacity-60 cursor-not-allowed border-b-0 translate-y-0 shadow-none grayscale' : ''}
          py-3 px-6 flex items-center justify-center gap-2 select-none
          ${className}
        `}
        {...props}
      >
        {/* Ripple Effect Container */}
        <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full animate-ripple"
              style={{
                top: ripple.y,
                left: ripple.x,
                width: Math.max(buttonRef.current?.offsetWidth || 0, buttonRef.current?.offsetHeight || 0) * 2,
                height: Math.max(buttonRef.current?.offsetWidth || 0, buttonRef.current?.offsetHeight || 0) * 2,
                transform: 'scale(0)',
                backgroundColor: rippleColor,
              }}
            />
          ))}
        </span>

        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="animate-pulse">Processing...</span>
          </>
        ) : (
          children
        )}
      </button>
      <style>{`
        .animate-ripple {
          animation: ripple 0.6s linear;
          position: absolute;
          border-radius: 50%;
          opacity: 1;
          pointer-events: none;
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default Button;
