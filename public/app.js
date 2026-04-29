
// =========================================
// TOGGLE IDENTITY FIELDS
// =========================================
function toggleIdentityFields() {
  const isAnon = document.getElementById("anonCheck").checked;
  document.getElementById("identityFields").style.display = isAnon ? "none" : "block";
}

// =========================================
// DU GUARDIAN — app.js (Frontend)
// Calls /api/chat on our Node.js backend.
// No API keys in frontend!
// =========================================
// Fix: Always point to the Node.js backend
const API_BASE = window.location.port === "5500" 
  ? "http://localhost:3000" 
  : "";

let conversationHistory = [];
let currentEmotion = "safe";
let lastComplaintData = null;

// =========================================
// UI HELPERS
// =========================================
function openChat() {
  document.getElementById("chatSection").scrollIntoView({ behavior: "smooth" });
}
function showSOS() {
  document.getElementById("sosOverlay").classList.add("active");
}
function hideSOS() {
  document.getElementById("sosOverlay").classList.remove("active");
}
function trackComplaint() {
  document.getElementById("trackModal").classList.add("active");
}
function closeTrackModal() {
  document.getElementById("trackModal").classList.remove("active");
  document.getElementById("trackResult").style.display = "none";
}
function closeComplaintModal() {
  document.getElementById("complaintModal").classList.remove("active");
}
function closeHashModal() {
  document.getElementById("hashModal").classList.remove("active");
}

// =========================================
// EMOTION STATE
// =========================================
function updateEmotionState(emotion) {
  currentEmotion = emotion;
  ["Safe", "Stressed", "Unsafe"].forEach(e =>
    document.getElementById("badge" + e).classList.remove("active")
  );
  const noteEl = document.getElementById("emotionNote");
  if (emotion === "safe") {
    document.getElementById("badgeSafe").classList.add("active");
    noteEl.textContent = "You seem safe. Here if you need anything.";
  } else if (emotion === "stressed") {
    document.getElementById("badgeStressed").classList.add("active");
    noteEl.textContent = "I can sense some stress. Let me help.";
  } else if (emotion === "unsafe") {
    document.getElementById("badgeUnsafe").classList.add("active");
    noteEl.textContent = "Your safety matters. Let's act together.";
  }
}

// =========================================
// CHAT WINDOW
// =========================================
function appendMessage(role, content) {
  const win = document.getElementById("chatWindow");
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-msg", role === "user" ? "user" : "bot");

  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  avatar.textContent = role === "user" ? "U" : "G";

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.innerHTML = content.replace(/\n/g, "<br/>");

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  win.appendChild(msgDiv);
  win.scrollTop = win.scrollHeight;
}

function showTypingIndicator() {
  const win = document.getElementById("chatWindow");
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-msg", "bot", "typing-indicator");
  msgDiv.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  avatar.textContent = "G";

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  win.appendChild(msgDiv);
  win.scrollTop = win.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// =========================================
// SEND MESSAGE → Backend → Gemini
// =========================================
async function sendMessage() {
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  conversationHistory.push({ role: "user", content: userText });
  input.value = "";
  sendBtn.disabled = true;
  showTypingIndicator();

  try {
    // Call our Node.js backend (no API key exposed here)
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory })
    });

    removeTypingIndicator();

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Backend error");
    }

    const parsed = await response.json();

    // Update emotion state
    updateEmotionState(parsed.emotion || "safe");

    // Build bot message
    let botMessage = parsed.message || "I'm here for you. Please tell me more.";

    if (parsed.shouldGenerateComplaint && parsed.complaintData) {
      lastComplaintData = parsed.complaintData;
      botMessage += `\n\n<strong>📋 I've drafted a formal complaint based on what you shared. Click below to review it before submitting.</strong>`;
      setTimeout(showComplaintButton, 300);
    }

    appendMessage("bot", botMessage);

    // Store assistant reply in history
    conversationHistory.push({ role: "assistant", content: parsed.message || "" });

  } catch (err) {
    removeTypingIndicator();
    console.error("Chat error:", err);
    appendMessage("bot",
      `⚠️ Connection issue. Please try again, or call <strong>1800-111-555</strong> immediately.<br/><small style="color:#888">Error: ${err.message}</small>`
    );
  }

  sendBtn.disabled = false;
}

// =========================================
// COMPLAINT BUTTON IN CHAT
// =========================================
function showComplaintButton() {
  const win = document.getElementById("chatWindow");
  const btnDiv = document.createElement("div");
  btnDiv.style.cssText = "display:flex;justify-content:center;padding:0.5rem 0;";
  btnDiv.innerHTML = `<button onclick="openComplaintModal()" style="
    background:rgba(232,255,71,0.12);
    border:1px solid rgba(232,255,71,0.4);
    color:#E8FF47;
    padding:0.6rem 1.5rem;
    border-radius:50px;
    font-family:'Syne',sans-serif;
    font-weight:600;
    font-size:0.85rem;
    cursor:pointer;">
    📋 Review Formal Complaint
  </button>`;
  win.appendChild(btnDiv);
  win.scrollTop = win.scrollHeight;
}

