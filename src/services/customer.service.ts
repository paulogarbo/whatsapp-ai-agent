import { supabase } from '../lib/supabase.js'
import type { NormalizedMessage } from '../types/message.js'

export const customerService = {
  async upsert(msg: NormalizedMessage): Promise<void> {
    const { error } = await supabase.from('clientes').upsert(
      {
        nome: msg.senderName,
        remotejid: msg.sender,
        ultimo_contato: new Date().toISOString(),
      },
      { onConflict: 'remotejid' }
    )

    if (error) {
      throw new Error(`Failed to upsert customer ${msg.sender}: ${error.message}`)
    }
  },
}
