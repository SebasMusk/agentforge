export interface CostRates {
  inputPerThousand: number; // USD per 1k input tokens
  outputPerThousand: number; // USD per 1k output tokens
}

export interface TokenUsageRecord {
  userId: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number; // USD
  timestamp: string; // ISO string
}

export interface RecordUsageArgs {
  userId: string;
  tokensInput: number;
  tokensOutput: number;
  cost?: number;
}


