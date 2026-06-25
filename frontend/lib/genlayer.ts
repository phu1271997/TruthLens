import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

let _client: ReturnType<typeof createClient> | null = null;

const envAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
export const CONTRACT_ADDRESS = (
  envAddress && envAddress !== "undefined" && envAddress !== "null"
    ? envAddress
    : "0x553dF22e2bBCcEABb2D83d9F0b0FFAbBB7b559A7"
) as `0x${string}`;

export function getClient(): ReturnType<typeof createClient> {
  if (typeof window === "undefined") {
    // Server-side fallback — read-only, no provider
    if (!_client) {
      _client = createClient({
        chain: studionet,
        endpoint: "https://studio.genlayer.com/rpc",
      } as any);
    }
    return _client;
  }

  const w = window as any;
  const provider = w.ethereum;

  _client = createClient({
    chain: studionet,
    provider,
    endpoint: "https://studio.genlayer.com/rpc",
  } as any);
  return _client;
}

export function getAccount(): `0x${string}` | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as any;
  const addr = w.ethereum?.selectedAddress;
  if (!addr || addr === "undefined" || addr === "null") return undefined;
  return addr as `0x${string}`;
}

export async function connectWallet(): Promise<`0x${string}`> {
  const w = window as any;
  if (!w.ethereum) {
    throw new Error(
      "MetaMask not detected. Please install MetaMask and reload."
    );
  }
  // Try switching to GenLayer Studio network (chainId 1234 = 0x4D2)
  try {
    await w.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x4D2" }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await w.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x4D2",
            chainName: "GenLayer Studio",
            rpcUrls: ["https://studio.genlayer.com/rpc"],
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            blockExplorerUrls: ["https://studio.genlayer.com/explorer"],
          },
        ],
      });
    }
  }
  const accounts = await w.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0 || !accounts[0] || accounts[0] === "undefined" || accounts[0] === "null") {
    throw new Error("No valid account connected.");
  }
  getClient(); // re-init client with provider
  return accounts[0] as `0x${string}`;
}

export async function readContract(
  method: string,
  args: any[] = []
): Promise<unknown> {
  if (!CONTRACT_ADDRESS || (CONTRACT_ADDRESS as string) === "undefined" || (CONTRACT_ADDRESS as string) === "null") {
    throw new Error("Contract address not set or is invalid");
  }
  const client = getClient();
  return (client as any).readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
}

export async function writeContract(
  method: string,
  args: any[] = [],
  account?: string
): Promise<unknown> {
  if (!CONTRACT_ADDRESS || (CONTRACT_ADDRESS as string) === "undefined" || (CONTRACT_ADDRESS as string) === "null") {
    throw new Error("Contract address not set or is invalid");
  }
  const client = getClient();
  const activeAccount = account || getAccount();
  
  const options: any = {
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  };
  
  if (activeAccount && activeAccount !== "undefined" && activeAccount !== "null") {
    options.account = activeAccount;
  }
  
  return (client as any).writeContract(options);
}
