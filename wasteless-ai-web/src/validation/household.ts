import { HOUSEHOLD_ROLES } from "@/features/household/constants";
import { z } from "zod";

export const householdInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(320).transform((value) => value.toLowerCase()),
  role: z.enum(HOUSEHOLD_ROLES).default("member"),
});

export const householdInvitationTokenSchema = z.object({
  token: z.string().trim().min(20).max(128),
});

export const householdInvitationIdSchema = z.object({
  invitationId: z.string().uuid(),
});

export const householdMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(HOUSEHOLD_ROLES),
});

export const householdMemberIdSchema = z.object({
  memberId: z.string().uuid(),
});

export const activeHouseholdSchema = z.object({
  householdId: z.string().uuid(),
});
