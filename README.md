# 🛡️ DU Guardian — Campus Safety System

> **AI-powered, Blockchain-verified anonymous complaint system for Delhi University students.**
> Built at InnovateX Hackathon 2026 — Sri Aurobindo College, University of Delhi.

---

## 🎯 Problem Statement

Every year, thousands of Delhi University students face harassment, ragging, and threats — but most never report it. Why?

- 😰 **Fear of identity exposure** — reporting means being identified
- 🗑️ **Records get buried** — complaints can be deleted or ignored
- 📭 **No proof** — without tamper-proof records, denying complaints is easy

**DU Guardian solves all three.**

---

## ✅ Solution

A three-step system:

| Step | What Happens |
|------|-------------|
| 💬 **Talk to AI** | Student chats naturally — AI detects emotional state |
| 📋 **Review Complaint** | AI auto-generates a formal complaint draft |
| 🔗 **Store on Chain** | SHA-256 hash stored permanently on Ethereum |

---

## 🚀 Features

- 🤖 **AI Emotion Detection** — Detects Safe / Stressed / Unsafe in real-time
- 📝 **Auto-generated Complaints** — Llama 3.3 70B structures your words into a formal complaint
- 🔒 **SHA-256 Hashing** — Complaint fingerprinted using Web Crypto API in-browser
- ⛓️ **Blockchain Storage** — Hash stored on Ethereum Sepolia via MetaMask
- 👤 **Anonymous by Default** — No identity required; optional name/roll/branch/year
- 🔍 **Complaint Tracking** — Verify any complaint using its SHA-256 hash
- 🚨 **SOS Panel** — Emergency numbers (112, 100, 181, DU Helpline)
- 📱 **Responsive UI** — Works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI** | Llama 3.3 70B via Groq API (free tier) |
| **Blockchain** | Ethereum Sepolia + Solidity Smart Contract |
| **Web3** | Ethers.js v6 + MetaMask |
| **Hashing** | SHA-256 via Web Crypto API (native browser) |
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Backend** | Node.js + Express |
| **Deployment** | Render (backend) + Sepolia Testnet (contract) |

---

## 📁 Project Structure

```
DU Guardian/
├── public/
│   ├── index.html        # Main frontend UI
│   ├── style.css         # Dark theme styling
│   ├── app.js            # Frontend logic, blockchain, hashing
│   └── blockchain.js     # Ethers.js MetaMask connector
├── server.js             # Node.js + Express backend
├── package.json          # Dependencies
├── .env                  # API keys (never commit this)
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Sepolia testnet ETH ([get free from faucet](https://sepoliafaucet.com))

### 1. Clone the repository

```bash
git clone https://github.com/YOURNAME/DU-Guardian.git
cd du-guardian
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

> Get your free Groq API key at: https://console.groq.com

### 4. Run the server

```bash
node server.js
```

### 5. Open in browser

```
http://localhost:3000
```

---

## 🌍 Production Deployment (Render)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Configure:

| Field | Value |
|-------|-------|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance Type | Free |

5. Add environment variables:
   - `GROQ_API_KEY` = your key
   - `PORT` = 3000

6. Deploy — live in ~2 minutes ✅

---

## ⛓️ Smart Contract

**Contract:** `ComplaintRegistry.sol`
**Network:** Ethereum Sepolia Testnet
**Address:** `0x1217cd3b3d18970ddaccff04b22f0e380e914079`
**Deployed via:** Remix IDE

### Functions

```solidity
// Store a complaint hash on-chain
storeComplaint(bytes32 _complaintHash, bool _anonymous)

// Verify if a complaint exists
verifyComplaint(bytes32 _complaintHash)
  returns (bool exists, uint256 timestamp, string status, bool anonymous)

// Get total complaints filed
getTotalComplaints() returns (uint256)
```

> View on Etherscan: https://sepolia.etherscan.io/address/0x1217cd3b3d18970ddaccff04b22f0e380e914079

---

## 🔐 How Anonymity Works

```
Student Message
      ↓
AI generates complaint JSON
      ↓
SHA-256 hash generated IN BROWSER (Web Crypto API)
      ↓
Only the 64-char hash goes to blockchain
      ↓
Actual complaint content NEVER leaves the device
      ↓
Hash stored on Ethereum = tamper-proof timestamp proof
```

No server ever sees your identity. No admin can delete the record.

---

## 📊 Impact

- 🎓 **3 Lakh+** Delhi University students
- 🏫 **90+ colleges** across DU
- 💰 **Zero cost** to run (Groq free tier + Sepolia testnet)
- 🌍 **Scalable** to any university in India

---

## 🔮 Roadmap

- [ ] Authority dashboard with anonymised complaint trends
- [ ] UGC anti-ragging portal integration
- [ ] Mobile app (iOS + Android)
- [ ] Hindi + regional language support
- [ ] Mainnet deployment
- [ ] Multi-university support

---

## 🧑‍💻 API Reference

### POST `/api/chat`

Send a message and get AI response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "I am being harassed by my senior" }
  ]
}
```

**Response:**
```json
{
  "emotion": "unsafe",
  "message": "I hear you, and I'm so sorry...",
  "shouldGenerateComplaint": true,
  "complaintData": {
    "incidentType": "Harassment",
    "date": "Today",
    "location": "Not specified",
    "formalDescription": "The student reports...",
    "requestedAction": "Formal investigation"
  }
}
```

### GET `/api/health`

```json
{
  "status": "ok",
  "model": "llama-3.3-70b-versatile (Groq)",
  "time": "2026-04-29T12:00:00.000Z"
}
```

---

## ⚠️ Important Notes

- **Never commit `.env`** — your API key must stay private
- **Render free tier** sleeps after 15 min inactivity — open the URL 5 min before demo
- **Sepolia ETH** is free test currency — get from [sepoliafaucet.com](https://sepoliafaucet.com)
- **MetaMask** must be on Sepolia network for blockchain submission

---

## 📜 License

MIT License — free to use, modify, and deploy.

---

## 🙏 Built With

- [Groq](https://groq.com) — Free Llama inference
- [Ethers.js](https://ethers.org) — Ethereum library
- [Remix IDE](https://remix.ethereum.org) — Smart contract deployment
- [Render](https://render.com) — Free hosting

---

<div align="center">

**🛡️ DU Guardian — Give Every Student Their Voice Back**

*Built at InnovateX Hackathon 2026 | Sri Aurobindo College, University of Delhi*

</div>
