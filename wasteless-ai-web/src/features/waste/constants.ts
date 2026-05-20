export const WASTE_REASON_VALUES = [
  "expired",
  "spoiled",
  "leftovers",
  "overbought",
  "damaged",
  "disliked",
  "other",
] as const;

export type WasteReason = (typeof WASTE_REASON_VALUES)[number];

export const WASTE_REASONS: Array<{ value: WasteReason; label: string }> = [
  { value: "expired", label: "Expired" },
  { value: "spoiled", label: "Spoiled" },
  { value: "leftovers", label: "Leftovers" },
  { value: "overbought", label: "Overbought" },
  { value: "damaged", label: "Damaged" },
  { value: "disliked", label: "Disliked" },
  { value: "other", label: "Other" },
];

export const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  expired: "Expired",
  spoiled: "Spoiled",
  leftovers: "Leftovers",
  overbought: "Overbought",
  damaged: "Damaged",
  disliked: "Disliked",
  other: "Other",
};

export function getWasteReasonLabel(reason?: string | null) {
  if (!reason) return WASTE_REASON_LABELS.other;
  return WASTE_REASON_LABELS[reason as WasteReason] ?? WASTE_REASON_LABELS.other;
}
