export type HouseholdMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  joinedAt: string;
  lastActiveAt: string | null;
  isCurrentUser: boolean;
};

export type HouseholdInvitation = {
  id: string;
  email: string;
  role: string;
  roleLabel: string;
  status: string;
  inviteUrl: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
};

export type HouseholdActivityEvent = {
  id: string;
  actorName: string;
  eventType: string;
  summary: string;
  createdAt: string;
};

export type HouseholdSummary = {
  id: string;
  name: string;
  role: string;
  timezone: string | null;
};

export type HouseholdCollaborationData = {
  household: HouseholdSummary;
  households: HouseholdSummary[];
  currentUserRole: string;
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
