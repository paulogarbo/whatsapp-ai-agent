# whatsapp-ai-agent

A production-ready WhatsApp AI agent that receives messages via webhook, buffers
them with a debounce strategy, and replies with text or audio using GPT-4.1-mini
and ElevenLabs TTS.

---

## How it works

When a user sends a message on WhatsApp, the agent:

1. Receives the webhook from UazAPI and normalizes the payload
2. Pauses itself if an operator replied manually (anti-collision via Redis)
3. Transcribes audio messages using OpenAI Whisper
4. Buffers messages for 9 seconds — if the user sends multiple messages in
   sequence, they are grouped into a single context before the AI responds
5. Processes the full context with GPT-4.1-mini, maintaining per-user
   conversation history in Redis
6. Decides whether to reply as text or audio based on conversation context
7. Sends each sentence individually with a randomized delay to simulate
   natural human typing

---

## Architecture

```
POST /gerar-resposta/agente-ai
        │
        ▼
  Normalize payload
        │
        ├─ fromMe? ──────────────────► set Redis block (5 min) → done
        │
        ├─ isBlocked? ───────────────► ignore → done
        │
        ├─ audio? ───────────────────► Whisper transcription
        │
        ├─ image/video/document? ────► ignore → done
        │
        ├─ upsert customer (Supabase)
        │
        └─ push to Redis buffer
                │
                ▼
         BullMQ job (9s debounce)
                │
                ▼
         flush buffer → join context
                │
                ▼
         GPT-4.1-mini + Redis memory
                │
                ├─ content_type: audio ──► ElevenLabs TTS → send audio
                │
                └─ content_type: text ───► send sentences with delay
```

---

## Stack

| Concern | Technology |
|---|---|
| HTTP server | Fastify 4 |
| Language | TypeScript (strict) |
| Validation | Zod |
| Job queue | BullMQ |
| Cache + session | Redis (ioredis) |
| Database | Supabase (PostgreSQL) |
| LLM | OpenAI GPT-4.1-mini |
| Speech-to-text | OpenAI Whisper |
| Text-to-speech | ElevenLabs |
| WhatsApp | UazAPI |

---

## Project structure

```
src/
├── controllers/        # request handlers
├── routes/             # fastify route registration
├── services/           # business logic (one responsibility each)
│   ├── normalizer      # raw payload → NormalizedMessage
│   ├── block           # operator takeover detection
│   ├── buffer          # message grouping with debounce
│   ├── customer        # supabase upsert
│   ├── media           # audio download + whisper transcription
│   ├── agent           # openai chat + redis memory
│   ├── tts             # elevenlabs synthesis
│   └── whatsapp        # uazapi message sender
├── jobs/               # bullmq queue + worker
├── lib/                # client singletons (redis, supabase, openai)
├── schemas/            # zod input validation
└── types/              # shared typescript interfaces
```

---

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

---

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: 3000) |
| `REDIS_URL` | Redis connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID |
| `UAZAPI_BASE_URL` | UazAPI base URL |
