import axios from 'axios'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

export const ttsService = {
  async synthesize(text: string): Promise<string> {
    const voiceId = process.env.ELEVENLABS_VOICE_ID!

    const response = await axios.post<ArrayBuffer>(
      `${ELEVENLABS_BASE_URL}/${voiceId}`,
      { text, model_id: 'eleven_flash_v2_5', language_code: 'pt' },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    )

    return Buffer.from(response.data).toString('base64')
  },
}
