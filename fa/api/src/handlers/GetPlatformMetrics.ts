import { type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { config } from '../config/Config.js';
import { BaseHelper } from '../postgres/BaseHelper.js';

const baseHelper = new BaseHelper({
  connectionString: config.Postgres.ConnectionString,
});

async function handle(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

  // Placeholder for business logic

  return {
    jsonBody: {}, // Placeholder for response body
  };
}

export async function GetPlatformMetrics(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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