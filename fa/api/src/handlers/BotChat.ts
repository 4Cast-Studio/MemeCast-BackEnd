import { type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { Conversation } from '../entity/Openai.js';
import {
  validateMessageSignature,
  validateStringNonEmpty,
  validateWallet,
  validateNumber,
} from '../entity/Validation.js';
import { BaseHelper } from '../postgres/BaseHelper.js';
import { OpenAIHelper } from '../utils/OpenaiHelper.js';
import { GameRepository } from '../repositories/GameRepository.js';
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
    const wallet = validateWallet(body.wallet);
    const gameId = validateNumber(body.gameId, 'gameId');
    const username = validateStringNonEmpty(body.username, 'username');
    const message = validateStringNonEmpty(body.message, 'message');
    const signature = validateStringNonEmpty(body.signature, 'signature');
    const content = validateStringNonEmpty(body.content, 'content');
    const conversations: Conversation[] = body.conversation ?? [];

    validateMessageSignature(wallet, message, signature);

    const response = await handle(context, {
      wallet,
      username,
      gameId,
      content,
      conversations,
    });

    return {
      jsonBody: response,
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
  param: {
    wallet: string;
    username: string;
    gameId: number;
    content: string;
    conversations: Conversation[];
  },
) {
  let response = '';
  const gameRepository = new GameRepository(context, baseHelper);
  const openaiHelper = new OpenAIHelper(param.gameId);

  response = await openaiHelper.createNormalChatCompletion(
    gameRepository,
    param.username,
    param.content,
    param.conversations,
  );

  return {
    wallet: param.wallet,
    username: param.username,
    content: param.content,
    response: response,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
}
