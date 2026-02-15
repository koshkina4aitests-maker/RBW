import { withClient } from './db.js'

const EMPLOYEES = [
  'Анна Петрова',
  'Илья Соколов',
  'Мария Иванова',
  'Владимир Ковалев',
  'Ольга Миронова',
  'Денис Фролов',
]

const DOCUMENTS = [
  {
    documentNumber: 'DOC-2026-041',
    title: 'Приказ о корректировке квартального бюджета',
    department: 'Финансовый департамент',
    ownerName: 'Анна Петрова',
    status: 'pending_signature',
    content:
      'Прошу утвердить корректировку бюджета на II квартал 2026 года. Изменения включают перераспределение расходов по статьям: развитие ИТ-инфраструктуры, обучение персонала и закупка сервисных лицензий. Подписанный документ требуется передать в бухгалтерию и отдел закупок до 20 числа текущего месяца.',
  },
  {
    documentNumber: 'DOC-2026-036',
    title: 'Согласование графика внедрения CRM-модулей',
    department: 'Проектный офис',
    ownerName: 'Мария Иванова',
    status: 'approved',
    content:
      'Документ содержит план внедрения модулей CRM, этапы тестирования и зоны ответственности. После согласования требуется подтверждение финальной даты запуска пилота и подготовка коммуникационного плана для подразделений продаж и сопровождения.',
  },
  {
    documentNumber: 'DOC-2026-029',
    title: 'Распоряжение о проведении внутреннего аудита',
    department: 'Юридический отдел',
    ownerName: 'Владимир Ковалев',
    status: 'signed',
    content:
      'Утверждается график внутреннего аудита по проверке договорного контура и соблюдения сроков согласования документов. Руководителям подразделений необходимо обеспечить доступ аудиторов к учетным системам и предоставить ответственных сотрудников для сопровождения проверки.',
  },
]

const hash = (value) => {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index)
    result |= 0
  }
  return Math.abs(result)
}

const seededRandomInt = (seed, min, max) => {
  const range = max - min + 1
  return min + (hash(seed) % range)
}

const getMonthStart = (year, monthIndex) => new Date(Date.UTC(year, monthIndex, 1))

const getLastMonths = (monthsCount) => {
  const now = new Date()
  const months = []
  for (let shift = monthsCount - 1; shift >= 0; shift -= 1) {
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - shift, 1))
    months.push(target)
  }
  return months
}

const createSchema = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS subordinate_task_reports (
      id BIGSERIAL PRIMARY KEY,
      report_month DATE NOT NULL,
      employee_name TEXT NOT NULL,
      assigned_count INTEGER NOT NULL,
      completed_count INTEGER NOT NULL,
      overdue_count INTEGER NOT NULL,
      approval_count INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (report_month, employee_name)
    )
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id BIGSERIAL PRIMARY KEY,
      document_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      signed_at TIMESTAMPTZ,
      signer_name TEXT,
      signature_code TEXT,
      content TEXT NOT NULL
    )
  `)
}

const seedReportsIfNeeded = async (client) => {
  const countResult = await client.query('SELECT COUNT(*)::int AS count FROM subordinate_task_reports')
  const count = Number(countResult.rows[0]?.count ?? 0)
  if (count > 0) {
    return
  }

  const months = getLastMonths(12)
  for (const monthDate of months) {
    const monthKey = monthDate.toISOString().slice(0, 7)
    for (const employee of EMPLOYEES) {
      const assignedCount = seededRandomInt(`${monthKey}-${employee}-assigned`, 18, 56)
      const completedGap = seededRandomInt(`${monthKey}-${employee}-gap`, 2, 14)
      const completedCount = Math.max(assignedCount - completedGap, 8)
      const overdueCount = seededRandomInt(`${monthKey}-${employee}-overdue`, 0, 7)
      const approvalCount = seededRandomInt(`${monthKey}-${employee}-approval`, 1, 11)

      await client.query(
        `
          INSERT INTO subordinate_task_reports (
            report_month,
            employee_name,
            assigned_count,
            completed_count,
            overdue_count,
            approval_count
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (report_month, employee_name) DO NOTHING
        `,
        [monthDate.toISOString().slice(0, 10), employee, assignedCount, completedCount, overdueCount, approvalCount],
      )
    }
  }
}

const seedDocumentsIfNeeded = async (client) => {
  const countResult = await client.query('SELECT COUNT(*)::int AS count FROM documents')
  const count = Number(countResult.rows[0]?.count ?? 0)
  if (count > 0) {
    return
  }

  const now = new Date()
  const approvedAt = new Date(now)
  approvedAt.setDate(now.getDate() - 3)

  const signedAt = new Date(now)
  signedAt.setDate(now.getDate() - 8)

  for (const doc of DOCUMENTS) {
    const isApproved = doc.status === 'approved' || doc.status === 'signed'
    const isSigned = doc.status === 'signed'

    await client.query(
      `
        INSERT INTO documents (
          document_number,
          title,
          department,
          owner_name,
          status,
          approved_at,
          signed_at,
          signer_name,
          signature_code,
          content
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (document_number) DO NOTHING
      `,
      [
        doc.documentNumber,
        doc.title,
        doc.department,
        doc.ownerName,
        doc.status,
        isApproved ? approvedAt.toISOString() : null,
        isSigned ? signedAt.toISOString() : null,
        isSigned ? 'Генеральный директор' : null,
        isSigned ? 'SIG-AUTO-2026-029' : null,
        doc.content,
      ],
    )
  }
}

const initializeDatabase = async () =>
  withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await createSchema(client)
      await seedReportsIfNeeded(client)
      await seedDocumentsIfNeeded(client)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })

const parseMonthKey = (monthKey) => {
  const [yearText, monthText] = monthKey.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  return getMonthStart(year, monthIndex)
}

const formatMonthLabel = (monthKey) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(parseMonthKey(monthKey))
    .replace('.', '')
    .replace(' г', '')

export { formatMonthLabel, initializeDatabase, parseMonthKey }
