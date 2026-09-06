export interface OxAlphaDistillRequest {
  content: string;
  source?: string;
  instruction?: string;
}

export interface OxAlphaDistillResult {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cost?: number;
  };
}

function config() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  return {
    apiKey,
    baseUrl: (process.env.OX_ALPHA_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    model: process.env.OX_ALPHA_MODEL || 'z-ai/glm-5.3-flash',
  };
}

export async function distillWithOxAlpha(request: OxAlphaDistillRequest): Promise<OxAlphaDistillResult> {
  if (!request.content.trim()) throw new Error('content is required');

  const { apiKey, baseUrl, model } = config();
  const instruction = request.instruction?.trim() || [
    'You are the Ox Alpha reasoning layer for The Factory knowledge system.',
    'Distill the supplied source into durable, factual knowledge.',
    'Preserve important technical details and explicit uncertainty.',
    'Do not invent facts. Do not execute actions. Return only the distilled knowledge.',
  ].join(' ');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/Daniel550-pixel/The-Factory-2.0',
      'X-Title': 'The Factory 2.0',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: instruction },
        {
          role: 'user',
          content: request.source
            ? `Source: ${request.source}\n\nContent:\n${request.content}`
            : request.content,
        },
      ],
      stream: false,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.error || `Ox Alpha request failed (${response.status})`;
    throw new Error(String(message));
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Ox Alpha returned no usable content');
  }

  return {
    content: content.trim(),
    model: body.model || model,
    provider: body.provider || 'OpenRouter',
    usage: body.usage ? {
      promptTokens: body.usage.prompt_tokens,
      completionTokens: body.usage.completion_tokens,
      totalTokens: body.usage.total_tokens,
      cost: body.usage.cost,
    } : undefined,
  };
}
