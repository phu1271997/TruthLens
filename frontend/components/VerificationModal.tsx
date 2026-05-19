"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Globe, FileSearch, ShieldCheck } from "lucide-react";
import { useTruthStore } from "@/lib/store";

interface VerificationModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  claim: string;
}

const SOURCES = ["Reuters", "Associated Press", "Wikipedia", "BBC News"];

export function VerificationModal({
  postId,
  isOpen,
  onClose,
  claim,
}: VerificationModalProps) {
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const verifyPost = useTruthStore((state) => state.verifyPost);

  useEffect(() => {
    if (!isOpen) {
      setStage(0);
      setError(null);
      return;
    }

    // Stage 1: Fetching sources (0→1.5s)
    const t1 = setTimeout(() => setStage(1), 1500);
    // Stage 2: Cross-referencing (1.5→3s) — show neural animation while awaiting
    const t2 = setTimeout(() => setStage(2), 3000);

    // Real on-chain call starts immediately; once it resolves → stage 3
    const runVerify = async () => {
      try {
        await verifyPost(postId);
      } catch (err: any) {
        setError(err?.message ?? "Verification failed");
      } finally {
        // Ensure at least 4.5s of animation before showing result
        setTimeout(() => setStage(3), 4500);
      }
    };
    runVerify();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && stage === 3 && onClose()}
    >
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white overflow-hidden p-0">
        <div className="relative">
          {stage < 3 && <div className="scan-line" />}
          <div className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <AnimatePresence mode="wait">
                {stage === 0 && (
                  <motion.div
                    key="s0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center text-center gap-6"
                  >
                    <div className="relative">
                      <Globe className="w-16 h-16 text-blue-500 opacity-50" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-400 mb-2">
                        Submitting to GenLayer
                      </h3>
                      <p className="text-sm text-slate-400">
                        Calling <span className="font-mono text-blue-300">verify_post()</span> on-chain…
                      </p>
                    </div>
                  </motion.div>
                )}

                {stage === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center text-center gap-6 w-full"
                  >
                    <div className="flex gap-4">
                      {SOURCES.map((src, i) => (
                        <motion.div
                          key={src}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.2 }}
                          className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700"
                        >
                          <FileSearch className="w-5 h-5 text-slate-400" />
                        </motion.div>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-indigo-400 mb-2">
                        AI Jury fetching sources…
                      </h3>
                      <p className="text-sm text-slate-400 font-mono text-xs">
                        gl.nondet.web.render(url)
                      </p>
                    </div>
                  </motion.div>
                )}

                {stage === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center text-center gap-6"
                  >
                    <div className="relative">
                      <Brain className="w-20 h-20 text-purple-500" />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-purple-500 rounded-full mix-blend-screen filter blur-xl"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-purple-400 mb-2">
                        Cross-referencing claim…
                      </h3>
                      <p className="text-sm text-slate-400 font-mono text-xs">
                        gl.nondet.exec_prompt()
                      </p>
                    </div>
                  </motion.div>
                )}

                {stage === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center gap-4 w-full"
                  >
                    <motion.div
                      initial={{ rotate: -15, scale: 2 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <ShieldCheck className="w-24 h-24 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white">
                      {error ? "Verification Error" : "Verification Complete"}
                    </h3>
                    {error ? (
                      <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
                        {error}
                      </p>
                    ) : (
                      <div className="text-sm text-slate-400 mt-2 bg-slate-800 px-4 py-2 rounded-lg w-full">
                        Consensus reached. Result permanently recorded on GenLayer.
                      </div>
                    )}
                    <button
                      onClick={onClose}
                      className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-full"
                    >
                      View Result
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
