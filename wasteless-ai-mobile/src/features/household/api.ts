import { API_ENDPOINTS } from '@/services/api/endpoints';
import { apiRequest } from '@/services/api/client';
import {
  getSuccessData,
  isRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
} from '@/services/api/response';
import type {
  HouseholdActivityEvent,
  HouseholdCollaborationData,
  HouseholdInvitation,
  HouseholdMember,
  HouseholdSummary,
} from './types';

function parseHousehold(value: unknown): HouseholdSummary {
  if (!isRecord(value)) {
    return { id: '', name: 'Household', role: 'member', timezone: null };
  }

  return {
    id: readString(value.id),
    name: readString(value.name, 'Household'),
    role: readString(value.role, 'member'),
    timezone: readNullableString(value.timezone),
  };
}

function parseMember(value: unknown): HouseholdMember | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const userId = readString(value.userId);
  if (!id || !userId) return null;

  return {
    id,
    userId,
    name: readString(value.name, 'Unknown'),
    email: readString(value.email),
    role: readString(value.role, 'member'),
    roleLabel: readString(value.roleLabel, 'Member'),
    joinedAt: readString(value.joinedAt),
    lastActiveAt: readNullableString(value.lastActiveAt),
    isCurrentUser: readBoolean(value.isCurrentUser),
  };
}

function parseInvitation(value: unknown): HouseholdInvitation | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  if (!id) return null;

  return {
    id,
    email: readString(value.email),
    role: readString(value.role, 'member'),
    roleLabel: readString(value.roleLabel, 'Member'),
    status: readString(value.status, 'pending'),
    inviteUrl: readString(value.inviteUrl),
    invitedBy: readString(value.invitedBy, 'Unknown'),
    expiresAt: readString(value.expiresAt),
    createdAt: readString(value.createdAt),
  };
}

function parseActivity(value: unknown): HouseholdActivityEvent | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  if (!id) return null;

  return {
    id,
    actorName: readString(value.actorName, 'System'),
    eventType: readString(value.eventType),
    summary: readString(value.summary),
    createdAt: readString(value.createdAt),
  };
}

function parseHouseholdResponse(payload: unknown): HouseholdCollaborationData {
  const data = getSuccessData(payload, 'Invalid household response from server.');
  if (!isRecord(data)) {
    throw new Error('Invalid household response from server.');
  }

  const rawStats = isRecord(data.stats) ? data.stats : {};

  return {
    household: parseHousehold(data.household),
    households: Array.isArray(data.households) ? data.households.map(parseHousehold) : [],
    currentUserRole: readString(data.currentUserRole, 'member'),
    canManageMembers: readBoolean(data.canManageMembers),
    members: Array.isArray(data.members)
      ? data.members.map(parseMember).filter((item): item is HouseholdMember => Boolean(item))
      : [],
    invitations: Array.isArray(data.invitations)
      ? data.invitations
          .map(parseInvitation)
          .filter((item): item is HouseholdInvitation => Boolean(item))
      : [],
    activity: Array.isArray(data.activity)
      ? data.activity.map(parseActivity).filter((item): item is HouseholdActivityEvent => Boolean(item))
      : [],
    stats: {
      memberCount: readNumber(rawStats.memberCount),
      pendingInvites: readNumber(rawStats.pendingInvites),
      sharedInventoryItems: readNumber(rawStats.sharedInventoryItems),
      openShoppingItems: readNumber(rawStats.openShoppingItems),
      activeMealPlanItems: readNumber(rawStats.activeMealPlanItems),
      wasteEvents: readNumber(rawStats.wasteEvents),
    },
  };
}

export async function getHouseholdData(token: string): Promise<HouseholdCollaborationData> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.household.detail, {
    authToken: token,
  });

  return parseHouseholdResponse(payload);
}
