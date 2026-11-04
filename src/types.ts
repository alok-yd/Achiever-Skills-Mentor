export type ModuleKey = "dashboard" | "roadmap" | "daily" | "weekly" | "courses" | "papers" | "projects" | "github" | "dsa" | "interviews" | "assessments" | "mentor" | "analytics" | "settings";
export type RecordItem = { id: string; createdAt: string; updatedAt: string; [key: string]: unknown };
export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Blocked";
export type TimerState = { running: boolean; startedAt: number | null; accumulatedMs: number; taskId: string; subject: string; note: string };
export type Settings = { dailyTargetHours: number; learningDays: number[]; timezone: string; startDate: string; endDate: string; theme: "dark" | "light"; notifications: boolean };
export type AppData = {
  tasks: RecordItem[]; courses: RecordItem[]; papers: RecordItem[]; projects: RecordItem[];
  github: RecordItem[]; dsa: RecordItem[]; interviews: RecordItem[]; assessments: RecordItem[];
  sessions: RecordItem[]; settings: Settings; timer: TimerState;
};
export type RoadmapMonth = { key: string; title: string; phase: number; focus: string; outcomes: string[]; topics: string[]; deliverables: string[] };
export type RoadmapPhase = { id: number; title: string; period: string; summary: string; months: string[] };
