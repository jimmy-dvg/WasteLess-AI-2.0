export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/auth/me',
  },
  inventory: {
    list: '/api/inventory',
    create: '/api/inventory',
  },
  recipes: {
    suggestions: '/api/recipes/suggestions',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
