const CONTRACT_ADDRESS = "0x1217cd3b3d18970ddaccff04b22f0e380e914079";

// ABI — only the functions we need from ComplaintRegistry.sol
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_complaintHash", "type": "bytes32" },
      { "internalType": "bool", "name": "_anonymous", "type": "bool" }
    ],
    "name": "storeComplaint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_complaintHash", "type": "bytes32" }
    ],
    "name": "verifyComplaint",
    "outputs": [
      { "internalType": "bool", "name": "exists", "type": "bool" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "string", "name": "status", "type": "string" },
      { "internalType": "bool", "name": "anonymous", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalComplaints",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "complaintHash", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "submitter", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "anonymous", "type": "bool" }
    ],
    "name": "ComplaintStored",
    "type": "event"
  }
];

// Sepolia Testnet chain ID
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";

let provider = null;
let signer = null;
let contract = null;

// =========================================
// CONNECT METAMASK
// =========================================
async function connectMetaMask() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed. Please install MetaMask from https://metamask.io");
  }

  // Request account access
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // Switch to Sepolia
  await switchToSepolia();

  // Create ethers provider and signer
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  // Instantiate contract
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const address = await signer.getAddress();
  console.log("Connected to MetaMask:", address);
  return address;
}

// =========================================
// SWITCH TO SEPOLIA TESTNET
// =========================================
async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }]
    });
  } catch (err) {
    // Chain not added — add it
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: SEPOLIA_CHAIN_HEX,
          chainName: "Sepolia Testnet",
          nativeCurrency: {
            name: "Sepolia Ether",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: [
            "https://rpc.sepolia.org",
            "https://sepolia.gateway.tenderly.co"
          ],
          blockExplorerUrls: ["https://sepolia.etherscan.io"]
        }]
      });
    } else {
      throw err;
    }
  }
}

// =========================================
// STORE COMPLAINT ON-CHAIN
// =========================================
/**
 * @param {string} hexHash - SHA-256 hash as hex string (without 0x)
 * @param {boolean} anonymous - Whether to submit anonymously
 * @returns {string} Transaction hash
 */
async function storeComplaintOnChain(hexHash, anonymous = true) {
  if (!contract) {
    await connectMetaMask();
  }

  // Convert hex string to bytes32
  const bytes32Hash = "0x" + hexHash;

  console.log("Submitting complaint to Sepolia...", bytes32Hash);

  // Call the smart contract
  const tx = await contract.storeComplaint(bytes32Hash, anonymous);

  console.log("Transaction sent:", tx.hash);

  // Wait for 1 confirmation
  const receipt = await tx.wait(1);

  console.log("Confirmed in block:", receipt.blockNumber);
  return tx.hash;
}

// =========================================
// VERIFY COMPLAINT ON-CHAIN
// =========================================
/**
 * @param {string} hexHash - SHA-256 hash as hex string (without 0x)
 * @returns {object} { exists, timestamp, status, anonymous }
 */
async function verifyComplaintOnChain(hexHash) {
  if (!provider) {
    // Read-only provider for verification (no MetaMask needed)
    provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  }

  const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const bytes32Hash = "0x" + hexHash;

  const [exists, timestamp, status, anonymous] = await readContract.verifyComplaint(bytes32Hash);

  return {
    exists,
    timestamp: exists ? new Date(Number(timestamp) * 1000).toLocaleString("en-IN") : null,
    status,
    anonymous
  };
}

// =========================================
// GET TOTAL COMPLAINTS (Stats)
// =========================================
async function getTotalComplaintsFromChain() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  }
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const total = await readContract.getTotalComplaints();
  return Number(total);
}

// =========================================
// EXPORT (for use in app.js)
// =========================================
window.DUBlockchain = {
  connectMetaMask,
  storeComplaintOnChain,
  verifyComplaintOnChain,
  getTotalComplaintsFromChain
};
