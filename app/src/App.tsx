import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type TabId = 'tasks' | 'dashboard' | 'analytics' | 'documents'
type TaskType = 'Операционные' | 'Проектные' | 'Документооборот' | 'Персонал'
type TaskStatus = 'Новая' | 'В работе' | 'На согласовании' | 'Выполнена'
type Priority = 'Низкий' | 'Средний' | 'Высокий'
type NotificationAction = 'approval' | 'signature' | 'review'
type ReportMode = 'monthly' | 'cumulative'
type DocumentStatus = 'pending_signature' | 'approved' | 'signed'

interface Task {
  id: number
  title: string
  assignee: string
  type: TaskType
  status: TaskStatus
  priority: Priority
  dueDate: string
  progress: number
  description: string
}

interface NotificationItem {
  id: number
  title: string
  description: string
  createdAt: string
  unread: boolean
  requireAction: boolean
  actionLabel: string
  action: NotificationAction
}

interface ReportTimelinePoint {
  monthKey: string
  monthLabel: string
  assigned: number
  completed: number
  overdue: number
  approvals: number
  cumulativeAssigned: number
  cumulativeCompleted: number
  cumulativeOverdue: number
  cumulativeApprovals: number
}

interface EmployeeReportPoint {
  employeeName: string
  assigned: number
  completed: number
  overdue: number
  approvals: number
  completionRate: number
}

interface ReportOverviewResponse {
  timeline: ReportTimelinePoint[]
  availableMonths: string[]
  selectedMonth: string | null
  selectedSummary: ReportTimelinePoint | null
  employeeBreakdown: EmployeeReportPoint[]
}

interface DocumentItem {
  id: number
  documentNumber: string
  title: string
  department: string
  ownerName: string
  status: DocumentStatus
  content: string
  createdAt: string
  approvedAt: string | null
  signedAt: string | null
  signerName: string | null
  signatureCode: string | null
}

interface DocumentsResponse {
  documents: DocumentItem[]
}

interface CurrentDocumentResponse {
  document: DocumentItem
}

interface SignDocumentResponse {
  alreadySigned: boolean
  document: DocumentItem
}

interface TaskDraft {
  title: string
  assignee: string
  type: TaskType
  priority: Priority
  dueDate: string
  description: string
}

const TASK_TYPES: TaskType[] = ['Операционные', 'Проектные', 'Документооборот', 'Персонал']
const TASK_STATUSES: TaskStatus[] = ['Новая', 'В работе', 'На согласовании', 'Выполнена']
const PRIORITIES: Priority[] = ['Низкий', 'Средний', 'Высокий']
const EMPLOYEES = [
  'Анна Петрова',
  'Илья Соколов',
  'Мария Иванова',
  'Владимир Ковалев',
  'Ольга Миронова',
]
const STATUS_COLORS: Record<TaskStatus, string> = {
  Новая: '#5f8dff',
  'В работе': '#4cb6c2',
  'На согласовании': '#f2aa4c',
  Выполнена: '#40b985',
}
const DASHBOARD_COLORS = ['#5f8dff', '#4cb6c2', '#f2aa4c', '#7f6bff']
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'
const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending_signature: 'Ожидает подписи',
  approved: 'Согласован',
  signed: 'Подписан',
}

