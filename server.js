const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are DU Guardian, an empathetic AI safety assistant for Delhi University students.
Your role:
1. Listen to students reporting harassment, ragging, threats, safety concerns, or stress.
2. Detect their emotional state: "safe", "stressed", or "unsafe".
3. Respond with compassion and clear guidance.
4. When a student describes a specific incident, offer to structure a formal complaint.

ALWAYS respond with ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "emotion": "safe" or "stressed" or "unsafe",
  "message": "Your warm empathetic response here",
  "shouldGenerateComplaint": true or false,
  "complaintData": null or {
    "incidentType": "Harassment / Ragging / Threat / Discrimination / Other",
    "date": "mentioned date or Today",
    "location": "mentioned location or Not specified",
    "formalDescription": "Formal third-person description of the incident for official complaint",
    "requestedAction": "Formal investigation / Disciplinary action / Counseling referral / Police report"
  }
}

Set shouldGenerateComplaint to true only when the student has described a specific incident.
Keep responses warm, concise, and empowering. Never dismiss any concern.`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not set in .env" });
  }

  try {
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    };

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Groq API error"
      });
    }

    const rawText = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          emotion: "safe",
          message: rawText,
          shouldGenerateComplaint: false,
          complaintData: null
        };
      }
    }

    res.json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: "llama-3.3-70b-versatile (Groq)", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  DU Guardian backend running at http://localhost:${PORT}`);
  console.log(`🦙  Groq/Llama3: ${GROQ_API_KEY ? "✅ Key loaded" : "❌ Missing — add GROQ_API_KEY to .env"}`);
  console.log(`🌐  Frontend: http://localhost:${PORT}\n`);
});
