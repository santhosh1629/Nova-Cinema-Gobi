import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Typewriter from 'typewriter-effect';

const CopyrightModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-amber-900/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,1)] p-8 text-center max-w-sm w-full animate-pop-in"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-xl font-logo font-bold text-gold tracking-widest uppercase">
                    NOVA CINEMA GOBI
                </p>
                <div className="w-12 h-[1px] bg-primary mx-auto my-4 opacity-50"></div>
                <p className="text-sm text-slate-400 font-medium">
                    EXECUTIVE PRODUCER
                </p>
                <p className="text-lg text-white font-bold tracking-tight">
                    SANTHOSH P.
                </p>
                <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    © 2025 ALL RIGHTS RESERVED
                </p>
                <button 
                    onClick={onClose}
                    className="mt-8 w-full border border-primary/30 text-primary font-bold py-3 px-4 rounded-full hover:bg-primary hover:text-black transition-all duration-500 text-xs tracking-widest uppercase"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [isCopyrightOpen, setIsCopyrightOpen] = useState(false);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden p-4 relative bg-background">
            {/* Elegant Background Gradient */}
            <div className="absolute inset-0 bg-royal-gradient opacity-80 pointer-events-none"></div>
            
            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>

            <button
                onClick={() => setIsCopyrightOpen(true)}
                className="fixed top-6 left-6 z-[100] h-10 w-10 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md text-primary/40 text-sm font-logo flex items-center justify-center transition-all duration-500 hover:scale-110 hover:border-primary hover:text-primary shadow-lg focus:outline-none"
            >
                C
            </button>
            
            <CopyrightModal isOpen={isCopyrightOpen} onClose={() => setIsCopyrightOpen(false)} />
            
            <main className="relative z-20 flex flex-col items-center justify-center text-center w-full max-w-4xl animate-fade-in-up">
                 
                 {/* Premium Logo Header - Width reduced via tighter tracking and increased side padding */}
                 <div className="mb-16 group cursor-default px-14 sm:px-32 max-w-xl mx-auto w-full">
                    <div className="flex flex-col items-center animate-gold-glow">
                        {/* Tracking reduced to 0.12em for a more condensed width */}
                        <h1 className="text-gold font-logo text-7xl sm:text-8xl lg:text-9xl font-black tracking-[0.12em] leading-none uppercase mb-2 ml-[0.12em]">
                            NOVA CINEMA
                        </h1>
                        <div className="flex items-center w-full gap-2 sm:gap-4">
                            <div className="h-[2px] flex-grow bg-gradient-to-r from-transparent to-primary/50"></div>
                            {/* Tracking reduced to 0.3em for GOBI */}
                            <h2 className="text-white font-logo text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[0.3em] uppercase whitespace-nowrap ml-[0.3em]">
                                GOBI
                            </h2>
                            <div className="h-[2px] flex-grow bg-gradient-to-l from-transparent to-primary/50"></div>
                        </div>
                    </div>
                    
                    {/* Sub-tagline with enhanced gold color - Updated text */}
                    <div className="mt-10 flex items-center justify-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(192,192,192,0.8)]"></div>
                        <span className="text-gold font-logo text-xs sm:text-sm tracking-[0.25em] uppercase font-bold drop-shadow-md whitespace-nowrap">
                            Movies, Magic, Memories
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(192,192,192,0.8)]"></div>
                    </div>
                 </div>

                {/* Typewriter Quotes */}
                <div className="h-20 text-center flex items-center justify-center mb-12">
                    <Typewriter
                        options={{
                            strings: [
                                "JUST US. JUST THE SCREEN.",
                                "YOUR PRIVATE CINEMATIC ESCAPE.",
                                "WHERE EVERY FRAME FEELS LIKE HOME.",
                                "RESERVATIONS FOR TWO, MEMORIES FOR LIFE."
                            ],
                            autoStart: true,
                            loop: true,
                            delay: 50,
                            deleteSpeed: 30,
                            wrapperClassName: "text-sm sm:text-base font-medium tracking-[0.25em] text-slate-400 font-sans uppercase italic opacity-80",
                            cursorClassName: "text-primary font-light",
                        }}
                    />
                </div>
                
                {/* Minimal Luxury Buttons - Styled for single screen booking navigation */}
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xs sm:max-w-md px-4 justify-center">
                    <button
                        onClick={() => navigate('/customer/games')}
                        className="group relative flex-1 bg-white text-black font-bold py-4 rounded-full tracking-[0.2em] uppercase text-xs overflow-hidden transition-all duration-500 hover:bg-primary hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                    >
                        <span className="relative z-10">Screens</span>
                    </button>
                </div>
                
                <div className="mt-12 flex flex-col items-center gap-4">
                    <button
                        onClick={() => navigate('/login-owner')}
                        className="text-slate-500 hover:text-primary transition-colors duration-500 text-[10px] font-bold tracking-[0.3em] uppercase"
                    >
                        Partner Entrance
                    </button>
                </div>
            </main>
            
            {/* Atmospheric Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent opacity-40 pointer-events-none"></div>
        </div>
    );
};

export default HomePage;