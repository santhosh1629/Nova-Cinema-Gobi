import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getHomeLink = () => {
      if (!user) return "/";
      switch(user.role) {
          case Role.STUDENT: return "/customer/games";
          case Role.CANTEEN_OWNER: return "/owner/dashboard";
          case Role.ADMIN: return "/admin/dashboard";
          default: return "/";
      }
  }

  return (
    <header className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to={getHomeLink()} className="flex flex-col items-center">
            <span className="font-logo font-black text-primary text-xl tracking-[0.2em] uppercase leading-none">
                NOVA CINEMA
            </span>
            <span className="font-logo font-bold text-white text-[10px] tracking-[0.4em] uppercase mt-1">
                GOBI
            </span>
          </Link>
          <div className="flex items-center gap-6">
            {user && (
              <>
                <span className="text-slate-400 hidden sm:inline text-xs tracking-widest font-medium uppercase">
                  Welcome, <span className="text-white">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="border border-white/10 text-white/70 font-bold px-5 py-2 rounded-full hover:bg-white/5 hover:text-white transition-all duration-500 text-[10px] tracking-widest uppercase"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;