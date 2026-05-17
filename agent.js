const ANTHROPIC_API_KEY = "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
";

const MODES = {
  general: "You are a GxP Compliance AI Agent. Answer the user's question with expert regulatory knowledge.",
  audit: `You are preparing or analyzing a GxP audit report. Structure your response with:
1. AUDIT SCOPE & OBJECTIVE
2. REGULATORY STANDARDS APPLIED (cite specific regulations)
3. FINDINGS (Critical / Major / Minor)
4. EVIDENCE REVIEWED
5. COMPLIANCE STATUS
6. CORRECTIVE ACTION RECOMMENDATIONS (CAPA)
Be specific and cite regulation numbers where applicable.`,
  qms: `You are analyzing a QMS document or SOP for GxP compliance gaps. Structure your response as:
1. DOCUMENT SUMMARY
2. COMPLIANCE GAPS IDENTIFIED (with regulation references)
3. INACCURACIES OR AMBIGUITIES
4. RISK LEVEL (High / Medium / Low) for each gap
5. RECOMMENDED CORRECTIONS
Reference specific regulations (e.g. 21 CFR Part 211, EU GMP Annex, ICH Q10).`,
  compare: `You are comparing GxP regulations across jurisdictions (EU, USA, Japan, China, Australia).
Provide a clear breakdown showing:
- What each jurisdiction requires
- Key differences
- Areas of harmonization (ICH guidelines)
- Practical implications for a multi-market company`,
  develop: `You are helping an early-stage company build a QMS from scratch. Structure your guidance as:
1. COMPANY PHASE (Pre-clinical / Clinical / Commercial)
2. MANDATORY QMS ELEMENTS for their stage
3. RECOMMENDED SOPs TO CREATE (with purpose)
4. REGULATORY SUBMISSIONS TO PREPARE FOR
5. COMMON MISTAKES TO AVOID
6. TIMELINE & PRIORITIZATION`
};

const BASE_SYSTEM_PROMPT = `You are an elite GxP Compliance AI Agent with deep expertise in:

REGULATIONS:
- USA: FDA 21 CFR Parts 11, 210, 211, 212, 600s, 820; ICH guidelines; FDA Guidance Documents
- EU: EudraLex Volume 4 (GMP), Annex 1-21, EMA guidelines, EU MDR/IVDR
- Japan: PMDA regulations, MHLW Ministerial Ordinance No. 179, JGMP
- China: NMPA GMP (2010 revision), China GMP for APIs, NMPA guidance
- Australia: TGA Code of GMP, PIC/S GMP Guide, TGA regulatory guidelines
- International: ICH Q7-Q12, PIC/S, WHO GMP

CAPABILITIES:
1. Prepare and analyze GxP audit reports
2. Review QMS procedures and SOPs to identify compliance gaps
3. Compare regulatory requirements across jurisdictions
4. Develop QMS frameworks for early-stage companies
5. Identify CAPA requirements
6. Advise on data integrity (21 CFR Part 11, EU Annex 11)

Always cite specific regulation numbers. Be precise, structured, and professional.`;

let currentMode = "general";
let conversationHistory = [];

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentMode = tab.dataset.mode;
    conversationHistory = [];
    addMessage("agent", `Mode switched to ${tab.textContent}. How can I help you?`);
  });
});

function addMessage(role, text) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerHTML = `<strong>${role === "user" ? "You" : "GxP Agent"}</strong><p>${text}</p>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("user", userText);
  input.value = "";
  sendBtn.disabled = true;

  conversationHistory.push({ role: "user", content: userText });

  const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nCURRENT MODE INSTRUCTIONS:\n${MODES[currentMode]}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: conversationHistory
      })
    });

    const data = await response.json();
    const agentReply = data.content[0].text;

    conversationHistory.push({ role: "assistant", content: agentReply });
    addMessage("agent", agentReply);

  } catch (err) {
    addMessage("agent", "Error connecting to the AI. Please check your API key and internet connection.");
    console.error(err);
  }

  sendBtn.disabled = false;
}

document.getElementById("userInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