// =========================================
// COMPLAINT MODAL — PREFILL
// =========================================
function openComplaintModal() {
  if (!lastComplaintData) return;
  const d = lastComplaintData;
  document.getElementById("incidentType").value = d.incidentType || "";
  document.getElementById("incidentDate").value = d.date || new Date().toLocaleDateString("en-IN");
  document.getElementById("incidentLocation").value = d.location || "";
  document.getElementById("formalDesc").value = d.formalDescription || "";
  document.getElementById("requestedAction").value = d.requestedAction || "";
  document.getElementById("complaintModal").classList.add("active");
}

// =========================================
// SUBMIT COMPLAINT + SHA-256 + BLOCKCHAIN
// =========================================
async function submitComplaint() {
  const isAnon = document.getElementById("anonCheck").checked;
  const complaint = {
    incidentType: document.getElementById("incidentType").value,
    date: document.getElementById("incidentDate").value,
    location: document.getElementById("incidentLocation").value,
    description: document.getElementById("formalDesc").value,
    requestedAction: document.getElementById("requestedAction").value,
    isAnon,
    identity: isAnon ? null : {
      name: document.getElementById("studentName").value,
      branch: document.getElementById("studentBranch").value,
      year: document.getElementById("studentYear").value,
      roll: document.getElementById("studentRoll").value
    },
    submittedAt: new Date().toISOString()
  };

  const hash = await generateSHA256(JSON.stringify(complaint));

  // Save locally
  const stored = JSON.parse(localStorage.getItem("du_guardian_complaints") || "{}");
  stored[hash] = { complaint, hash, txHash: null, submittedAt: complaint.submittedAt };
  localStorage.setItem("du_guardian_complaints", JSON.stringify(stored));

  closeComplaintModal();

  document.getElementById("complaintHash").textContent = hash;
  document.getElementById("txHash").textContent = "Connecting MetaMask…";
  document.getElementById("hashModal").classList.add("active");

  // Try blockchain submission
  const txHash = await submitToBlockchain(hash, isAnon);
  if (txHash) {
    document.getElementById("txHash").textContent = txHash;
    stored[hash].txHash = txHash;
    localStorage.setItem("du_guardian_complaints", JSON.stringify(stored));
  }

  const onChain = stored[hash]?.txHash;
  const statusMsg = onChain
    ? `✅ Your complaint has been securely recorded on the blockchain.\n\nComplaint ID (save this):\n<code style="color:#E8FF47;font-size:0.75rem;word-break:break-all">${hash.substring(0, 40)}…</code>\n\nYou are not alone — we stand with you. 💛`
    : `🛡️ Don't be afraid to speak up — your complaint has been saved and hashed securely.\n\nComplaint ID (save this):\n<code style="color:#E8FF47;font-size:0.75rem;word-break:break-all">${hash.substring(0, 40)}…</code>\n\nEven without blockchain confirmation, your record is safe. We're here for you. 💛`;
  appendMessage("bot", statusMsg);
}

// =========================================
// SHA-256 (Web Crypto API — no library needed)
// =========================================
async function generateSHA256(text) {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// =========================================
// BLOCKCHAIN — MetaMask + Sepolia
// Uses ethers.js loaded in index.html
// =========================================
async function submitToBlockchain(hexHash, isAnon) {
  if (typeof window.ethereum === "undefined") {
    document.getElementById("txHash").textContent =
      "⚠️ MetaMask not installed. Hash is saved locally.";
    return null;
  }

  // ⚠️ Paste your Remix-deployed contract address here
  const CONTRACT_ADDRESS = "0x1217cd3b3d18970ddaccff04b22f0e380e914079";

  const ABI = [
    "function storeComplaint(bytes32 _hash, bool _isAnon) external",
    "function verifyComplaint(bytes32 _hash) external view returns (bool exists, uint256 timestamp, string memory status, bool isAnon)"
  ];

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Switch to Sepolia
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xaa36a7",
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"]
          }]
        });
      }
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const bytes32Hash = "0x" + hexHash;
    const tx = await contract.storeComplaint(bytes32Hash, isAnon);
    document.getElementById("txHash").textContent = "Waiting for confirmation…";
    await tx.wait(1);
    return tx.hash;

  } catch (err) {
    console.error("Blockchain error:", err);
    document.getElementById("txHash").textContent =
      `⚠️ On-chain failed: ${err.message}. Hash saved locally.`;
    return null;
  }
}

// =========================================
// VERIFY / TRACK COMPLAINT
// =========================================
function verifyHash() {
  const input = document.getElementById("trackHashInput").value.trim();
  const result = document.getElementById("trackResult");

  if (!input) {
    result.style.display = "block";
    result.className = "track-result not-found";
    result.textContent = "Please enter a hash.";
    return;
  }

  const stored = JSON.parse(localStorage.getItem("du_guardian_complaints") || "{}");
  const record = stored[input];
  result.style.display = "block";

  if (record) {
    result.className = "track-result verified";
    result.innerHTML = `✅ Complaint verified!<br/>
      Submitted: ${new Date(record.submittedAt).toLocaleString("en-IN")}<br/>
      ${record.txHash ? `Tx: ${record.txHash.substring(0, 22)}…` : "On-chain: pending MetaMask"}`;
  } else {
    result.className = "track-result not-found";
    result.textContent = "❌ No complaint found with this hash.";
  }
}

// =========================================
// ENTER KEY TO SEND
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
