export async function gradeWithAI({ instructions, content }) {
  const body = {
    model: "openrouter/auto", // or a specific model, e.g., "anthropic/claude-3.5-sonnet"
    messages: [
      { role: "system", content: "You are a strict but helpful grader. Return constructive feedback and a 0-100 score." },
      { role: "user", content: `Assignment instructions:\n${instructions}\n\nStudent submission:\n${content}\n\nReturn JSON: {"feedback": string, "score": number}` }
    ],
    temperature: 0.2
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      // These two headers improve OpenRouter reliability/quotas:
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
      "X-Title": process.env.OPENROUTER_APP_NAME || "TeachAI"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const out = data.choices?.[0]?.message?.content || "";
  // Try to parse JSON chunk from the model output:
  const jsonMatch = out.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { feedback: out, score: null };
}
