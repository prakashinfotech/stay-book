import { AppError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { config } from '../../config/env';
import { AskDto } from './chat.schema';

const SYSTEM_INSTRUCTION =
  'You are a helpful hotel booking assistant for StayBook, an Indian hotel booking platform. ' +
  'Only answer questions related to hotels, properties, room types, amenities, pricing, availability, ' +
  'travel destinations in India, and booking processes. ' +
  'If asked anything unrelated to hotels or travel, politely decline and redirect to hotel topics. ' +
  'Keep responses concise (2-4 sentences max) and friendly.';

export class ChatService {
  async ask(dto: AskDto): Promise<string> {
    if (!config.GEMINI_API_KEY) {
      throw new AppError(503, 'CHAT_UNAVAILABLE', 'Chat service is not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.GEMINI_API_KEY}`;

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [...dto.history, { role: 'user', parts: [{ text: dto.userText }] }],
      generationConfig: { maxOutputTokens: 400 },
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      logger.error('Gemini API network error', { err });
      throw new AppError(502, 'CHAT_UPSTREAM_ERROR', 'Chat service temporarily unavailable');
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
      logger.warn('Gemini API error response', { status: res.status, body: errBody });
      throw new AppError(502, 'CHAT_UPSTREAM_ERROR', errBody.error?.message ?? `Gemini HTTP ${res.status}`);
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text ?? '')
      .join('')
      .trim();

    return text || 'No response received.';
  }
}
