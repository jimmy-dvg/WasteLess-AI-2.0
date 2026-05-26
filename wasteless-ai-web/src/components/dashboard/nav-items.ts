import {
  Bot,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Home,
  Leaf,
  ScanBarcode,
  Settings,
  ShoppingBasket,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: ClipboardList,
  },
  {
    label: "Household",
    href: "/dashboard/household",
    icon: Users,
  },
  {
    label: "Scanner",
    href: "/dashboard/scanning",
    icon: ScanBarcode,
  },
  {
    label: "Categories & Zones",
    href: "/dashboard/categories",
    icon: Tags,
  },
  {
    label: "Shopping List",
    href: "/dashboard/shopping",
    icon: ShoppingBasket,
  },
  {
    label: "Meal Plan",
    href: "/dashboard/meal-plan",
    icon: CalendarDays,
  },
  {
    label: "AI Assistant",
    href: "/dashboard/assistant",
    icon: Bot,
  },
  {
    label: "Waste",
    href: "/dashboard/waste",
    icon: Leaf,
  },
  {
    label: "Recipes",
    href: "/dashboard/recipes",
    icon: ChefHat,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
] satisfies DashboardNavItem[];
