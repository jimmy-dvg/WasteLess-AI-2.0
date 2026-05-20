import "server-only";

import { randomBytes } from "crypto";
import { db } from "@/db";
import {
  ensurePersonalHouseholdForUser,
  getHouseholdsForUser,
  type DashboardUser,
  type UserHousehold,
} from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { formatDate, parseJsonValue } from "@/lib/dashboard-utils";
import {
  canManageHousehold,
  canManageRole,
  HOUSEHOLD_ROLE_LABELS,
  type HouseholdRole,
} from "@/features/household/constants";
import { and, asc, count, desc, eq, inArray, isNull, or } from "drizzle-orm";

const INVITATION_DAYS = 7;

export type HouseholdMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: HouseholdRole;
  roleLabel: string;
  joinedAt: Date;
  lastActiveAt: Date | null;
  isCurrentUser: boolean;
};

export type HouseholdInvitation = {
  id: string;
  email: string;
  role: HouseholdRole;
  roleLabel: string;
  status: string;
  inviteUrl: string;
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
};

export type HouseholdActivityEvent = {
  id: string;
  actorName: string;
  eventType: string;
  summary: string;
  createdAt: Date;
};

export type HouseholdCollaborationData = {
  household: UserHousehold;
  households: UserHousehold[];
  currentUserRole: HouseholdRole;
  canManageMembers: boolean;
  members: HouseholdMember[];
  invitations: HouseholdInvitation[];
  activity: HouseholdActivityEvent[];
  stats: {
    memberCount: number;
    pendingInvites: number;
    sharedInventoryItems: number;
    openShoppingItems: number;
    activeMealPlanItems: number;
    wasteEvents: number;
  };
};

export type InvitationPreview = {
  token: string;
  householdName: string;
  invitedEmail: string;
  role: HouseholdRole;
  roleLabel: string;
  status: string;
  expiresAt: Date;
  isExpired: boolean;
  emailMatchesUser: boolean;
  currentUserEmail: string;
};

