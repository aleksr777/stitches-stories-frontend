import type { PropsWithChildren } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';
import { useAuthActions } from './use-auth-actions';
import { useAuthSession } from './use-auth-session';

const AuthProvider = ({ children }: PropsWithChildren) => {
  const session = useAuthSession();
  const actions = useAuthActions(session);
  const value: AuthContextValue = {
    isAuth: session.isAuth,
    isInitializing: session.isInitializing,
    isEndingSession: session.isEndingSession,
    role: session.role,
    ...actions,
    endSession: session.endSession,
    clearSession: session.endSession,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
