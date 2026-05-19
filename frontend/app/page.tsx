"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Activity, Users, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Powered by GenLayer Intelligent Contracts
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              Free Speech Without <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Free Lies.</span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The world's first decentralized social network where AI consensus fact-checks every viral post before it spreads. No human moderators. No censorship politics. Just truth.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link href="/feed">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-lg rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  Try the Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white">
                  How it works
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <Activity className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <div className="text-4xl font-bold text-white mb-2">1,248</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Claims Verified</div>
          </div>
          <div className="p-6">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
            <div className="text-4xl font-bold text-white mb-2">89%</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Misinformation Prevented</div>
          </div>
          <div className="p-6">
            <Coins className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <div className="text-4xl font-bold text-white mb-2">45K</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">TRUTH Distributed</div>
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to see it in action?</h2>
        <Link href="/feed">
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200 rounded-full h-12 px-8">
            Enter the Feed
          </Button>
        </Link>
      </section>
    </div>
  );
}