type ActivityInput = {
  householdId: string;
  actorUserId?: string | null;
  eventType: string;
  objectType?: string | null;
  objectId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRoleLabel(role: string): string {
  return HOUSEHOLD_ROLE_LABELS[role as HouseholdRole] ?? "Member";
}

function asHouseholdRole(role: string): HouseholdRole {
  if (role === "owner" || role === "admin" || role === "guest") return role;
  return "member";
}

function buildInviteUrl(token: string) {
  return `/dashboard/household/invite/${token}`;
}

async function getUserMeta(userId: string) {
  const rows = await db.select({ meta: schema.users.meta }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return parseJsonValue<Record<string, unknown>>(rows[0]?.meta ?? {}, {});
}

async function setActiveHouseholdMeta(userId: string, householdId: string) {
  const meta = await getUserMeta(userId);

  await db
    .update(schema.users)
    .set({
      meta: {
        ...meta,
        activeHouseholdId: householdId,
      },
      updated_at: new Date(),
    })
    .where(eq(schema.users.id, userId));
}

async function getMembership(userId: string, householdId: string) {
  const rows = await db
    .select({
      id: schema.household_members.id,
      role: schema.household_members.role,
      userId: schema.household_members.user_id,
      householdId: schema.household_members.household_id,
    })
    .from(schema.household_members)
    .where(and(eq(schema.household_members.user_id, userId), eq(schema.household_members.household_id, householdId)))
    .limit(1);

  return rows[0] ?? null;
}

async function requireHouseholdManager(userId: string, householdId: string) {
  const membership = await getMembership(userId, householdId);
  if (!membership || !canManageHousehold(membership.role)) {
    throw new Error("You do not have permission to manage this household");
  }

  return {
    ...membership,
    role: asHouseholdRole(membership.role),
  };
}

async function getOwnerCount(householdId: string) {
  const rows = await db
    .select({ value: count() })
    .from(schema.household_members)
    .where(and(eq(schema.household_members.household_id, householdId), eq(schema.household_members.role, "owner")));

  return Number(rows[0]?.value ?? 0);
}

export async function recordHouseholdActivity(input: ActivityInput) {
  await db.insert(schema.household_activity_events).values({
    household_id: input.householdId,
    actor_user_id: input.actorUserId ?? null,
    event_type: input.eventType,
    object_type: input.objectType ?? null,
    object_id: input.objectId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });
}

export async function getHouseholdCollaborationData(user: DashboardUser): Promise<HouseholdCollaborationData> {
  const household = await ensurePersonalHouseholdForUser(user);
  const households = await getHouseholdsForUser(user.id);
  const currentUserRole = asHouseholdRole(household.role);
  const canManageMembers = canManageHousehold(currentUserRole);

  const [memberRows, invitationRows, activityRows] = await Promise.all([
    db
      .select({
        id: schema.household_members.id,
        userId: schema.household_members.user_id,
        role: schema.household_members.role,
        joinedAt: schema.household_members.joined_at,
        lastActiveAt: schema.household_members.last_active_at,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.household_members)
      .innerJoin(schema.users, eq(schema.household_members.user_id, schema.users.id))
      .where(eq(schema.household_members.household_id, household.id))
      .orderBy(asc(schema.household_members.role), asc(schema.users.name)),
    db
      .select({
        id: schema.household_invitations.id,
        email: schema.household_invitations.email,
        role: schema.household_invitations.role,
        status: schema.household_invitations.status,
        token: schema.household_invitations.token,
        expiresAt: schema.household_invitations.expires_at,
        createdAt: schema.household_invitations.created_at,
        invitedByName: schema.users.name,
      })
      .from(schema.household_invitations)
      .leftJoin(schema.users, eq(schema.household_invitations.invited_by, schema.users.id))
      .where(and(eq(schema.household_invitations.household_id, household.id), eq(schema.household_invitations.status, "pending")))
      .orderBy(desc(schema.household_invitations.created_at)),
    db
      .select({
        id: schema.household_activity_events.id,
        eventType: schema.household_activity_events.event_type,
        summary: schema.household_activity_events.summary,
        createdAt: schema.household_activity_events.created_at,
        actorName: schema.users.name,
      })
      .from(schema.household_activity_events)
      .leftJoin(schema.users, eq(schema.household_activity_events.actor_user_id, schema.users.id))
      .where(eq(schema.household_activity_events.household_id, household.id))
      .orderBy(desc(schema.household_activity_events.created_at))
      .limit(12),
  ]);

  const memberUserIds = memberRows.map((member) => member.userId);
  const sharedProductCondition =
    memberUserIds.length > 0
      ? or(
          eq(schema.products.household_id, household.id),
          and(isNull(schema.products.household_id), inArray(schema.products.user_id, memberUserIds))
        )!
      : eq(schema.products.household_id, household.id);
  const [inventoryRows, shoppingRows, mealRows, wasteRows] = await Promise.all([
    db.select({ value: count() }).from(schema.products).where(sharedProductCondition),
    db
      .select({ value: count() })
      .from(schema.shopping_list_items)
      .innerJoin(schema.shopping_lists, eq(schema.shopping_list_items.shopping_list_id, schema.shopping_lists.id))
      .where(and(eq(schema.shopping_lists.household_id, household.id), eq(schema.shopping_list_items.checked, false))),
    db
      .select({ value: count() })
      .from(schema.meal_plan_items)
      .innerJoin(schema.meal_plans, eq(schema.meal_plan_items.meal_plan_id, schema.meal_plans.id))
      .where(and(eq(schema.meal_plans.household_id, household.id), eq(schema.meal_plan_items.status, "planned"))),
    db
      .select({ value: count() })
      .from(schema.waste_logs)
      .where(eq(schema.waste_logs.household_id, household.id)),
  ]);

  return {
    household,
    households,
    currentUserRole,
    canManageMembers,
    members: memberRows.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.name,
      email: member.email,
      role: asHouseholdRole(member.role),
      roleLabel: getRoleLabel(member.role),
      joinedAt: member.joinedAt,
      lastActiveAt: member.lastActiveAt ?? null,
      isCurrentUser: member.userId === user.id,
    })),
    invitations: invitationRows.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: asHouseholdRole(invitation.role),
      roleLabel: getRoleLabel(invitation.role),
      status: invitation.status,
      inviteUrl: buildInviteUrl(invitation.token),
      invitedBy: invitation.invitedByName ?? "Unknown",
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })),
    activity: activityRows.map((event) => ({
      id: event.id,
      actorName: event.actorName ?? "System",
      eventType: event.eventType,
      summary: event.summary,
      createdAt: event.createdAt,
    })),
    stats: {
      memberCount: memberRows.length,
      pendingInvites: invitationRows.length,
      sharedInventoryItems: Number(inventoryRows[0]?.value ?? 0),
      openShoppingItems: Number(shoppingRows[0]?.value ?? 0),
      activeMealPlanItems: Number(mealRows[0]?.value ?? 0),
      wasteEvents: Number(wasteRows[0]?.value ?? 0),
    },
  };
}

