import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type TabId = 'tasks' | 'dashboard' | 'analytics'
type TaskType = 'Операционные' | 'Проектные' | 'Документооборот' | 'Персонал'
type TaskStatus = 'Новая' | 'В работе' | 'На согласовании' | 'Выполнена'
type Priority = 'Низкий' | 'Средний' | 'Высокий'
type NotificationAction = 'approval' | 'signature' | 'review'

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

interface AnalyticsPoint {
  month: string
  created: number
  completed: number
  overdue: number
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
    actionLabel: 'Перейти к подписанию',
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

const ANALYTICS_SERIES: AnalyticsPoint[] = [
  { month: 'Сен', created: 48, completed: 41, overdue: 5 },
  { month: 'Окт', created: 52, completed: 46, overdue: 4 },
  { month: 'Ноя', created: 57, completed: 50, overdue: 6 },
  { month: 'Дек', created: 50, completed: 47, overdue: 3 },
  { month: 'Янв', created: 62, completed: 55, overdue: 4 },
  { month: 'Фев', created: 58, completed: 53, overdue: 3 },
]

const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(isoDate))

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

const buildLinePoints = (
  points: AnalyticsPoint[],
  key: 'created' | 'completed',
  maxValue: number,
): string =>
  points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100
      const y = 90 - (point[key] / maxValue) * 70
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

  const maxChartValue = useMemo(
    () => Math.max(...ANALYTICS_SERIES.flatMap((point) => [point.created, point.completed]), 1),
    [],
  )
  const createdLinePoints = useMemo(
    () => buildLinePoints(ANALYTICS_SERIES, 'created', maxChartValue),
    [maxChartValue],
  )
  const completedLinePoints = useMemo(
    () => buildLinePoints(ANALYTICS_SERIES, 'completed', maxChartValue),
    [maxChartValue],
  )

  const completionTrend = useMemo(() => {
    const created = ANALYTICS_SERIES.reduce((sum, item) => sum + item.created, 0)
    const completed = ANALYTICS_SERIES.reduce((sum, item) => sum + item.completed, 0)
    return created ? Math.round((completed / created) * 100) : 0
  }, [])
  const overdueTrend = useMemo(
    () => ANALYTICS_SERIES.reduce((sum, item) => sum + item.overdue, 0),
    [],
  )

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

    if (notification.action === 'review') {
      setActiveTab('analytics')
      setFlashMessage('Открыт аналитический отчет по текущему периоду.')
      return
    }

    setActiveTab('tasks')
    setTaskFilter('На согласовании')
    setFlashMessage('Открыты задачи, требующие согласования или подписания.')
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
          </div>
        ) : null}

        {activeTab === 'analytics' ? (
          <div className="analytics-layout">
            <section className="surface-card chart-surface">
              <div className="card-head chart-head">
                <div>
                  <h2>Аналитическая динамика</h2>
                  <p>Количество созданных и закрытых задач по месяцам.</p>
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
                  <polyline className="created-line" points={createdLinePoints} />
                  <polyline className="completed-line" points={completedLinePoints} />
                </svg>
                <div className="chart-labels">
                  {ANALYTICS_SERIES.map((point) => (
                    <span key={point.month}>{point.month}</span>
                  ))}
                </div>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend created" />
                  Создано задач
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
                  <span>По данным последних 6 месяцев</span>
                </article>
                <article>
                  <p>Просроченные задачи</p>
                  <h3>{overdueTrend}</h3>
                  <span>Суммарно за отчетный период</span>
                </article>
                <article>
                  <p>Открытые согласования</p>
                  <h3>{onApprovalTasks}</h3>
                  <span>Требуют вашего решения сегодня</span>
                </article>
              </div>
            </section>

            <section className="surface-card">
              <div className="card-head">
                <h2>Таблица отчетности</h2>
                <p>Детализация результатов по месяцам.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Месяц</th>
                      <th>Создано</th>
                      <th>Выполнено</th>
                      <th>Просрочено</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ANALYTICS_SERIES.map((point) => (
                      <tr key={point.month}>
                        <td>{point.month}</td>
                        <td>{point.created}</td>
                        <td>{point.completed}</td>
                        <td>{point.overdue}</td>
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
