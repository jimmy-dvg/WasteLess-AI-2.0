import type { Href } from 'expo-router';

export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  inventory: '/inventory',
  scan: '/scan',
  recipes: '/recipes',
  shoppingList: '/shopping-list',
  household: '/household',
  categoriesZones: '/categories-zones',
  mealPlan: '/meal-plan',
  assistant: '/assistant',
  waste: '/waste',
  profile: '/profile',
} as const satisfies Record<string, Href>;