export async function inviteHouseholdMember(input: {
  actor: DashboardUser;
  householdId: string;
  email: string;
  role: HouseholdRole;
}) {
  const actorMembership = await requireHouseholdManager(input.actor.id, input.householdId);
  if (!canManageRole(actorMembership.role, input.role)) {
    throw new Error("You cannot invite a collaborator with that role");
  }

  const email = normalizeEmail(input.email);
  const userRows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const existingUser = userRows[0] ?? null;

  if (existingUser) {
    const existingMember = await getMembership(existingUser.id, input.householdId);
    if (existingMember) throw new Error("That user is already in this household");
  }

  const token = generateInviteToken();
  const expiresAt = addDays(new Date(), INVITATION_DAYS);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.household_invitations)
      .set({
        status: "revoked",
        updated_at: new Date(),
      })
      .where(
        and(
          eq(schema.household_invitations.household_id, input.householdId),
          eq(schema.household_invitations.email, email),
          eq(schema.household_invitations.status, "pending")
        )
      );

    const invitations = await tx
      .insert(schema.household_invitations)
      .values({
        household_id: input.householdId,
        email,
        role: input.role,
        token,
        status: "pending",
        invited_by: input.actor.id,
        expires_at: expiresAt,
        metadata: {
          delivery: "link",
        },
      })
      .returning({ id: schema.household_invitations.id });

    await tx.insert(schema.household_activity_events).values({
      household_id: input.householdId,
      actor_user_id: input.actor.id,
      event_type: "invitation_created",
      object_type: "household_invitation",
      object_id: invitations[0]?.id ?? null,
      summary: `${input.actor.name} invited ${email} as ${getRoleLabel(input.role)}.`,
      metadata: { email, role: input.role },
    });
  });

  return {
    email,
    inviteUrl: buildInviteUrl(token),
    expiresAt,
  };
}

export async function revokeHouseholdInvitation(input: {
  actor: DashboardUser;
  invitationId: string;
}) {
  const rows = await db
    .select({
      id: schema.household_invitations.id,
      householdId: schema.household_invitations.household_id,
      email: schema.household_invitations.email,
      status: schema.household_invitations.status,
    })
    .from(schema.household_invitations)
    .where(eq(schema.household_invitations.id, input.invitationId))
    .limit(1);

  const invitation = rows[0];
  if (!invitation) throw new Error("Invitation not found");
  await requireHouseholdManager(input.actor.id, invitation.householdId);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.household_invitations)
      .set({
        status: "revoked",
        updated_at: new Date(),
      })
      .where(eq(schema.household_invitations.id, invitation.id));

    await tx.insert(schema.household_activity_events).values({
      household_id: invitation.householdId,
      actor_user_id: input.actor.id,
      event_type: "invitation_revoked",
      object_type: "household_invitation",
      object_id: invitation.id,
      summary: `${input.actor.name} revoked the invitation for ${invitation.email}.`,
      metadata: { email: invitation.email },
    });
  });
}

