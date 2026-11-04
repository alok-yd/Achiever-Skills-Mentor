import { months, phases } from "../data/roadmap";
import type { AppData, RecordItem, RoadmapMonth } from "../types";

export const todayKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Kolkata", year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const value = (type:string) => parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
export const monthKey = (date = new Date()) => todayKey(date).slice(0,7);
export const formatDate = (date: string) => date ? new Date(date + (date.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
export const uid = () => crypto.randomUUID();
export const hours = (ms: number) => ms / 3600000;
export const durationLabel = (ms: number) => {
  const total = Math.max(0, Math.floor(ms/1000));
  return `${String(Math.floor(total/3600)).padStart(2,"0")}:${String(Math.floor(total%3600/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
};
export function activeMonth(now = new Date()): RoadmapMonth | undefined {
  const key = monthKey(now);
  return months.find(m => m.key === key);
}
export function currentPhase(now = new Date()) {
  const month = activeMonth(now);
  return month ? phases.find(p => p.id === month.phase) : undefined;
}
export function roadmapStats(data: AppData) {
  const completed = data.tasks.filter(t => t.status === "Completed").length;
  const total = data.tasks.length;
  const taskProgress = total ? Math.round(completed/total*100) : 0;
  const sessionsHours = data.sessions.reduce((sum,s) => sum + Number(s.durationHours ?? 0),0);
  const active = activeMonth();
  const phase = currentPhase();
  const today = todayKey();
  const due = data.tasks.filter(t => String(t.dueDate ?? "") === today);
  const overdue = data.tasks.filter(t => String(t.dueDate ?? "") < today && t.status !== "Completed");
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7)); weekStart.setHours(0,0,0,0);
  const weeklyHours = data.sessions.filter(s => new Date(String(s.date)).getTime() >= weekStart.getTime()).reduce((sum,s) => sum + Number(s.durationHours ?? 0),0);
  const weekTarget = data.settings.dailyTargetHours * data.settings.learningDays.length;
  const start = new Date(data.settings.startDate + "T00:00:00+05:30");
  const end = new Date(data.settings.endDate + "T23:59:59+05:30");
  const now = new Date();
  const daysTotal = Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
  const elapsed = Math.max(0,Math.min(daysTotal,Math.floor((now.getTime()-start.getTime())/86400000)));
  const remaining = now < start ? Math.max(0,Math.ceil((start.getTime()-now.getTime())/86400000)) : Math.max(0,Math.ceil((end.getTime()-now.getTime())/86400000));
  const phaseTasks = active ? data.tasks.filter(t => t.phase === active.phase || t.month === active.key) : [];
  const phaseDone = phaseTasks.filter(t => t.status === "Completed").length;
  return {completed,total,taskProgress,sessionsHours,active,phase, due,overdue,weeklyHours,weekTarget,elapsed,remaining,daysTotal,phaseProgress:phaseTasks.length?Math.round(phaseDone/phaseTasks.length*100):0};
}
export function averageHoursPerLearningDay(sessions: RecordItem[], learningDays: number[]) {
  if (!sessions.length) return 0;
  const grouped = new Map<string,number>();
  sessions.forEach(s => { const key=String(s.date ?? "").slice(0,10); if(key) grouped.set(key,(grouped.get(key)??0)+Number(s.durationHours??0)); });
  const qualifying = [...grouped.entries()].filter(([date]) => learningDays.includes(new Date(date+"T12:00:00").getDay()===0?7:new Date(date+"T12:00:00").getDay()));
  return qualifying.length ? qualifying.reduce((a,[,v])=>a+v,0)/qualifying.length : 0;
}
export function subjectOptions() {
  return ["Python","Mathematics","Machine Learning","Deep Learning","NLP","Transformers & LLMs","Research","DSA","Core CS","Placement","Other"];
}
