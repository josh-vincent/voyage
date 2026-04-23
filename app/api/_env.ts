export function getDuffelToken(): string {
  const v = process.env.DUFFEL_ACCESS_TOKEN;
  if (!v) throw new Error('DUFFEL_ACCESS_TOKEN is missing. Add it to .env.');
  return v;
}

export function getGatewayKey(): string {
  const v = process.env.AI_GATEWAY_API_KEY;
  if (!v) throw new Error('AI_GATEWAY_API_KEY is missing. Add it to .env.');
  return v;
}

const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-sonnet-4';
const DEFAULT_TEST_GATEWAY_MODEL = 'openai/gpt-4.1-mini';

export function getGatewayModel(): string {
  const model = process.env.AI_GATEWAY_MODEL?.trim();
  if (model) return model;

  const nodeEnv = (process.env.NODE_ENV ?? '').toLowerCase();
  const testModel = process.env.AI_GATEWAY_TEST_MODEL?.trim();
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return testModel || DEFAULT_TEST_GATEWAY_MODEL;
  }

  return DEFAULT_GATEWAY_MODEL;
}

export function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default { getDuffelToken, getGatewayKey, getGatewayModel, jsonError };
