"use client";

import Link from "next/link";
import { Bell, CheckCheck, Settings2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationSettingsAction,
  type NotificationActionState,
} from "@/features/notifications/actions";
import type { NotificationSettings, NotificationSeverity } from "@/features/notifications/constants";
import RunNotificationChecksButton from "@/features/notifications/components/RunNotificationChecksButton";

export type NotificationDropdownItem = {
  id: string;
  typeLabel: string;
  status: string;
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  severity: NotificationSeverity;
  createdAtLabel: string;
};

export type NotificationDropdownData = {
  unreadCount: number;
  items: NotificationDropdownItem[];
};

type NotificationBellDropdownProps = {
  data: NotificationDropdownData;
  settings: NotificationSettings;
};

const initialState: NotificationActionState = {
  success: false,
  message: null,
  error: null,
};

const severityStyles: Record<NotificationSeverity, string> = {
  info: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-amber-100",
  critical: "bg-rose-50 text-rose-700 ring-rose-100",
};

function SettingsSaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      {pending ? "Saving..." : "Save settings"}
    </button>
  );
}

function CompactToggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
    </label>
  );
}

function NotificationSettingsPanel({ settings }: { settings: NotificationSettings }) {
  const [state, formAction] = useActionState(updateNotificationSettingsAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  return (
    <form action={formAction} className="space-y-4 p-4">
      <div className="grid gap-2">
        <CompactToggle name="expirationReminders" label="Expiring soon" defaultChecked={settings.expirationReminders} />
        <CompactToggle name="expiredItemReminders" label="Expired items" defaultChecked={settings.expiredItemReminders} />
        <CompactToggle name="lowStockReminders" label="Low stock" defaultChecked={settings.lowStockReminders} />
        <CompactToggle name="useTodayAlerts" label="Use today" defaultChecked={settings.useTodayAlerts} />
        <CompactToggle name="mealPlanReminders" label="Meal plan" defaultChecked={settings.mealPlanReminders} />
        <CompactToggle name="shoppingReminders" label="Shopping" defaultChecked={settings.shoppingReminders} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Digest</span>
          <select
            name="digestFrequency"
            defaultValue={settings.digestFrequency}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="off">Off</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Window</span>
          <select
            name="expirationWindowDays"
            defaultValue={settings.expirationWindowDays}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="3">3 days</option>
            <option value="5">5 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Reminder time</span>
        <input
          type="time"
          name="reminderTime"
          defaultValue={settings.reminderTime}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <div className="grid gap-2">
        <CompactToggle name="emailNotifications" label="Email" defaultChecked={settings.emailNotifications} />
        <CompactToggle name="webPushNotifications" label="Web push" defaultChecked={settings.webPushNotifications} />
        <CompactToggle name="expoPushNotifications" label="Expo push" defaultChecked={settings.expoPushNotifications} />
      </div>

      <SettingsSaveButton />
    </form>
  );
}

function NotificationList({ items, onNavigate }: { items: NotificationDropdownItem[]; onNavigate: () => void }) {
  if (items.length === 0) {
    return (
      <div className="p-5 text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-950">No notifications</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Run checks to generate alerts from inventory and plans.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-y-auto">
      {items.map((item) => (
        <article key={item.id} className="border-b border-slate-100 p-4 last:border-b-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${severityStyles[item.severity]}`}>
              {item.typeLabel}
            </span>
            {item.status !== "read" ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Unread
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{item.body}</p>
          <p className="mt-2 text-xs text-slate-400">{item.createdAtLabel}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={item.href}
              onClick={onNavigate}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {item.actionLabel}
            </Link>
            {item.status !== "read" ? (
              <form action={markNotificationReadAction}>
                <input type="hidden" name="notificationId" value={item.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Mark read
                </button>
              </form>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function NotificationBellDropdown({ data, settings }: NotificationBellDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "settings">("alerts");
  const hasUnread = data.unreadCount > 0;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section className="absolute right-0 top-12 z-50 w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Notifications</h2>
                  <p className="text-xs text-slate-500">{data.unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasUnread ? (
                    <form action={markAllNotificationsReadAction}>
                      <button
                        type="submit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        aria-label="Mark all notifications read"
                      >
                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </form>
                  ) : null}
                  <RunNotificationChecksButton />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("alerts")}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${
                    activeTab === "alerts" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Alerts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                    activeTab === "settings" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                  }`}
                >
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                  Settings
                </button>
              </div>
            </div>

            {activeTab === "alerts" ? (
              <NotificationList items={data.items} onNavigate={() => setOpen(false)} />
            ) : (
              <NotificationSettingsPanel settings={settings} />
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
