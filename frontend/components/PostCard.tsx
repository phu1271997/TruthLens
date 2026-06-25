"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@/lib/mockData";
import { TruthBadge } from "./TruthBadge";
import { AIReasoningPanel } from "./AIReasoningPanel";
import { VerificationModal } from "./VerificationModal";
import { Button } from "@/components/ui/button";
import { useTruthStore } from "@/lib/store";
import { ScanSearch, Wallet, Loader2 } from "lucide-react";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { isConnected, connect, appealPost, balance } = useTruthStore();

  return (
    <div className="glass-panel rounded-xl p-5 mb-4 relative overflow-hidden group">
      {post.status === "TRUE" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      )}
      {post.status === "FALSE" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      )}

      <div className="flex items-start gap-4 relative z-10">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.author.avatarGradient} flex-shrink-0 shadow-lg`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-200">
                {post.author.address}
              </span>
              <span className="text-xs text-slate-500">
                • {formatDistanceToNow(post.createdAt)} ago
              </span>
            </div>
            <Link href={`/post/${post.id}`}>
              <TruthBadge status={post.status} confidence={post.confidence} />
            </Link>
          </div>

          <p className="text-slate-200 text-lg mb-4 whitespace-pre-wrap">
            {post.content}
          </p>

          {post.status === "PENDING" || post.status === "APPEALED" ? (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {post.status === "APPEALED" ? (
                  <span className="text-purple-400 font-semibold flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Supreme AI Jury is conducting forensic analysis (5 TRUTH staked)...
                  </span>
                ) : (
                  <>
                    <span className="text-amber-400 font-semibold">
                      {post.stake_locked} TRUTH
                    </span>{" "}
                    staked
                  </>
                )}
              </div>
              {post.status === "PENDING" && (
                isConnected ? (
                  <Button
                    onClick={() => setIsVerifying(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
                  >
                    <ScanSearch className="w-4 h-4 mr-2" />
                    Verify with AI Jury
                  </Button>
                ) : (
                  <Button
                    onClick={connect}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect to Verify
                  </Button>
                )
              )}
            </div>
          ) : (
            <>
              {post.reasoning && (
                <AIReasoningPanel
                  verdict={post.status}
                  confidence={post.confidence || 0}
                  reasoning={post.reasoning}
                  evidenceUrls={post.evidence_urls || []}
                />
              )}

              {/* Appeal Section */}
              {(post.status === "FALSE" || post.status === "MISLEADING") && !post.is_appealed && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Disagree with the AI verdict? Stake{" "}
                    <span className="text-amber-400 font-semibold">5 TRUTH</span> to
                    appeal to the Supreme AI Jury.
                  </div>
                  {isConnected ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (balance < 5) {
                          alert("Insufficient balance to appeal. Please claim from the Faucet first.");
                          return;
                        }
                        if (confirm("Are you sure you want to appeal? This will stake 5 TRUTH. If the appeal is upheld, the stake is burned. If overturned, you get your stake back + a reward.")) {
                          await appealPost(post.id);
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 h-8 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)] transition-all"
                    >
                      Appeal Verdict
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={connect}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-xs rounded-full"
                    >
                      Connect to Appeal
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isVerifying && (
        <VerificationModal
          postId={post.id}
          isOpen={isVerifying}
          onClose={() => setIsVerifying(false)}
          claim={post.content}
        />
      )}
    </div>
  );
}
