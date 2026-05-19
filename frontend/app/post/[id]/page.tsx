"use client";

import { useTruthStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { TruthBadge } from "@/components/TruthBadge";
import { AIReasoningPanel } from "@/components/AIReasoningPanel";
import { ArrowLeft, Box, Fingerprint } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const post = useTruthStore(state => state.posts.find(p => p.id === id));

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-200">Post not found</h1>
        <Link href="/feed">
          <Button variant="link" className="mt-4 text-blue-400">Back to Feed</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/feed" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Link>

      <div className="glass-panel rounded-xl p-8 mb-6 relative overflow-hidden">
        {/* Decorative gradient for verified posts */}
        {post.status === "TRUE" && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        )}
        {post.status === "FALSE" && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        )}

        <div className="flex items-start gap-4 mb-6 relative z-10">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${post.author.avatarGradient} flex-shrink-0 shadow-lg`} />
          <div className="flex-1">
            <div className="text-lg font-medium text-white">{post.author.address}</div>
            <div className="text-sm text-slate-500">{formatDistanceToNow(post.createdAt)} ago</div>
          </div>
          <div className="scale-125 origin-top-right">
            <TruthBadge status={post.status} confidence={post.confidence} />
          </div>
        </div>

        <p className="text-2xl text-white leading-relaxed mb-8 relative z-10 font-medium">
          {post.content}
        </p>

        {post.status !== "PENDING" && post.reasoning && (
          <div className="relative z-10 border-t border-slate-800 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Verification Results</h3>
            <AIReasoningPanel 
              verdict={post.status} 
              confidence={post.confidence || 0} 
              reasoning={post.reasoning} 
              evidenceUrls={post.evidence_urls || []} 
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Box className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">On-Chain State</span>
          </div>
          <div className="space-y-2 mt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Staked</span>
              <span className="text-white font-mono">{post.stake_locked} TRUTH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reward/Slash</span>
              <span className={post.reward_paid > 0 ? "text-emerald-400 font-mono" : "text-slate-400 font-mono"}>
                {post.reward_paid > 0 ? `+${post.reward_paid} TRUTH` : "0 TRUTH"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Network</span>
              <span className="text-blue-400 font-mono">GenLayer (Testnet)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Fingerprint className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Validators</span>
          </div>
          <div className="mt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Leader</span>
              <span className="text-slate-300 font-mono text-xs">0x1a4...d9f</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consensus</span>
              <span className="text-slate-300">5/5 Approvals</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Execution Time</span>
              <span className="text-slate-300 font-mono">3.2s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
