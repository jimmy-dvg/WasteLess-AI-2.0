export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

export type AuthFormResult = {
  success: boolean;
  error?: string;
};
