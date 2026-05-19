"use client";

import { useTruthStore } from "@/lib/store";
import { ComposePost } from "@/components/ComposePost";
import { PostCard } from "@/components/PostCard";
import { Activity } from "lucide-react";

export default function FeedPage() {
  const posts = useTruthStore(state => state.posts);

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

      <div className="space-y-2">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