export async function updateHouseholdMemberRole(input: {
  actor: DashboardUser;
  memberId: string;
  role: HouseholdRole;
}) {
  const rows = await db
    .select({
      id: schema.household_members.id,
      userId: schema.household_members.user_id,
      householdId: schema.household_members.household_id,
      currentRole: schema.household_members.role,
      targetName: schema.users.name,
    })
    .from(schema.household_members)
    .innerJoin(schema.users, eq(schema.household_members.user_id, schema.users.id))
    .where(eq(schema.household_members.id, input.memberId))
    .limit(1);

  const member = rows[0];
  if (!member) throw new Error("Household member not found");

  const actorMembership = await requireHouseholdManager(input.actor.id, member.householdId);
  if (!canManageRole(actorMembership.role, member.currentRole) || !canManageRole(actorMembership.role, input.role)) {
    throw new Error("You cannot manage that household role");
  }

  if (member.userId === input.actor.id && member.currentRole === "owner" && input.role !== "owner") {
    throw new Error("Owners cannot demote themselves");
  }

  if (member.currentRole === "owner" && input.role !== "owner" && (await getOwnerCount(member.householdId)) <= 1) {
    throw new Error("A household must keep at least one owner");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.household_members)
      .set({
        role: input.role,
        updated_at: new Date(),
      })
      .where(eq(schema.household_members.id, member.id));

    await tx.insert(schema.household_activity_events).values({
      household_id: member.householdId,
      actor_user_id: input.actor.id,
      event_type: "member_role_updated",
      object_type: "household_member",
      object_id: member.id,
      summary: `${input.actor.name} changed ${member.targetName}'s role to ${getRoleLabel(input.role)}.`,
      metadata: { previousRole: member.currentRole, nextRole: input.role },
    });
  });
}

export async function removeHouseholdMember(input: {
  actor: DashboardUser;
  memberId: string;
}) {
  const rows = await db
    .select({
      id: schema.household_members.id,
      userId: schema.household_members.user_id,
      householdId: schema.household_members.household_id,
      role: schema.household_members.role,
      targetName: schema.users.name,
    })
    .from(schema.household_members)
    .innerJoin(schema.users, eq(schema.household_members.user_id, schema.users.id))
    .where(eq(schema.household_members.id, input.memberId))
    .limit(1);

  const member = rows[0];
  if (!member) throw new Error("Household member not found");

  const actorMembership = await requireHouseholdManager(input.actor.id, member.householdId);
  if (!canManageRole(actorMembership.role, member.role)) {
    throw new Error("You cannot remove that household member");
  }

  if (member.role === "owner" && (await getOwnerCount(member.householdId)) <= 1) {
    throw new Error("A household must keep at least one owner");
  }

  await db.transaction(async (tx) => {
    await tx.delete(schema.household_members).where(eq(schema.household_members.id, member.id));

    await tx.insert(schema.household_activity_events).values({
      household_id: member.householdId,
      actor_user_id: input.actor.id,
      event_type: "member_removed",
      object_type: "household_member",
      object_id: member.id,
      summary: `${input.actor.name} removed ${member.targetName} from the household.`,
      metadata: { removedUserId: member.userId, role: member.role },
    });
  });
}

export async function switchActiveHouseholdForUser(userId: string, householdId: string) {
  const membership = await getMembership(userId, householdId);
  if (!membership) throw new Error("Household not found");

  await setActiveHouseholdMeta(userId, householdId);
  return householdId;
}

