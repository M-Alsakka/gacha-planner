import { useEffect, useMemo, useState } from "react";
import {
  createTaskRequest,
  deleteTaskRequest,
  getTasksRequest,
  markTaskDoneRequest,
  scheduleTaskRequest,
  unscheduleTaskRequest,
  updateTaskRequest,
  type TaskListItem,
} from "@/api/tasks";
import {
  getGameTaskTypesRequest,
  getGamesRequest,
  type Game,
  type TaskType,
} from "@/api/games";
import { extractErrorMessage } from "@/lib/api";
import "../styles/home.css";

type PriorityValue = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ModalMode = "create" | "edit";

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "success";
  action: null | (() => Promise<void>);
};

function startOfWeekMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPastDay(day: Date, today: Date) {
  const a = new Date(day);
  const b = new Date(today);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return a.getTime() < b.getTime();
}

function formatDateTime(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function isTaskOverdue(task: TaskListItem, referenceDate = new Date()) {
  if (!task.dueDate) return false;
  return new Date(task.dueDate).getTime() < referenceDate.getTime();
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function TaskImagePlaceholder() {
  return (
    <div className="task-image-placeholder">
      <span>Image soon</span>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v7h-2v-7Zm4 0h2v7h-2v-7ZM7 10h2v7H7v-7Zm-1 10h12l1-12H5l1 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m9.55 18.2-5.2-5.2 1.4-1.4 3.8 3.8 8.7-8.7 1.4 1.4-10.1 10.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HomePage() {
  const [unscheduledTasks, setUnscheduledTasks] = useState<TaskListItem[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<TaskListItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [taskTypesLoading, setTaskTypesLoading] = useState(false);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<PriorityValue>("MEDIUM");

  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishingTaskId, setFinishingTaskId] = useState<string | null>(null);
  const [unschedulingTaskId, setUnschedulingTaskId] = useState<string | null>(
    null,
  );
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingTask, setEditingTask] = useState<TaskListItem | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    tone: "danger",
    action: null,
  });
  const [confirming, setConfirming] = useState(false);
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const nowForValidation = useMemo(() => new Date(), [isTaskModalOpen, modalMode]);

  const weekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const scheduledDateError =
    scheduledDate && new Date(scheduledDate).getTime() < nowForValidation.getTime()
      ? "Scheduled date cannot be before the current time."
      : "";

  const dueDateError =
    dueDate &&
    new Date(dueDate).getTime() < nowForValidation.getTime()
      ? "Due date cannot be before the current time."
      : "";

  const hasDateErrors = !!scheduledDateError || !!dueDateError;

  const loadTasks = async () => {
    setTasksLoading(true);
    setError("");

    try {
      const [pendingData, scheduledData] = await Promise.all([
        getTasksRequest("pending"),
        getTasksRequest("scheduled"),
      ]);

      setUnscheduledTasks(pendingData);
      setScheduledTasks(scheduledData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setTasksLoading(false);
    }
  };

  const loadGames = async () => {
    setGamesLoading(true);
    setError("");

    try {
      const data = await getGamesRequest();
      setGames(data);

      if (data.length > 0 && !selectedGameId) {
        setSelectedGameId(data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setGamesLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
    void loadGames();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedGameId) {
        setTaskTypes([]);
        setSelectedTaskTypeId("");
        return;
      }

      setTaskTypesLoading(true);
      setSubmitError("");

      try {
        const data = await getGameTaskTypesRequest(selectedGameId);
        const filtered = data.filter((item) => item.key !== "daily");
        setTaskTypes(filtered);

        if (!filtered.some((item) => item.id === selectedTaskTypeId)) {
          setSelectedTaskTypeId(filtered[0]?.id ?? "");
        }
      } catch (err) {
        setSubmitError(extractErrorMessage(err));
      } finally {
        setTaskTypesLoading(false);
      }
    };

    void run();
  }, [selectedGameId, selectedTaskTypeId]);

  const resetForm = () => {
    setSelectedTaskTypeId("");
    setTitle("");
    setDescription("");
    setNotes("");
    setScheduledDate("");
    setDueDate("");
    setPriority("MEDIUM");
    setSubmitError("");
    setEditingTask(null);
    setModalMode("create");
  };

  const openCreateModal = () => {
    resetForm();

    if (games.length > 0) {
      setSelectedGameId((prev) => prev || games[0].id);
    }

    setModalMode("create");
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: TaskListItem) => {
    setModalMode("edit");
    setEditingTask(task);
    setSelectedGameId(task.gameId);
    setSelectedTaskTypeId(task.taskTypeId);
    setTitle(task.title);
    setDescription(task.description || "");
    setNotes(task.notes || "");
    setScheduledDate(toDateTimeLocal(task.scheduledDate));
    setDueDate(toDateTimeLocal(task.dueDate));
    setPriority(task.priority);
    setSubmitError("");
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    if (submitting) return;
    setIsTaskModalOpen(false);
    setSubmitError("");
  };

  const openConfirmDialog = (config: Omit<ConfirmDialogState, "open">) => {
    setConfirmDialog({
      open: true,
      ...config,
    });
  };

  const closeConfirmDialog = () => {
    if (confirming) return;
    setConfirmDialog((prev) => ({
      ...prev,
      open: false,
      action: null,
    }));
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog.action) return;

    setConfirming(true);

    try {
      await confirmDialog.action();
      closeConfirmDialog();
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!selectedGameId || !selectedTaskTypeId || !title.trim()) {
      setSubmitError("Game, task type, and title are required.");
      return;
    }

    if (hasDateErrors) {
      return;
    }

    setSubmitting(true);

    try {
      if (modalMode === "create") {
        await createTaskRequest({
          gameId: selectedGameId,
          taskTypeId: selectedTaskTypeId,
          sourceType: "MANUAL",
          title: title.trim(),
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          priority,
          status: scheduledDate ? "SCHEDULED" : "PENDING",
          scheduledDate: scheduledDate || undefined,
          dueDate: dueDate || undefined,
          isAllDay: true,
          isAutoGenerated: false,
          requiresAttention: false,
        });
      } else if (editingTask) {
        await updateTaskRequest(editingTask.id, {
          gameId: selectedGameId,
          taskTypeId: selectedTaskTypeId,
          title: title.trim(),
          description: description.trim(),
          notes: notes.trim(),
          dueDate: dueDate || undefined,
          priority,
          requiresAttention: false,
          isAllDay: true,
        });
      }

      await loadTasks();
      closeTaskModal();
      resetForm();
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmMarkDone = (taskId: string) => {
    openConfirmDialog({
      title: "Mark task as done?",
      message:
        "This task will disappear from the normal pending and scheduled views.",
      confirmLabel: "Mark done",
      tone: "success",
      action: async () => {
        setFinishingTaskId(taskId);

        try {
          await markTaskDoneRequest(taskId);
          await loadTasks();
        } catch (err) {
          setError(extractErrorMessage(err));
        } finally {
          setFinishingTaskId(null);
        }
      },
    });
  };

  const confirmDeleteTask = (taskId: string) => {
    openConfirmDialog({
      title: "Delete task?",
      message: "This task will be permanently deleted.",
      confirmLabel: "Delete",
      tone: "danger",
      action: async () => {
        setDeletingTaskId(taskId);

        try {
          await deleteTaskRequest(taskId);
          await loadTasks();
        } catch (err) {
          setError(extractErrorMessage(err));
        } finally {
          setDeletingTaskId(null);
        }
      },
    });
  };

  const handleUnschedule = async (taskId: string) => {
    setUnschedulingTaskId(taskId);

    try {
      await unscheduleTaskRequest(taskId);
      await loadTasks();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUnschedulingTaskId(null);
    }
  };

  const handleDropOnDay = async (date: Date, taskId: string) => {
    if (isPastDay(date, today)) {
      setDragOverDay(null);
      return;
    }

    try {
      const dropDate = new Date(date);
      dropDate.setHours(12, 0, 0, 0);

      await scheduleTaskRequest(taskId, dropDate.toISOString());
      await loadTasks();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDragOverDay(null);
    }
  };

  const tasksForDay = (date: Date) =>
    scheduledTasks.filter((task) => {
      if (!task.scheduledDate) return false;
      return isSameDay(new Date(task.scheduledDate), date);
    });

  const handleDragStartTask = (
    event: React.DragEvent<HTMLDivElement>,
    task: TaskListItem,
  ) => {
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="home-page">
      <div className="home-layout">
        <aside className="home-sidebar">
          <div className="home-panel home-panel--sidebar">
            <div className="home-panel__header">
              <h2>Unscheduled Tasks</h2>
            </div>

            {tasksLoading ? <p>Loading tasks...</p> : null}
            {error ? <div className="home-error">{error}</div> : null}

            {!tasksLoading && !error && unscheduledTasks.length === 0 ? (
              <div className="home-empty-state">
                <p>No unscheduled tasks.</p>
                <button
                  type="button"
                  className="home-primary-button"
                  onClick={openCreateModal}
                >
                  Create Task
                </button>
              </div>
            ) : null}

            {unscheduledTasks.length > 0 ? (
              <>
                <div className="home-task-list">
                  {unscheduledTasks.map((task) => {
                    const isOverdue = isTaskOverdue(task);

                    return (
                      <div
                        key={task.id}
                        className={`home-task-card ${
                          isOverdue
                            ? "home-task-card--overdue"
                            : "home-task-card--draggable"
                        }`}
                        draggable={!isOverdue}
                        onDragStart={(event) => handleDragStartTask(event, task)}
                        onClick={() => openEditModal(task)}
                      >
                        <TaskImagePlaceholder />

                        <div className="home-task-card__top">
                          <strong>{task.title}</strong>
                        </div>

                        <span>{task.game.name}</span>
                        <small>{task.taskType.label}</small>
                        <small>
                          Due:{" "}
                          {task.dueDate
                            ? formatDateTime(task.dueDate)
                            : "No due date"}
                        </small>
                        {isOverdue ? (
                          <div className="home-task-card__warning" role="note">
                            This task is past its due date. Update the due date or
                            delete the task before you can drag it or mark it as
                            done.
                          </div>
                        ) : null}

                        <div
                          className="home-task-card__actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="home-icon-button home-icon-button--danger"
                            onClick={() => confirmDeleteTask(task.id)}
                            disabled={deletingTaskId === task.id}
                            title="Delete task"
                            aria-label="Delete task"
                          >
                            {deletingTaskId === task.id ? "..." : <TrashIcon />}
                          </button>

                          <button
                            type="button"
                            className="home-icon-button home-icon-button--success"
                            onClick={() => confirmMarkDone(task.id)}
                            disabled={isOverdue || finishingTaskId === task.id}
                            title={
                              isOverdue
                                ? "Update the due date or delete the task first"
                                : "Mark as done"
                            }
                            aria-label="Mark task as done"
                          >
                            {finishingTaskId === task.id ? "..." : <CheckIcon />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="home-sidebar__footer">
                  <button
                    type="button"
                    className="home-primary-button"
                    onClick={openCreateModal}
                  >
                    Create Task
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </aside>

        <main className="home-main">
          <div className="home-panel home-panel--calendar">
            <div className="calendar-header">
              <h1>This Week</h1>
              <p>
                {dayLabel(weekDays[0])} - {dayLabel(weekDays[6])}
              </p>
            </div>

            <div className="weekly-calendar-scroll weekly-calendar-scroll--vertical">
              <div className="weekly-calendar weekly-calendar--vertical">
                {weekDays.map((day) => {
                  const dayKey = day.toISOString();
                  const dayTasks = tasksForDay(day);
                  const pastDay = isPastDay(day, today);
                  const todayDay = isSameDay(day, today);

                  return (
                    <div
                      key={dayKey}
                      className={`calendar-day calendar-day--row ${
                        dragOverDay === dayKey ? "calendar-day--drag-over" : ""
                      } ${todayDay ? "calendar-day--today" : ""} ${
                        pastDay ? "calendar-day--past" : ""
                      }`}
                      onDragOver={(event) => {
                        if (pastDay) return;
                        event.preventDefault();
                        setDragOverDay(dayKey);
                      }}
                      onDragLeave={() => {
                        setDragOverDay((prev) =>
                          prev === dayKey ? null : prev,
                        );
                      }}
                      onDrop={(event) => {
                        if (pastDay) return;
                        event.preventDefault();
                        const taskId =
                          event.dataTransfer.getData("text/task-id");
                        if (taskId) {
                          void handleDropOnDay(day, taskId);
                        }
                      }}
                    >
                      <div className="calendar-day__header calendar-day__header--row">
                        <strong>
                          {day.toLocaleDateString(undefined, {
                            weekday: "long",
                          })}
                        </strong>
                        <span>
                          {day.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {todayDay ? (
                          <span className="calendar-today-badge">Today</span>
                        ) : null}
                      </div>

                      <div className="calendar-day__content calendar-day__content--row">
                        {dayTasks.length === 0 ? (
                          <div className="calendar-day__empty">
                            {pastDay ? "Past day" : "Drop task here"}
                          </div>
                        ) : (
                          dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className="calendar-task-card calendar-task-card--draggable"
                              draggable
                              onDragStart={(event) =>
                                handleDragStartTask(event, task)
                              }
                              onClick={() => openEditModal(task)}
                            >
                              <TaskImagePlaceholder />

                              <div className="calendar-task-card__top">
                                <strong>{task.title}</strong>
                              </div>

                              <span>{task.game.name}</span>
                              <small>{task.taskType.label}</small>

                              <div
                                className="calendar-task-card__actions"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="home-icon-button"
                                  onClick={() => handleUnschedule(task.id)}
                                  disabled={unschedulingTaskId === task.id}
                                  title="Unschedule"
                                >
                                  {unschedulingTaskId === task.id ? "…" : "×"}
                                </button>

                                <button
                                  type="button"
                                  className="home-icon-button home-icon-button--success"
                                  onClick={() => confirmMarkDone(task.id)}
                                  disabled={finishingTaskId === task.id}
                                  title="Mark as done"
                                >
                                  {finishingTaskId === task.id ? "…" : "✓"}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isTaskModalOpen && (
        <div className="home-modal-overlay" onClick={closeTaskModal}>
          <div
            className="home-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal__header">
              <h2>
                {modalMode === "create" ? "Create Manual Task" : "Edit Task"}
              </h2>
              <button
                type="button"
                className="home-modal__close"
                onClick={closeTaskModal}
              >
                ×
              </button>
            </div>

            <form className="task-form" onSubmit={handleSubmitTask}>
              <div className="task-form__grid">
                <label className="task-form__field">
                  <span>Game</span>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    disabled={gamesLoading}
                  >
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="task-form__field">
                  <span>Task Type</span>
                  <select
                    value={selectedTaskTypeId}
                    onChange={(e) => setSelectedTaskTypeId(e.target.value)}
                    disabled={taskTypesLoading || !selectedGameId}
                  >
                    {taskTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="task-form__field task-form__field--full">
                  <span>Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Finish current event"
                  />
                </label>

                <label className="task-form__field task-form__field--full">
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </label>

                <label className="task-form__field task-form__field--full">
                  <span>Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    rows={3}
                  />
                </label>

                <label className="task-form__field">
                  <span>Scheduled Date</span>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    disabled={modalMode === "edit"}
                  />
                  {scheduledDateError ? (
                    <small className="task-form__error">{scheduledDateError}</small>
                  ) : null}
                </label>

                <label className="task-form__field">
                  <span>Due Date</span>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {dueDateError ? (
                    <small className="task-form__error">{dueDateError}</small>
                  ) : null}
                </label>

                <label className="task-form__field">
                  <span>Priority</span>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as PriorityValue)
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </label>
              </div>

              {submitError ? (
                <div className="home-error">{submitError}</div>
              ) : null}

              <div className="task-form__actions">
                <button
                  type="button"
                  className="task-form__secondary-button"
                  onClick={closeTaskModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || hasDateErrors}
                >
                  {submitting
                    ? modalMode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : modalMode === "create"
                      ? "Create Task"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="confirm-dialog-overlay" onClick={closeConfirmDialog}>
          <div
            className="confirm-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-dialog__header">
              <h3>{confirmDialog.title}</h3>
            </div>

            <p className="confirm-dialog__message">{confirmDialog.message}</p>

            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="confirm-dialog__button confirm-dialog__button--secondary"
                onClick={closeConfirmDialog}
                disabled={confirming}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`confirm-dialog__button ${
                  confirmDialog.tone === "success"
                    ? "confirm-dialog__button--success"
                    : "confirm-dialog__button--danger"
                }`}
                onClick={handleConfirmDialog}
                disabled={confirming}
              >
                {confirming ? "Please wait..." : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

