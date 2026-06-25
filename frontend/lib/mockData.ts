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

export const MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    author: {
      address: "0x742d...44e",
      avatarGradient: "from-blue-500 to-cyan-500",
    },
    content: "Breaking: SpaceX just announced a permanent Mars colony to be established by 2027.",
    status: "PENDING",
    stake_locked: 1,
    reward_paid: 0,
    createdAt: Date.now() - 1000 * 60 * 5,
  },
  {
    id: "post_2",
    author: {
      address: "0x123a...bc9",
      avatarGradient: "from-emerald-400 to-teal-500",
    },
    content: "Bitcoin reached $100K in early 2025, breaking all previous records.",
    status: "TRUE",
    confidence: 95,
    reasoning: "Multiple authoritative sources, including Reuters and Bloomberg, confirmed that Bitcoin surpassed the $100,000 threshold in January 2025.",
    evidence_urls: ["https://reuters.com", "https://bloomberg.com"],
    stake_locked: 1,
    reward_paid: 3,
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "post_3",
    author: {
      address: "0x999f...11a",
      avatarGradient: "from-red-500 to-orange-500",
    },
    content: "NASA confirmed an alien spacecraft was discovered over Antarctica in March 2026.",
    status: "FALSE",
    confidence: 99,
    reasoning: "There are no reports from NASA or any credible news organization confirming the discovery of an alien spacecraft in Antarctica. This claim is completely fabricated.",
    evidence_urls: ["https://nasa.gov", "https://apnews.com"],
    stake_locked: 1,
    reward_paid: 0,
    createdAt: Date.now() - 1000 * 60 * 120,
  },
  {
    id: "post_4",
    author: {
      address: "0x444b...88c",
      avatarGradient: "from-amber-400 to-yellow-600",
    },
    content: "Global warming is just a natural cycle, Earth has been much hotter in the past so current warming is completely natural.",
    status: "MISLEADING",
    confidence: 88,
    reasoning: "While Earth has been hotter in the past, scientific consensus indicates that the rapid warming observed since the mid-20th century is unprecedented over millennia and is primarily driven by human activities, not natural cycles.",
    evidence_urls: ["https://climate.nasa.gov", "https://ipcc.ch"],
    stake_locked: 1,
    reward_paid: 0, // partially slashed
    createdAt: Date.now() - 1000 * 60 * 240,
  },
  {
    id: "post_5",
    author: {
      address: "0x777d...99e",
      avatarGradient: "from-purple-500 to-pink-500",
    },
    content: "Christopher Nolan is the greatest filmmaker of our generation.",
    status: "OPINION",
    confidence: 100,
    reasoning: "This statement is a subjective evaluation of a filmmaker's artistic merit. It cannot be factually proven or disproven using authoritative sources.",
    evidence_urls: [],
    stake_locked: 1,
    reward_paid: 1, // Stake returned
    createdAt: Date.now() - 1000 * 60 * 480,
  },
];
