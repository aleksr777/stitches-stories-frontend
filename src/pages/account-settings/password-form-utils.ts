export const getNewPasswords = (form: HTMLFormElement) => {
  const data = new FormData(form);

  return {
    newPassword: String(data.get('newPassword') ?? ''),
    confirm: String(data.get('newPasswordConfirm') ?? ''),
  };
};

export const getPasswordValidationError = (password: string, confirm: string): string | null => {
  if (password.length < 12 || password.length > 100) {
    return 'Password must contain from 12 to 100 characters';
  }

  if (password !== confirm) {
    return 'Passwords do not match';
  }

  return null;
};
