import axios from 'axios'
import { toFile } from 'openai'
import { openai } from '../lib/openai.js'

interface DownloadAudioParams {
  messageId: string
  baseUrl: string
  token: string
}

export const mediaService = {
  async downloadAndTranscribeAudio(params: DownloadAudioParams): Promise<string> {
    const { messageId, baseUrl, token } = params

    const response = await axios.post<{ base64Data: string }>(
      `${baseUrl}/message/download`,
      { id: messageId, return_base64: true },
      { headers: { token }, timeout: 15_000 }
    )

    const buffer = Buffer.from(response.data.base64Data, 'base64')

    const file = await toFile(buffer, 'audio.ogg', { type: 'audio/ogg' })

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: 'pt',
    })

    return transcription.text
  },
}
