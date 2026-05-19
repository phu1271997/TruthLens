import { create } from 'zustand';
import { Post, MOCK_POSTS, Verdict } from './mockData';

interface TruthStore {
  posts: Post[];
  balance: number;
  address: string;
  addPost: (content: string) => void;
  verifyPost: (id: string, result: { status: Verdict; confidence: number; reasoning: string; evidence_urls: string[] }) => void;
}

export const useTruthStore = create<TruthStore>((set) => ({
  posts: [...MOCK_POSTS],
  balance: 100,
  address: "0xUser...123",
  addPost: (content) =>
    set((state) => {
      const newPost: Post = {
        id: `post_${Date.now()}`,
        author: {
          address: state.address,
          avatarGradient: "from-indigo-500 to-purple-500",
        },
        content,
        status: "PENDING",
        stake_locked: 1,
        reward_paid: 0,
        createdAt: Date.now(),
      };
      return { 
        posts: [newPost, ...state.posts],
        balance: state.balance - 1
      };
    }),
  verifyPost: (id, result) =>
    set((state) => {
      const updatedPosts = state.posts.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: result.status,
            confidence: result.confidence,
            reasoning: result.reasoning,
            evidence_urls: result.evidence_urls,
          };
        }
        return p;
      });
      
      let balanceChange = 0;
      if (result.status === "TRUE") balanceChange = +3;
      else if (result.status === "FALSE") balanceChange = 0; // Lost stake
      else if (result.status === "MISLEADING") balanceChange = +0.5; // Kept half stake
      else if (result.status === "OPINION") balanceChange = +1; // Kept full stake

      return {
        posts: updatedPosts,
        balance: state.balance + balanceChange
      };
    }),
}));
