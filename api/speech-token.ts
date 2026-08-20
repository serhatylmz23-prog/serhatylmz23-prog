import { handleSpeechToken } from './azure-speech.js';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request): Promise<Response> {
  return handleSpeechToken(request);
}
