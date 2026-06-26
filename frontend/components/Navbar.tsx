"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Wallet, Loader2 } from "lucide-react";
import { useTruthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { balance, address, isConnected, isConnecting, connect, claimTokens, isClaiming } = useTruthStore();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <ShieldCheck className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
          <span className="font-bold text-xl tracking-tight text-white">
            Truth<span className="text-blue-500">Lens</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/feed"
              className={`transition-colors ${
                pathname === "/feed"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Feed
            </Link>
            <Link
              href="/how-it-works"
              className={`transition-colors ${
                pathname === "/how-it-works"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              How it works
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={claimTokens}
              disabled={isClaiming}
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full px-4 h-9 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {isClaiming ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Claiming...</>
              ) : (
                <>Claim Faucet</>
              )}
            </Button>

            {isConnected ? (
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-full py-1.5 px-4 border border-slate-700">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
                  <Wallet className="w-4 h-4" />
                  {balance} TRUTH
                </div>
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <div className="text-xs text-slate-400 font-mono">
                  {address && address.length > 10
                    ? address.slice(0, 6) + "..." + address.slice(-4)
                    : address}
                </div>
              </div>
            ) : (
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 h-9 text-sm font-semibold"
              >
                {isConnecting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
                ) : (
                  <><Wallet className="w-4 h-4 mr-2" />Connect Wallet</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
