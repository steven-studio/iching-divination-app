export type HistoryItem = {
  timestamp: number;
  n1: number;
  n2: number;
  n3: number;
  hexagramName: string;
  changingLine: number;
};

export type PaymentState = {
  freeUsesRemaining: number;
  totalUses: number;
  hasPaid: boolean;
};
