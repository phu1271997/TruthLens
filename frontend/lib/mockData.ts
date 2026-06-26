export type Verdict = "PENDING" | "TRUE" | "FALSE" | "MISLEADING" | "OPINION" | "APPEALED";

export interface Post {
  id: string;
  author: {
    address: string;
    avatarGradient: string;
  };
  content: string;
  status: Verdict;
  confidence?: number;
  reasoning?: string;
  evidence_urls?: string[];
  stake_locked: number;
  reward_paid: number;
  createdAt: number;
  
  // Appeal fields
  is_appealed?: boolean;
  appeal_verdict?: string;
  appeal_confidence?: number;
  appeal_reasoning?: string;
  appeal_evidence_urls?: string[];
  appeal_stake_locked?: number;
}
