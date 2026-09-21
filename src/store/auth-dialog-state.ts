import { useState } from 'react';
import type { AdminLoginChallenge } from '../features/auth/api/auth-api';
import { useVerificationRequestState } from '../shared/model/verification-request';
import { useStore } from './context';
import { documentRef } from './types';

export type AuthMode = 'login' | 'registration' | 'password-reset';

export const useAuthDialogState = (initialMode: AuthMode) => {
  const { documents } = useStore();
  const verification = useVerificationRequestState();
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(false);
  const [email, setEmail] = useState('');
  const [adminChallenge, setAdminChallenge] = useState<AdminLoginChallenge | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const refs = documents
    .filter((document) => ['pd-account', 'account-terms'].includes(document.id))
    .map(documentRef);
  const isAdminConfirmation = mode === 'login' && step && adminChallenge !== null;

  const changeMode = (value: AuthMode) => {
    setMode(value);
    setStep(false);
    setAdminChallenge(null);
    setError('');
    verification.reset();
  };
  const resetStep = () => {
    setStep(false);
    setAdminChallenge(null);
    setError('');
    verification.reset();
  };

  return {
    mode,
    step,
    email,
    adminChallenge,
    error,
    busy,
    visible,
    refs,
    isAdminConfirmation,
    verification,
    setStep,
    setEmail,
    setAdminChallenge,
    setError,
    setBusy,
    setVisible,
    changeMode,
    resetStep,
  };
};
