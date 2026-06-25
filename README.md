<div align="center">
  <h1>🌐 TruthLens</h1>
  <p><strong>Free speech without free lies. AI fact-checks before reach.</strong></p>
</div>

## The Problem
Misinformation costs the global economy **$78 billion per year**. It swings elections, destroys reputations, and causes market panics. 

Existing solutions are fundamentally broken:
- **Traditional Fact-Checkers**: Too slow, taking days to verify viral claims.
- **Twitter/X Community Notes**: Highly centralized, political, tribal, and often weaponized.
- **Traditional Smart Contracts**: Incapable of verifying subjective truth. They require centralized oracles.

## The Solution
**TruthLens** is the world's first decentralized social network where AI consensus fact-checks every viral post before it reaches a wide audience. 

When a post gains traction, an **Intelligent Contract** triggers an AI Jury. This jury crawls authoritative sources (Reuters, AP, Wikipedia) natively, cross-references the claim, and reaches a consensus. 
- **Truth-tellers** are rewarded with a 2x token bonus.
- **Liars** are slashed, and their posts receive a permanent on-chain 🚫 FLAGGED FALSE stamp.
- **Opinions** are categorized appropriately without penalty.

## Why GenLayer?
This application is **technically impossible on any other blockchain**. GenLayer's Intelligent Contracts allow us to natively crawl the web and run LLMs to evaluate subjective truth directly in the consensus layer.

```python
# 1. Native web access (No Oracles!)
snippet = gl.nondet.web.render(url, mode="text")

# 2. AI Judgment in Consensus Layer
verdict = gl.nondet.exec_prompt(prompt, response_format="json")

# 3. Secure execution
gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

## Tech Stack
| Component | Technology |
|---|---|
| **Smart Contracts** | GenLayer, Python, GenVM |
| **Frontend** | Next.js 14 (App Router), TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | Zustand |

## Local Setup
1. Clone the repo
2. `cd frontend`
3. `npm install`
4. `npm run dev`
5. Open `http://localhost:3000`

## GenLayer Contract Deployment Guide
To deploy the contracts to GenLayer Studio:
1. Open [GenLayer Studio](https://studio.genlayer.com/run-debug)
2. Go to Settings → Reset Storage → Confirm
3. **Hard refresh** the browser (Cmd+Shift+R)
4. Upload `contracts/storage_test.py` → Deploy → verify it succeeds
5. Upload `contracts/truth_lens.py` → Deploy → verify it succeeds
6. Call `claim_starter_tokens()` to receive 100 TRUTH
7. Call `create_post(content, post_id)` to stake and post
8. Call `verify_post(post_id)` to trigger the AI Jury and see the on-chain verdict

## Faucet & Token Replenishment
To resolve onboarding friction and make evaluation seamless:
- A highly visible **Claim Faucet** button is integrated into the navigation bar.
- If a user has insufficient tokens to post, an inline call-to-action banner is displayed to easily claim `100 TRUTH` directly in-context.
- The Intelligent Contract (`claim_starter_tokens`) supports replenishment: users can reclaim tokens as long as their balance is $\le 5$ `TRUTH`.

## Decentralized Appeal / Dispute Flow (Unicorn Milestone)
If a post is flagged as `FALSE` or `MISLEADING` by the initial AI consensus, users can challenge the verdict:
1. **Stake to Appeal:** Disputing a verdict requires staking `5 TRUTH` tokens to prevent spam.
2. **Supreme AI Jury:** The appeal triggers the `appeal_verdict` method, spinning up a larger, high-scrutiny AI Jury that crawls 4 authoritative sources (Reuters, AP, Wikipedia, BBC) in parallel.
3. **Consensus Resolution:** Consensus is achieved via GenLayer's `gl.eq_principle.prompt_comparative` to check semantic equivalence.
4. **Economic Settlement:**
   - **Overturned (TRUE):** The post status updates to `VERIFIED`. The appealer is refunded their `5 TRUTH` stake + `2 TRUTH` reward. The author is refunded their original `1 TRUTH` stake + `2 TRUTH` reward.
   - **Upheld (FALSE/MISLEADING):** The status remains `FLAGGED`. The appealer's `5 TRUTH` stake is burned.

## Hackathon Submission
Built for the **GenLayer Foundation Hackathon**.

## License
MIT
