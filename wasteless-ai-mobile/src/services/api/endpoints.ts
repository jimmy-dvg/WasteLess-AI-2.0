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
  household: {
    detail: '/api/household',
  },
  categories: {
    list: '/api/categories',
    create: '/api/categories',
    item: (id: string) => `/api/categories/${encodeURIComponent(id)}`,
    suggest: '/api/categories/suggest',
  },
  mealPlan: {
    detail: '/api/meal-plan',
    save: '/api/meal-plan/save',
    shoppingItems: '/api/meal-plan/shopping-items',
    item: (id: string) => `/api/meal-plan/items/${encodeURIComponent(id)}`,
  },
  assistant: {
    chat: '/api/assistant/chat',
  },
  waste: {
    detail: '/api/waste',
    create: '/api/waste',
  },
  scanner: {
    product: '/api/scanning/photo/analyze',
    receipt: '/api/scanning/receipt/ocr',
  },
  recipes: {
    list: '/api/recipes',
    generate: '/api/recipes/generate',
    detail: (id: string) => `/api/recipes/${encodeURIComponent(id)}`,
    favorite: (id: string) => `/api/recipes/${encodeURIComponent(id)}/favorite`,
  },
  shoppingList: {
    list: '/api/shopping-list',
    create: '/api/shopping-list',
    item: (id: string) => `/api/shopping-list/${encodeURIComponent(id)}`,
    clearChecked: '/api/shopping-list/clear-checked',
    generate: '/api/shopping-list/generate',
  },
  notifications: {
    preferences: '/api/notifications/preferences',
    pushToken: '/api/notifications/push-token',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
