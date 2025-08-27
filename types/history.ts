export type HistoryItem = {
  timestamp: number;
  n1: number;
  n2: number;
  n3: number;
  question: string;
  hexagramName: string;
  changingLine: number;
  lowerTrigram: string;
  upperTrigram: string;
  explanation: {
    plain: string;
    tips: string[];
  };
};

export type PaymentState = {
  freeUsesRemaining: number;
  totalUses: number;
  hasPaid: boolean;
};