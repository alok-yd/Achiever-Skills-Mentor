import type { AppData, RecordItem, Settings, TimerState } from "../types";
import { starterCourses } from "../data/roadmap";
const STORAGE_KEY = "achiever-skills-mentor:v1";
export const defaultSettings: Settings = { dailyTargetHours:7.5, learningDays:[1,2,3,4,5], timezone:"Asia/Kolkata", startDate:"2027-03-01", endDate:"2028-05-31", theme:"dark", notifications:false };
export const emptyTimer: TimerState = { running:false, startedAt:null, accumulatedMs:0, taskId:"", subject:"", note:"" };
function makeItem(item:Record<string,unknown>):RecordItem { const now=new Date().toISOString(); return {...item,id:crypto.randomUUID(),createdAt:now,updatedAt:now} as RecordItem; }
function initialData():AppData { return {tasks:[],courses:starterCourses.map(c=>makeItem(c as unknown as Record<string,unknown>)),papers:[],projects:[],github:[],dsa:[],interviews:[],assessments:[],sessions:[],settings:defaultSettings,timer:emptyTimer}; }
export function loadData():AppData {
  try {
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw){const fresh=initialData();localStorage.setItem(STORAGE_KEY,JSON.stringify(fresh));return fresh;}
    const parsed=JSON.parse(raw) as Partial<AppData>; const base=initialData();
    return {...base,...parsed,settings:{...defaultSettings,...(parsed.settings??{})},timer:{...emptyTimer,...(parsed.timer??{})},
      tasks:Array.isArray(parsed.tasks)?parsed.tasks:[],courses:Array.isArray(parsed.courses)?parsed.courses:base.courses,
      papers:Array.isArray(parsed.papers)?parsed.papers:[],projects:Array.isArray(parsed.projects)?parsed.projects:[],
      github:Array.isArray(parsed.github)?parsed.github:[],dsa:Array.isArray(parsed.dsa)?parsed.dsa:[],
      interviews:Array.isArray(parsed.interviews)?parsed.interviews:[],assessments:Array.isArray(parsed.assessments)?parsed.assessments:[],
      sessions:Array.isArray(parsed.sessions)?parsed.sessions:[]};
  } catch { return initialData(); }
}
export function persistData(data:AppData):void { localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); }
export function makeRecord(values:Record<string,unknown>):RecordItem { return makeItem(values); }
export function exportBackup(data:AppData):void {
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),version:1,data},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`achiever-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
}
export function importBackup(file:File):Promise<AppData> {
  return file.text().then(text=>{
    const parsed=JSON.parse(text) as {data?:AppData} & Partial<AppData>;
    const candidate=(parsed.data??parsed) as AppData;
    if(!candidate||!Array.isArray(candidate.tasks)||!candidate.settings)throw new Error("This file is not a valid Achiever backup.");
    const merged={...initialData(),...candidate,settings:{...defaultSettings,...candidate.settings},timer:emptyTimer} as AppData;
    persistData(merged);return merged;
  });
}
export function exportCsv(rows:RecordItem[],filename:string):void {
  const cols=[...new Set(rows.flatMap(row=>Object.keys(row).filter(k=>!["id","createdAt","updatedAt"].includes(k))))];
  const quote=(value:unknown)=>`"${String(value??"").replace(/"/g,'""')}"`;
  const csv=[cols.map(quote).join(","),...rows.map(row=>cols.map(c=>quote(row[c])).join(","))].join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
