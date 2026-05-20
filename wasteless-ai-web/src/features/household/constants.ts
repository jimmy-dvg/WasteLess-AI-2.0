export const HOUSEHOLD_ROLES = ["owner", "admin", "member", "guest"] as const;

export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

export const HOUSEHOLD_ROLE_LABELS: Record<HouseholdRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  guest: "Guest",
};

export const HOUSEHOLD_ROLE_DESCRIPTIONS: Record<HouseholdRole, string> = {
  owner: "Full household control, billing-ready ownership, and member management.",
  admin: "Can invite members and manage shared household workflows.",
  member: "Can contribute to shared inventory, shopping, and meal planning.",
  guest: "Limited read-oriented access for temporary household collaborators.",
};

export function isHouseholdRole(value: string): value is HouseholdRole {
  return HOUSEHOLD_ROLES.includes(value as HouseholdRole);
}

export function canManageHousehold(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canEditHouseholdInventory(role?: string | null) {
  return role === "owner" || role === "admin" || role === "member";
}

export function canManageRole(actorRole: string | null | undefined, targetRole: string | null | undefined) {
  if (actorRole === "owner") return true;
  if (actorRole === "admin") return targetRole !== "owner";
  return false;
}
