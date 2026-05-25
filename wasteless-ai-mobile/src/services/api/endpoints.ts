export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  inventory: {
    list: '/api/inventory',
    create: '/api/inventory',
    item: (id: string) => `/api/inventory/${encodeURIComponent(id)}`,
  },
  scanner: {
    product: '/api/scanning/photo/analyze',
    receipt: '/api/scanning/receipt/ocr',
  },
  recipes: {
    suggestions: '/api/recipes/suggestions',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
