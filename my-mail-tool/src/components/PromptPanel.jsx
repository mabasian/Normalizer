import { useState } from "react";

const DEFAULT_SYSTEM_PROMPT = `ROLE

You extract structured calendar items (appointments, tasks, deadlines)
from normalized Outlook emails and attachment content.

Return ONLY one valid JSON object.
No explanation.`;

const DEFAULT_USER_PROMPT = `Analyze the following normalized email input and return the result strictly in the required JSON format.`;

export default function PromptPanel({ normalizedText }) {
  const [modelName, setModelName] = useState("cyankiwi/GLM-4.7-Flash-AWQ-8bit");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT);
  const [llmInput, setLlmInput] = useState("");
  const [llmOutput, setLlmOutput] = useState("");

  const sendToBackend = async () => {
    try {
      const payload = {
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt}\n\n${llmInput}` },
        ],
      };

      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload }),
      });

      const data = await res.json();

      const text =
        data?.choices?.[0]?.message?.content ||
        JSON.stringify(data, null, 2);

      setLlmOutput(text);
    } catch (err) {
      setLlmOutput("ERROR: " + err.message);
    }
  };

  const prepareLlmInput = () => {
    setLlmInput(normalizedText || "");
    setLlmOutput("");
  };

  const copySystemPrompt = async () => {
    await navigator.clipboard.writeText(systemPrompt);
  };

  const copyUserPrompt = async () => {
    await navigator.clipboard.writeText(userPrompt);
  };

  const copyLlmInput = async () => {
    await navigator.clipboard.writeText(llmInput);
  };

  const copyAll = async () => {
    const combined = `MODEL:
${modelName}

SYSTEM PROMPT:
${systemPrompt}

USER PROMPT:
${userPrompt}

NORMALIZED INPUT:
${llmInput}`;

    await navigator.clipboard.writeText(combined);
  };

  return (
    <div>
      <h2>Prompt Panel</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Model Name</label>
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          style={{ width: "100%", height: 180 }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={copySystemPrompt}>Copy System Prompt</button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>User Prompt</label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          style={{ width: "100%", height: 120 }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={copyUserPrompt}>Copy User Prompt</button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={prepareLlmInput}>Prepare LLM Input</button>
        <button onClick={copyLlmInput} style={{ marginLeft: 8 }}>
          Copy Normalized Input
        </button>
        <button onClick={copyAll} style={{ marginLeft: 8 }}>
          Copy All
        </button>
        <button onClick={sendToBackend} style={{ marginLeft: 8 }}>
          Send (Backend)
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Normalized Input</label>
        <textarea
          value={llmInput}
          readOnly
          style={{ width: "100%", height: 260 }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6 }}>LLM Output</label>
        <textarea
          value={llmOutput}
          onChange={(e) => setLlmOutput(e.target.value)}
          placeholder="Paste LLM output here..."
          style={{ width: "100%", height: 220 }}
        />
      </div>
    </div>
  );
}