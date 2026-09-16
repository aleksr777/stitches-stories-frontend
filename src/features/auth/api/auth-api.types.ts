export type LoginDto = {
  email: string;
  password: string;
};

export type RegistrationRequestDto = {
  email: string;
  password: string;
};

export type RegistrationResendDto = {
  email: string;
};

export type RegistrationConfirmDto = {
  code: string;
  email: string;
};

export type PasswordResetRequestDto = {
  email: string;
};

export type PasswordResetConfirmDto = {
  code: string;
  email: string;
  new_password: string;
};

export type MessageResponse = {
  message: string;
};
