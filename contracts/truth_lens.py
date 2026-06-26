# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json

# === Helper functions ===

def safe_address(value: str) -> str:
    """Normalize address input. Raises UserError if invalid."""
    try:
        return str(Address(value))
    except Exception:
        raise gl.vm.UserError(f"Invalid address: {value}")

def normalize_verdict(raw: dict) -> dict:
    """Sanitize AI Jury output to known schema."""
    valid_verdicts = ["TRUE", "FALSE", "MISLEADING", "OPINION", "UNVERIFIABLE"]
    verdict = str(raw.get("verdict", "UNVERIFIABLE")).upper()
    if verdict not in valid_verdicts:
        verdict = "UNVERIFIABLE"
    
    confidence_raw = raw.get("confidence", 0)
    try:
        confidence = int(round(float(confidence_raw)))
    except Exception:
        confidence = 0
    confidence = max(0, min(100, confidence))
    
    evidence = raw.get("evidence_urls", [])
    if not isinstance(evidence, list):
        evidence = []
    evidence_strs = [str(u).strip() for u in evidence if str(u).strip()][:10]
    
    return {
        "verdict": verdict,
        "confidence": confidence,
        "evidence_urls": evidence_strs,
        "reasoning": str(raw.get("reasoning", "No reasoning provided.")).strip()[:2000],
    }

# === Main Contract ===

