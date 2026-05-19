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

def verdict_is_valid(data, verdict: dict) -> bool:
    """Validator check — re-runs leader_fn output validation."""
    if not isinstance(data, dict):
        return False
    if str(data.get("verdict", "")).upper() not in ["TRUE", "FALSE", "MISLEADING", "OPINION", "UNVERIFIABLE"]:
        return False
    try:
        c = int(round(float(data.get("confidence", -1))))
        if c < 0 or c > 100:
            return False
    except Exception:
        return False
    return True

# === Main Contract ===

class Contract(gl.Contract):
    # Storage field DECLARATIONS — auto zero-initialized by GenVM
    posts: TreeMap[str, str]              # post_id -> JSON-encoded post
    balances: TreeMap[str, u256]          # address -> $TRUTH balance
    user_posts: TreeMap[str, str]         # address -> JSON list of post_ids
    total_supply: u256
    token_symbol: str
    post_counter: u256
    initial_grant: u256                   # tokens given to new users
    stake_amount: u256                    # tokens locked per post

    def __init__(self):
        # ONLY primitives here — TreeMaps auto-init to empty
        self.total_supply = u256(0)
        self.token_symbol = "TRUTH"
        self.post_counter = u256(0)
        self.initial_grant = u256(100)
        self.stake_amount = u256(1)

    @gl.public.write
    def claim_starter_tokens(self) -> str:
        """New users claim 100 TRUTH to get started. One-time per address."""
        sender = str(gl.message.sender_address)
        current_balance = self.balances.get(sender, u256(0))
        if current_balance > u256(0):
            raise gl.vm.UserError("Already claimed starter tokens")
        self.balances[sender] = self.initial_grant
        self.total_supply = self.total_supply + self.initial_grant
        return json.dumps({
            "status": "granted",
            "amount": int(self.initial_grant),
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
        
        return json.dumps({
            "status": "posted",
            "post_id": post_id,
            "post_number": int(self.post_counter),
            "balance_remaining": int(self.balances[sender]),
        })

    @gl.public.write
    def verify_post(self, post_id: str) -> str:
        """
        Triggers AI Jury to fact-check this post.
        AI reads multiple authoritative sources and returns verdict.
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
        
        def leader_fn():
            # Fetch authoritative sources in parallel via web.render
            # In production, AI Jury would use semantic search across these
            # For demo, we simulate by feeding their general content
            evidence_dump = ""
            for src in sources[:2]:  # Limit to 2 to save tokens in demo
                try:
                    snippet = gl.nondet.web.render(src, mode="text")
                    # Truncate to keep prompt manageable
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
        
        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            return verdict_is_valid(leader_result.calldata, leader_result.calldata)
        
        verdict = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
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
            post["reward_paid"] = int(reward_amount)
        elif verdict["verdict"] == "FALSE" and verdict["confidence"] >= 85:
            # Slash liars: burn the staked tokens
            burned_amount = stake_locked
            self.total_supply = self.total_supply - burned_amount
            post["status"] = "FLAGGED"
        elif verdict["verdict"] == "MISLEADING" and verdict["confidence"] >= 70:
            # Partial slash: keep half, burn half
            burned_amount = stake_locked / u256(2)
            self.balances[author] = self.balances.get(author, u256(0)) + (stake_locked - burned_amount)
            self.total_supply = self.total_supply - burned_amount
            post["status"] = "FLAGGED"
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

    @gl.public.view
    def get_post(self, post_id: str) -> str:
        post_raw = self.posts.get(post_id, "")
        if post_raw == "":
            raise gl.vm.UserError("Unknown post_id")
        return post_raw

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
