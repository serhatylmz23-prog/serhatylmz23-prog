import { handleVision } from './cloudflare-ai.js';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request): Promise<Response> {
  return handleVision(request);
}
