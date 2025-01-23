import { type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { config } from '../config/Config.js';
import { BaseHelper } from '../postgres/BaseHelper.js';
import { GameRepository } from '../repositories/GameRepository.js';

const baseHelper = new BaseHelper({
  connectionString: config.Postgres.ConnectionString,
});

export async function GetPlatformMetrics(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    context.log('Request received.');

    return await handle(request, context);
  } catch (e: any) {
    context.log('Error:', e);
    context.log('Error detected.');

    return {
      status: 500,
      body: e.message,
    };
  }
}

async function handle(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const gameRepository = new GameRepository(context, baseHelper);

  const [walletSummaryResult, interationResult, gameRoundsResult, revenueShareResult] = await Promise.all([
    gameRepository.queryUniqueWalletCountAndVolume(),
    gameRepository.queryInteractions(),
    gameRepository.queryGameRounds(),
    gameRepository.queryRevenueShare(),
  ]);

  const responseBody = {
    walletCount: walletSummaryResult?.wallet_count,
    gamePlayVolume: walletSummaryResult?.total_volume,
    interactions: interationResult?.interaction_count,
    gameRounds: gameRoundsResult?.game_rounds,
    revenueShare: revenueShareResult?.revenue_sharing,
  };

  return {
    jsonBody: responseBody,
  };
}
