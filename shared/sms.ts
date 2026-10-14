export type SmsCandidate = {
  intent: "strike" | "other" | "unclear";
  pledgeName: string | null;
  reason: string | null;
  date: string | null;
  points: number | null;
};
export type SmsItem = {
  id: string;
  receivedAt: string;
  importedAt: string;
  phone: string | null;
  text: string;
  reporterId?: string;
  status: "processing" | "review" | "reported" | "ignored" | "failed";
  note: string;
  attempts: number;
  lease?: string;
  leaseUntil?: number;
  candidate?: SmsCandidate;
  strikeId?: string;
  demo?: boolean;
};
export type SmsBinding = {
  phone: string;
  userId: string;
  verifiedBy: string;
  verifiedAt: string;
};
export type SmsData = {
  items: SmsItem[];
  bindings: SmsBinding[];
  usage: Record<string, number>;
  lastReceivedAt?: string;
};
export type SmsInbox = {
  items: SmsItem[];
  bindings: SmsBinding[];
  lastReceivedAt?: string;
  callsToday: number;
  dailyLimit: number;
  enabled: boolean;
  configured: boolean;
  demo: boolean;
};
