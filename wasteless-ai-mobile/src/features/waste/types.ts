export const WASTE_REASONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'leftovers', label: 'Leftovers' },
  { value: 'overbought', label: 'Overbought' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'disliked', label: 'Disliked' },
  { value: 'other', label: 'Other' },
] as const;

export type WasteReason = (typeof WASTE_REASONS)[number]['value'];

export type WasteLogEntry = {
  id: string;
  productId: string | null;
  productName: string;
  categoryName: string;
  quantity: string;
  unit: string | null;
  quantityLabel: string;
  reason: string;
  reasonLabel: string;
  notes: string | null;
  createdAt: string;
};

export type WasteReasonBreakdown = {
  reason: string;
  label: string;
  count: number;
};

export type WastePageData = {
  stats: {
    totalEvents: number;
    recentEvents: number;
    topReason: string;
    preventedUpdates: number;
  };
  recentLogs: WasteLogEntry[];
  reasonBreakdown: WasteReasonBreakdown[];
};

export type WasteLogPayload = {
  productId: string;
  quantity: number;
  reason: WasteReason;
  notes?: string;
};
