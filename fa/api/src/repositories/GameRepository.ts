import type { Context } from '../entity/Context.js';
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
}
