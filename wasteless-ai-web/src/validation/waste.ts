import { WASTE_REASON_VALUES } from "@/features/waste/constants";
import { z } from "zod";

export const wasteLogSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .max(999999, "Quantity is too large"),
  reason: z.enum(WASTE_REASON_VALUES).default("expired"),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional(),
});
