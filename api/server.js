import { Firewall } from "../firewall/Firewall.js";
import { RegexScanner } from "../firewall/scanners/RegexScanner.js";
import { LLMScanner } from "../firewall/scanners/LLMScanner.js";
import { DocumentScanner } from "../firewall/scanners/DocumentScanner.js";
import { createFirewallMiddleware } from "../firewall/middleware.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const firewallInstance = new Firewall()
  .use(new RegexScanner())
  .use(new LLMScanner())
  .use(new DocumentScanner());

// This is your Vercel-compatible handler
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Manually run the firewall logic since middleware needs an Express-like req/res
    const { message, documentContent, enableFirewall } = req.body;
    let userInput = message || "";
    
    if (documentContent) userInput += "\n\nAttached Document:\n" + documentContent;

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(userInput);
    const response = await result.response;

    return res.status(200).json({
      reply: response.text(),
      risk: 0,
      blocked: false
    });
  } catch (err) {
    console.error("BACKEND ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
