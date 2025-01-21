import { type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { Conversation } from '../entity/Openai.js';
import { BaseHelper } from '../postgres/BaseHelper.js';
import { config } from '../config/Config.js';

const baseHelper = new BaseHelper({
  connectionString: config.Postgres.ConnectionString,
});

export async function BotChat(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body: any = await request.json();
    // ... process the request body ...

    return {
      jsonBody: {}, // Placeholder for response data
    };
  } catch (e: any) {
    context.log('Error:', e);

    return {
      status: 500,
      body: e.message,
    };
  }
}

async function handle(
  context: InvocationContext,
  param: { wallet: string; username: string; gameId: number; content: string; conversations: Conversation[] },
) {
  let response = '';

  // Placeholder for handling logic

  return {
    wallet: param.wallet,
    username: param.username,
    content: param.content,
    response: response,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
}