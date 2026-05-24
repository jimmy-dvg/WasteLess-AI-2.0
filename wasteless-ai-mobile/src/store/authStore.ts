export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export const createEmptyAuthState = (): AuthState => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

export const authStore = {
  getState: createEmptyAuthState,
  signIn: async (): Promise<AuthState> => createEmptyAuthState(),
  signOut: createEmptyAuthState,
};
