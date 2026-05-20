"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  DASHBOARD_MODE_DESCRIPTIONS,
  DASHBOARD_MODE_LABELS,
  DASHBOARD_MODES,
  type DashboardMode,
} from "@/features/dashboard-mode/constants";
import {
  updateDashboardModeAction,
  type DashboardModeActionState,
} from "@/features/dashboard-mode/actions";

const initialState: DashboardModeActionState = {
  success: false,
  message: null,
  error: null,
};

function ModeSelect({
  selectedMode,
  onSelect,
}: {
  selectedMode: DashboardMode;
  onSelect: (mode: DashboardMode) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <select
      name="mode"
      value={selectedMode}
      disabled={pending}
      onChange={(event) => {
        const mode = event.currentTarget.value as DashboardMode;
        onSelect(mode);
        event.currentTarget.form?.requestSubmit();
      }}
      className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
      aria-label="Dashboard mode"
    >
      {DASHBOARD_MODES.map((mode) => (
        <option key={mode} value={mode}>
          {DASHBOARD_MODE_LABELS[mode]}
        </option>
      ))}
    </select>
  );
}

function SaveStatus() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return <p className="mt-2 text-xs font-medium text-emerald-800">Saving...</p>;
}

export default function DashboardModeSwitcher({ currentMode }: { currentMode: DashboardMode }) {
  const [state, formAction] = useActionState(updateDashboardModeAction, initialState);
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  return (
    <form action={formAction} className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Dashboard mode</p>
      <ModeSelect selectedMode={selectedMode} onSelect={setSelectedMode} />
      <p className="mt-2 text-xs leading-5 text-emerald-800">
        {DASHBOARD_MODE_DESCRIPTIONS[selectedMode]}
      </p>
      <SaveStatus />
    </form>
  );
}
