import { type QueryResult, type QueryResultRow } from 'pg';
import { DatabaseProvider } from './DatabaseProvider.js';

export type BaseHelperConfig = {
  readonly connectionString: string;
};

export class BaseHelper {
  private readonly provider: DatabaseProvider;

  public constructor(config: BaseHelperConfig) {
    this.provider = new DatabaseProvider(config.connectionString);
  }

  public get pool() {
    return this.provider.pool;
  }

  public query<T extends QueryResultRow>(sql: string, params: (string | number | number[] | string[])[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }
}
