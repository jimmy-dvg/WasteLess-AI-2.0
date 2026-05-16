import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getPrimaryHouseholdForUser } from "@/db/queries/households";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  let household;

  try {
    household = await getPrimaryHouseholdForUser(user.id);
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

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Account settings</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
              <span>
                <span className="block text-sm font-semibold text-slate-950">Expiration reminders</span>
                <span className="block text-sm text-slate-500">Notify when items are close to expiring.</span>
              </span>
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
              <span>
                <span className="block text-sm font-semibold text-slate-950">Weekly waste digest</span>
                <span className="block text-sm text-slate-500">Summarize waste patterns and savings opportunities.</span>
              </span>
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
            </label>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Household settings</h2>
          <div className="mt-4 grid gap-3">
            <label>
              <span className="text-xs font-semibold text-slate-600">Default storage location</span>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option>Pantry</option>
                <option>Fridge</option>
                <option>Freezer</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-600">Shopping cadence</span>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option>Weekly</option>
                <option>Every 2 weeks</option>
                <option>As needed</option>
              </select>
            </label>
          </div>
        </article>
      </section>
    </div>
  );
}
