# TruthLens Demo Flow

*This script is designed for a 3-minute hackathon pitch to GenLayer judges.*

## 1. The Global Feed (0:00 - 0:30)
- **Action**: Open `http://localhost:3000/feed`.
- **Talk Track**: "Welcome to TruthLens. At first glance, it looks like a normal social feed. But here, misinformation costs money. Notice the different badges on these posts. 'TRUE', 'FALSE', 'MISLEADING', and 'OPINION'. These weren't put here by human moderators. They were decided by GenLayer AI consensus."

## 2. Triggering AI Jury (0:30 - 1:30)
- **Action**: Point to the "SpaceX" post that is marked as `PENDING`. Click **Verify with AI Jury**.
- **Talk Track**: "When a post goes viral, the network triggers an Intelligent Contract. Watch this. GenLayer is currently natively crawling the web—fetching from Reuters, AP, and Wikipedia using `web.render`. Now, the AI validators are cross-referencing the claim against the fetched evidence using `exec_prompt`. Consensus reached! The post is flagged, and the author's staked TRUTH token is burned directly on-chain."

## 3. Composing a Lie (1:30 - 2:15)
- **Action**: Go to the compose box. Type: *"The Earth is flat and NASA admitted it yesterday."* Click **Post**.
- **Talk Track**: "Let's try it ourselves. I'm going to stake 1 TRUTH token and post an obvious lie. The post is live, but if it gets traction, it gets verified."
- **Action**: Click **Verify with AI Jury** on your new post. Wait for the simulation.
- **Talk Track**: "The AI Jury runs again. It sees through the lie. We lose our stake. But if we told the truth, the protocol would have minted a reward for us."

## 4. Under the Hood (2:15 - 2:45)
- **Action**: Show `truth_lens.py` in GenLayer Studio or VS Code.
- **Talk Track**: "This was impossible before GenLayer. Look at the code. Just Python. No oracles. No complex decentralized human voting mechanisms. Just `gl.nondet.web.render` and `gl.nondet.exec_prompt`. We are executing subjective fact-checking at the consensus layer."

## 5. Closing (2:45 - 3:00)
- **Talk Track**: "Misinformation is a 78 billion dollar problem. With TruthLens on GenLayer, we finally have the tools to create a social network with free speech, but no free lies. Thank you."
