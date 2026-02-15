import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { closePool, query } from './db.js'
import { formatMonthLabel, initializeDatabase, parseMonthKey } from './seed.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 4000)

const parseCorsOrigins = () => {
  if (!process.env.CORS_ORIGIN) {
    return true
  }
  return process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
}

const mapDocument = (row) => ({
  id: Number(row.id),
  documentNumber: row.document_number,
  title: row.title,
  department: row.department,
  ownerName: row.owner_name,
  status: row.status,
  content: row.content,
  createdAt: row.created_at,
  approvedAt: row.approved_at,
  signedAt: row.signed_at,
  signerName: row.signer_name,
  signatureCode: row.signature_code,
})

app.use(cors({ origin: parseCorsOrigins() }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'executive-workplace-api' })
})

app.get('/api/reports/overview', async (req, res, next) => {
  try {
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/
    const requestedMonth =
      typeof req.query.month === 'string' && monthRegex.test(req.query.month) ? req.query.month : null

    const timelineResult = await query(
      `
      SELECT
        TO_CHAR(report_month, 'YYYY-MM') AS month_key,
        SUM(assigned_count)::int AS assigned,
        SUM(completed_count)::int AS completed,
        SUM(overdue_count)::int AS overdue,
        SUM(approval_count)::int AS approvals
      FROM subordinate_task_reports
      GROUP BY report_month
      ORDER BY report_month
      `,
    )

    const timelineBase = timelineResult.rows.map((row) => ({
      monthKey: row.month_key,
      monthLabel: formatMonthLabel(row.month_key),
      assigned: Number(row.assigned),
      completed: Number(row.completed),
      overdue: Number(row.overdue),
      approvals: Number(row.approvals),
    }))

    let cumulativeAssigned = 0
    let cumulativeCompleted = 0
    let cumulativeOverdue = 0
    let cumulativeApprovals = 0

    const timeline = timelineBase.map((month) => {
      cumulativeAssigned += month.assigned
      cumulativeCompleted += month.completed
      cumulativeOverdue += month.overdue
      cumulativeApprovals += month.approvals
      return {
        ...month,
        cumulativeAssigned,
        cumulativeCompleted,
        cumulativeOverdue,
        cumulativeApprovals,
      }
    })

    const fallbackMonth = timeline.length > 0 ? timeline[timeline.length - 1].monthKey : null
    const selectedMonth =
      requestedMonth && timeline.some((item) => item.monthKey === requestedMonth)
        ? requestedMonth
        : fallbackMonth

    if (!selectedMonth) {
      res.json({
        timeline: [],
        availableMonths: [],
        selectedMonth: null,
        selectedSummary: null,
        employeeBreakdown: [],
      })
      return
    }

    const selectedMonthDate = parseMonthKey(selectedMonth).toISOString().slice(0, 10)
    const employeeResult = await query(
      `
      SELECT
        employee_name,
        assigned_count,
        completed_count,
        overdue_count,
        approval_count
      FROM subordinate_task_reports
      WHERE report_month = $1
      ORDER BY employee_name
      `,
      [selectedMonthDate],
    )

    const employeeBreakdown = employeeResult.rows.map((row) => ({
      employeeName: row.employee_name,
      assigned: Number(row.assigned_count),
      completed: Number(row.completed_count),
      overdue: Number(row.overdue_count),
      approvals: Number(row.approval_count),
      completionRate: Number(row.assigned_count)
        ? Math.round((Number(row.completed_count) / Number(row.assigned_count)) * 100)
        : 0,
    }))

    const selectedSummary = timeline.find((row) => row.monthKey === selectedMonth) ?? null

    res.json({
      timeline,
      availableMonths: timeline.map((month) => month.monthKey),
      selectedMonth,
      selectedSummary,
      employeeBreakdown,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/documents', async (_req, res, next) => {
  try {
    const documentsResult = await query(
      `
      SELECT
        id,
        document_number,
        title,
        department,
        owner_name,
        status,
        content,
        created_at,
        approved_at,
        signed_at,
        signer_name,
        signature_code
      FROM documents
      ORDER BY created_at DESC
      `,
    )
    res.json({ documents: documentsResult.rows.map(mapDocument) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/documents/current', async (_req, res, next) => {
  try {
    const currentResult = await query(
      `
      SELECT
        id,
        document_number,
        title,
        department,
        owner_name,
        status,
        content,
        created_at,
        approved_at,
        signed_at,
        signer_name,
        signature_code
      FROM documents
      ORDER BY
        CASE
          WHEN status = 'pending_signature' THEN 0
          WHEN status = 'approved' THEN 1
          ELSE 2
        END,
        created_at DESC
      LIMIT 1
      `,
    )

    if (!currentResult.rows[0]) {
      res.status(404).json({ message: 'Документы не найдены' })
      return
    }

    res.json({ document: mapDocument(currentResult.rows[0]) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/documents/:documentId/sign', async (req, res, next) => {
  try {
    const documentId = Number(req.params.documentId)
    if (!Number.isFinite(documentId) || documentId <= 0) {
      res.status(400).json({ message: 'Некорректный идентификатор документа' })
      return
    }

    const signerName =
      typeof req.body?.signerName === 'string' && req.body.signerName.trim()
        ? req.body.signerName.trim()
        : 'Руководитель'

    const documentResult = await query(
      `
      SELECT
        id,
        document_number,
        title,
        department,
        owner_name,
        status,
        content,
        created_at,
        approved_at,
        signed_at,
        signer_name,
        signature_code
      FROM documents
      WHERE id = $1
      `,
      [documentId],
    )

    const current = documentResult.rows[0]
    if (!current) {
      res.status(404).json({ message: 'Документ не найден' })
      return
    }

    if (current.status === 'signed') {
      res.json({ alreadySigned: true, document: mapDocument(current) })
      return
    }

    const signatureCode = `SIG-${documentId}-${Date.now().toString(36).toUpperCase()}`

    const updatedResult = await query(
      `
      UPDATE documents
      SET
        status = 'signed',
        approved_at = COALESCE(approved_at, NOW()),
        signed_at = NOW(),
        signer_name = $2,
        signature_code = $3
      WHERE id = $1
      RETURNING
        id,
        document_number,
        title,
        department,
        owner_name,
        status,
        content,
        created_at,
        approved_at,
        signed_at,
        signer_name,
        signature_code
      `,
      [documentId, signerName, signatureCode],
    )

    res.json({ alreadySigned: false, document: mapDocument(updatedResult.rows[0]) })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

const start = async () => {
  await initializeDatabase()

  if (process.argv.includes('--seed-only')) {
    console.log('Database schema ensured and synthetic data seeded.')
    await closePool()
    return
  }

  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`)
  })
}

start().catch(async (error) => {
  console.error('Startup failed:', error)
  await closePool()
  process.exit(1)
})
