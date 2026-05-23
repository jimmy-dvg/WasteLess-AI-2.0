import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardModeSwitcher from "@/components/dashboard/DashboardModeSwitcher";
import type { NotificationDropdownData } from "@/components/dashboard/NotificationBellDropdown";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import FloatingAssistantChat from "@/features/assistant/components/FloatingAssistantChat";
import { getAssistantPageData } from "@/features/assistant/services/assistant.service";
import type { AssistantContextSummary } from "@/features/assistant/types";
import { DEFAULT_DASHBOARD_MODE, type DashboardMode } from "@/features/dashboard-mode/constants";
import { getDashboardModeForUser } from "@/features/dashboard-mode/services/dashboard-mode.service";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/features/notifications/constants";
import {
  getNotificationCenterData,
  getNotificationSettingsForUser,
} from "@/features/notifications/services/notification.service";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dashboard-utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  let notifications: NotificationDropdownData = {
    unreadCount: 0,
    items: [],
  };
  let notificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
  let dashboardMode: DashboardMode = DEFAULT_DASHBOARD_MODE;
  let assistantContextSummary: AssistantContextSummary | null = null;

  try {
    const [notificationData, settingsData, mode] = await Promise.all([
      getNotificationCenterData(user.id),
      getNotificationSettingsForUser(user.id),
      getDashboardModeForUser(user.id),
    ]);

    notifications = {
      unreadCount: notificationData.unreadCount,
      items: notificationData.items.slice(0, 8).map((item) => ({
        id: item.id,
        typeLabel: item.typeLabel,
        status: item.status,
        title: item.title,
        body: item.body,
        href: item.href,
        actionLabel: item.actionLabel,
        severity: item.severity,
        createdAtLabel: formatDate(item.createdAt),
      })),
    };
    notificationSettings = settingsData.settings;
    dashboardMode = mode;
  } catch {
    notifications = {
      unreadCount: 0,
      items: [],
    };
    notificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
    dashboardMode = DEFAULT_DASHBOARD_MODE;
  }

  try {
    assistantContextSummary = await getAssistantPageData(user);
  } catch {
    assistantContextSummary = null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <div className="mb-8">
          <Link href="/" className="text-lg font-bold text-slate-950">
            WasteLessAI
          </Link>
          <p className="mt-1 text-sm text-slate-500">Smart household waste control</p>
        </div>
        <DashboardSidebar />
        <div className="mt-auto">
          <DashboardModeSwitcher key={dashboardMode} currentMode={dashboardMode} />
        </div>
      </aside>
      <div className="lg:pl-72">
        <DashboardHeader
          user={user}
          notifications={notifications}
          notificationSettings={notificationSettings}
          dashboardMode={dashboardMode}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <FloatingAssistantChat initialContextSummary={assistantContextSummary} />
    </div>
  );
}
