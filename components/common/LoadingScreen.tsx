import React from 'react';

const NoodlesIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_15px_rgba(0,0,0,0.4)]">
        <defs>
            <radialGradient id="bowl-gloss" cx="0.3" cy="0.3" r="0.7">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <linearGradient id="noodle-gloss" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
        </defs>
        <path d="M 10,50 C 10,85 90,85 90,50" fill="url(#bowl-gloss)" />
        <path d="M 12,52 Q 50,42 88,52" fill="url(#noodle-gloss)" />
        <path d="M 20,48 C 30,30 40,50 50,35 S 70,50 80,40" stroke="#FBBF24" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M 25,50 C 35,35 45,55 55,40 S 75,55 85,45" stroke="#FCD34D" strokeWidth="5" fill="none" strokeLinecap="round"/>
        {/* Steam */}
        <path d="M 30 30 Q 35 20 40 30 T 50 30" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M 60 28 Q 65 18 70 28 T 80 28" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
    </svg>
);

const RiceBowlIcon = () => (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_15px_rgba(0,0,0,0.4)]">
        <defs>
            <radialGradient id="rice-bowl-gloss" cx="0.3" cy="0.3" r="0.7">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
        </defs>
        <path d="M 10,50 C 10,85 90,85 90,50" fill="url(#rice-bowl-gloss)" />
        <ellipse cx="50" cy="50" rx="40" ry="10" fill="#f8fafc" />
        <circle cx="40" cy="50" r="2" fill="#e2e8f0" />
        <circle cx="50" cy="48" r="1.5" fill="#e2e8f0" />
        <circle cx="60" cy="51" r="2" fill="#e2e8f0" />
        <circle cx="45" cy="53" r="1.5" fill="#e2e8f0" />
        <circle cx="55" cy="52" r="2" fill="#e2e8f0" />
    </svg>
);

const ParottaIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_15px_rgba(0,0,0,0.4)]">
         <defs>
            <linearGradient id="parotta-gloss" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="45" ry="30" fill="url(#parotta-gloss)" stroke="#F59E0B" strokeWidth="2"/>
        <path d="M 15,50 C 30,40 70,40 85,50" stroke="#FCD34D" strokeWidth="2.5" fill="none" />
        <path d="M 25,50 C 40,45 60,45 75,50" stroke="#FBBF24" strokeWidth="2" fill="none" />
        <ellipse cx="50" cy="50" rx="20" ry="10" fill="#FBBF24" opacity="0.6"/>
    </svg>
);

const JuiceIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_15px_rgba(0,0,0,0.4)]">
        <defs>
             <linearGradient id="juice-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
             <linearGradient id="glass-gloss" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="30%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.3" />
            </linearGradient>
        </defs>
        {/* Glass shape */}
        <path d="M 25 10 L 75 10 L 80 90 L 20 90 Z" fill="url(#glass-gloss)" />
        {/* Juice inside */}
        <path d="M 27 15 L 73 15 L 78 88 L 22 88 Z" fill="url(#juice-fill)" />
        {/* Straw */}
        <rect x="65" y="5" width="8" height="50" fill="#4ade80" transform="rotate(10 69 30)" />
        {/* bubbles */}
        <circle cx="40" cy="40" r="3" fill="white" opacity="0.5" />
        <circle cx="45" cy="60" r="2" fill="white" opacity="0.4" />
    </svg>
);


const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-energetic-gradient bg-400 animate-gradient-fire">
            <div className="relative w-48 h-48">
                <div className="absolute inset-0 animate-morph-and-float" style={{ animationDelay: '0s' }}>
                    <NoodlesIcon />
                </div>
                 <div className="absolute inset-0 animate-morph-and-float" style={{ animationDelay: '2s' }}>
                    <RiceBowlIcon />
                </div>
                <div className="absolute inset-0 animate-morph-and-float" style={{ animationDelay: '4s' }}>
                    <ParottaIcon />
                </div>
                <div className="absolute inset-0 animate-morph-and-float" style={{ animationDelay: '6s' }}>
                    <JuiceIcon />
                </div>
            </div>
            <p className="font-heading text-primary font-bold text-2xl mt-8 animate-sparkle">
                Loading...
            </p>
        </div>
    );
};

export default LoadingScreen;