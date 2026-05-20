import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import InvitationResponseButtons from "@/features/household/components/InvitationResponseButtons";
import { getInvitationPreview } from "@/features/household/services/household.service";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dashboard-utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HouseholdInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const user = await requireUser();
  const { token } = await params;
  let preview;

  try {
    preview = await getInvitationPreview(token, user);
  } catch {
    return <ErrorState title="Invitation is unavailable" />;
  }

  if (!preview) notFound();

  const disabled = preview.status !== "pending" || preview.isExpired || !preview.emailMatchesUser;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Household invitation"
        description="Review the household invitation before joining shared workflows."
        action={
          <Link
            href="/dashboard/household"
            className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Household
          </Link>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Invite details</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950">{preview.householdName}</h2>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">Invited email</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-slate-950">{preview.invitedEmail}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">Your email</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-slate-950">{preview.currentUserEmail}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">Role</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-950">{preview.roleLabel}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">Expires</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-950">{formatDate(preview.expiresAt)}</dd>
          </div>
        </dl>

        {!preview.emailMatchesUser ? (
          <ErrorState
            title="This invitation is for a different email"
            description={`Sign in as ${preview.invitedEmail} to accept this household invitation.`}
          />
        ) : null}

        {preview.isExpired ? (
          <div className="mt-5">
            <ErrorState title="Invitation expired" description="Ask the household owner or admin for a new invite." />
          </div>
        ) : null}

        {preview.status !== "pending" ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            This invitation is {preview.status}.
          </div>
        ) : null}

        <div className="mt-6">
          <InvitationResponseButtons token={preview.token} disabled={disabled} />
        </div>
      </section>
    </div>
  );
}
