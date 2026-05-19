"use client";

import { motion } from "framer-motion";
import { Brain, FileSearch, ShieldCheck, Scale, Network, ArrowDown } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">How TruthLens Works</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          We leverage GenLayer's Intelligent Contracts to enable AI consensus on subjective truth without relying on centralized oracles.
        </p>
      </div>

      {/* Mechanism Steps */}
      <div className="space-y-12 mb-24 relative">
        <div className="absolute top-0 bottom-0 left-[28px] w-0.5 bg-slate-800 md:left-1/2 md:-ml-px hidden md:block" />

        {[
          {
            icon: Scale,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            title: "1. Stake to Speak",
            desc: "Users must stake 1 $TRUTH token to post. This prevents spam and creates an economic disincentive for lying.",
            align: "right"
          },
          {
            icon: Network,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            title: "2. Trigger Verification",
            desc: "When a post reaches an engagement threshold, an Intelligent Contract on GenLayer is triggered.",
            align: "left"
          },
          {
            icon: FileSearch,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            title: "3. Dynamic Web Access",
            desc: "The contract actively crawls authoritative sources (Reuters, Wikipedia, etc.) in real-time using GenLayer's native web access.",
            align: "right"
          },
          {
            icon: Brain,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            title: "4. AI Consensus",
            desc: "Multiple AI validators analyze the sources and the claim. They must reach a consensus on the verdict (TRUE, FALSE, MISLEADING, or OPINION).",
            align: "left"
          },
          {
            icon: ShieldCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            title: "5. On-Chain Resolution",
            desc: "Truth-tellers are rewarded with 2x their stake. Liars are slashed and their stake is burned. Opinions simply have their stake returned.",
            align: "right"
          }
        ].map((step, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`flex flex-col md:flex-row items-center gap-8 ${step.align === 'left' ? 'md:flex-row-reverse' : ''}`}
          >
            <div className={`md:w-1/2 text-center md:text-${step.align === 'left' ? 'right' : 'left'}`}>
              <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 text-lg leading-relaxed">{step.desc}</p>
            </div>
            
            <div className="relative z-10 flex-shrink-0">
              <div className={`w-14 h-14 rounded-full ${step.bg} border border-slate-700 flex items-center justify-center shadow-xl`}>
                <step.icon className={`w-6 h-6 ${step.color}`} />
              </div>
            </div>
            
            <div className="md:w-1/2" />
          </motion.div>
        ))}
      </div>

      {/* Code Snippet */}
      <div className="glass-panel rounded-2xl overflow-hidden mb-16">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-slate-300">truth_lens.py (GenLayer Contract)</h3>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
          </div>
        </div>
        <div className="p-6 bg-[#0d1117] overflow-x-auto">
          <pre className="font-mono text-sm leading-relaxed text-slate-300">
            <code>
{`def leader_fn():
    # 1. Fetch authoritative sources natively from the web
    evidence = ""
    for src in sources:
        # ⚠️ This is native web access, no oracle needed!
        snippet = gl.nondet.web.render(src, mode="text")
        evidence += snippet

    prompt = f"Verify claim: {claim}\\nUsing evidence: {evidence}"
    
    # 2. Call LLM for subjective judgment
    raw_verdict = gl.nondet.exec_prompt(prompt, response_format="json")
    return raw_verdict

# 3. Consensus execution
verdict = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

if verdict["verdict"] == "FALSE":
    # Slash stake directly on-chain
    burn(stake)`}
            </code>
          </pre>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel rounded-2xl p-8 overflow-x-auto">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Why TruthLens?</h3>
        <table className="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-4 px-4 font-semibold text-slate-300">Feature</th>
              <th className="py-4 px-4 font-semibold text-blue-400">TruthLens (GenLayer)</th>
              <th className="py-4 px-4 font-semibold text-slate-500">X Community Notes</th>
              <th className="py-4 px-4 font-semibold text-slate-500">Standard DApps</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-slate-800/50">
              <td className="py-4 px-4 text-slate-400">Speed</td>
              <td className="py-4 px-4 text-white font-medium">Seconds (AI Speed)</td>
              <td className="py-4 px-4 text-slate-400">Days (Human Speed)</td>
              <td className="py-4 px-4 text-slate-400">Instant (No verification)</td>
            </tr>
            <tr className="border-b border-slate-800/50">
              <td className="py-4 px-4 text-slate-400">Bias</td>
              <td className="py-4 px-4 text-white font-medium">Mitigated by AI consensus</td>
              <td className="py-4 px-4 text-slate-400">Highly political / tribal</td>
              <td className="py-4 px-4 text-slate-400">N/A</td>
            </tr>
            <tr className="border-b border-slate-800/50">
              <td className="py-4 px-4 text-slate-400">Censorship Resistance</td>
              <td className="py-4 px-4 text-white font-medium">Fully Decentralized</td>
              <td className="py-4 px-4 text-slate-400">Controlled by Corporation</td>
              <td className="py-4 px-4 text-slate-400">Fully Decentralized</td>
            </tr>
            <tr>
              <td className="py-4 px-4 text-slate-400">Subjective Logic</td>
              <td className="py-4 px-4 text-emerald-400 font-medium font-semibold">Yes (GenLayer Native)</td>
              <td className="py-4 px-4 text-slate-400">Yes (Humans)</td>
              <td className="py-4 px-4 text-red-400">Impossible</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
