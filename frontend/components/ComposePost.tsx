"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTruthStore } from "@/lib/store";
import { Coins, Send, Loader2 } from "lucide-react";

export function ComposePost() {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { balance, addPost, isConnected, connect, isClaiming, claimStarterTokens } = useTruthStore();
  const stakeAmount = 1;

  const handleSubmit = async () => {
    if (!content.trim() || balance < stakeAmount || isPosting) return;
    setIsPosting(true);
    try {
      await addPost(content.trim());
      setContent("");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 mb-8 border-slate-700">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0" />

        <div className="flex-1">
          <Textarea
            placeholder={
              isConnected
                ? "What claim do you want to verify?"
                : "Connect your wallet to post..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!isConnected || isPosting}
            className="bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-[100px] resize-none focus-visible:ring-blue-500 mb-3 disabled:opacity-50"
            maxLength={2000}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">
                Stake required:{" "}
                <span className="text-amber-400 font-semibold">
                  {stakeAmount} TRUTH
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{content.length}/2000</span>
              {isConnected ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || balance < stakeAmount || isPosting}
                  className="bg-slate-200 hover:bg-white text-slate-900 font-semibold"
                >
                  {isPosting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Post</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={connect}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Connect to Post
                </Button>
              )}
            </div>
          </div>

          {isConnected && balance < stakeAmount && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center justify-between">
              <span>
                Insufficient TRUTH balance to post (requires 1 TRUTH, you have {balance}).
              </span>
              {balance === 0 && (
                <div className="flex-shrink-0 ml-4">
                  {isClaiming ? (
                    <Button
                      disabled
                      size="sm"
                      className="bg-amber-600/30 hover:bg-amber-600/30 text-white text-[11px] h-7 px-3 rounded-full flex items-center gap-1.5 border border-amber-500/20 cursor-not-allowed"
                    >
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      Claiming...
                    </Button>
                  ) : (
                    <Button
                      onClick={claimStarterTokens}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] h-7 px-3 rounded-full flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse border border-amber-500/30"
                    >
                      <Coins className="w-3 h-3 text-amber-400 animate-bounce" />
                      Claim 100 TRUTH
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
