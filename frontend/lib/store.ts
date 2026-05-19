import { create } from "zustand";
import { Post, MOCK_POSTS, Verdict } from "./mockData";
import { readContract, writeContract, connectWallet, getAccount } from "./genlayer";

interface TruthStore {
  posts: Post[];
  balance: number;
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  fetchBalance: (address: string) => Promise<void>;
  addPost: (content: string) => Promise<void>;
  verifyPost: (id: string) => Promise<void>;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export const useTruthStore = create<TruthStore>((set, get) => ({
  posts: [...MOCK_POSTS],
  balance: 0,
  address: "",
  isConnected: false,
  isConnecting: false,

  connect: async () => {
    set({ isConnecting: true });
    try {
      const addr = await connectWallet();
      set({ address: shortAddr(addr), isConnected: true });
      await get().fetchBalance(addr);

      // Try to claim starter tokens if balance is 0
      const raw = await readContract("get_balance", [addr]).catch(() => null);
      const bal = raw ? Number(raw) : 0;
      if (bal === 0) {
        try {
          await writeContract("claim_starter_tokens", []);
          await get().fetchBalance(addr);
        } catch {
          // Already claimed — ignore
        }
      }
    } catch (err: any) {
      console.error("Connect wallet error:", err);
    } finally {
      set({ isConnecting: false });
    }
  },

  fetchBalance: async (address: string) => {
    try {
      const raw = await readContract("get_balance", [address]);
      set({ balance: Number(raw) });
    } catch {
      // fallback
    }
  },

  addPost: async (content: string) => {
    const postId = `post_${Date.now()}`;
    const addr = getAccount() || "0xUser...123";
    const shortAddress = get().address || shortAddr(addr);

    // Optimistic UI update
    const optimistic: Post = {
      id: postId,
      author: {
        address: shortAddress,
        avatarGradient: "from-indigo-500 to-purple-500",
      },
      content,
      status: "PENDING",
      stake_locked: 1,
      reward_paid: 0,
      createdAt: Date.now(),
    };
    set((state) => ({
      posts: [optimistic, ...state.posts],
      balance: state.balance - 1,
    }));

    // On-chain write
    try {
      await writeContract("create_post", [content, postId]);
    } catch (err: any) {
      console.error("create_post error:", err);
      // Revert optimistic update on error
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        balance: state.balance + 1,
      }));
    }
  },

  verifyPost: async (id: string) => {
    // On-chain verification call
    try {
      const result = await writeContract("verify_post", [id]);
      // Parse returned JSON from contract
      let parsed: any = null;
      if (typeof result === "string") {
        try {
          parsed = JSON.parse(result);
        } catch {}
      } else if (result && typeof result === "object") {
        parsed = result;
      }

      if (parsed && parsed.verdict) {
        const v = parsed.verdict;
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              status: parsed.status as Verdict,
              confidence: v.confidence ?? 0,
              reasoning: v.reasoning ?? "Verified on-chain.",
              evidence_urls: v.evidence_urls ?? [],
            };
          }),
          balance: parsed.author_balance != null ? parsed.author_balance : state.balance,
        }));
      } else {
        // Fallback: fetch post from chain
        const postRaw = await readContract("get_post", [id]);
        if (typeof postRaw === "string") {
          const post = JSON.parse(postRaw);
          set((state) => ({
            posts: state.posts.map((p) => {
              if (p.id !== id) return p;
              return {
                ...p,
                status: post.status as Verdict,
                confidence: post.confidence ?? 0,
                reasoning: post.reasoning ?? "Verified on-chain.",
                evidence_urls: post.evidence_urls ?? [],
              };
            }),
          }));
        }
      }
    } catch (err: any) {
      console.error("verify_post error:", err);
    }
  },
}));
