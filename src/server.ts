import 'dotenv/config'
import { buildApp } from './app.js'
import './jobs/worker.js'

const app = buildApp()

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
