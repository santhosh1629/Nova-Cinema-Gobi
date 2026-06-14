
import { useContext } from 'react';
import { useAuth as useAuthFromContext } from '../context/AuthContext';

/**
 * @deprecated The actual implementation is in context/AuthContext.tsx.
 * This file is kept for compatibility, but `useAuth` should be imported from `context/AuthContext` directly.
 */
export const useAuth = () => {
    return useAuthFromContext();
}