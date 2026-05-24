"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  DASHBOARD_MODE_DESCRIPTIONS,
  DASHBOARD_MODE_LABELS,
  DASHBOARD_MODES,
  DASHBOARD_MODE_THEMES,
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
  const theme = DASHBOARD_MODE_THEMES[selectedMode];

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
      className={`mt-2 w-full rounded-lg px-3 py-2 text-sm font-semibold outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${theme.switcherSelectClass}`}
      aria-label="Focus mode"
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

  return <p className="mt-2 text-xs font-medium">Saving...</p>;
}

export default function DashboardModeSwitcher({ currentMode }: { currentMode: DashboardMode }) {
  const [state, formAction] = useActionState(updateDashboardModeAction, initialState);
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  const theme = DASHBOARD_MODE_THEMES[selectedMode];

  return (
    <form action={formAction} className={`rounded-lg border p-4 ${theme.switcherClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-normal ${theme.switcherLabelClass}`}>Focus Mode</p>
      <ModeSelect selectedMode={selectedMode} onSelect={setSelectedMode} />
      <p className={`mt-2 text-xs leading-5 ${theme.switcherDescriptionClass}`}>
        {DASHBOARD_MODE_DESCRIPTIONS[selectedMode]}
      </p>
      <div className={theme.switcherStatusClass}>
        <SaveStatus />
      </div>
    </form>
  );
}
