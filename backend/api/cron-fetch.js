import { runCronFetch } from '../src/services/cronPipeline.js';
import { checkCronSecret } from '../src/utils/auth.js';

export default async function handler(request, response) {
  const denied = checkCronSecret(request, response);
  if (denied) return denied;

  const payload = await runCronFetch(request.query.tier);
  return response.status(payload.status === 'error' ? 500 : 200).json(payload);
}
