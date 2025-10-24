// Helper function to call OpenRouter
async function callOpenRouter(body) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Innodeed Classroom"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Your existing function for grading
 */
export async function gradeWithAI({ instructions, content }) {
  const body = {
    model: "openrouter/auto",
    messages: [
      { role: "system", content: "You are a strict but helpful grader. Return constructive feedback and a 0-100 score. Respond in JSON." },
      { role: "user", content: `Assignment instructions:\n${instructions}\n\nStudent submission:\n${content}\n\nReturn JSON: {"feedback": string, "score": number}` }
    ],
    temperature: 0.2
  };
  
  const out = await callOpenRouter(body);
  const jsonMatch = out.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { feedback: out, score: null };
}

/**
 * --- NEW FUNCTION FOR GETTING HINTS ---
 */
export async function getHintWithAI({ title, instructions }) {
  const body = {
    model: "openrouter/auto", // Or a faster model like "mistralai/mistral-7b-instruct"
    messages: [
      { role: "system", content: "You are a helpful teaching assistant. A student is stuck on an assignment. Your goal is to give them a *small conceptual hint* or a *guiding question* to get them started. DO NOT give them the direct answer or write code for them. Keep your response brief (2-3 sentences). Respond in plain text, not JSON." },
      { role: "user", content: `Assignment Title:\n${title}\n\nInstructions:\n${instructions}` }
    ],
    temperature: 0.5
  };

  const hint = await callOpenRouter(body);
  return { hint: hint };
}