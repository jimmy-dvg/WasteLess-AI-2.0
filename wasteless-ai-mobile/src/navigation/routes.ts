import type { Href } from 'expo-router';

export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  inventory: '/inventory',
  scan: '/scan',
  recipes: '/recipes',
  shoppingList: '/shopping-list',
  profile: '/profile',
} as const satisfies Record<string, Href>;
