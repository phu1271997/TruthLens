"use client";

import { motion } from "framer-motion";
import { Brain, ExternalLink } from "lucide-react";
import { Verdict } from "@/lib/mockData";

interface AIReasoningPanelProps {
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidenceUrls: string[];
}

export function AIReasoningPanel({ verdict, confidence, reasoning, evidenceUrls }: AIReasoningPanelProps) {
  let borderColor = "border-slate-700";
  let iconColor = "text-slate-400";
  
  if (verdict === "TRUE") {
    borderColor = "border-emerald-500/30";
    iconColor = "text-emerald-400";
  } else if (verdict === "FALSE") {
    borderColor = "border-red-500/30";
    iconColor = "text-red-400";
  } else if (verdict === "MISLEADING") {
    borderColor = "border-amber-500/30";
    iconColor = "text-amber-400";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={`mt-4 p-4 rounded-xl border ${borderColor} bg-slate-900/50 backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-slate-800 ${iconColor}`}>
          <Brain className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-200">AI Jury Reasoning</h4>
            <span className="text-xs text-slate-400">Confidence: {confidence}%</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {reasoning}
          </p>
          
          {evidenceUrls && evidenceUrls.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources Consulted</h5>
              <div className="flex flex-wrap gap-2">
                {evidenceUrls.map((url, idx) => {
                  try {
                    const domain = new URL(url).hostname.replace('www.', '');
                    return (
                      <a 
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors text-xs text-blue-400 border border-slate-700 hover:border-slate-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {domain}
                      </a>
                    );
                  } catch (e) {
                    return null;
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
