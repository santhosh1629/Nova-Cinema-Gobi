import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../types';
import { Role } from '../types';
import { supabase } from '../services/supabaseClient';

export interface PhoneLoginModalInfo {
  isOpen: boolean;
  onSuccess?: () => void;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<User>;
  register: (name: string, phone: string, password: string) => Promise<User>;
  registerOwner: (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string) => Promise<User>;
  registerStaffUser: (name: string, phone: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  requestPasswordReset: (phone: string) => Promise<{ message: string }>;
  verifyOtpAndResetPassword: (phone: string, otp: string, newPassword: string) => Promise<{ message: string }>;
  promptForPhone: (onSuccess?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PhoneLoginModal: React.FC<{ onLogin: (phone: string) => Promise<void>, onClose: () => void }> = ({ onLogin, onClose }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onLogin(phone);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in-down">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-1 rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="bg-gray-900 rounded-xl p-8 text-center relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold font-heading text-white mb-2">Login / Sign Up</h2>
                <p className="text-gray-400 mb-6">Enter phone number to continue.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-center px-4 py-3 bg-black/30 border-b-2 border-white/20 text-white rounded-lg focus:outline-none focus:border-indigo-500 transition-all placeholder:text-white/40"
                    placeholder="10-digit phone number"
                    required
                    autoFocus
                  />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg transition-colors hover:bg-indigo-700 disabled:bg-indigo-500/50">
                      {isLoading ? 'Verifying...' : 'Continue'}
                  </button>
                </form>
            </div>
        </div>
    </div>
  );
};

const EMPTY_FN = () => {};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState<PhoneLoginModalInfo>({ isOpen: false });

  // Helper to map DB profile to App User type
  const mapProfileToUser = (profile: any): User => {
    return {
      ...profile,
      approvalStatus: profile.approval_status,
      canteenName: profile.canteen_name,
      idProofUrl: profile.id_proof_url,
      profileImageUrl: profile.profile_image_url
    };
  };

  // Initialize from LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('app_session_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setLoading(false);
  }, []);

  const loginOrRegisterWithPhone = useCallback(async (phone: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
        if (error.message?.includes('fetch') || error.message?.includes('Network')) {
            const demoStudent: User = {
                id: 'demo-student-id',
                username: `Demo Student ${phone.slice(-4)}`,
                phone: phone,
                role: Role.STUDENT,
                approvalStatus: 'approved',
                loyaltyPoints: 100
            };
            setUser(demoStudent);
            localStorage.setItem('app_session_user', JSON.stringify(demoStudent));
            setModalInfo({ isOpen: false });
            if (modalInfo.onSuccess) modalInfo.onSuccess();
            return;
        }
        throw error;
    }

    if (profile) {
      const userData = mapProfileToUser(profile);
      setUser(userData);
      localStorage.setItem('app_session_user', JSON.stringify(userData));
    } else {
      const newId = crypto.randomUUID();
      const newProfileData = {
        id: newId,
        username: `Customer ${phone.slice(-4)}`,
        phone: phone,
        role: Role.STUDENT,
        approval_status: 'approved',
        loyalty_points: 0
      };

      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfileData])
        .select()
        .single();

      if (insertError) throw insertError;
      const userData = mapProfileToUser(data);
      setUser(userData);
      localStorage.setItem('app_session_user', JSON.stringify(userData));
    }
    
    setModalInfo({ isOpen: false });
    if (modalInfo.onSuccess) modalInfo.onSuccess();
  }, [modalInfo.onSuccess]);

  const login = useCallback(async (phoneOrEmail: string, password: string): Promise<User> => {
    let query = supabase.from('profiles').select('*');
    
    if (phoneOrEmail.includes('@')) {
      query = query.eq('email', phoneOrEmail);
    } else {
      query = query.eq('phone', phoneOrEmail);
    }

    const { data: profile, error } = await query.eq('password', password).maybeSingle();

    if (error) {
      console.error("Database Login Error:", error);
      // If it's a network error, allow demo login for specific credentials
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
          if (phoneOrEmail === '9876543210' && password === 'demo123') {
              const demoUser: User = {
                  id: 'demo-id',
                  username: 'Demo Owner',
                  role: Role.CANTEEN_OWNER,
                  phone: '9876543210',
                  approvalStatus: 'approved',
                  canteenName: 'Nova Cinema Gobi Demo'
              };
              setUser(demoUser);
              localStorage.setItem('app_session_user', JSON.stringify(demoUser));
              return demoUser;
          }
          throw new Error("Network error. Please check your connection or try Demo Login (9876543210 / demo123).");
      }
      throw new Error(`Database error: ${error.message}.`);
    }

    if (!profile) {
      const { data: userExists } = await supabase
        .from('profiles')
        .select('id')
        .or(`phone.eq.${phoneOrEmail},email.eq.${phoneOrEmail}`)
        .maybeSingle();

      if (userExists) {
        throw new Error("Incorrect password. Please try again.");
      } else {
        throw new Error("User account not found. Please register first.");
      }
    }

    const userData = mapProfileToUser(profile);
    setUser(userData);
    localStorage.setItem('app_session_user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const newId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: newId,
        username: name,
        phone,
        password,
        role: Role.STUDENT,
        approval_status: 'approved'
      }])
      .select()
      .single();

    if (error) throw error;
    const userData = mapProfileToUser(data);
    setUser(userData);
    localStorage.setItem('app_session_user', JSON.stringify(userData));
    return userData;
  }, []);

  const registerOwner = useCallback(async (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string): Promise<User> => {
    const newId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: newId,
        username: name,
        email,
        phone,
        password,
        role: Role.CANTEEN_OWNER,
        canteen_name: canteenName,
        id_proof_url: idProofUrl,
        approval_status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return mapProfileToUser(data);
  }, []);

  const registerStaffUser = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const newId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: newId,
        username: name,
        phone,
        password,
        role: Role.CANTEEN_OWNER,
        approval_status: 'approved'
      }])
      .select()
      .single();

    if (error) throw error;
    return mapProfileToUser(data);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('app_session_user');
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    
    // Map camelCase back to snake_case for DB update if necessary
    const dbUpdate: any = { ...data };
    if (data.approvalStatus) dbUpdate.approval_status = data.approvalStatus;
    if (data.canteenName) dbUpdate.canteen_name = data.canteenName;
    if (data.idProofUrl) dbUpdate.id_proof_url = data.idProofUrl;
    
    const { error } = await supabase.from('profiles').update(dbUpdate).eq('id', user.id);
    if (error) throw error;
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('app_session_user', JSON.stringify(updatedUser));
  }, [user]);

  const promptForPhone = useCallback((onSuccess?: () => void) => {
    setModalInfo(prev => {
      // Avoid re-triggering if already open with same success handler
      if (prev.isOpen && !onSuccess) return prev;
      return {
        isOpen: true,
        onSuccess: onSuccess || EMPTY_FN
      };
    });
  }, []);

  const requestPasswordReset = useCallback(async () => ({ message: 'Contact admin' }), []);
  const verifyOtpAndResetPassword = useCallback(async () => ({ message: 'Contact admin' }), []);

  const authContextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    registerOwner,
    registerStaffUser,
    logout,
    updateUser,
    requestPasswordReset,
    verifyOtpAndResetPassword,
    promptForPhone
  }), [user, loading, login, register, registerOwner, registerStaffUser, logout, updateUser, requestPasswordReset, verifyOtpAndResetPassword, promptForPhone]);

  const handleModalClose = useCallback(() => setModalInfo({ isOpen: false }), []);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      {modalInfo.isOpen && <PhoneLoginModal onLogin={loginOrRegisterWithPhone} onClose={handleModalClose} />}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
