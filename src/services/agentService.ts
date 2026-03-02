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
  type: 'feature' | 'ui' | 'gamification' | 'animation';
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
    case 'Qwen 3 Coder': return 'qwen3-coder-next:cloud';
    case 'GPT-OSS 120B': return 'gpt-oss:120b-cloud';
    default: return 'gemini-3-flash-preview';
  }
};

const isOllamaModel = (modelId: string): boolean => {
  return ['qwen3-coder-next:cloud', 'gpt-oss:120b-cloud'].includes(modelId);
};

const callOllamaAPI = async (
  modelId: string,
  systemInstruction: string,
  userMessage: string
): Promise<string> => {
  const ollamaKey = import.meta.env.VITE_OLLAMA_API_KEY || '';

  // Always use streaming to avoid Ollama cloud timeout on large models
  const response = await fetch('/api/ollama', {
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

  // Accumulate streamed NDJSON chunks into full response
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        accumulated += json.message?.content || '';
      } catch {
        // skip non-JSON lines
      }
    }
  }

  return accumulated;
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

  const response = await fetch('/api/ollama', {
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
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        const content = json.message?.content;
        if (content) yield content;
      } catch {
        // Skip malformed chunks
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
  evaluatePrompt: async (prompt: string, lang: string = 'en', modelName: string = 'Gemini 3 Flash'): Promise<PromptEvaluation> => {
    const isVi = lang === 'vi';
    const actualModel = getModelName(modelName);

    const systemPrompt = isVi
      ? `Bạn là một chuyên gia hàng đầu về Prompt Engineering cho lĩnh vực lập trình (coding).
Nhiệm vụ: Phân tích prompt coding của user và đưa ra đánh giá chuyên sâu.

Tiêu chí đánh giá (mỗi mục 1-10):
- **clarity** (Rõ ràng): Prompt có diễn đạt rõ mục tiêu coding không? Có mơ hồ hay gây hiểu nhầm không?
- **specificity** (Cụ thể): Có nêu rõ công nghệ (HTML/CSS/JS), framework, thư viện cần dùng không? Có mô tả chi tiết giao diện, chức năng, hành vi không?
- **structure** (Cấu trúc): Prompt có được tổ chức logic không? Có chia nhỏ yêu cầu thành các bước/phần rõ ràng không?

Quy tắc:
- CHỈ đánh giá prompt liên quan đến coding/lập trình. Nếu prompt không liên quan đến coding, nhẹ nhàng nhắc user rằng Mentor chỉ hỗ trợ prompt coding.
- Đề xuất improvedPrompt phải giữ nguyên ý tưởng gốc nhưng thêm chi tiết kỹ thuật: màu sắc cụ thể (hex), font chữ, responsive, animation, cấu trúc file, v.v.
- Liệt kê weaknesses cụ thể và cách khắc phục.
- Phản hồi bằng tiếng Việt, thân thiện, dùng emoji.

Trả về JSON thuần (KHÔNG wrap trong code block):
{
  "score": <1-10>,
  "clarity": <1-10>,
  "specificity": <1-10>,
  "structure": <1-10>,
  "feedback": "<nhận xét chi tiết>",
  "improvedPrompt": "<prompt đã cải thiện với chi tiết kỹ thuật>",
  "weaknesses": ["<điểm yếu 1>", "<điểm yếu 2>"]
}`
      : `You are a world-class Prompt Engineering expert specializing in coding and software development prompts.
Your mission: Analyze the user's coding prompt and provide expert-level feedback.

Evaluation criteria (each 1-10):
- **clarity**: Is the coding goal clearly stated? Any ambiguity or room for misinterpretation?
- **specificity**: Does it specify technologies (HTML/CSS/JS), frameworks, libraries? Does it describe UI details, functionality, behavior?
- **structure**: Is the prompt organized logically? Are requirements broken down into clear steps/sections?

Rules:
- ONLY evaluate coding/programming related prompts. If the prompt is not about coding, gently remind the user that Mentor only supports coding prompts.
- The improvedPrompt must preserve the original idea but add technical details: specific colors (hex codes), fonts, responsive design, animations, file structure, etc.
- List concrete weaknesses with actionable fixes.
- Be friendly and encouraging, use emoji.

Return pure JSON (do NOT wrap in code block):
{
  "score": <1-10>,
  "clarity": <1-10>,
  "specificity": <1-10>,
  "structure": <1-10>,
  "feedback": "<detailed expert feedback>",
  "improvedPrompt": "<improved prompt with technical details>",
  "weaknesses": ["<weakness 1>", "<weakness 2>"]
}`;

    try {
      const raw = await callAI(actualModel, systemPrompt, `Evaluate this coding prompt: "${prompt}"`);
      const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        score: parsed.score || 5,
        clarity: parsed.clarity || 5,
        specificity: parsed.specificity || 5,
        structure: parsed.structure || 5,
        feedback: parsed.feedback || (isVi ? 'Không thể phân tích prompt.' : 'Could not analyze prompt.'),
        improvedPrompt: parsed.improvedPrompt || prompt,
        weaknesses: parsed.weaknesses || [],
      };
    } catch (error) {
      console.error('[evaluatePrompt] Error:', error);
      return {
        score: 5, clarity: 5, specificity: 5, structure: 5,
        feedback: isVi ? '⚠️ Không thể kết nối AI để đánh giá. Hãy thử lại sau.' : '⚠️ Could not connect to AI for evaluation. Please try again.',
        improvedPrompt: prompt,
        weaknesses: [isVi ? 'Lỗi kết nối' : 'Connection error'],
      };
    }
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

  generateIdeas: async (files: Record<string, string>, lang: string = 'en'): Promise<IdeaSuggestion[]> => {
    const isVi = lang === 'vi';
    const fileNames = Object.keys(files);
    const fileSummary = fileNames.length > 0
      ? fileNames.map(f => `- ${f}`).join('\n')
      : '(Empty project)';

    const systemPrompt = isVi
      ? `Bạn là một trợ lý sáng tạo giúp học sinh cải thiện dự án web.
Dựa trên các file hiện tại trong project, đề xuất 3-4 ý tưởng cụ thể, thực tế.
Trả về JSON (KHÔNG wrap trong code block):
[{"id":"1","title":"<tiêu đề>","description":"<mô tả chi tiết>","type":"<ui|feature|gamification|animation>"},...]
Phản hồi bằng tiếng Việt, thân thiện, dùng emoji.`
      : `You are a creative assistant helping students improve their web project.
Based on the current project files, suggest 3-4 specific, actionable ideas.
Return JSON (do NOT wrap in code block):
[{"id":"1","title":"<title>","description":"<detailed description>","type":"<ui|feature|gamification|animation>"},...]
Be friendly, use emoji, respond in English.`;

    try {
      const raw = await callAI('gemini-3-flash-preview', systemPrompt, `My project has these files:\n${fileSummary}\n\nSuggest improvements!`);
      const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[generateIdeas] Error:', error);
      return [
        { id: '1', title: isVi ? '🎨 Thêm hiệu ứng hover' : '🎨 Add hover effects', description: isVi ? 'Làm các nút và thẻ sáng lên khi di chuột qua' : 'Make buttons and cards glow on hover', type: 'ui' },
        { id: '2', title: isVi ? '🌙 Chế độ tối' : '🌙 Dark mode toggle', description: isVi ? 'Cho người dùng chuyển giữa giao diện sáng và tối' : 'Let users switch between light and dark themes', type: 'feature' },
        { id: '3', title: isVi ? '✨ Animation loading' : '✨ Loading animation', description: isVi ? 'Thêm hiệu ứng tải trang mượt mà' : 'Add smooth page loading transitions', type: 'animation' },
      ];
    }
  }
};
