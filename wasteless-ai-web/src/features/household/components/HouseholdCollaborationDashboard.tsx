import EmptyState from "@/components/dashboard/EmptyState";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  canManageRole,
  HOUSEHOLD_ROLE_DESCRIPTIONS,
} from "@/features/household/constants";
import type { HouseholdCollaborationData } from "@/features/household/services/household.service";
import { formatDate } from "@/lib/dashboard-utils";
import HouseholdSwitcher from "./HouseholdSwitcher";
import InvitationActions from "./InvitationActions";
import InviteMemberForm from "./InviteMemberForm";
import MemberRoleForm from "./MemberRoleForm";

type HouseholdCollaborationDashboardProps = {
  data: HouseholdCollaborationData;
};

const roleStyles = {
  owner: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  admin: "bg-sky-50 text-sky-700 ring-sky-100",
  member: "bg-slate-100 text-slate-700 ring-slate-200",
  guest: "bg-amber-50 text-amber-800 ring-amber-100",
};

export default function HouseholdCollaborationDashboard({ data }: HouseholdCollaborationDashboardProps) {
  const statCards = [
    {
      label: "Members",
      value: data.stats.memberCount,
      description: "People connected to this household",
      marker: "H",
    },
    {
      label: "Pending invites",
      value: data.stats.pendingInvites,
      description: "Invitation links waiting for response",
      marker: "I",
    },
    {
      label: "Shared inventory",
      value: data.stats.sharedInventoryItems,
      description: "Items owned by household members",
      marker: "P",
    },
    {
      label: "Shared tasks",
      value: data.stats.openShoppingItems + data.stats.activeMealPlanItems,
      description: "Open shopping and planned meals",
      marker: "S",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Active household</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">{data.household.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              You are {data.currentUserRole}. Timezone: {data.household.timezone ?? "Not set"}.
            </p>
          </div>
          <HouseholdSwitcher households={data.households} currentHouseholdId={data.household.id} />
        </div>
      </section>

      <section aria-label="Household overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-950">Members</h2>
            <p className="mt-1 text-sm text-slate-500">Roles control collaboration access across shared workflows.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.members.map((member) => {
              const disabled =
                !data.canManageMembers ||
                (member.isCurrentUser && member.role === "owner") ||
                !canManageRole(data.currentUserRole, member.role);

              return (
                <article key={member.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-950">{member.name}</h3>
                        {member.isCurrentUser ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            You
                          </span>
                        ) : null}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleStyles[member.role]}`}>
                          {member.roleLabel}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-500">{member.email}</p>
                      <p className="mt-2 text-xs text-slate-500">{HOUSEHOLD_ROLE_DESCRIPTIONS[member.role]}</p>
                      <p className="mt-2 text-xs text-slate-400">Joined {formatDate(member.joinedAt)}</p>
                    </div>
                    <MemberRoleForm memberId={member.id} role={member.role} disabled={disabled} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          {data.canManageMembers ? <InviteMemberForm householdId={data.household.id} /> : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Shared workspace</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Shopping</p>
                <p className="mt-1 font-semibold text-slate-950">{data.stats.openShoppingItems} open items</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Meal planning</p>
                <p className="mt-1 font-semibold text-slate-950">{data.stats.activeMealPlanItems} planned meals</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Waste tracking</p>
                <p className="mt-1 font-semibold text-slate-950">{data.stats.wasteEvents} logged events</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {data.canManageMembers ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-950">Pending invitations</h2>
            <p className="mt-1 text-sm text-slate-500">Share invite links manually until email delivery is connected.</p>
          </div>
          {data.invitations.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No pending invitations"
                description="Invite an admin, member, or guest to start building shared household workflows."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.invitations.map((invitation) => (
                <article key={invitation.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-all text-sm font-semibold text-slate-950">{invitation.email}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleStyles[invitation.role]}`}>
                          {invitation.roleLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Invited by {invitation.invitedBy}. Expires {formatDate(invitation.expiresAt)}.
                      </p>
                      <code className="mt-2 block truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                        {invitation.inviteUrl}
                      </code>
                    </div>
                    <InvitationActions invitationId={invitation.id} inviteUrl={invitation.inviteUrl} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-950">Recent household activity</h2>
          <p className="mt-1 text-sm text-slate-500">Collaboration events from invitations and role changes.</p>
        </div>
        {data.activity.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No household activity yet"
              description="Invites, role changes, shared inventory events, and meal plan collaboration will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.activity.map((event) => (
              <li key={event.id} className="p-5">
                <p className="text-sm font-semibold text-slate-950">{event.summary}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {event.actorName} - {formatDate(event.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
