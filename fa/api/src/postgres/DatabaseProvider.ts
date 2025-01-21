import pg from 'pg';

export class DatabaseProvider {
  public readonly pool: pg.Pool;

  public constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      ssl: true,
      query_timeout: 60 * 1000,
      connectionTimeoutMillis: 60 * 1000,
      max: 20,
    });
  }
}
