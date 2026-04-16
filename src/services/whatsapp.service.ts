import axios from 'axios'

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL ?? 'https://bot-test.uazapi.com'

interface SendParams {
  token: string
  number: string
}

function randomDelay(): number {
  return Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const whatsappService = {
  async sendTextMessages(params: SendParams, messages: string[]): Promise<void> {
    const { token, number } = params

    for (const text of messages) {
      await axios.post(
        `${UAZAPI_BASE_URL}/send/text`,
        { number, text, delay: randomDelay() },
        { headers: { token }, timeout: 15_000 }
      )
      await sleep(randomDelay())
    }
  },

  async sendAudioMessages(params: SendParams, audioBase64List: string[]): Promise<void> {
    const { token, number } = params

    for (const file of audioBase64List) {
      await axios.post(
        `${UAZAPI_BASE_URL}/send/media`,
        { number, type: 'audio', file, delay: randomDelay() },
        { headers: { token }, timeout: 15_000 }
      )
      await sleep(randomDelay())
    }
  },
}
