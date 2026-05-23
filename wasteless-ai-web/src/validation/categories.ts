import { z } from "zod";

export const storageSuggestionRequestSchema = z.object({
  productName: z.string().trim().min(2, "Product name must be at least 2 characters").max(120),
});