const getDateOffset = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: 'Подготовить бюджет по департаменту на Q2',
    assignee: 'Анна Петрова',
    type: 'Операционные',
    status: 'В работе',
    priority: 'Высокий',
    dueDate: getDateOffset(2),
    progress: 70,
    description: 'Сверка по статьям и уточнение лимитов с финансовым отделом.',
  },
  {
    id: 2,
    title: 'Согласовать договор с новым поставщиком',
    assignee: 'Илья Соколов',
    type: 'Документооборот',
    status: 'На согласовании',
    priority: 'Высокий',
    dueDate: getDateOffset(1),
    progress: 85,
    description: 'Необходимо финальное согласование и подпись руководителя.',
  },
  {
    id: 3,
    title: 'Запустить пилот CRM-автоматизации',
    assignee: 'Мария Иванова',
    type: 'Проектные',
    status: 'В работе',
    priority: 'Средний',
    dueDate: getDateOffset(7),
    progress: 45,
    description: 'Подготовка сценариев, обучение команды и настройка триггеров.',
  },
  {
    id: 4,
    title: 'Обновить матрицу KPI сотрудников',
    assignee: 'Ольга Миронова',
    type: 'Персонал',
    status: 'Новая',
    priority: 'Средний',
    dueDate: getDateOffset(5),
    progress: 10,
    description: 'Согласовать критерии оценки и обновить цели на месяц.',
  },
  {
    id: 5,
    title: 'Подготовить пакет документов для аудита',
    assignee: 'Владимир Ковалев',
    type: 'Документооборот',
    status: 'Выполнена',
    priority: 'Высокий',
    dueDate: getDateOffset(-1),
    progress: 100,
    description: 'Все документы структурированы и переданы в юридический отдел.',
  },
]

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: 'Требуется подписание: Договор №248/26',
    description: 'Документ согласован отделами и ожидает вашу подпись.',
    createdAt: '2 мин назад',
    unread: true,
    requireAction: true,
    actionLabel: 'Открыть документ',
    action: 'signature',
  },
  {
    id: 2,
    title: 'Согласование бюджета проекта CRM',
    description: 'Финансовый отдел ждет вашего решения по лимитам.',
    createdAt: '12 мин назад',
    unread: true,
    requireAction: true,
    actionLabel: 'Открыть согласование',
    action: 'approval',
  },
  {
    id: 3,
    title: 'Еженедельный отчет готов',
    description: 'Сформирован аналитический отчет по выполнению задач.',
    createdAt: '1 ч назад',
    unread: false,
    requireAction: false,
    actionLabel: 'Открыть отчет',
    action: 'review',
  },
]

const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(
    new Date(`${isoDate}T12:00:00`),
  )

const formatDateTime = (isoDateTime: string | null): string =>
  isoDateTime
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoDateTime))
    : '—'

const buildDonutGradient = (counts: number[]): string => {
  const total = counts.reduce((sum, value) => sum + value, 0)
  if (!total) {
    return '#e8edff'
  }
  let cursor = 0
  const segments = counts
    .map((count, index) => {
      const start = cursor
      const value = (count / total) * 100
      cursor += value
      return `${DASHBOARD_COLORS[index % DASHBOARD_COLORS.length]} ${start}% ${cursor}%`
    })
    .join(', ')
  return `conic-gradient(${segments})`
}

