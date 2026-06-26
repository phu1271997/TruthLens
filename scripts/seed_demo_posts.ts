import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import * as fs from "fs";
import * as path from "path";

function getContractAddress(): string {
  if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
    return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  }
  
  const root = process.cwd();
  const paths = [
    path.join(root, "frontend", ".env.local"),
    path.join(root, "frontend", ".env"),
    path.join(root, ".env.local"),
    path.join(root, ".env"),
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      const match = content.match(/NEXT_PUBLIC_CONTRACT_ADDRESS\s*=\s*(0x[a-fA-F0-9]+)/);
      if (match) {
        return match[1];
      }
    }
  }
  
  throw new Error("Could not find NEXT_PUBLIC_CONTRACT_ADDRESS in environment or env files.");
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY || process.argv[2];
  if (!privateKey) {
    console.error("Error: Please provide a private key as an argument or via the PRIVATE_KEY env variable.");
    console.error("Usage: npx tsx scripts/seed_demo_posts.ts <private_key>");
    process.exit(1);
  }

  const contractAddress = getContractAddress();
  console.log(`Using Contract Address: ${contractAddress}`);

  const account = createAccount(privateKey as `0x${string}`);
  console.log(`Using Seeding Address: ${account.address}`);

  const client = createClient({
    chain: studionet,
    account: account,
    endpoint: "https://studio.genlayer.com/api",
  });

  // Check balance and claim starter tokens if needed
  try {
    const rawBalance = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: "get_balance",
      args: [account.address],
    });
    const balance = Number(rawBalance);
    console.log(`Current Balance: ${balance} TRUTH`);
    
    if (balance <= 5) {
      console.log("Balance is low. Claiming starter tokens...");
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "claim_starter_tokens",
        args: [],
      });
      console.log(`Claim transaction sent: ${hash}. Waiting for finalization...`);
      await client.waitForTransactionReceipt({ hash, status: "FINALIZED" }).catch((err: any) => {
        console.log(`Note: Faucet finalization wait returned: ${err.message || err}. Proceeding...`);
      });
      console.log("Starter tokens claim processed!");
    }
  } catch (e: any) {
    console.warn("Could not check/claim balance (it might be the first run/no balance yet):", e.message || e);
  }

  const postsToSeed = [
    {
      id: "post_1",
      content: "Breaking: SpaceX just announced a permanent Mars colony to be established by 2027.",
    },
    {
      id: "post_2",
      content: "Bitcoin reached $100K in early 2025, breaking all previous records.",
    },
    {
      id: "post_3",
      content: "NASA confirmed an alien spacecraft was discovered over Antarctica in March 2026.",
    },
    {
      id: "post_4",
      content: "Global warming is just a natural cycle, Earth has been much hotter in the past so current warming is completely natural.",
    },
    {
      id: "post_5",
      content: "Christopher Nolan is the greatest filmmaker of our generation.",
    },
  ];

  for (const post of postsToSeed) {
    console.log(`\n--- Processing ${post.id} ---`);
    let postExists = false;
    let status = "PENDING";

    try {
      const rawPost = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_post",
        args: [post.id],
      });
      if (rawPost) {
        const parsed = JSON.parse(rawPost as string);
        postExists = true;
        status = parsed.status;
        console.log(`Post ${post.id} already exists on-chain with status: ${status}`);
      }
    } catch (e) {
      // Post does not exist yet
    }

    if (!postExists) {
      console.log(`Creating post: "${post.content.substring(0, 40)}..."`);
      try {
        const hash = await client.writeContract({
          address: contractAddress as `0x${string}`,
          functionName: "create_post",
          args: [post.content, post.id],
        });
        console.log(`Create transaction sent: ${hash}. Waiting for finalization...`);
        await client.waitForTransactionReceipt({ hash, status: "FINALIZED" }).catch((err: any) => {
          console.log(`Note: Create finalization wait returned: ${err.message || err}. Proceeding...`);
        });
        console.log("Post creation transaction processed!");
        
        // Wait 2 seconds to ensure state propagation before checking/verifying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e: any) {
        console.error(`Failed to create post ${post.id}:`, e.message || e);
        continue;
      }
    }

    // Re-verify status to be sure it's pending before triggering AI Jury
    try {
      const rawPost = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_post",
        args: [post.id],
      });
      if (rawPost) {
        const parsed = JSON.parse(rawPost as string);
        status = parsed.status;
      }
    } catch (e) {}

    if (status === "PENDING") {
      console.log("Triggering AI Jury verification...");
      try {
        const hash = await client.writeContract({
          address: contractAddress as `0x${string}`,
          functionName: "verify_post",
          args: [post.id],
        });
        console.log(`Verify transaction sent: ${hash}. Waiting for AI Jury consensus...`);
        await client.waitForTransactionReceipt({ hash, status: "FINALIZED" }).catch((err: any) => {
          console.log(`Note: Verify finalization wait returned: ${err.message || err}. Proceeding...`);
        });
        console.log("AI Jury verification transaction processed!");
      } catch (e: any) {
        console.error(`Failed to verify post ${post.id}:`, e.message || e);
      }
    } else {
      console.log(`Skipping verification: post status is already ${status}`);
    }
  }

  console.log("\nSeeding completed successfully!");
}

main().catch((err) => {
  console.error("Fatal error in seed script:", err);
  process.exit(1);
});
