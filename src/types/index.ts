// ---------------------------------------------------------------------------
// Core data model.
//
// A task here is intentionally much richer than a normal todo item: it carries
// the ADHD-aware dimensions (energy, emotional weight, urgency, size, time
// estimates) that power smart prioritization, the "What Now?" wizard, and the
// daily planner. Ported and trimmed from the original ADHDPlannerWorking app.
// ---------------------------------------------------------------------------

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type TaskSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge';
export type Urgency = 'today' | 'tomorrow' | 'week' | 'month' | 'someday';
export type EmotionalWeight = 'easy' | 'neutral' | 'stressful' | 'dreading';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  archived: boolean;

  // Scheduling
  dueDate: string | null;
  startDate: string | null; // When the task becomes available to start

  // Organization
  projectId: string | null;
  categoryIds: string[];
  parentTaskId: string | null;

  // Classic prioritization
  priority?: Priority;
  size?: TaskSize;
  estimatedMinutes?: number;

  // ADHD-aware multi-dimensional prioritization
  urgency?: Urgency; // Time sensitivity
  importance?: number; // 1-5: how critical to goals
  emotionalWeight?: EmotionalWeight; // Emotional difficulty
  energyRequired?: EnergyLevel; // Physical/mental effort needed
  smartPriorityScore?: number; // Calculated composite score (runtime)

  // Calibration / time-blindness support
  actualMinutesSpent?: number | null;

  // Recurring (reserved for later phases)
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;

  // Capture provenance
  braindumpSource?: string;
  aiProcessed?: boolean;

  // Soft delete
  deletedAt?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;

  // Runtime computed (derived from relationships, not stored verbatim)
  dependsOn?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  order?: number;
  completed: boolean;
  completedAt?: string | null;
  archived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlock {
  id: string;
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  taskIds: string[];
  title: string;
  description: string;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  timeBlocks: TimeBlock[];
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  section?: 'reflect' | 'overdue' | 'upcoming' | 'projects' | 'life-areas';
  prompt?: string;
  mood?: 'great' | 'good' | 'neutral' | 'challenging' | 'difficult';
  weekNumber: number;
  weekYear: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatNowCriteria {
  availableTime: 'short' | 'medium' | 'long';
  energyLevel: EnergyLevel;
  blockers: string[];
}

// A logged record of why a task wasn't completed (non-shaming accountability).
export interface AccountabilityResponse {
  id: string;
  taskId: string;
  reason: string;
  action: string;
  note?: string;
  createdAt: string;
}

export interface AppSettings {
  timeManagement: {
    defaultBufferTime: number; // minutes between tasks
    timeBlindnessAlerts: boolean;
    timeBlindnessInterval: number; // minutes between alerts
    autoAdjustEstimates: boolean;
    gettingReadyTime: number; // minutes before appointments
  };
  visual: {
    fontSize: 'small' | 'medium' | 'large';
    layoutDensity: 'compact' | 'comfortable' | 'spacious';
    reduceAnimations: boolean;
    highContrast: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  ai: {
    apiKey: string; // bring-your-own-key, stored locally only
    provider: 'openai';
    model: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeManagement: {
    defaultBufferTime: 10,
    timeBlindnessAlerts: false,
    timeBlindnessInterval: 30,
    autoAdjustEstimates: false,
    gettingReadyTime: 15,
  },
  visual: {
    fontSize: 'medium',
    layoutDensity: 'comfortable',
    reduceAnimations: false,
    highContrast: false,
    theme: 'system',
  },
  ai: {
    apiKey: '',
    provider: 'openai',
    model: 'gpt-4o-mini',
  },
};
