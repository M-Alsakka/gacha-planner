import { apiFetch } from '@/lib/api';

export type Game = {
  id: string;
  name: string;
  slug: string;
  syncType: string;
  isActive: boolean;
  hasDailyPlanner: boolean;
  hasMaterialPlanner: boolean;
};

export type TaskType = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  category: string;
  isSchedulable: boolean;
  isRepeatable: boolean;
};

export type ActivityType = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  resourceType: string;
  defaultUnit: string;
  isActive: boolean;
};

export function getGamesRequest(): Promise<Game[]> {
  return apiFetch<Game[]>('/games');
}

export function getGameTaskTypesRequest(gameId: string): Promise<TaskType[]> {
  return apiFetch<TaskType[]>(`/games/${gameId}/task-types`);
}

export function getGameActivityTypesRequest(gameId: string): Promise<ActivityType[]> {
  return apiFetch<ActivityType[]>(`/games/${gameId}/activity-types`);
}