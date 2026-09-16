export const getNewPasswords = (form: HTMLFormElement) => {
  const data = new FormData(form);

  return {
    newPassword: String(data.get('newPassword') ?? ''),
    confirm: String(data.get('newPasswordConfirm') ?? ''),
  };
};

export const getPasswordValidationError = (password: string, confirm: string): string | null => {
  if (password.length < 12 || password.length > 100) {
    return 'Пароль должен содержать от 12 до 100 символов';
  }

  if (password !== confirm) {
    return 'Пароли не совпадают';
  }

  return null;
};
