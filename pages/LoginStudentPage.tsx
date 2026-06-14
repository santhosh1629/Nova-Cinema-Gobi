import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import DynamicBackground from '../components/student/DynamicBackground';

declare const gsap: any;

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);


const LoginCustomerPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof gsap === 'undefined') return;
    gsap.from(cardRef.current, {
      duration: 0.8,
      opacity: 0,
      scale: 0.9,
      y: 50,
      ease: 'power3.out',
      delay: 0.2
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(phone, password);
      if (user.role === Role.STUDENT) {
        navigate('/customer/welcome'); 
      } else {
        setError('Access denied. This portal is for customers only.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <DynamicBackground />
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <div ref={cardRef} className="relative max-w-md w-full bg-surface/50 backdrop-blur-xl border border-surface-light rounded-2xl shadow-2xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-textPrimary font-heading">Customer Login</h1>
          <p className="text-textSecondary/80 mt-2">Let's get you some food!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div>
            <label className="block text-textSecondary font-semibold mb-2" htmlFor="phone">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border-b-2 border-white/20 text-textPrimary rounded-lg focus:outline-none focus:border-primary transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(245,158,11,0.6)]"
              placeholder="e.g., 9876543210"
              required
            />
          </div>
          <div>
            <label className="block text-textSecondary font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-black/30 border-b-2 border-white/20 text-textPrimary rounded-lg focus:outline-none focus:border-primary transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                placeholder="Enter your password"
                required
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-textSecondary/70 hover:text-textSecondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
          </div>
           <div className="text-right text-xs -mt-4">
            <Link to="/forgot-password" className="text-textSecondary/70 hover:underline">Forgot Password?</Link>
          </div>
          
          {error && <p className="text-red-400 text-sm text-center !-mt-2">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="btn-3d w-full bg-primary border-primary-dark text-background font-black font-heading py-3 px-4 rounded-lg shadow-lg transition-transform hover:-translate-y-1 hover:shadow-primary/40 hover:shadow-2xl disabled:bg-primary/50 disabled:border-primary-dark/50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
            <p><Link to="/register-customer" className="text-sm text-primary/90 hover:text-primary font-bold font-heading transition-colors">Don't have an account? Sign Up</Link></p>
            <p><Link to="/login-owner" className="text-sm text-textSecondary/60 hover:text-textSecondary/80 font-medium transition-colors">Are you a cinema partner?</Link></p>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginCustomerPage;