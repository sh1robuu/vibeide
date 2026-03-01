import { GoogleGenAI } from '@google/genai';

export interface PromptEvaluation {
  score: number;
  clarity: number;
  specificity: number;
  structure: number;
  feedback: string;
  improvedPrompt: string;
  weaknesses: string[];
}

export interface IdeaSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'ui' | 'gamification';
}

/**
 * Represents a single file change proposed by the agent.
 */
export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  content?: string;
}

/**
 * The response from the agent: contains a conversational message
 * and optionally file changes for the user to review.
 */
export interface AgentResponse {
  message: string;
  fileChanges?: FileChange[];
  hasCodeChange: boolean;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const getModelName = (displayName: string): string => {
  switch (displayName) {
    case 'Gemini 3 Flash': return 'gemini-3-flash-preview';
    case 'Qwen 3 Coder': return 'qwen3-coder-next';
    default: return 'gemini-3-flash-preview';
  }
};

const isOllamaModel = (modelId: string): boolean => {
  return ['qwen3-coder-next'].includes(modelId);
};

const callOllamaAPI = async (
  modelId: string,
  systemInstruction: string,
  userMessage: string
): Promise<string> => {
  const ollamaKey = import.meta.env.VITE_OLLAMA_API_KEY || '';
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'https://ollama.com/api/v1';

  const response = await fetch(`${ollamaBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ollamaKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Ollama API error (${response.status}): ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

const callGeminiAPI = async (
  modelId: string,
  systemInstruction: string,
  userMessage: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: modelId,
    contents: userMessage,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });
  return response.text || '';
};

const callAI = async (
  modelId: string,
  systemInstruction: string,
  userMessage: string
): Promise<string> => {
  if (isOllamaModel(modelId)) {
    return callOllamaAPI(modelId, systemInstruction, userMessage);
  }
  return callGeminiAPI(modelId, systemInstruction, userMessage);
};

/**
 * Streams response from Gemini using generateContentStream.
 */
async function* streamGeminiAPI(
  modelId: string,
  systemInstruction: string,
  userMessage: string
): AsyncGenerator<string> {
  const response = await ai.models.generateContentStream({
    model: modelId,
    contents: userMessage,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/**
 * Streams response from Ollama using SSE/streaming endpoint.
 */
async function* streamOllamaAPI(
  modelId: string,
  systemInstruction: string,
  userMessage: string
): AsyncGenerator<string> {
  const ollamaKey = import.meta.env.VITE_OLLAMA_API_KEY || '';
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'https://ollama.com/api/v1';

  const response = await fetch(`${ollamaBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ollamaKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      stream: true
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Ollama API error (${response.status}): ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream from Ollama');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

/**
 * Streams AI response using the appropriate provider.
 */
function streamAI(
  modelId: string,
  systemInstruction: string,
  userMessage: string
): AsyncGenerator<string> {
  if (isOllamaModel(modelId)) {
    return streamOllamaAPI(modelId, systemInstruction, userMessage);
  }
  return streamGeminiAPI(modelId, systemInstruction, userMessage);
}

/**
 * Extracts the "message" value from partially streamed JSON for live display.
 * When the AI is streaming `{"message": "Hello world...", "fileChanges": [...]}`,
 * this tries to show the message portion progressively.
 */
const extractLiveMessage = (accumulated: string): string => {
  const trimmed = accumulated.trim();

  // Try to find the "message" field in partial JSON
  const msgMatch = trimmed.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)(?:")?/s);
  if (msgMatch) {
    // Unescape basic JSON escapes for display
    return msgMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  // If it doesn't look like JSON at all, just show the raw text
  if (!trimmed.startsWith('{')) {
    return trimmed;
  }

  // It might be JSON but we haven't reached the message field yet
  return '⏳ Thinking...';
};

/**
 * Parses the AI's structured JSON response into an AgentResponse.
 * Handles edge cases: markdown-wrapped JSON, plain text, raw HTML fallback.
 */
const parseAgentResponse = (raw: string): AgentResponse => {
  const trimmed = raw.trim();

  // Try to extract JSON — handles ```json ... ``` wrapping
  let jsonStr = trimmed;
  const jsonMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.message) {
      // Check if there are file changes
      const fileChanges: FileChange[] = [];

      if (Array.isArray(parsed.fileChanges)) {
        for (const fc of parsed.fileChanges) {
          if (fc.path && fc.action) {
            fileChanges.push({
              path: fc.path,
              action: fc.action,
              content: fc.content ?? undefined,
            });
          }
        }
      }

      return {
        message: parsed.message,
        fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
        hasCodeChange: fileChanges.length > 0,
      };
    }
  } catch {
    // JSON parsing failed
  }

  // Fallback: if it looks like HTML, treat it as a modification to index.html
  if (trimmed.includes('<!DOCTYPE html>') || trimmed.includes('<html')) {
    return {
      message: '✅ Tôi đã cập nhật code cho bạn!',
      fileChanges: [{ path: 'index.html', action: 'modify', content: trimmed }],
      hasCodeChange: true,
    };
  }

  // Otherwise, it's purely conversational
  return {
    message: trimmed,
    fileChanges: undefined,
    hasCodeChange: false,
  };
};

/**
 * The smart system prompt that enables the agent to chat, create files, modify files, and delete files.
 */
const AGENT_SYSTEM_PROMPT = `You are VibeBot — a friendly, smart AI coding assistant built into a web IDE for students (middle school and high school). You can CHAT and work with MULTIPLE FILES.

## YOUR PERSONALITY
- You are enthusiastic, supportive, and encouraging
- You explain things simply — your users are students learning to code
- You use emoji occasionally to keep things fun 🎉
- You can speak Vietnamese or English depending on the user's language
- You are like a friendly tutor who happens to be great at coding

## HOW TO RESPOND
You MUST respond in valid JSON format with this exact structure:
{
  "message": "Your conversational response here. ALWAYS include this.",
  "fileChanges": [
    {
      "path": "filename.ext",
      "action": "create | modify | delete",
      "content": "The COMPLETE file content (for create/modify). Omit for delete."
    }
  ]
}

## CRITICAL RULES

### About "message"
- ALWAYS include a "message" — explain what you did, answer questions, or just chat
- When you make file changes, describe WHAT you changed and WHY in the message
- For greetings like "hi", "hello", "xin chào" — just chat! Don't include fileChanges
- For questions about programming — explain in your message, only change files if asked

### About "fileChanges"
- Include "fileChanges" ONLY when the user asks to create, modify, or fix code
- Each file change must have: "path" (filename), "action" (create/modify/delete)
- For "create" and "modify": include "content" with the COMPLETE file content
- For "delete": don't include "content"
- You can change MULTIPLE files at once! For example, create index.html AND styles.css
- File paths should be simple filenames or relative paths (e.g., "styles.css" or "js/app.js")
- If no code changes are needed, OMIT the "fileChanges" field entirely

### About code quality
- Always write clean, well-commented, student-friendly code
- Use modern HTML5, CSS3, and vanilla JavaScript
- Add helpful comments so students can learn from the code
- Make webpages visually appealing with good design

## EXAMPLES

User says "hi":
{"message": "Chào bạn! 👋 Mình là VibeBot, trợ lý AI của bạn. Bạn muốn xây dựng gì hôm nay? Mình có thể giúp bạn tạo website, sửa code, hoặc giải thích các khái niệm lập trình! 🚀"}

User says "tạo web portfolio cho tôi":
{"message": "Tuyệt vời! 🎨 Mình đã tạo cho bạn một trang portfolio với:\\n- Header với tên và navigation\\n- Section giới thiệu với ảnh đại diện\\n- Section skills với cards\\n- Footer\\n\\nCode được chia thành 2 file: HTML cho cấu trúc và CSS cho styling. Bạn có thể tùy chỉnh thêm nhé!", "fileChanges": [{"path": "index.html", "action": "modify", "content": "<!DOCTYPE html>..."}, {"path": "styles.css", "action": "create", "content": "body { margin: 0; ... }"}]}

User says "CSS là gì?":
{"message": "CSS (Cascading Style Sheets) là ngôn ngữ dùng để trang trí trang web! 🎨\\n\\n**Ví dụ đơn giản:**\\n- \`color: red;\` → đổi màu chữ thành đỏ\\n- \`font-size: 20px;\` → chỉnh cỡ chữ\\n- \`background: blue;\` → đổi nền thành xanh\\n\\nBạn muốn mình làm ví dụ CSS trong code không?"}

User says "xóa file styles.css":
{"message": "Đã xóa file styles.css! 🗑️ Nhớ rằng nếu index.html đang link tới file này thì bạn cần xóa thẻ \`<link>\` trong HTML nữa nhé.", "fileChanges": [{"path": "styles.css", "action": "delete"}]}

IMPORTANT: Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.`;

export const agentService = {
  evaluatePrompt: async (prompt: string): Promise<PromptEvaluation> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const length = prompt.length;
        if (length < 20) {
          resolve({
            score: 4,
            clarity: 5,
            specificity: 3,
            structure: 4,
            feedback: "Your prompt is a bit too short! To get exactly what you want, try adding more details about colors, layout, and what the user should do.",
            improvedPrompt: `Create a ${prompt || 'webpage'} with a modern, dark-themed UI. Include a centered title, a glowing button, and a responsive layout using Flexbox.`,
            weaknesses: ["Missing visual details", "No layout instructions", "Too vague"],
          });
        } else {
          resolve({
            score: 8,
            clarity: 9,
            specificity: 7,
            structure: 8,
            feedback: "Great prompt! You gave clear instructions. To make it a 10/10, try specifying the exact colors or fonts you want to use.",
            improvedPrompt: prompt + " Use a neon green accent color (#00FF00) and the 'Inter' font for a futuristic vibe.",
            weaknesses: ["Could use exact color hex codes"],
          });
        }
      }, 1500);
    });
  },

  /**
   * Smart agent: can chat, create/modify/delete files.
   * Accepts all project files so the AI understands the full context.
   */
  chat: async (
    prompt: string,
    files: Record<string, string>,
    modelName: string = 'Gemini 3 Flash'
  ): Promise<AgentResponse> => {
    const actualModel = getModelName(modelName);

    // Build file context string
    const fileEntries = Object.entries(files);
    let fileContext = '';
    if (fileEntries.length > 0) {
      fileContext = fileEntries
        .map(([name, content]) => `--- File: ${name} ---\n${content}\n--- End of ${name} ---`)
        .join('\n\n');
    } else {
      fileContext = '(No files in the project yet)';
    }

    const userMessage = `## Current Project Files\n${fileContext}\n\n## User Message\n${prompt}`;

    try {
      const raw = await callAI(actualModel, AGENT_SYSTEM_PROMPT, userMessage);

      if (!raw) {
        throw new Error('AI returned empty response. Please try again.');
      }

      return parseAgentResponse(raw);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';

      if (message.includes('429') || message.toLowerCase().includes('quota')) {
        throw new Error(
          `⚠️ API quota exceeded for ${modelName}. Try switching to a different model or wait a few minutes.`
        );
      }
      if (message.includes('401') || message.includes('403')) {
        throw new Error(
          `🔑 Authentication failed for ${modelName}. Please check your API key in settings.`
        );
      }

      console.error(`[AgentService] Error with model ${modelName}:`, error);
      throw new Error(`Failed to connect to ${modelName}: ${message}`);
    }
  },

  /**
   * Streaming version of chat. Calls onChunk with progressive text,
   * then returns the final parsed AgentResponse.
   */
  chatStream: async (
    prompt: string,
    files: Record<string, string>,
    modelName: string = 'Gemini 3 Flash',
    onChunk: (accumulated: string) => void
  ): Promise<AgentResponse> => {
    const actualModel = getModelName(modelName);

    const fileEntries = Object.entries(files);
    let fileContext = '';
    if (fileEntries.length > 0) {
      fileContext = fileEntries
        .map(([name, content]) => `--- File: ${name} ---\n${content}\n--- End of ${name} ---`)
        .join('\n\n');
    } else {
      fileContext = '(No files in the project yet)';
    }

    const userMessage = `## Current Project Files\n${fileContext}\n\n## User Message\n${prompt}`;

    try {
      let accumulated = '';
      const stream = streamAI(actualModel, AGENT_SYSTEM_PROMPT, userMessage);

      for await (const chunk of stream) {
        accumulated += chunk;
        // Try to extract just the "message" portion for live display
        const liveText = extractLiveMessage(accumulated);
        onChunk(liveText);
      }

      if (!accumulated) {
        throw new Error('AI returned empty response. Please try again.');
      }

      return parseAgentResponse(accumulated);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      if (message.includes('429') || message.toLowerCase().includes('quota')) {
        throw new Error(`⚠️ API quota exceeded for ${modelName}. Try switching to a different model.`);
      }
      if (message.includes('401') || message.includes('403')) {
        throw new Error(`🔑 Authentication failed for ${modelName}. Check your API key.`);
      }
      console.error(`[AgentService] Error with model ${modelName}:`, error);
      throw new Error(`Failed to connect to ${modelName}: ${message}`);
    }
  },

  generateIdeas: async (): Promise<IdeaSuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Add a Dark Mode Toggle',
            description: 'Let users switch between a bright neon theme and a sleek dark mode.',
            type: 'ui',
          },
          {
            id: '2',
            title: 'Confetti on Click',
            description: 'Make it rain confetti when the user clicks the main button! 🎉',
            type: 'gamification',
          },
          {
            id: '3',
            title: 'User Profile Card',
            description: 'Add a floating card showing a user avatar and their current level.',
            type: 'feature',
          },
        ]);
      }, 1000);
    });
  }
};