class Contract(gl.Contract):
    # Storage field DECLARATIONS — auto zero-initialized by GenVM
    posts: TreeMap[str, str]              # post_id -> JSON-encoded post
    balances: TreeMap[str, u256]          # address -> $TRUTH balance
    user_posts: TreeMap[str, str]         # address -> JSON list of post_ids
    post_ids: DynArray[str]               # post IDs in creation order
    total_supply: u256
    token_symbol: str
    post_counter: u256
    initial_grant: u256                   # tokens given to new users
    stake_amount: u256                    # tokens locked per post
    verified_count: u256                  # count of verified posts
    flagged_count: u256                   # count of flagged posts

    def __init__(self):
        # ONLY primitives here — TreeMaps auto-init to empty
        self.total_supply = u256(0)
        self.token_symbol = "TRUTH"
        self.post_counter = u256(0)
        self.initial_grant = u256(100)
        self.stake_amount = u256(1)
        self.verified_count = u256(0)
        self.flagged_count = u256(0)

    @gl.public.write
    def claim_starter_tokens(self) -> str:
        """Claim 100 TRUTH to get started or replenish if balance is low (<= 5 TRUTH)."""
        sender = str(gl.message.sender_address)
        current_balance = self.balances.get(sender, u256(0))
        if current_balance > u256(5):
            raise gl.vm.UserError("Balance is sufficient, no need to claim Faucet")
        
        added_amount = self.initial_grant - current_balance
        self.balances[sender] = self.initial_grant
        self.total_supply = self.total_supply + added_amount
        return json.dumps({
            "status": "granted",
            "amount": int(added_amount),
            "balance": int(self.initial_grant),
        })

    @gl.public.write
    def create_post(self, content: str, post_id: str) -> str:
        """User creates a post by staking 1 TRUTH. Post enters 'PENDING' status."""
        content = content.strip()
        post_id = post_id.strip()
        if not content:
            raise gl.vm.UserError("Content cannot be empty")
        if len(content) > 2000:
            raise gl.vm.UserError("Content exceeds 2000 chars")
        if not post_id:
            raise gl.vm.UserError("post_id required")
        if self.posts.get(post_id, "") != "":
            raise gl.vm.UserError("post_id already exists")
        
        sender = str(gl.message.sender_address)
        balance = self.balances.get(sender, u256(0))
        if balance < self.stake_amount:
            raise gl.vm.UserError("Insufficient TRUTH balance to stake")
        
        # Lock stake
        self.balances[sender] = balance - self.stake_amount
        self.post_counter = self.post_counter + u256(1)
        
        post = {
            "id": post_id,
            "author": sender,
            "content": content,
            "status": "PENDING",         # PENDING | VERIFIED | FLAGGED | OPINION
            "verdict": "",
            "confidence": 0,
            "reasoning": "",
            "evidence_urls": [],
            "stake_locked": int(self.stake_amount),
            "reward_paid": 0,
            "post_number": int(self.post_counter),
        }
        self.posts[post_id] = json.dumps(post, sort_keys=True)
        self.post_ids.append(post_id)
        
        return json.dumps({
            "status": "posted",
            "post_id": post_id,
            "post_number": int(self.post_counter),
            "balance_remaining": int(self.balances[sender]),
        })

    @gl.public.write
    def verify_post(self, post_id: str) -> str:
        """
        Triggers AI Jury to fact-check this post using GenLayer's Equivalence Principle (prompt_comparative).
        AI reads multiple authoritative sources and returns a verdict.
        """
        post_raw = self.posts.get(post_id, "")
        if post_raw == "":
            raise gl.vm.UserError("Unknown post_id")
        
        post = json.loads(post_raw)
        if post["status"] != "PENDING":
            raise gl.vm.UserError("Post already verified")
        
        content = str(post["content"])
        author = str(post["author"])
        
        # Sources the AI Jury will consult
        sources = [
            "https://www.reuters.com",
            "https://apnews.com",
            "https://en.wikipedia.org",
            "https://www.bbc.com/news",
        ]
        
        def check_claim_nondet():
            evidence_dump = ""
            for src in sources[:2]:  # Limit to 2 to save tokens in demo
                try:
                    snippet = gl.nondet.web.render(src, mode="text")
                    evidence_dump += f"\n\n=== {src} ===\n{snippet[:1500]}"
                except Exception as e:
                    evidence_dump += f"\n\n=== {src} ===\n[Unable to fetch: {str(e)[:100]}]"
            
            prompt = f"""
You are an AI fact-checker for TruthLens, a decentralized social network.
Your job is to assess whether the following claim is TRUE, FALSE, MISLEADING, an OPINION, or UNVERIFIABLE.

CLAIM TO VERIFY:
\"\"\"{content}\"\"\"

EVIDENCE FROM AUTHORITATIVE SOURCES:
{evidence_dump}

CLASSIFICATION RULES:
- TRUE: claim is factually supported by authoritative sources
- FALSE: claim contradicts authoritative sources or makes up events that did not happen
- MISLEADING: contains some truth but framed deceptively (cherry-picked, missing context)
- OPINION: subjective statement (preferences, predictions, value judgments) — neither true nor false
- UNVERIFIABLE: insufficient evidence in sources to determine

Return STRICT JSON with EXACTLY this schema:
{{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "OPINION" | "UNVERIFIABLE",
  "confidence": integer 0-100,
  "evidence_urls": [array of source URLs you used],
  "reasoning": "detailed 2-4 sentence explanation of your verdict"
}}

Be CONSERVATIVE: when in doubt, prefer UNVERIFIABLE over FALSE. Reserve FALSE only for claims clearly contradicted by evidence.
""".strip()
            
            raw_verdict = gl.nondet.exec_prompt(prompt, response_format="json")
            return normalize_verdict(raw_verdict)
        
        comparison_principle = """
Compare these two fact-checking results from different validators.
They are equivalent if and only if they agree on the core "verdict" category.
The allowed verdicts are: "TRUE", "FALSE", "MISLEADING", "OPINION", "UNVERIFIABLE".
Two results are equivalent if they both classify the claim under the same verdict, even if their confidence score differs by up to 20 points, or if their detailed reasoning is phrased differently.
If one is "FALSE" and the other is "MISLEADING", they are NOT equivalent.
Output a JSON: {"equivalent": true} or {"equivalent": false}.
""".strip()

        # Run semantic consensus
        verdict = gl.eq_principle.prompt_comparative(check_claim_nondet, comparison_principle)
        
        # Apply economic consequences based on verdict
        stake_locked = u256(int(post["stake_locked"]))
        reward_amount = u256(0)
        burned_amount = u256(0)
        
        if verdict["verdict"] == "TRUE" and verdict["confidence"] >= 85:
            # Reward truth-tellers: refund stake + 2x bonus
            reward_amount = stake_locked + (stake_locked * u256(2))
            self.balances[author] = self.balances.get(author, u256(0)) + reward_amount
            self.total_supply = self.total_supply + (stake_locked * u256(2))
            post["status"] = "VERIFIED"
            self.verified_count = self.verified_count + u256(1)
            post["reward_paid"] = int(reward_amount)
        elif verdict["verdict"] == "FALSE" and verdict["confidence"] >= 85:
            # Slash liars: burn the staked tokens
            burned_amount = stake_locked
            self.total_supply = self.total_supply - burned_amount
            post["status"] = "FLAGGED"
            self.flagged_count = self.flagged_count + u256(1)
        elif verdict["verdict"] == "MISLEADING" and verdict["confidence"] >= 70:
            # Partial slash: keep half, burn half
            burned_amount = stake_locked / u256(2)
            self.balances[author] = self.balances.get(author, u256(0)) + (stake_locked - burned_amount)
            self.total_supply = self.total_supply - burned_amount
            post["status"] = "FLAGGED"
            self.flagged_count = self.flagged_count + u256(1)
        elif verdict["verdict"] == "OPINION":
            # Return stake — opinions are neither rewarded nor punished
            self.balances[author] = self.balances.get(author, u256(0)) + stake_locked
            post["status"] = "OPINION"
        else:
            # UNVERIFIABLE or low-confidence: return stake unchanged
            self.balances[author] = self.balances.get(author, u256(0)) + stake_locked
            post["status"] = "PENDING"  # Stays pending, can be re-verified later
        
        # Update post state
        post["verdict"] = verdict["verdict"]
        post["confidence"] = verdict["confidence"]
        post["reasoning"] = verdict["reasoning"]
        post["evidence_urls"] = verdict["evidence_urls"]
        self.posts[post_id] = json.dumps(post, sort_keys=True)
        
        return json.dumps({
            "status": post["status"],
            "post_id": post_id,
            "verdict": verdict,
            "reward_paid": int(reward_amount),
            "burned": int(burned_amount),
            "author_balance": int(self.balances.get(author, u256(0))),
        })

    @gl.public.write
    def appeal_verdict(self, post_id: str) -> str:
        """
        Allows the author or any user to appeal a FLAGGED post.
        Requires staking 5 TRUTH. A high-scrutiny AI Jury will perform a deep forensic factcheck.
        """
        post_raw = self.posts.get(post_id, "")
        if post_raw == "":
            raise gl.vm.UserError("Unknown post_id")
        
        post = json.loads(post_raw)
        if post["status"] != "FLAGGED":
            raise gl.vm.UserError("Only FLAGGED posts can be appealed")
        if post.get("is_appealed", False):
            raise gl.vm.UserError("Post has already been appealed")
        
        sender = str(gl.message.sender_address)
        appeal_stake = u256(5)
        
        balance = self.balances.get(sender, u256(0))
        if balance < appeal_stake:
            raise gl.vm.UserError("Insufficient TRUTH balance to appeal (5 TRUTH required)")
        
        # Deduct appeal stake
        self.balances[sender] = balance - appeal_stake
        
        content = str(post["content"])
        author = str(post["author"])
        
        # Comprehensive list of 4 authoritative sources for appeal
        sources = [
            "https://www.reuters.com",
            "https://apnews.com",
            "https://en.wikipedia.org",
            "https://www.bbc.com/news",
        ]
        
        def forensic_check_nondet():
            evidence_dump = ""
            # Appeal uses all 4 sources for a deeper factcheck
            for src in sources:
                try:
                    snippet = gl.nondet.web.render(src, mode="text")
                    evidence_dump += f"\n\n=== {src} ===\n{snippet[:1500]}"
                except Exception as e:
                    evidence_dump += f"\n\n=== {src} ===\n[Unable to fetch: {str(e)[:100]}]"
            
            prompt = f"""
You are the Supreme AI Jury for TruthLens, an elite decentralized fact-checking network.
A user has appealed a previous FLAGGED (FALSE/MISLEADING) verdict for the following claim.
Your job is to conduct an exhaustive, highly critical, and forensic analysis to determine the absolute truth.

CLAIM TO VERIFY:
\"\"\"{content}\"\"\"

EXTENSIVE WEB EVIDENCE COLLECTED:
{evidence_dump}

CLASSIFICATION RULES:
- TRUE: claim is fully supported by the authoritative evidence.
- FALSE: claim is clearly contradicted by the evidence or fabricated.
- MISLEADING: contains partial truth but is framed to deceive.
- OPINION: purely subjective value judgment or preference.
- UNVERIFIABLE: insufficient evidence to confidently prove or disprove.

Return STRICT JSON with EXACTLY this schema:
{{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "OPINION" | "UNVERIFIABLE",
  "confidence": integer 0-100,
  "evidence_urls": [array of source URLs you used],
  "reasoning": "detailed forensic explanation justifying why you uphold or overturn the previous verdict"
}}
""".strip()
            
            raw_verdict = gl.nondet.exec_prompt(prompt, response_format="json")
            return normalize_verdict(raw_verdict)
        
        comparison_principle = """
Compare these forensic appeal fact-checking results.
They are equivalent if they agree on the core "verdict" category.
The allowed verdicts are: "TRUE", "FALSE", "MISLEADING", "OPINION", "UNVERIFIABLE".
Output a JSON: {"equivalent": true} or {"equivalent": false}.
""".strip()

        # Run semantic consensus
        verdict = gl.eq_principle.prompt_comparative(forensic_check_nondet, comparison_principle)
        
        # Process appeal outcome
        original_stake = u256(int(post["stake_locked"]))
        
        if verdict["verdict"] == "TRUE" and verdict["confidence"] >= 80:
            # Overturn success! Post is verified
            # Refund appealer their 5 TRUTH stake + 2 TRUTH reward
            # Refund author their original 1 TRUTH stake + 2 TRUTH reward (total 3 TRUTH)
            self.balances[sender] = self.balances.get(sender, u256(0)) + appeal_stake + u256(2)
            self.balances[author] = self.balances.get(author, u256(0)) + original_stake + u256(2)
            self.total_supply = self.total_supply + u256(4) # 2 for author, 2 for appealer minted
            post["status"] = "VERIFIED"
            self.flagged_count = self.flagged_count - u256(1)
            self.verified_count = self.verified_count + u256(1)
            post["reward_paid"] = int(original_stake + u256(2))
        else:
            # Appeal failed! The original FLAGGED/OPINION status is upheld, or updated to the new verdict.
            # The 5 TRUTH appeal stake is burned.
            self.total_supply = self.total_supply - appeal_stake
            # Status remains FLAGGED (or becomes what the new verdict is)
            if verdict["verdict"] in ["FALSE", "MISLEADING"]:
                post["status"] = "FLAGGED"
            elif verdict["verdict"] == "OPINION":
                post["status"] = "OPINION"
                self.flagged_count = self.flagged_count - u256(1)
            else:
                post["status"] = "FLAGGED"
        
        # Update post state
        post["is_appealed"] = True
        post["appeal_verdict"] = verdict["verdict"]
        post["appeal_confidence"] = verdict["confidence"]
        post["appeal_reasoning"] = verdict["reasoning"]
        post["appeal_evidence_urls"] = verdict["evidence_urls"]
        post["appeal_stake_locked"] = int(appeal_stake)
        post["verdict"] = verdict["verdict"] # Update main verdict to the appeal result
        post["confidence"] = verdict["confidence"]
        post["reasoning"] = f"[APPEAL RESOLVED] {verdict['reasoning']}"
        post["evidence_urls"] = verdict["evidence_urls"]
        
        self.posts[post_id] = json.dumps(post, sort_keys=True)
        
        return json.dumps({
            "status": post["status"],
            "post_id": post_id,
            "verdict": verdict,
            "appealer_balance": int(self.balances.get(sender, u256(0))),
            "author_balance": int(self.balances.get(author, u256(0))),
        })

    @gl.public.view
    def get_post(self, post_id: str) -> str:
        post_raw = self.posts.get(post_id, "")
        if post_raw == "":
            raise gl.vm.UserError("Unknown post_id")
        return post_raw

    @gl.public.view
    def list_recent_posts(self, limit: u256, offset: u256) -> str:
        """Return JSON array of posts newest-first. limit max 50."""
        total = len(self.post_ids)
        lim = min(int(limit), 50)
        off = int(offset)
        if off >= total:
            return json.dumps([])
        # Iterate newest -> oldest
        start = total - 1 - off
        end = max(-1, start - lim)
        result = []
        i = start
        while i > end:
            pid = self.post_ids[i]
            raw = self.posts.get(pid, "")
            if raw:
                result.append(json.loads(raw))
            i -= 1
        return json.dumps(result)

    @gl.public.view
    def get_feed_stats(self) -> str:
        return json.dumps({
            "post_count": int(self.post_counter),
            "total_supply": int(self.total_supply),
            "verified_count": int(self.verified_count),
            "flagged_count": int(self.flagged_count),
        })

    @gl.public.view
    def get_balance(self, address: str) -> u256:
        addr = safe_address(address)
        return self.balances.get(addr, u256(0))

    @gl.public.view
    def get_total_supply(self) -> u256:
        return self.total_supply

    @gl.public.view
    def get_post_count(self) -> u256:
        return self.post_counter

    @gl.public.write
    def transfer(self, to: str, amount: u256) -> str:
        """Standard ERC-20-like transfer of $TRUTH."""
        recipient = safe_address(to)
        sender = str(gl.message.sender_address)
        if amount <= u256(0):
            raise gl.vm.UserError("Amount must be positive")
        sender_balance = self.balances.get(sender, u256(0))
        if sender_balance < amount:
            raise gl.vm.UserError("Insufficient balance")
        self.balances[sender] = sender_balance - amount
        self.balances[recipient] = self.balances.get(recipient, u256(0)) + amount
        return json.dumps({
            "status": "transferred",
            "from": sender,
            "to": recipient,
            "amount": int(amount),
        })
