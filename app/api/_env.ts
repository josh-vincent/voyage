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

export function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default { getDuffelToken, getGatewayKey, jsonError };
