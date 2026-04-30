export default async function handler(req: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  return new Response(JSON.stringify({
    anthropic_key_set: !!anthropicKey,
    anthropic_key_prefix: anthropicKey ? anthropicKey.slice(0, 15) + '...' : null,
    openai_key_set: !!openaiKey,
    openai_key_prefix: openaiKey ? openaiKey.slice(0, 15) + '...' : null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = { runtime: 'edge' };