export async function getInvitationPreview(token: string, user: DashboardUser): Promise<InvitationPreview | null> {
  const rows = await db
    .select({
      token: schema.household_invitations.token,
      email: schema.household_invitations.email,
      role: schema.household_invitations.role,
      status: schema.household_invitations.status,
      expiresAt: schema.household_invitations.expires_at,
      householdName: schema.households.name,
    })
    .from(schema.household_invitations)
    .innerJoin(schema.households, eq(schema.household_invitations.household_id, schema.households.id))
    .where(eq(schema.household_invitations.token, token))
    .limit(1);

  const invitation = rows[0];
  if (!invitation) return null;

  const isExpired = invitation.expiresAt.getTime() < Date.now();

  return {
    token: invitation.token,
    householdName: invitation.householdName,
    invitedEmail: invitation.email,
    role: asHouseholdRole(invitation.role),
    roleLabel: getRoleLabel(invitation.role),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    isExpired,
    emailMatchesUser: normalizeEmail(user.email) === normalizeEmail(invitation.email),
    currentUserEmail: user.email,
  };
}

export async function acceptHouseholdInvitation(input: {
  user: DashboardUser;
  token: string;
}) {
  const rows = await db
    .select({
      id: schema.household_invitations.id,
      householdId: schema.household_invitations.household_id,
      householdName: schema.households.name,
      email: schema.household_invitations.email,
      role: schema.household_invitations.role,
      status: schema.household_invitations.status,
      expiresAt: schema.household_invitations.expires_at,
    })
    .from(schema.household_invitations)
    .innerJoin(schema.households, eq(schema.household_invitations.household_id, schema.households.id))
    .where(eq(schema.household_invitations.token, input.token))
    .limit(1);

  const invitation = rows[0];
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") throw new Error("This invitation is no longer active");
  if (invitation.expiresAt.getTime() < Date.now()) throw new Error("This invitation has expired");
  if (normalizeEmail(invitation.email) !== normalizeEmail(input.user.email)) {
    throw new Error(`This invitation was sent to ${invitation.email}`);
  }

  await db.transaction(async (tx) => {
    const existingRows = await tx
      .select({ id: schema.household_members.id })
      .from(schema.household_members)
      .where(
        and(
          eq(schema.household_members.household_id, invitation.householdId),
          eq(schema.household_members.user_id, input.user.id)
        )
      )
      .limit(1);

    if (!existingRows[0]) {
      await tx.insert(schema.household_members).values({
        household_id: invitation.householdId,
        user_id: input.user.id,
        role: invitation.role,
      });
    }

    await tx
      .update(schema.household_invitations)
      .set({
        status: "accepted",
        accepted_by: input.user.id,
        accepted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(schema.household_invitations.id, invitation.id));

    await tx.insert(schema.household_activity_events).values({
      household_id: invitation.householdId,
      actor_user_id: input.user.id,
      event_type: "invitation_accepted",
      object_type: "household_invitation",
      object_id: invitation.id,
      summary: `${input.user.name} joined ${invitation.householdName}.`,
      metadata: { role: invitation.role },
    });
  });

  await setActiveHouseholdMeta(input.user.id, invitation.householdId);

  return invitation.householdName;
}

export async function declineHouseholdInvitation(input: {
  user: DashboardUser;
  token: string;
}) {
  const rows = await db
    .select({
      id: schema.household_invitations.id,
      householdId: schema.household_invitations.household_id,
      email: schema.household_invitations.email,
      status: schema.household_invitations.status,
    })
    .from(schema.household_invitations)
    .where(eq(schema.household_invitations.token, input.token))
    .limit(1);

  const invitation = rows[0];
  if (!invitation) throw new Error("Invitation not found");
  if (normalizeEmail(invitation.email) !== normalizeEmail(input.user.email)) {
    throw new Error(`This invitation was sent to ${invitation.email}`);
  }
  if (invitation.status !== "pending") throw new Error("This invitation is no longer active");

  await db
    .update(schema.household_invitations)
    .set({
      status: "declined",
      declined_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(schema.household_invitations.id, invitation.id));

  await recordHouseholdActivity({
    householdId: invitation.householdId,
    actorUserId: input.user.id,
    eventType: "invitation_declined",
    objectType: "household_invitation",
    objectId: invitation.id,
    summary: `${input.user.name} declined a household invitation.`,
  });
}

export function formatActivityDate(value: Date) {
  return formatDate(value);
}
