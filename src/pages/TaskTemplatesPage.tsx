import { useEffect, useMemo, useState } from 'react';
import {
  createTaskTemplateRequest,
  deleteTaskTemplateRequest,
  disableTaskTemplateRequest,
  enableTaskTemplateRequest,
  getTaskTemplatesRequest,
  updateTaskTemplateRequest,
  type CreateTaskTemplatePayload,
  type RecurrenceType,
  type TaskTemplate,
} from '@/api/taskTemplates';
import {
  getGameTaskTypesRequest,
  getGamesRequest,
  type Game,
  type TaskType,
} from '@/api/games';
import { extractErrorMessage } from '@/lib/api';
import '../styles/task-templates.css';

type ModalMode = 'create' | 'edit';

const WEEK_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function minutesToTimeInput(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeInputToMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TaskTemplatesPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null,
  );

  const [gameId, setGameId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('');
  const [descriptionTemplate, setDescriptionTemplate] = useState('');
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>('WEEKLY');
  const [intervalCount, setIntervalCount] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('05:59');
  const [autoCreateCalendarEntry, setAutoCreateCalendarEntry] = useState(false);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) ?? null,
    [games, gameId],
  );

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [templateData, gameData] = await Promise.all([
        getTaskTemplatesRequest(),
        getGamesRequest(),
      ]);

      setTemplates(templateData);
      setGames(gameData);

      if (gameData.length > 0 && !gameId) {
        setGameId(gameData[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!gameId) {
        setTaskTypes([]);
        setTaskTypeId('');
        return;
      }

      setFormLoading(true);
      setSubmitError('');

      try {
        const data = await getGameTaskTypesRequest(gameId);
        const filtered = data.filter((item) => item.key !== 'daily');
        setTaskTypes(filtered);

        if (!filtered.some((item) => item.id === taskTypeId)) {
          setTaskTypeId(filtered[0]?.id ?? '');
        }
      } catch (err) {
        setSubmitError(extractErrorMessage(err));
      } finally {
        setFormLoading(false);
      }
    };

    void run();
  }, [gameId, taskTypeId]);

  const resetForm = () => {
    setEditingTemplate(null);
    setModalMode('create');
    setTaskTypeId('');
    setTitleTemplate('');
    setDescriptionTemplate('');
    setRecurrenceType('WEEKLY');
    setIntervalCount(1);
    setDayOfWeek(1);
    setDayOfMonth(1);
    setStartAt('');
    setEndAt('');
    setStartTime('06:00');
    setEndTime('05:59');
    setAutoCreateCalendarEntry(false);
    setSubmitError('');
  };

  const openCreateModal = () => {
    resetForm();

    if (games.length > 0) {
      setGameId((prev) => prev || games[0].id);
    }

    setModalOpen(true);
  };

  const openEditModal = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setModalMode('edit');
    setGameId(template.gameId);
    setTaskTypeId(template.taskTypeId);
    setTitleTemplate(template.titleTemplate);
    setDescriptionTemplate(template.descriptionTemplate || '');
    setRecurrenceType(template.recurrenceType);
    setIntervalCount(template.intervalCount);
    setDayOfWeek(template.dayOfWeek ?? 1);
    setDayOfMonth(template.dayOfMonth ?? 1);
    setStartAt(toDateTimeLocal(template.startAt));
    setEndAt(toDateTimeLocal(template.endAt));
    setStartTime(minutesToTimeInput(template.startTimeMinutes));
    setEndTime(minutesToTimeInput(template.endTimeMinutes));
    setAutoCreateCalendarEntry(template.autoCreateCalendarEntry);
    setSubmitError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSubmitError('');
  };

  const buildPayload = (): CreateTaskTemplatePayload => {
    const payload: CreateTaskTemplatePayload = {
      gameId,
      taskTypeId,
      titleTemplate: titleTemplate.trim(),
      descriptionTemplate: descriptionTemplate.trim() || undefined,
      recurrenceType,
      intervalCount,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      autoCreateTask: true,
      autoCreateCalendarEntry,
      startTimeMinutes: timeInputToMinutes(startTime),
      endTimeMinutes: timeInputToMinutes(endTime),
    };

    if (recurrenceType === 'WEEKLY' || recurrenceType === 'BIWEEKLY') {
      payload.dayOfWeek = dayOfWeek;
    }

    if (recurrenceType === 'MONTHLY') {
      payload.dayOfMonth = dayOfMonth;
    }

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    if (!gameId || !taskTypeId || !titleTemplate.trim()) {
      setSubmitError('Game, task type, and title are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload();

      if (modalMode === 'create') {
        await createTaskTemplateRequest(payload);
      } else if (editingTemplate) {
        await updateTaskTemplateRequest(editingTemplate.id, payload);
      }

      await loadData();
      closeModal();
      resetForm();
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (template: TaskTemplate) => {
    setError('');

    try {
      if (template.isEnabled) {
        await disableTaskTemplateRequest(template.id);
      } else {
        await enableTaskTemplateRequest(template.id);
      }

      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleDelete = async (template: TaskTemplate) => {
    const confirmed = window.confirm(
      `Delete template "${template.titleTemplate}"? Existing generated tasks will remain.`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await deleteTaskTemplateRequest(template.id);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="templates-page">
      <div className="templates-page__header">
        <div>
          <h1>Task Templates</h1>
          <p>Create recurring task rules for weekly, biweekly, monthly, and custom resets.</p>
        </div>

        <button
          type="button"
          className="templates-primary-button"
          onClick={openCreateModal}
        >
          New Template
        </button>
      </div>

      {error ? <div className="templates-error">{error}</div> : null}

      {loading ? (
        <div className="templates-panel">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="templates-panel">
          <h2>No templates yet</h2>
          <p>Create your first recurring task template.</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-card__top">
                <div>
                  <h2>{template.titleTemplate}</h2>
                  <p>{template.descriptionTemplate || 'No description'}</p>
                </div>

                <span
                  className={`template-status ${
                    template.isEnabled
                      ? 'template-status--enabled'
                      : 'template-status--disabled'
                  }`}
                >
                  {template.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="template-card__meta">
                <span>{template.game.name}</span>
                <span>{template.taskType.label}</span>
                <span>{template.recurrenceType}</span>
                <span>
                  {minutesToTimeInput(template.startTimeMinutes)} →{' '}
                  {minutesToTimeInput(template.endTimeMinutes)}
                </span>
                <span>
                  Auto schedule: {template.autoCreateCalendarEntry ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="template-card__actions">
                <button type="button" onClick={() => openEditModal(template)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleToggleEnabled(template)}>
                  {template.isEnabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className="template-card__danger"
                  onClick={() => handleDelete(template)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="templates-modal-overlay" onClick={closeModal}>
          <div
            className="templates-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="templates-modal__header">
              <h2>
                {modalMode === 'create' ? 'Create Template' : 'Edit Template'}
              </h2>
              <button type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form className="templates-form" onSubmit={handleSubmit}>
              <div className="templates-form__grid">
                <label className="templates-form__field">
                  <span>Game</span>
                  <select
                    value={gameId}
                    onChange={(event) => setGameId(event.target.value)}
                  >
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="templates-form__field">
                  <span>Task Type</span>
                  <select
                    value={taskTypeId}
                    onChange={(event) => setTaskTypeId(event.target.value)}
                    disabled={formLoading || !selectedGame}
                  >
                    {taskTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="templates-form__field templates-form__field--full">
                  <span>Title</span>
                  <input
                    type="text"
                    value={titleTemplate}
                    onChange={(event) => setTitleTemplate(event.target.value)}
                    placeholder="Weekly boss run"
                  />
                </label>

                <label className="templates-form__field templates-form__field--full">
                  <span>Description</span>
                  <textarea
                    value={descriptionTemplate}
                    onChange={(event) =>
                      setDescriptionTemplate(event.target.value)
                    }
                    rows={3}
                    placeholder="Optional description"
                  />
                </label>

                <label className="templates-form__field">
                  <span>Recurrence</span>
                  <select
                    value={recurrenceType}
                    onChange={(event) =>
                      setRecurrenceType(event.target.value as RecurrenceType)
                    }
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Biweekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </label>

                <label className="templates-form__field">
                  <span>Interval Count</span>
                  <input
                    type="number"
                    min={1}
                    value={intervalCount}
                    onChange={(event) =>
                      setIntervalCount(Number(event.target.value))
                    }
                  />
                </label>

                {(recurrenceType === 'WEEKLY' ||
                  recurrenceType === 'BIWEEKLY') && (
                  <label className="templates-form__field">
                    <span>Day of Week</span>
                    <select
                      value={dayOfWeek}
                      onChange={(event) =>
                        setDayOfWeek(Number(event.target.value))
                      }
                    >
                      {WEEK_DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {recurrenceType === 'MONTHLY' && (
                  <label className="templates-form__field">
                    <span>Day of Month</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(event) =>
                        setDayOfMonth(Number(event.target.value))
                      }
                    />
                  </label>
                )}

                <label className="templates-form__field">
                  <span>Start Time</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </label>

                <label className="templates-form__field">
                  <span>End Time</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </label>

                <label className="templates-form__field">
                  <span>Template Start Date</span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                  />
                </label>

                <label className="templates-form__field">
                  <span>Template End Date</span>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(event) => setEndAt(event.target.value)}
                  />
                </label>

                <label className="templates-form__checkbox templates-form__field--full">
                  <input
                    type="checkbox"
                    checked={autoCreateCalendarEntry}
                    onChange={(event) =>
                      setAutoCreateCalendarEntry(event.target.checked)
                    }
                  />
                  <span>Auto schedule generated tasks on the calendar</span>
                </label>
              </div>

              {submitError ? (
                <div className="templates-error">{submitError}</div>
              ) : null}

              <div className="templates-form__actions">
                <button type="button" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving...'
                    : modalMode === 'create'
                      ? 'Create Template'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}