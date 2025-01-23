import type { Context } from '../entity/Context.js';
import type { WalletCountAndVolume, InteractionCount, GameRounds, RevenueShare } from '../entity/Game.js';
import type { BaseHelper } from '../postgres/BaseHelper.js';

export class GameRepository {
  private readonly context: Context;
  private readonly baseHelper: BaseHelper;

  public constructor(context: Context, baseHelper: BaseHelper) {
    this.context = context;
    this.baseHelper = baseHelper;
  }

  public async queryCrashPoint(): Promise<number[]> {
    const query = `
      SELECT crash_point
      FROM crash_point_history
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    const result = await this.baseHelper.query(query, []);
    return result.rows.map((row) => row.crash_point);
  }

  public async queryUniqueWalletCountAndVolume(): Promise<WalletCountAndVolume | undefined> {
    const query = `
      SELECT COUNT(DISTINCT wallet_address) AS wallet_count, SUM(volume) AS total_volume
      FROM user_game_play_history
    `;
    const result = await this.baseHelper.query<WalletCountAndVolume>(query, []);
    return result.rows[0];
  }

  public async queryInteractions(): Promise<InteractionCount | undefined> {
    const query = `
      SELECT COUNT(*) AS interaction_count
      FROM user_game_play_history
    `;
    const result = await this.baseHelper.query<InteractionCount>(query, []);
    return result.rows[0];
  }

  public async queryGameRounds(): Promise<GameRounds | undefined> {
    const query = `
      SELECT COUNT(*) AS game_rounds
      FROM game_round_history
    `;
    const result = await this.baseHelper.query<GameRounds>(query, []);
    return result.rows[0];
  }

  public async queryRevenueShare(): Promise<RevenueShare | undefined> {
    const query = `
      SELECT revenue_sharing
      FROM revenue_share_summary
    `;
    const result = await this.baseHelper.query<RevenueShare>(query, []);
    return result.rows[0];
  }
}
