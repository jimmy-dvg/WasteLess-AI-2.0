import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getPrimaryHouseholdForUser } from "@/db/queries/households";
import { requireUser } from "@/lib/auth";
import { getAiSettingsForUser } from "@/ai/services/ai-settings";
import AiProviderSettings from "@/features/ai/components/AiProviderSettings";
import HouseholdSettingsForm from "@/features/household/components/HouseholdSettingsForm";
import { canManageHousehold } from "@/features/household/constants";
import { getHouseholdPreferencesForUser } from "@/features/household/services/household-preferences.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  let household;
  let aiSettings;
  let householdPreferences;

  try {
    [household, aiSettings, householdPreferences] = await Promise.all([
      getPrimaryHouseholdForUser(user.id),
      getAiSettingsForUser(user.id),
      getHouseholdPreferencesForUser(user.id),
    ]);
  } catch {
    return <ErrorState title="Settings data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage profile details, account preferences, and household-level defaults."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Profile information</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Name</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{user.name}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Email</dt>
              <dd className="mt-1 break-all text-sm font-semibold text-slate-950">{user.email}</dd>
            </div>
          </dl>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Household</h2>
          {household ? (
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Kitchen</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-950">{household.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Role</dt>
                <dd className="mt-1 text-sm font-semibold capitalize text-slate-950">{household.role}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Timezone</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-950">{household.timezone ?? "Not set"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              A personal household will be created when you add your first inventory or shopping item.
            </p>
          )}
        </aside>
      </div>

      <HouseholdSettingsForm
        preferences={householdPreferences}
        canManage={!household || canManageHousehold(household.role)}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <AiProviderSettings initialSettings={aiSettings} />
      </section>
    </div>
  );
}
