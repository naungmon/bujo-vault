import { EntryType } from "../types";

function isElectron(): boolean {
  return typeof window !== 'undefined' && window.bujo !== undefined;
}

export async function parseDump(dumpText: string): Promise<{ type: EntryType; content: string }[]> {
  if (isElectron()) {
    const results = await window.bujo.smartParse(dumpText);
    return results.map(([type, content]) => ({ type: type as EntryType, content }));
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key is missing. Please set OPENROUTER_API_KEY in Settings -> Secrets.");
  }

  const prompt = `Parse the following brain dump into bullet journal entries.
    
    The user is using an ADHD-friendly bullet journal. They dumped a paragraph of text.
    Break it down into individual actionable or notable items.
    
    Assign each item one of the following types:
    - 'task': A to-do item
    - 'done': A completed task
    - 'migrated': A task moved to another day
    - 'killed': A canceled or abandoned task
    - 'note': A general thought, feeling, or observation
    - 'event': A meeting, appointment, or happening
    - 'scheduled': A task scheduled for a specific future time
    - 'priority': A highly important task
    
    Return ONLY a valid JSON array of objects, each with a 'type' and 'content' string. Do not include markdown formatting like \`\`\`json. Keep the content concise and actionable.
    
    Dump: "${dumpText}"`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "BuJo Vault"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let jsonStr = data.choices[0]?.message?.content?.trim() || "[]";
    
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    return [];
  }
}
