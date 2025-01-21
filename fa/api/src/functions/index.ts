import { app } from '@azure/functions';
import { GetPlatformMetrics } from '../handlers/GetPlatformMetrics.js';
import { BotChat } from '../handlers/BotChat.js';

app.get('GetPlatformMetrics', {
  authLevel: 'function',
  handler: GetPlatformMetrics,
});

app.post('BotChat', {
  authLevel: 'function',
  handler: BotChat,
});
