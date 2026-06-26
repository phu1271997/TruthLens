import { create } from "zustand";
import { Post, Verdict } from "./mockData";
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
  fetchFeed: () => Promise<void>;
  fetchStats: () => Promise<{ post_count: number; total_supply: number; verified: number; flagged: number }>;
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
  posts: [],
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
    let { address, isConnected } = get();
    if (!isConnected || !address || address === "undefined" || address === "null") {
      try {
        await get().connect();
        // Wait a brief moment for the provider and state store to fully propagate the account address
        await new Promise((resolve) => setTimeout(resolve, 500));
        const state = get();
        address = state.address;
        isConnected = state.isConnected;
        if (!isConnected || !address || address === "undefined" || address === "null") {
          return;
        }
      } catch (err) {
        console.error("Auto-connect before faucet claim failed:", err);
        return;
      }
    }
    set({ isClaiming: true });
    try {
      // Robustly fetch the latest address directly from the provider or the store
      const activeAddress = getAccount() || address;
      if (!activeAddress || activeAddress === "undefined" || activeAddress === "null") {
        throw new Error("No active wallet account found. Please connect your wallet.");
      }

      await writeContract("claim_starter_tokens", [], activeAddress);
      // Re-fetch balance
      await get().fetchBalance(activeAddress);
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
      await get().fetchFeed();
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
      await writeContract("verify_post", [id], address);
      await get().fetchFeed();
      await get().fetchBalance(address);
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
      await writeContract("appeal_verdict", [id], address);
      await get().fetchFeed();
      await get().fetchBalance(address);
    } catch (err: any) {
      console.error("appealPost error:", err);
      // Revert status to FALSE (which maps to FLAGGED / Red badge) on error
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, status: "FALSE" } : p)),
      }));
      alert(err.message || "Failed to appeal verdict. Make sure you have at least 5 TRUTH tokens.");
    }
  },

  fetchFeed: async () => {
    try {
      const raw = await readContract("list_recent_posts", [50, 0]);
      if (typeof raw === "string" && raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const getAvatarGradient = (address: string) => {
            const gradients = [
              "from-blue-500 to-cyan-500",
              "from-emerald-400 to-teal-500",
              "from-red-500 to-orange-500",
              "from-amber-400 to-yellow-600",
              "from-purple-500 to-pink-500",
              "from-indigo-500 to-purple-500",
              "from-pink-500 to-rose-500",
            ];
            let hash = 0;
            for (let i = 0; i < address.length; i++) {
              hash = address.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % gradients.length;
            return gradients[index];
          };

          const mapped = parsed.map((p: any) => {
            let createdAt = Date.now();
            const match = p.id?.match(/^post_(\d+)$/);
            if (match) {
              createdAt = parseInt(match[1], 10);
            } else {
              createdAt = Date.now() - 1000 * 60 * 60 * (p.post_number || 1);
            }

            return {
              id: p.id,
              author: {
                address: p.author ? shortAddr(p.author) : "0xUnknown",
                avatarGradient: getAvatarGradient(p.author || ""),
              },
              content: p.content,
              status: mapStatus(p.status, p.verdict),
              confidence: p.confidence,
              reasoning: p.reasoning,
              evidence_urls: p.evidence_urls,
              stake_locked: p.stake_locked,
              reward_paid: p.reward_paid,
              createdAt,
              is_appealed: p.is_appealed,
              appeal_verdict: p.appeal_verdict,
              appeal_confidence: p.appeal_confidence,
              appeal_reasoning: p.appeal_reasoning,
              appeal_evidence_urls: p.appeal_evidence_urls,
              appeal_stake_locked: p.appeal_stake_locked,
            };
          });
          set({ posts: mapped });
        }
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
    }
  },

  fetchStats: async () => {
    try {
      const raw = await readContract("get_feed_stats", []);
      if (typeof raw === "string" && raw) {
        const parsed = JSON.parse(raw);
        return {
          post_count: Number(parsed.post_count || 0),
          total_supply: Number(parsed.total_supply || 0),
          verified: Number(parsed.verified_count || 0),
          flagged: Number(parsed.flagged_count || 0),
        };
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
    return { post_count: 0, total_supply: 0, verified: 0, flagged: 0 };
  },
}));