const buildLinePoints = (values: number[], maxValue: number): string =>
  values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100
      const y = 90 - (value / maxValue) * 70
      return `${x},${y}`
    })
    .join(' ')

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('tasks')
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [popupNotification, setPopupNotification] = useState<NotificationItem | null>(null)
  const [shownPopups, setShownPopups] = useState<number[]>([])
  const [taskFilter, setTaskFilter] = useState<'Все' | TaskStatus>('Все')
  const [flashMessage, setFlashMessage] = useState('')
  const [draft, setDraft] = useState<TaskDraft>({
    title: '',
    assignee: EMPLOYEES[0],
    type: TASK_TYPES[0],
    priority: PRIORITIES[1],
    dueDate: getDateOffset(3),
    description: '',
  })
  const [reportMode, setReportMode] = useState<ReportMode>('monthly')
  const [reportTimeline, setReportTimeline] = useState<ReportTimelinePoint[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [employeeBreakdown, setEmployeeBreakdown] = useState<EmployeeReportPoint[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [currentDocument, setCurrentDocument] = useState<DocumentItem | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState('')
  const [signerName, setSignerName] = useState('Генеральный директор')
  const [signingInProgress, setSigningInProgress] = useState(false)

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  )

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === 'Выполнена').length
  const onApprovalTasks = tasks.filter((task) => task.status === 'На согласовании').length
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  const urgentTasks = useMemo(() => {
    const today = new Date()
    const threshold = new Date()
    threshold.setDate(today.getDate() + 2)
    return tasks.filter((task) => {
      const dueDate = new Date(task.dueDate)
      return task.status !== 'Выполнена' && dueDate >= today && dueDate <= threshold
    })
  }, [tasks])

  const visibleTasks = useMemo(
    () => (taskFilter === 'Все' ? tasks : tasks.filter((task) => task.status === taskFilter)),
    [taskFilter, tasks],
  )

  const byTypeStats = useMemo(
    () =>
      TASK_TYPES.map((type) => {
        const scopedTasks = tasks.filter((task) => task.type === type)
        const total = scopedTasks.length
        const completed = scopedTasks.filter((task) => task.status === 'Выполнена').length
        return {
          type,
          total,
          completed,
          progress: total ? Math.round((completed / total) * 100) : 0,
        }
      }),
    [tasks],
  )

  const byStatusStats = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        count: tasks.filter((task) => task.status === status).length,
      })),
    [tasks],
  )

  const employeeStats = useMemo(
    () =>
      EMPLOYEES.map((employee) => {
        const employeeTasks = tasks.filter((task) => task.assignee === employee)
        const total = employeeTasks.length
        const completed = employeeTasks.filter((task) => task.status === 'Выполнена').length
        return {
          employee,
          total,
          completed,
          load: total ? Math.round((completed / total) * 100) : 0,
        }
      }).sort((a, b) => b.total - a.total),
    [tasks],
  )

  const statusDonutStyle = useMemo(
    () => buildDonutGradient(byStatusStats.map((item) => item.count)),
    [byStatusStats],
  )

  const reportTimelineView = useMemo(
    () =>
      reportTimeline.map((point) => ({
        ...point,
        assignedView: reportMode === 'monthly' ? point.assigned : point.cumulativeAssigned,
        completedView: reportMode === 'monthly' ? point.completed : point.cumulativeCompleted,
        overdueView: reportMode === 'monthly' ? point.overdue : point.cumulativeOverdue,
        approvalsView: reportMode === 'monthly' ? point.approvals : point.cumulativeApprovals,
      })),
    [reportMode, reportTimeline],
  )

  const maxChartValue = useMemo(() => {
    const values = reportTimelineView.flatMap((point) => [point.assignedView, point.completedView])
    return Math.max(...values, 1)
  }, [reportTimelineView])

  const assignedLinePoints = useMemo(
    () => buildLinePoints(reportTimelineView.map((point) => point.assignedView), maxChartValue),
    [maxChartValue, reportTimelineView],
  )

  const completedLinePoints = useMemo(
    () => buildLinePoints(reportTimelineView.map((point) => point.completedView), maxChartValue),
    [maxChartValue, reportTimelineView],
  )

  const selectedMonthSummary = useMemo(
    () => reportTimeline.find((point) => point.monthKey === selectedMonth) ?? null,
    [reportTimeline, selectedMonth],
  )

  const selectedMonthMetrics = useMemo(() => {
    if (!selectedMonthSummary) {
      return null
    }
    return reportMode === 'monthly'
      ? {
          assigned: selectedMonthSummary.assigned,
          completed: selectedMonthSummary.completed,
          overdue: selectedMonthSummary.overdue,
          approvals: selectedMonthSummary.approvals,
        }
      : {
          assigned: selectedMonthSummary.cumulativeAssigned,
          completed: selectedMonthSummary.cumulativeCompleted,
          overdue: selectedMonthSummary.cumulativeOverdue,
          approvals: selectedMonthSummary.cumulativeApprovals,
        }
  }, [reportMode, selectedMonthSummary])

  const totalReportStats = useMemo(() => {
    return reportTimeline.reduce(
      (accumulator, point) => {
        accumulator.assigned += point.assigned
        accumulator.completed += point.completed
        accumulator.overdue += point.overdue
        accumulator.approvals += point.approvals
        return accumulator
      },
      { assigned: 0, completed: 0, overdue: 0, approvals: 0 },
    )
  }, [reportTimeline])

  const completionTrend = useMemo(() => {
    if (!totalReportStats.assigned) {
      return 0
    }
    return Math.round((totalReportStats.completed / totalReportStats.assigned) * 100)
  }, [totalReportStats.assigned, totalReportStats.completed])

  const monthLabelMap = useMemo(
    () => Object.fromEntries(reportTimeline.map((point) => [point.monthKey, point.monthLabel])),
    [reportTimeline],
  )

  const currentDocumentStatusLabel = useMemo(
    () => (currentDocument ? DOCUMENT_STATUS_LABELS[currentDocument.status] : ''),
    [currentDocument],
  )

  const loadReports = useCallback(async (monthOverride?: string) => {
    setReportsLoading(true)
    setReportsError('')
    try {
      const queryString = monthOverride ? `?month=${encodeURIComponent(monthOverride)}` : ''
      const response = await fetch(`${API_BASE_URL}/reports/overview${queryString}`)
      if (!response.ok) {
        throw new Error(`Ошибка загрузки отчетности: ${response.status}`)
      }
      const payload = (await response.json()) as ReportOverviewResponse
      setReportTimeline(payload.timeline)
      setAvailableMonths(payload.availableMonths)
      setSelectedMonth(payload.selectedMonth)
      setEmployeeBreakdown(payload.employeeBreakdown)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить отчетность'
      setReportsError(message)
    } finally {
      setReportsLoading(false)
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true)
    setDocumentsError('')
    try {
      const [currentResponse, listResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/documents/current`),
        fetch(`${API_BASE_URL}/documents`),
      ])

      if (!currentResponse.ok && currentResponse.status !== 404) {
        throw new Error(`Ошибка загрузки документа: ${currentResponse.status}`)
      }
      if (!listResponse.ok) {
        throw new Error(`Ошибка загрузки документов: ${listResponse.status}`)
      }

      if (currentResponse.status === 404) {
        setCurrentDocument(null)
      } else {
        const currentPayload = (await currentResponse.json()) as CurrentDocumentResponse
        setCurrentDocument(currentPayload.document)
      }

      const listPayload = (await listResponse.json()) as DocumentsResponse
      setDocuments(listPayload.documents)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить документы'
      setDocumentsError(message)
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReports()
    void loadDocuments()
  }, [loadDocuments, loadReports])

  useEffect(() => {
    const candidate = notifications.find(
      (item) => item.unread && item.requireAction && !shownPopups.includes(item.id),
    )
    if (!candidate) {
      return undefined
    }
    const timer = window.setTimeout(() => {
      setPopupNotification(candidate)
      setShownPopups((prev) => [...prev, candidate.id])
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [notifications, shownPopups])

  useEffect(() => {
    if (!flashMessage) {
      return undefined
    }
    const timer = window.setTimeout(() => setFlashMessage(''), 3200)
    return () => window.clearTimeout(timer)
  }, [flashMessage])

  const updateTaskStatus = (taskId: number, nextStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
              progress:
                nextStatus === 'Выполнена'
                  ? 100
                  : task.progress === 100
                    ? 90
                    : Math.max(task.progress, 15),
            }
          : task,
      ),
    )
  }

  const updateTaskProgress = (taskId: number, nextProgress: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) {
          return task
        }
        if (nextProgress === 100) {
          return { ...task, progress: 100, status: 'Выполнена' }
        }
        return {
          ...task,
          progress: nextProgress,
          status:
            task.status === 'Выполнена'
              ? 'В работе'
              : task.status === 'Новая'
                ? 'В работе'
                : task.status,
        }
      }),
    )
  }

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, unread: false } : item)),
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })))
  }

  const handleNotificationAction = (notification: NotificationItem) => {
    markNotificationAsRead(notification.id)
    setPopupNotification(null)
    setIsNotificationOpen(false)

    if (notification.action === 'signature') {
      setActiveTab('documents')
      setFlashMessage('Открыта вкладка документа. Выполните подписание.')
      return
    }

    if (notification.action === 'review') {
      setActiveTab('analytics')
      setFlashMessage('Открыт аналитический отчет по текущему периоду.')
      return
    }

    setActiveTab('tasks')
    setTaskFilter('На согласовании')
    setFlashMessage('Открыты задачи, требующие согласования или подписания.')
  }

  const handleReportMonthChange = (month: string) => {
    setSelectedMonth(month)
    void loadReports(month)
  }

  const handleSignDocument = async () => {
    if (!currentDocument) {
      return
    }
    setSigningInProgress(true)
    setDocumentsError('')
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${currentDocument.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName }),
      })
      if (!response.ok) {
        throw new Error(`Ошибка подписания документа: ${response.status}`)
      }

      const payload = (await response.json()) as SignDocumentResponse
      setCurrentDocument(payload.document)
      setFlashMessage(
        payload.alreadySigned
          ? 'Документ уже был подписан ранее.'
          : 'Документ успешно подписан электронной подписью.',
      )

      setNotifications((prev) =>
        prev.map((item) =>
          item.action === 'signature'
            ? {
                ...item,
                unread: false,
                requireAction: false,
                description: 'Подписание завершено, документ отправлен в архив.',
              }
            : item,
        ),
      )

      await loadDocuments()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подписать документ'
      setDocumentsError(message)
    } finally {
      setSigningInProgress(false)
    }
  }

  const handleDraftChange = <K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) {
      return
    }

    const nextTask: Task = {
      id: tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1,
      title,
      assignee: draft.assignee,
      type: draft.type,
      status: 'Новая',
      priority: draft.priority,
      dueDate: draft.dueDate,
      progress: 0,
      description: draft.description.trim(),
    }

    setTasks((prev) => [nextTask, ...prev])
    setActiveTab('tasks')
    setTaskFilter('Все')
    setFlashMessage(`Задача поставлена: ${nextTask.title}`)
    setDraft((prev) => ({
      ...prev,
      title: '',
      description: '',
      dueDate: getDateOffset(3),
      priority: 'Средний',
      type: TASK_TYPES[0],
    }))
  }

  return (
    <div className="workspace-shell">
      {isNotificationOpen ? (
        <button
          className="backdrop"
          type="button"
          aria-label="Закрыть панель уведомлений"
          onClick={() => setIsNotificationOpen(false)}
        />
      ) : null}

      <header className="workspace-header">
        <div>
          <p className="eyebrow">Автоматизированное рабочее место руководителя</p>
          <h1>Управление задачами, контролем и отчетностью</h1>
          <p className="header-subtitle">
            Единый интерфейс для постановки задач сотрудникам, контроля исполнения, аналитики и
            действий по согласованиям.
          </p>
        </div>
        <div className="header-actions">
          <span className="date-chip">{new Date().toLocaleDateString('ru-RU')}</span>
          <button
            className="notification-trigger"
            type="button"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
          >
            Уведомления
            {unreadNotificationsCount ? <span>{unreadNotificationsCount}</span> : null}
          </button>
        </div>
      </header>

      {flashMessage ? <div className="flash-message">{flashMessage}</div> : null}

      <section className="kpi-grid">
        <article className="kpi-card">
          <p>Всего задач</p>
          <h3>{totalTasks}</h3>
          <span>Активные и завершенные поручения</span>
        </article>
        <article className="kpi-card">
          <p>Выполнено</p>
          <h3>
            {completedTasks} <small>({completionRate}%)</small>
          </h3>
          <span>Доля закрытых задач команды</span>
        </article>
        <article className="kpi-card">
          <p>На согласовании</p>
          <h3>{onApprovalTasks}</h3>
          <span>Требуется управленческое решение</span>
        </article>
        <article className="kpi-card">
          <p>Срочные задачи</p>
          <h3>{urgentTasks.length}</h3>
          <span>Срок исполнения в ближайшие 48 часов</span>
        </article>
      </section>

      <nav className="tabs">
        <button
          type="button"
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          Постановка задач
        </button>
        <button
          type="button"
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Дашборды
        </button>
        <button
          type="button"
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Аналитическая отчетность
        </button>
        <button
          type="button"
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          Документы и подпись
        </button>
      </nav>

      <main className="tab-panel">
        {activeTab === 'tasks' ? (
          <div className="tasks-layout">
            <section className="surface-card">
              <div className="card-head">
                <h2>Постановка задачи сотруднику</h2>
                <p>Создайте задачу, назначьте исполнителя и срок выполнения.</p>
              </div>
              <form className="task-form" onSubmit={handleCreateTask}>
                <label>
                  Название задачи
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => handleDraftChange('title', event.target.value)}
                    placeholder="Например: Подготовить коммерческое предложение"
                    required
                  />
                </label>

                <div className="field-row">
                  <label>
                    Исполнитель
                    <select
                      value={draft.assignee}
                      onChange={(event) => handleDraftChange('assignee', event.target.value)}
                    >
                      {EMPLOYEES.map((employee) => (
                        <option key={employee} value={employee}>
                          {employee}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Тип задачи
                    <select
                      value={draft.type}
                      onChange={(event) => handleDraftChange('type', event.target.value as TaskType)}
                    >
                      {TASK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Приоритет
                    <select
                      value={draft.priority}
                      onChange={(event) =>
                        handleDraftChange('priority', event.target.value as Priority)
                      }
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Срок исполнения
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) => handleDraftChange('dueDate', event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Комментарий
                  <textarea
                    value={draft.description}
                    rows={4}
                    onChange={(event) => handleDraftChange('description', event.target.value)}
                    placeholder="Контекст, ожидаемый результат, ссылки на документы"
                  />
                </label>

                <button className="primary-btn" type="submit">
                  Поставить задачу
                </button>
              </form>
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Контроль выполнения</h2>
                <p>Отслеживайте статус и прогресс по каждому поручению.</p>
              </div>
              <div className="filter-row">
                {(['Все', ...TASK_STATUSES] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={taskFilter === filter ? 'active' : ''}
                    onClick={() => setTaskFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="task-list">
                {visibleTasks.map((task) => (
                  <article className="task-item" key={task.id}>
                    <div className="task-row">
                      <div>
                        <h3>{task.title}</h3>
                        <p>{task.description || 'Описание не добавлено.'}</p>
                      </div>
                      <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="task-meta">
                      <span>{task.assignee}</span>
                      <span>{task.type}</span>
                      <span>{formatDate(task.dueDate)}</span>
                    </div>

                    <div className="task-controls">
                      <label>
                        Статус
                        <select
                          value={task.status}
                          onChange={(event) =>
                            updateTaskStatus(task.id, event.target.value as TaskStatus)
                          }
                        >
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Прогресс
                        <div className="progress-input">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={task.progress}
                            onChange={(event) =>
                              updateTaskProgress(task.id, Number(event.target.value))
                            }
                          />
                          <span>{task.progress}%</span>
                        </div>
                      </label>
                    </div>

                    <div className="progress-track">
                      <span style={{ width: `${task.progress}%` }} />
                    </div>
                  </article>
                ))}
                {!visibleTasks.length ? (
                  <p className="empty-state">
                    По выбранному фильтру задач нет. Выберите другой статус или создайте новую
                    задачу.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'dashboard' ? (
          <div className="dashboard-layout">
            <section className="surface-card">
              <div className="card-head">
                <h2>Выполнение по типам задач</h2>
                <p>Сравнение прогресса по основным направлениям работы.</p>
              </div>
              <div className="type-stats">
                {byTypeStats.map((item) => (
                  <article key={item.type}>
                    <div className="stat-head">
                      <h3>{item.type}</h3>
                      <span>
                        {item.completed}/{item.total}
                      </span>
                    </div>
                    <div className="stat-progress">
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                    <small>Выполнение: {item.progress}%</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Структура статусов</h2>
                <p>Распределение задач на текущий момент.</p>
              </div>
              <div className="status-donut-block">
                <div className="status-donut" style={{ background: statusDonutStyle }}>
                  <span>{completionRate}%</span>
                </div>
                <ul>
                  {byStatusStats.map((item) => (
                    <li key={item.status}>
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                      />
                      {item.status}
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Нагрузка сотрудников</h2>
                <p>Контроль распределения задач между участниками команды.</p>
              </div>
              <div className="employee-list">
                {employeeStats.map((item) => (
                  <article key={item.employee}>
                    <div className="employee-head">
                      <h3>{item.employee}</h3>
                      <span>{item.total} задач</span>
                    </div>
                    <div className="employee-progress">
                      <span style={{ width: `${item.load}%` }} />
                    </div>
                    <small>Завершено: {item.completed}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-card report-surface">
              <div className="card-head report-head">
                <div>
                  <h2>Отчетность подчиненных (PostgreSQL)</h2>
                  <p>Синтетические данные по задачам сотрудников: помесячно и накопительно.</p>
                </div>
                <div className="report-controls">
                  <label>
                    Месяц
                    <select
                      value={selectedMonth ?? ''}
                      onChange={(event) => handleReportMonthChange(event.target.value)}
                      disabled={!availableMonths.length || reportsLoading}
                    >
                      {availableMonths.map((monthKey) => (
                        <option key={monthKey} value={monthKey}>
                          {monthLabelMap[monthKey] ?? monthKey}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mode-switch">
                    <button
                      type="button"
                      className={reportMode === 'monthly' ? 'active' : ''}
                      onClick={() => setReportMode('monthly')}
                    >
                      За месяц
                    </button>
                    <button
                      type="button"
                      className={reportMode === 'cumulative' ? 'active' : ''}
                      onClick={() => setReportMode('cumulative')}
                    >
                      Накопительно
                    </button>
                  </div>
                </div>
              </div>

              {reportsLoading ? <p className="loading-note">Загрузка отчетности из PostgreSQL...</p> : null}
              {reportsError ? <p className="error-note">{reportsError}</p> : null}

              {!reportsLoading && !reportsError && reportTimelineView.length ? (
                <>
                  <div className="line-chart">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="График отчетности">
                      <line x1="0" y1="90" x2="100" y2="90" />
                      <line x1="0" y1="60" x2="100" y2="60" />
                      <line x1="0" y1="30" x2="100" y2="30" />
                      <polyline className="created-line" points={assignedLinePoints} />
                      <polyline className="completed-line" points={completedLinePoints} />
                    </svg>
                    <div className="chart-labels dynamic-labels">
                      {reportTimelineView.map((point) => (
                        <span key={point.monthKey}>{point.monthLabel}</span>
                      ))}
                    </div>
                  </div>

                  <div className="chart-legend">
                    <span>
                      <i className="legend created" />
                      Назначено задач
                    </span>
                    <span>
                      <i className="legend completed" />
                      Выполнено задач
                    </span>
                  </div>

                  <div className="report-kpi-grid">
                    <article>
                      <p>{reportMode === 'monthly' ? 'Назначено за месяц' : 'Назначено накопительно'}</p>
                      <h3>{selectedMonthMetrics?.assigned ?? 0}</h3>
                    </article>
                    <article>
                      <p>{reportMode === 'monthly' ? 'Выполнено за месяц' : 'Выполнено накопительно'}</p>
                      <h3>{selectedMonthMetrics?.completed ?? 0}</h3>
                    </article>
                    <article>
                      <p>{reportMode === 'monthly' ? 'Просрочено за месяц' : 'Просрочено накопительно'}</p>
                      <h3>{selectedMonthMetrics?.overdue ?? 0}</h3>
                    </article>
                    <article>
                      <p>{reportMode === 'monthly' ? 'Согласования за месяц' : 'Согласования накопительно'}</p>
                      <h3>{selectedMonthMetrics?.approvals ?? 0}</h3>
                    </article>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Сотрудник</th>
                          <th>Назначено</th>
                          <th>Выполнено</th>
                          <th>Просрочено</th>
                          <th>Согласования</th>
                          <th>Исполнение</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeBreakdown.map((employee) => (
                          <tr key={employee.employeeName}>
                            <td>{employee.employeeName}</td>
                            <td>{employee.assigned}</td>
                            <td>{employee.completed}</td>
                            <td>{employee.overdue}</td>
                            <td>{employee.approvals}</td>
                            <td>{employee.completionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        ) : null}

        {activeTab === 'analytics' ? (
          <div className="analytics-layout">
            <section className="surface-card chart-surface">
              <div className="card-head chart-head">
                <div>
                  <h2>Аналитическая динамика</h2>
                  <p>Данные по отчетности подчиненных на основании PostgreSQL.</p>
                </div>
                <button className="ghost-btn" type="button">
                  Экспорт отчета
                </button>
              </div>

              <div className="line-chart">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="График динамики">
                  <line x1="0" y1="90" x2="100" y2="90" />
                  <line x1="0" y1="60" x2="100" y2="60" />
                  <line x1="0" y1="30" x2="100" y2="30" />
                  <polyline className="created-line" points={assignedLinePoints} />
                  <polyline className="completed-line" points={completedLinePoints} />
                </svg>
                <div className="chart-labels dynamic-labels">
                  {reportTimelineView.map((point) => (
                    <span key={point.monthKey}>{point.monthLabel}</span>
                  ))}
                </div>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend created" />
                  Назначено задач
                </span>
                <span>
                  <i className="legend completed" />
                  Выполнено задач
                </span>
              </div>
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Показатели периода</h2>
                <p>Сводная аналитика по качеству исполнения.</p>
              </div>
              <div className="analytics-kpi">
                <article>
                  <p>Процент исполнения</p>
                  <h3>{completionTrend}%</h3>
                  <span>По данным всего отчетного периода</span>
                </article>
                <article>
                  <p>Просроченные задачи</p>
                  <h3>{totalReportStats.overdue}</h3>
                  <span>Суммарно за все месяцы</span>
                </article>
                <article>
                  <p>Открытые согласования</p>
                  <h3>{totalReportStats.approvals}</h3>
                  <span>Накопительный итог по отчетам</span>
                </article>
              </div>
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Таблица отчетности</h2>
                <p>Детализация результатов по месяцам и накопительный итог.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Месяц</th>
                      <th>Назначено</th>
                      <th>Выполнено</th>
                      <th>Просрочено</th>
                      <th>Накоп. назначено</th>
                      <th>Накоп. выполнено</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTimeline.map((point) => (
                      <tr key={point.monthKey}>
                        <td>{point.monthLabel}</td>
                        <td>{point.assigned}</td>
                        <td>{point.completed}</td>
                        <td>{point.overdue}</td>
                        <td>{point.cumulativeAssigned}</td>
                        <td>{point.cumulativeCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'documents' ? (
          <div className="documents-layout">
            <section className="surface-card">
              <div className="card-head">
                <div>
                  <h2>Визуализация документа и подписания</h2>
                  <p>Просмотр документа, статус согласования и подписание электронной подписью.</p>
                </div>
                {currentDocument ? (
                  <span className={`document-status-pill status-${currentDocument.status}`}>
                    {currentDocumentStatusLabel}
                  </span>
                ) : null}
              </div>

              {documentsLoading ? <p className="loading-note">Загрузка документа...</p> : null}
              {documentsError ? <p className="error-note">{documentsError}</p> : null}

              {!documentsLoading && !documentsError && currentDocument ? (
                <div className="document-layout">
                  <article className="document-paper">
                    <header>
                      <p>Служебный документ</p>
                      <h3>{currentDocument.title}</h3>
                    </header>

                    <div className="document-meta">
                      <span>
                        <strong>Номер:</strong> {currentDocument.documentNumber}
                      </span>
                      <span>
                        <strong>Подразделение:</strong> {currentDocument.department}
                      </span>
                      <span>
                        <strong>Инициатор:</strong> {currentDocument.ownerName}
                      </span>
                      <span>
                        <strong>Создан:</strong> {formatDateTime(currentDocument.createdAt)}
                      </span>
                    </div>

                    <p className="document-text">{currentDocument.content}</p>

                    <div className="signature-zone">
                      <h4>Статус подписания</h4>
                      {currentDocument.status === 'signed' ? (
                        <div className="signature-stamp">
                          <p>Документ подписан</p>
                          <strong>{currentDocument.signerName}</strong>
                          <span>{formatDateTime(currentDocument.signedAt)}</span>
                          <code>{currentDocument.signatureCode}</code>
                        </div>
                      ) : (
                        <p className="pending-note">
                          Документ ожидает подписи руководителя. После подписания статус обновится
                          автоматически.
                        </p>
                      )}
                    </div>
                  </article>

                  <aside className="signature-panel">
                    <h3>Подписание документа</h3>
                    <p>Введите ФИО подписанта и подтвердите действие.</p>
                    <label>
                      Подписант
                      <input
                        type="text"
                        value={signerName}
                        onChange={(event) => setSignerName(event.target.value)}
                        placeholder="ФИО руководителя"
                        disabled={currentDocument.status === 'signed'}
                      />
                    </label>
                    <button
                      className="primary-btn"
                      type="button"
                      disabled={currentDocument.status === 'signed' || signingInProgress}
                      onClick={handleSignDocument}
                    >
                      {currentDocument.status === 'signed'
                        ? 'Документ уже подписан'
                        : signingInProgress
                          ? 'Подписание...'
                          : 'Подписать документ'}
                    </button>
                  </aside>
                </div>
              ) : null}
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Реестр документов</h2>
                <p>История документов с текущими статусами.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Номер</th>
                      <th>Документ</th>
                      <th>Подразделение</th>
                      <th>Статус</th>
                      <th>Подписант</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td>{document.documentNumber}</td>
                        <td>{document.title}</td>
                        <td>{document.department}</td>
                        <td>{DOCUMENT_STATUS_LABELS[document.status]}</td>
                        <td>{document.signerName ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </main>

      <aside className={`notification-panel ${isNotificationOpen ? 'open' : ''}`}>
        <div className="card-head">
          <h2>Уведомления</h2>
          <button className="ghost-btn" type="button" onClick={markAllNotificationsAsRead}>
            Отметить все прочитанными
          </button>
        </div>
        <div className="notice-list">
          {notifications.map((item) => (
            <article className={`notice-item ${item.unread ? 'unread' : ''}`} key={item.id}>
              <div className="notice-top">
                <span>{item.requireAction ? 'Требуется действие' : 'Информация'}</span>
                <time>{item.createdAt}</time>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="notice-actions">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => handleNotificationAction(item)}
                >
                  {item.actionLabel}
                </button>
                {item.unread ? (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => markNotificationAsRead(item.id)}
                  >
                    Прочитано
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </aside>

      {popupNotification ? (
        <div className="popup-overlay" role="dialog" aria-modal="true" aria-label="Требуется действие">
          <div className="popup-card">
            <p className="popup-tag">Нужно действие руководителя</p>
            <h3>{popupNotification.title}</h3>
            <p>{popupNotification.description}</p>
            <div className="popup-actions">
              <button
                className="primary-btn"
                type="button"
                onClick={() => handleNotificationAction(popupNotification)}
              >
                {popupNotification.actionLabel}
              </button>
              <button className="ghost-btn" type="button" onClick={() => setPopupNotification(null)}>
                Напомнить позже
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
