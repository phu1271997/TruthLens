"use client";

import { Verdict } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock } from "lucide-react";

interface TruthBadgeProps {
  status: Verdict;
  confidence?: number;
}

export function TruthBadge({ status, confidence }: TruthBadgeProps) {
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        PENDING VERIFICATION
      </Badge>
    );
  }

  if (status === "TRUE") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 px-2 py-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
        <CheckCircle className="w-3.5 h-3.5" />
        AI VERIFIED TRUE {confidence && <span className="opacity-70 text-[10px]">({confidence}%)</span>}
      </Badge>
    );
  }

  if (status === "FALSE") {
    return (
      <Badge variant="destructive" className="bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 px-2 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
        <XCircle className="w-3.5 h-3.5" />
        FLAGGED FALSE {confidence && <span className="opacity-70 text-[10px]">({confidence}%)</span>}
      </Badge>
    );
  }

  if (status === "MISLEADING") {
    return (
      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
        <AlertTriangle className="w-3.5 h-3.5" />
        MISLEADING {confidence && <span className="opacity-70 text-[10px]">({confidence}%)</span>}
      </Badge>
    );
  }

  return (
    <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1 px-2 py-0.5">
      <MessageSquare className="w-3.5 h-3.5" />
      OPINION
    </Badge>
  );
}
