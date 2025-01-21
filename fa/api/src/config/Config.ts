export const config = {
  Env: process.env.DSM_ENV ?? '',
  Script: process.env.Script ?? 'MEMECAST API',
  Postgres: {
    ConnectionString: process.env.PostgresConnectionString ?? '',
    PaginationSize: Number(process.env.PaginationSize ?? '1'),
  },
  OpenAI: {
    ApiKey: process.env.OpenAIApiKey ?? '',
    MaxRetryNum: process.env.OpenAIMaxRetryNum ?? '',
    Model: process.env.OpenAIModel ?? '',
    TokenLimit: process.env.OpenAITokenLimit ?? '',
    DefaultProjectBackground: process.env.DefaultProjectBackground ?? '',
    MEMECASTProjectBackground: process.env.MEMECASTProjectBackground ?? '',
  },
};
