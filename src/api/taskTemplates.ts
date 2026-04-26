import { apiFetch } from "@/lib/api";

export type RecurrenceType =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export type TaskTemplate = {
  id: string;
  userId: string;
  gameId: string;
  taskTypeId: string;
  titleTemplate: string;
  descriptionTemplate?: string | null;
  isEnabled: boolean;
  recurrenceType: RecurrenceType;
  intervalCount: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  autoCreateTask: boolean;
  autoCreateCalendarEntry: boolean;
  defaultDueOffsetDays?: number | null;
  startTimeMinutes: number;
  endTimeMinutes: number;
  imageUrl?: string;
  imagePath?: string;
  createdAt: string;
  updatedAt: string;
  game: {
    id: string;
    name: string;
    slug: string;
  };
  taskType: {
    id: string;
    key: string;
    label: string;
  };
};

export type CreateTaskTemplatePayload = {
  gameId: string;
  taskTypeId: string;
  titleTemplate: string;
  descriptionTemplate?: string;
  recurrenceType: RecurrenceType;
  intervalCount?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startAt?: string;
  endAt?: string;
  autoCreateTask?: boolean;
  autoCreateCalendarEntry?: boolean;
  defaultDueOffsetDays?: number;
  startTimeMinutes?: number;
  endTimeMinutes?: number;
  imageUrl?: string;
  imagePath?: string;
};

export type UpdateTaskTemplatePayload = Partial<CreateTaskTemplatePayload>;

export function getTaskTemplatesRequest() {
  return apiFetch<TaskTemplate[]>("/task-templates");
}

export function createTaskTemplateRequest(payload: CreateTaskTemplatePayload) {
  return apiFetch<TaskTemplate>("/task-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTaskTemplateRequest(
  templateId: string,
  payload: UpdateTaskTemplatePayload,
) {
  return apiFetch<TaskTemplate>(`/task-templates/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function enableTaskTemplateRequest(templateId: string) {
  return apiFetch<TaskTemplate>(`/task-templates/${templateId}/enable`, {
    method: "PATCH",
  });
}

export function disableTaskTemplateRequest(templateId: string) {
  return apiFetch<TaskTemplate>(`/task-templates/${templateId}/disable`, {
    method: "PATCH",
  });
}

export function deleteTaskTemplateRequest(templateId: string) {
  return apiFetch<{ success: boolean }>(`/task-templates/${templateId}`, {
    method: "DELETE",
  });
}

export function generateTemplateTasksRequest(
  startDate: string,
  endDate: string,
) {
  return apiFetch<{ createdCount: number }>("/task-templates/generate", {
    method: "POST",
    body: JSON.stringify({ startDate, endDate }),
  });
}
