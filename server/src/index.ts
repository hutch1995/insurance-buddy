import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import documentsRouter from './routes/documents'
import benefitsRouter from './routes/benefits'
import expensesRouter from './routes/expenses'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/documents', documentsRouter)
app.use('/benefits', benefitsRouter)
app.use('/expenses', expensesRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
