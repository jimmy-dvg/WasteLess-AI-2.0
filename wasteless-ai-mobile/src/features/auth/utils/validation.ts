const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginFormErrors = {
  email?: string;
  password?: string;
};

export type RegisterFormErrors = LoginFormErrors & {
  name?: string;
};

export function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function validateRegisterForm(
  name: string,
  email: string,
  password: string,
): RegisterFormErrors {
  const errors: RegisterFormErrors = validateLoginForm(email, password);
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = 'Name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (password && password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

export function hasFormErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}
