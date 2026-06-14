import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DynamicBackground from '../../components/student/DynamicBackground';

declare const gsap: any;

const Confetti: React.FC = () => (
    <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 100 }).map((_, i) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * -100}%`, // Start above screen
                animation: `confetti-fall ${Math.random() * 2 + 3}s ${Math.random() * 2}s linear forwards`,
                backgroundColor: ['#7C4DFF', '#FF3B30', '#FFFFFF', '#FBBF24'][Math.floor(Math.random() * 4)],
            };
            return <div key={i} className="confetti-piece" style={style}></div>;
        })}
    </div>
);

const WelcomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContinue = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    navigate('/customer/games');
  };

  useEffect(() => {
    // Auto-navigate after 3 seconds
    timerRef.current = setTimeout(() => {
      navigate('/customer/games');
    }, 3000);

    // GSAP animations
    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline();
      tl.from('.welcome-title', { y: 50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' })
        .from('.welcome-subtitle', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, "-=0.5")
        .from('.welcome-button', { scale: 0.5, opacity: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }, "-=0.3");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate]);
  
   const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    ripple.classList.add('ripple');
    
    const existingRipple = button.getElementsByClassName('ripple')[0];
    if(existingRipple) existingRipple.remove();
    
    button.appendChild(ripple);
  };


  return (
    <>
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white overflow-hidden">
      <DynamicBackground />
      <Confetti />

      <main className="relative z-20 flex flex-col items-center justify-center text-center">
        <h1 className="welcome-title text-4xl sm:text-6xl font-extrabold" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          Hey, {user?.username}, buddy!
        </h1>
        <p className="welcome-subtitle text-lg sm:text-xl mt-4 max-w-md" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
          Happy to serve you — Let’s reserve your premium screen 🎬
        </p>
        <button
          onClick={(e) => {handleRipple(e); handleContinue()}}
          className="welcome-button relative mt-12 bg-black/50 backdrop-blur-lg border border-white/20 text-white font-bold py-3 px-10 rounded-full shadow-2xl overflow-hidden transition-all duration-300 transform active:scale-[0.97] hover:-translate-y-1 hover:border-white/50"
          style={{
            boxShadow: '0 0 20px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)',
          }}
        >
          Continue
        </button>
      </main>
    </div>
    <style>{`
        @keyframes confetti-fall {
            from {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        .confetti-piece {
            position: absolute;
            width: 8px;
            height: 16px;
            border-radius: 4px;
        }
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple-effect 0.6s linear;
        }
        @keyframes ripple-effect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `}</style>
    </>
  );
};

export default WelcomePage;