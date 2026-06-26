"use client";

import { useEffect, useState } from "react";
import { useTruthStore } from "@/lib/store";
import { ComposePost } from "@/components/ComposePost";
import { PostCard } from "@/components/PostCard";
import { Activity, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const { posts, fetchFeed, isConnected, connect } = useTruthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchFeed().finally(() => setIsLoading(false));
    const id = setInterval(fetchFeed, 15000);
    return () => clearInterval(id);
  }, [fetchFeed]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          Global Feed
        </h1>
        <div className="text-sm text-slate-400">
          Showing {posts.length} posts
        </div>
      </div>

      <ComposePost />

      {posts.length === 0 && !isLoading ? (
        <div className="glass-panel rounded-xl p-8 text-center border border-slate-800 bg-slate-900/40 max-w-xl mx-auto my-12 shadow-lg">
          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            Be the first to post — claim 100 TRUTH and stake 1 to begin.
          </p>
          {!isConnected && (
            <Button
              onClick={connect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
