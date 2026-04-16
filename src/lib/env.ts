const required = [
  'REDIS_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'UAZAPI_BASE_URL',
  'UAZAPI_WEBHOOK_SECRET',
] as const

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`)
  }
}
