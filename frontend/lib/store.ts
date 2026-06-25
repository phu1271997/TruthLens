import { create } from "zustand";
import { Post, MOCK_POSTS, Verdict } from "./mockData";
import { readContract, writeContract, connectWallet, getAccount } from "./genlayer";

interface TruthStore {
  posts: Post[];
  balance: number;
  address: string; // Will store the full connected address
  isConnected: boolean;
  isConnecting: boolean;
  isClaiming: boolean;
  connect: () => Promise<void>;
  fetchBalance: (address: string) => Promise<void>;
  claimTokens: () => Promise<void>;
  addPost: (content: string) => Promise<void>;
  verifyPost: (id: string) => Promise<void>;
  appealPost: (id: string) => Promise<void>;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

const mapStatus = (status: string, verdict: string): Verdict => {
  if (status === "VERIFIED") return "TRUE";
  if (status === "FLAGGED") {
    if (verdict === "MISLEADING") return "MISLEADING";
    return "FALSE";
  }
  if (status === "OPINION") return "OPINION";
  if (status === "APPEALED") return "APPEALED";
  return "PENDING";
};

export const useTruthStore = create<TruthStore>((set, get) => ({
  posts: [...MOCK_POSTS],
  balance: 0,
  address: "",
  isConnected: false,
  isConnecting: false,
  isClaiming: false,

  connect: async () => {
    set({ isConnecting: true });
    try {
      const addr = await connectWallet();
      if (!addr || (addr as string) === "undefined" || (addr as string) === "null") {
        throw new Error("No valid account returned from wallet.");
      }
      // Store the full address instead of the shortened one
      set({ address: addr, isConnected: true });
      await get().fetchBalance(addr);

      // Try to claim starter tokens automatically if balance is 0 on first connect
      const raw = await readContract("get_balance", [addr]).catch(() => null);
      const bal = raw ? Number(raw) : 0;
      if (bal === 0) {
        try {
          await writeContract("claim_starter_tokens", [], addr);
          await get().fetchBalance(addr);
        } catch {
          // Already claimed or failed silently
        }
      }
    } catch (err: any) {
      console.error("Connect wallet error:", err);
    } finally {
      set({ isConnecting: false });
    }
  },

  fetchBalance: async (address: string) => {
    if (!address || address === "undefined" || address === "null") return;
    try {
      const raw = await readContract("get_balance", [address]);
      set({ balance: Number(raw) });
    } catch {
      // fallback
    }
  },

  claimTokens: async () => {
    const { address, isConnected } = get();
    if (!isConnected || !address || address === "undefined" || address === "null") {
      alert("Please connect your wallet first.");
      return;
    }
    set({ isClaiming: true });
    try {
      await writeContract("claim_starter_tokens", [], address);
      // Re-fetch balance
      await get().fetchBalance(address);
    } catch (err: any) {
      console.error("Claim tokens error:", err);
      alert(err.message || "Failed to claim tokens. Make sure your balance is <= 5 TRUTH.");
    } finally {
      set({ isClaiming: false });
    }
  },

  addPost: async (content: string) => {
    const postId = `post_${Date.now()}`;
    let addr = getAccount() || get().address || "0xUser...123";
    if (addr === "undefined" || addr === "null") {
      addr = "0xUser...123";
    }
    const shortAddress = shortAddr(addr);

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
      await writeContract("create_post", [content, postId], get().address);
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
    const { address } = get();
    if (!address || address === "undefined" || address === "null") {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const result = await writeContract("verify_post", [id], address);
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
              status: mapStatus(parsed.status, v.verdict),
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
                status: mapStatus(post.status, post.verdict),
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

  appealPost: async (id: string) => {
    const { address, isConnected } = get();
    if (!isConnected || !address || address === "undefined" || address === "null") {
      alert("Please connect your wallet first.");
      return;
    }
    
    // Set post status to "APPEALED" to show loading/appealing state in UI
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, status: "APPEALED" } : p)),
    }));

    try {
      const result = await writeContract("appeal_verdict", [id], address);
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
              status: mapStatus(parsed.status, v.verdict),
              confidence: v.confidence ?? 0,
              reasoning: `[APPEAL RESOLVED] ${v.reasoning ?? ""}`,
              evidence_urls: v.evidence_urls ?? [],
              is_appealed: true,
              appeal_verdict: v.verdict,
              appeal_confidence: v.confidence,
              appeal_reasoning: v.reasoning,
              appeal_evidence_urls: v.evidence_urls,
              appeal_stake_locked: 5,
            };
          }),
          balance: parsed.appealer_balance != null ? parsed.appealer_balance : state.balance,
        }));
      } else {
        // Fallback: fetch from chain
        const postRaw = await readContract("get_post", [id]);
        if (typeof postRaw === "string") {
          const post = JSON.parse(postRaw);
          set((state) => ({
            posts: state.posts.map((p) => {
              if (p.id !== id) return p;
              return {
                ...p,
                status: mapStatus(post.status, post.verdict),
                confidence: post.confidence ?? 0,
                reasoning: post.reasoning ?? "Verified on-chain.",
                evidence_urls: post.evidence_urls ?? [],
                is_appealed: post.is_appealed ?? false,
                appeal_verdict: post.appeal_verdict,
                appeal_confidence: post.appeal_confidence,
                appeal_reasoning: post.appeal_reasoning,
                appeal_evidence_urls: post.appeal_evidence_urls,
                appeal_stake_locked: post.appeal_stake_locked,
              };
            }),
          }));
          // Refresh balance
          await get().fetchBalance(address);
        }
      }
    } catch (err: any) {
      console.error("appealPost error:", err);
      // Revert status to FALSE (which maps to FLAGGED / Red badge) on error
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, status: "FALSE" } : p)),
      }));
      alert(err.message || "Failed to appeal verdict. Make sure you have at least 5 TRUTH tokens.");
    }
  },
}));
