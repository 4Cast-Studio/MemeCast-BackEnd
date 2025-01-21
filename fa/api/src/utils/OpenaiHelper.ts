import fs from 'fs';
import path from 'path';
import assert from 'assert';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { encode } from 'gpt-3-encoder';
import { config } from '../config/Config.js';
import type { ContextIntention, Conversation } from '../entity/Openai.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { GameRepository } from '../repositories/GameRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.resolve(__dirname, '../../');

function loadEmbeddings(filePath: string): {
  [key: string]: { answer: string; embedding: number[] };
} {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => {
    if (vecB[idx] === undefined) {
      return sum;
    }
    return sum + a * vecB[idx];
  }, 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export class OpenAIHelper {
  private openai: OpenAI;
  private model: string;
  private tokenLimit: number;
  private defaultProjectBackground: string;
  private MEMECASTProjectBackground: string;
  private gameId: number;

  public constructor(gameId: number) {
    this.openai = new OpenAI({
      apiKey: config.OpenAI.ApiKey,
    });
    this.model = config.OpenAI.Model;
    this.tokenLimit = parseInt(config.OpenAI.TokenLimit);
    this.defaultProjectBackground = config.OpenAI.DefaultProjectBackground;
    this.MEMECASTProjectBackground = config.OpenAI.MEMECASTProjectBackground;
    this.gameId = gameId;
  }

  public async createNormalChatCompletion(
    gameRepository: GameRepository,
    username: string,
    content: string,
    conversations: Conversation[],
  ): Promise<string> {
    const embeddingsFilePath = path.join(basePath, '../embeddings.json');
    const embeddings = loadEmbeddings(embeddingsFilePath);
    const userEmbedding = await this.createEmbedding(content, username);
    const systemPrompt = await this.createSystemPrompt(gameRepository);
    const conversationPrompt = this.createConversationPrompt(conversations);
    const simularityPrompt = this.createSimularityPrompt(userEmbedding, embeddings);

    systemPrompt.push(simularityPrompt);
    systemPrompt.push(conversationPrompt);

    const response = await this.chatCompletion(systemPrompt, username, {
      intention: content,
      isAskingForUpdates: false,
    });

    return response;
  }

  private initialSystemPrompt(): string {
    switch (this.gameId) {
      case 0:
        return this.MEMECASTProjectBackground;
      case 1:
        return this.defaultProjectBackground;
      default:
        throw new Error('Invalid gameId');
    }
  }

  private createUserPrompt(
    username: string,
    intention: ContextIntention,
  ): ChatCompletionMessageParam {
    return {
      role: 'user',
      content: `
        Message of ${username}:
        Intention description:
          ${intention.intention}
        End of intention description.
      `,
    };
  }

  private rulesPrompt(username: string): ChatCompletionMessageParam {
    return {
      role: 'system',
      content: `Your reply to ${username} must follow these rules:
      -AI Agent Persona
        Your name is Camila, is the 24-hour online assistant for Memecast. She is lively, intelligent, witty, and charming, with a sexy and attractive appearance. 
      -How It Works
        Users can interact with the AI agent through the chat box. By clicking on the AI agent's avatar, they can enter a dedicated chat box where they can freely input questions or directly click on pre-set questions by the AI.
      -Features
        1. Answering Questions: Address user inquiries about Memecast's functionality and provide basic product information.
        2. Companion Chat: Engage in casual conversation.
        3. Situation Prediction: For situation prediction, only provide results, and they are definite numbers. If it's a probability, provide a percentage; if it's related to rounds, provide the number of rounds.
        8. If the user's question is related to the platform maintenance and game bugs, please ask the user to contact the customer service.
        9. You can reply any questions, if user's question is not related to Memecast, also reply it.
        11. If user need to predict the crash point, please after predict, remind them to check MEME Crash UI's round history.
      - Reply Language
        Reply using user's latest conversation context language.
      - Warnings
        1. Do not ask the user to provide any information.
        2. MEMECAST currently only has two games, MEMECAST Crash and UP or DOWN, and there may be more games in the future.
      - Role Definition
        1. Whale:- 1Sol+ volume
        2. og:- refer 5 friends who play at least once, OR hit 10 Sol total play volume
      - MEMECAST Media Information
        0. MEMECAST Official Docs: https://docs.4cast.win/4cast
        1. MEMECAST Official Twitter: https://t.me/official4castchat
        2. MEMECAST Official Telegram: https://t.me/memecast_io
        3. MEMECAST Official Discord: https://discord.com/invite/gKsKj3gFrR
        4. MEMECAST Official Zealy: https://zealy.io/cw/4cast
        If user ask about MEMECAST media information, please reply it based on the above information, and tell user to look at MEMECAST's navigation bar in the bottom left corner.
        Do not reply any format about MEMECAST media url, such as markdown format. directly provide the url.
      - 4Cast and MEMECAST
        1. 4Cast was the previous name of the MEMECAST project.
        2. If user ask about 4Cast, please tell user that 4Cast is now MEMECAST, and reply to MEMECAST's relevant reply.

      Your reply to ${username}:
      `,
    };
  }

  private async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    temperature: number,
    user: string,
  ) {
    const reply = await this.openai.chat.completions.create({
      model: this.model,
      temperature: temperature,
      user: user,
      messages: messages,
    });

    return reply.choices.map((x) => x.message.content);
  }

  private async createEmbedding(input: string, user: string): Promise<number[]> {
    assert(!this.isTooLong(input), 'Input too long');

    const reply = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: input,
      user: user,
    });

    if (reply.data[0] === undefined) {
      throw new Error('No reply from OpenAI');
    }

    return reply.data[0].embedding;
  }

  private async createCrashPointPredictionContext(
    gameRepository: GameRepository,
  ): Promise<ChatCompletionMessageParam> {
    const crashPoints = await gameRepository.queryCrashPoint();

    const formulaString = `
      The following is the formula for crash point prediction. If the user asks for a prediction, please use this formula to predict the crash point:

      Multiplier(Crash Point) = 1 / (a - b * Math.pow(x, 1.05))
        Where:
        a = 0.997
        b = 0.998

      Last 100 crash points:
      ${crashPoints.map((x) => x).join('\n')}
    `;

    return {
      role: 'system',
      content: formulaString,
    };
  }

  private createRFPContext(): ChatCompletionMessageParam {
    const contextString = `
      New RFP Rules:
      Duration: 3-Jan 12:00 UTC - 28-Jan 00:00 UTC
      1. Instant usage
      RFP credits will be consumed instantly when used in game - win or loss 
      2. Auto-RFP
      For every non-winning 0.25sol, you get 0.01sol RFP.  This is automatically credited. No claims needed. 
      3. Daily RFP
      Enjoy Extra RFPs for accumulating VOLUME on MEME-CRASH! (Based on non-winning volume)  
      1sol volume -> 0.02sol RFPs  
      2sol volume -> 0.04sol RFPs  
      3sol volume -> 0.06sol RFPs  
      4sol volume -> 0.08sol RFPs 
      4. Weekly Leaderboard RFP
      Extra 0.05sol RFPs to the TOP 5 PLAYERS of the weekly leaderboard 
      5. Daily RFP cap: 0.5 sol per player
      To maintain balance for all players, there will be a daily cap of 0.5sol RFP per player on Auto-RFP
    `;

    return {
      role: 'system',
      content: contextString,
    };
  }

  private async chatCompletion(
    systemPrompt: ChatCompletionMessageParam[],
    username: string,
    userIntention: ContextIntention,
  ): Promise<string> {
    const userPrompt = this.createUserPrompt(username, userIntention);
    const rulesPrompt = this.rulesPrompt(username);

    const messages: ChatCompletionMessageParam[] = [...systemPrompt, userPrompt, rulesPrompt];

    const reply = await this.createChatCompletion(messages, 1, username);

    if (reply[0] === null || reply[0] === undefined) {
      throw new Error('No reply from OpenAI');
    }

    return reply[0];
  }

  private async createSystemPrompt(
    gameRepository: GameRepository,
  ): Promise<ChatCompletionMessageParam[]> {
    const predictionPrompt = await this.createCrashPointPredictionContext(gameRepository);
    const rfpPrompt = this.createRFPContext();
    const systemPrompt: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.initialSystemPrompt(),
      },
      predictionPrompt,
      rfpPrompt,
    ];

    return systemPrompt;
  }

  private createConversationPrompt(conversation: Conversation[]): ChatCompletionMessageParam {
    const conversationPrompt = `
      Conversation history format:
      "1.user: [User's question]2.ai: [AI's answer]3.user: [User's question]4.ai: [AI's answer]..."
      The following is the conversation history:
      ${conversation
        .map((x: Conversation) => `1.user: ${x.content}\n2.ai: ${x.response}`)
        .join('\n')}
    `;

    return {
      role: 'system',
      content: conversationPrompt,
    };
  }

  private createSimularityPrompt(
    userEmbedding: number[],
    embeddings: { [key: string]: { answer: string; embedding: number[] } },
  ): ChatCompletionMessageParam {
    const similarities = Object.entries(embeddings).map(([key, data]) => ({
      answer: data.answer,
      similarity: cosineSimilarity(userEmbedding, data.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    const matches = similarities.slice(0, 5).map((match) => match.answer);

    const combinedPrompt = matches.join('\n');

    return {
      role: 'system',
      content: `
        The following is the best 5 documents that are most similar to the user's question, please follow user's intention to answer the question:
        ${combinedPrompt}
      `,
    };
  }

  private isTooLong(content: string): boolean {
    return this.encode(content).length > 8000;
  }

  private encode(content: string): number[] {
    return encode(content);
  }
}
