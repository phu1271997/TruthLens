"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTruthStore } from "@/lib/store";
import { Coins, Send } from "lucide-react";

export function ComposePost() {
  const [content, setContent] = useState("");
  const { balance, addPost, address } = useTruthStore();
  const stakeAmount = 1;

  const handleSubmit = () => {
    if (!content.trim() || balance < stakeAmount) return;
    addPost(content.trim());
    setContent("");
  };

  return (
    <div className="glass-panel rounded-xl p-5 mb-8 border-slate-700">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0" />
        
        <div className="flex-1">
          <Textarea 
            placeholder="What claim do you want to verify?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-[100px] resize-none focus-visible:ring-blue-500 mb-3"
            maxLength={2000}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">
                Stake required: <span className="text-amber-400 font-semibold">{stakeAmount} TRUTH</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{content.length}/2000</span>
              <Button 
                onClick={handleSubmit} 
                disabled={!content.trim() || balance < stakeAmount}
                className="bg-slate-200 hover:bg-white text-slate-900 font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
          
          {balance < stakeAmount && (
            <p className="text-red-400 text-xs mt-2">Insufficient TRUTH balance to post.</p>
          )}
        </div>
      </div>
    </div>
  );
}
