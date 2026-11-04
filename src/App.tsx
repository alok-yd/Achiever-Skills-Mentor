import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, Bot, Brain, BriefcaseBusiness,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, Code2,
  Download, ExternalLink, FileText, FolderGit2, Github, GraduationCap, LayoutDashboard,
  Lightbulb, ListTodo, Menu, MoreHorizontal, Plus, Search, Send, Settings as SettingsIcon,
  ShieldCheck, Sparkles, Target, Timer, Trash2, TrendingUp, Upload, X, Zap, Pause, Play,
  Square, Pencil, AlertTriangle, BarChart3, BookMarked, Award
} from "lucide-react";
import type { AppData, ModuleKey, RecordItem, RoadmapMonth, TaskStatus } from "./types";
import { phases, months } from "./data/roadmap";
import { exportBackup, exportCsv, importBackup, loadData, makeRecord, persistData } from "./lib/store";
import { activeMonth, averageHoursPerLearningDay, currentPhase, durationLabel, formatDate, hours, monthKey, roadmapStats, subjectOptions, todayKey } from "./lib/utils";

type CollectionKey = "tasks" | "courses" | "papers" | "projects" | "github" | "dsa" | "interviews" | "assessments";
type Field = { key:string; label:string; type?:"text"|"textarea"|"url"|"date"|"number"|"select"; options?:string[]; placeholder?:string };
type Editor = { collection:CollectionKey; item?:RecordItem; defaults?:Record<string,string> };
type ChatMessage = { role:"assistant"|"user"; text:string };
const nav: { key:ModuleKey; label:string; icon:typeof LayoutDashboard; group:string }[] = [
  {key:"dashboard",label:"Overview",icon:LayoutDashboard,group:"WORKSPACE"},
  {key:"roadmap",label:"Learning roadmap",icon:CalendarDays,group:"WORKSPACE"},
  {key:"daily",label:"Daily learning",icon:ListTodo,group:"WORKSPACE"},
  {key:"weekly",label:"Weekly planner",icon:Target,group:"WORKSPACE"},
  {key:"courses",label:"Course tracker",icon:BookOpen,group:"LEARNING"},
  {key:"papers",label:"Research library",icon:FileText,group:"LEARNING"},
  {key:"projects",label:"Projects",icon:FolderGit2,group:"BUILD"},
  {key:"github",label:"GitHub portfolio",icon:Github,group:"BUILD"},
  {key:"dsa",label:"DSA practice",icon:Code2,group:"CAREER"},
  {key:"interviews",label:"Interview tracker",icon:BriefcaseBusiness,group:"CAREER"},
  {key:"assessments",label:"Monthly assessment",icon:Award,group:"INSIGHTS"},
  {key:"mentor",label:"AI learning mentor",icon:Bot,group:"INSIGHTS"},
  {key:"analytics",label:"Analytics",icon:BarChart3,group:"INSIGHTS"},
  {key:"settings",label:"Settings",icon:SettingsIcon,group:"SYSTEM"}
];
const collectionByModule: Partial<Record<ModuleKey,CollectionKey>> = {
  daily:"tasks",courses:"courses",papers:"papers",projects:"projects",github:"github",dsa:"dsa",interviews:"interviews",assessments:"assessments"
};
const fields:Record<CollectionKey,Field[]> = {
  tasks:[
    {key:"title",label:"Task title",placeholder:"What will you work on?"},
    {key:"subject",label:"Subject",type:"select",options:subjectOptions()},
    {key:"topic",label:"Topic"},
    {key:"description",label:"Description",type:"textarea"},
    {key:"phase",label:"Roadmap phase",type:"select",options:phases.map(p=>String(p.id))},
    {key:"month",label:"Roadmap month",type:"select",options:months.map(m=>m.key+" · "+m.title)},
    {key:"priority",label:"Priority",type:"select",options:["Low","Medium","High"]},
    {key:"dueDate",label:"Due date",type:"date"},
    {key:"estimatedHours",label:"Estimated hours",type:"number"},
    {key:"status",label:"Status",type:"select",options:["Not Started","In Progress","Completed","Blocked"]},
    {key:"notes",label:"Notes",type:"textarea"},
    {key:"resourceUrl",label:"Resource URL",type:"url"}
  ],
  courses:[
    {key:"title",label:"Course / resource title"},{key:"instructor",label:"Instructor"},{key:"platform",label:"Platform"},
    {key:"subject",label:"Subject"},{key:"url",label:"Resource URL",type:"url"},{key:"startDate",label:"Start date",type:"date"},
    {key:"targetDate",label:"Target date",type:"date"},{key:"totalLectures",label:"Total lectures",type:"number"},
    {key:"completedLectures",label:"Completed lectures",type:"number"},{key:"progress",label:"Progress %",type:"number"},
    {key:"status",label:"Status",type:"select",options:["Not Started","In Progress","Completed","On Hold"]},{key:"rating",label:"Rating (1–5)",type:"number"},{key:"notes",label:"Notes",type:"textarea"}
  ],
  papers:[
    {key:"title",label:"Paper title"},{key:"authors",label:"Authors"},{key:"year",label:"Year",type:"number"},{key:"domain",label:"Domain"},
    {key:"abstract",label:"Abstract",type:"textarea"},{key:"url",label:"Paper URL",type:"url"},{key:"pdfUrl",label:"PDF / file reference",type:"url"},
    {key:"status",label:"Reading status",type:"select",options:["To Read","Reading","Read","Summarized","Implemented"]},
    {key:"priority",label:"Priority",type:"select",options:["Low","Medium","High"]},{key:"dateRead",label:"Date read",type:"date"},
    {key:"contributions",label:"Key contributions",type:"textarea"},{key:"methodology",label:"Methodology",type:"textarea"},
    {key:"limitations",label:"Limitations",type:"textarea"},{key:"equations",label:"Important equations",type:"textarea"},
    {key:"observations",label:"Observations / future directions",type:"textarea"}
  ],
  projects:[
    {key:"title",label:"Project name"},{key:"category",label:"Category",type:"select",options:["Python","Machine Learning","Deep Learning","NLP","Transformer","LLM","Research"]},
    {key:"problemStatement",label:"Problem statement",type:"textarea"},{key:"techStack",label:"Technology stack"},
    {key:"githubUrl",label:"GitHub URL",type:"url"},{key:"liveUrl",label:"Live demo URL",type:"url"},
    {key:"startDate",label:"Start date",type:"date"},{key:"targetDate",label:"Target date",type:"date"},
    {key:"status",label:"Status",type:"select",options:["Idea","Planning","In Progress","Completed","Paused"]},
    {key:"progress",label:"Progress %",type:"number"},{key:"milestones",label:"Milestones",type:"textarea"},
    {key:"results",label:"Results",type:"textarea"},{key:"challenges",label:"Challenges",type:"textarea"},{key:"notes",label:"Notes / improvements",type:"textarea"}
  ],
  github:[
    {key:"repoName",label:"Repository name"},{key:"url",label:"Repository URL",type:"url"},{key:"description",label:"Description",type:"textarea"},
    {key:"language",label:"Primary language"},{key:"techStack",label:"Tech stack"},{key:"category",label:"Category"},
    {key:"completion",label:"Completion %",type:"number"},{key:"readme",label:"README complete?",type:"select",options:["Yes","No"]},
    {key:"docs",label:"Documentation complete?",type:"select",options:["Yes","No"]},{key:"demo",label:"Demo available?",type:"select",options:["Yes","No"]},
    {key:"reviewDate",label:"Next review date",type:"date"},{key:"notes",label:"Review notes",type:"textarea"}
  ],
  dsa:[
    {key:"title",label:"Problem title"},{key:"platform",label:"Platform"},{key:"url",label:"Problem URL",type:"url"},{key:"topic",label:"Topic"},
    {key:"difficulty",label:"Difficulty",type:"select",options:["Easy","Medium","Hard"]},{key:"date",label:"Practice date",type:"date"},
    {key:"status",label:"Status",type:"select",options:["Not Attempted","Attempted","Solved","Needs Revision","Mastered"]},
    {key:"timeMinutes",label:"Time spent (minutes)",type:"number"},{key:"approach",label:"Approach / explanation",type:"textarea"},
    {key:"timeComplexity",label:"Time complexity"},{key:"spaceComplexity",label:"Space complexity"},
    {key:"notes",label:"Notes"},{key:"revisionDate",label:"Next revision date",type:"date"}
  ],
  interviews:[
    {key:"company",label:"Company"},{key:"role",label:"Role"},{key:"date",label:"Interview date",type:"date"},
    {key:"round",label:"Round"},{key:"topics",label:"Topics asked",type:"textarea"},
    {key:"performance",label:"Performance",type:"select",options:["Not Rated","Strong","Good","Average","Needs Improvement"]},
    {key:"feedback",label:"Feedback",type:"textarea"},{key:"weakness",label:"Weak areas",type:"textarea"},{key:"followUps",label:"Follow-up actions",type:"textarea"}
  ],
  assessments:[
    {key:"month",label:"Assessment month",type:"select",options:months.map(m=>m.key+" · "+m.title)},{key:"conceptual",label:"Conceptual mastery (0–100)",type:"number"},
    {key:"practical",label:"Practical implementation (0–100)",type:"number"},{key:"math",label:"Math / theory (0–100)",type:"number"},
    {key:"projectsScore",label:"Projects / experiments (0–100)",type:"number"},{key:"consistency",label:"Consistency (0–100)",type:"number"},
    {key:"evidence",label:"Evidence / examples",type:"textarea"},{key:"weaknesses",label:"Weaknesses",type:"textarea"},{key:"actions",label:"Next-month actions",type:"textarea"}
  ]
};
const moduleLabels:Partial<Record<ModuleKey,string>>={daily:"Daily learning",courses:"Course tracker",papers:"Research library",projects:"Projects",github:"GitHub portfolio",dsa:"DSA practice",interviews:"Interview tracker",assessments:"Monthly assessment"};
const statusColor=(status:unknown)=>status==="Completed"||status==="Mastered"||status==="Summarized"?"green":status==="In Progress"||status==="Reading"||status==="Solved"||status==="Good"?"blue":status==="Blocked"||status==="Needs Revision"||status==="Needs Improvement"?"red":"muted";
const todayLabel=new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long"}).format(new Date());

function App() {
  const [data,setData]=useState<AppData>(()=>loadData());
  const [active,setActive]=useState<ModuleKey>("dashboard");
  const [editor,setEditor]=useState<Editor|null>(null);
  const [search,setSearch]=useState("");
  const [mobileOpen,setMobileOpen]=useState(false);
  const [notice,setNotice]=useState("");
  const [tick,setTick]=useState(Date.now());
  const [mentorInput,setMentorInput]=useState("");
  const [messages,setMessages]=useState<ChatMessage[]>([{role:"assistant",text:"I’m your learning mentor. I can review the progress you have actually recorded, find overdue work and help turn a goal into a planned task. Your tracker is currently running in local-first mode; I’ll clearly distinguish recorded evidence from suggestions."}]);
  const importRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{persistData(data)},[data]);
  useEffect(()=>{const id=window.setInterval(()=>setTick(Date.now()),1000);return()=>window.clearInterval(id)},[]);
  useEffect(()=>{if(notice){const id=window.setTimeout(()=>setNotice(""),3200);return()=>window.clearTimeout(id)}},[notice]);
  const stats=useMemo(()=>roadmapStats(data),[data]);
  const runningMs=data.timer.accumulatedMs+(data.timer.running&&data.timer.startedAt?Math.max(0,tick-data.timer.startedAt):0);
  const currentNav=nav.find(n=>n.key===active);
  const collection=collectionByModule[active];
  const currentRows=collection?(data[collection] as RecordItem[]):[];
  const filteredRows=currentRows.filter(row=>JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const upcomingMonth=months.find(m=>m.key>=monthKey()) ?? months[months.length-1];
  const todayTasks=data.tasks.filter(t=>String(t.dueDate??"")===todayKey());
  const openTasks=data.tasks.filter(t=>t.status!=="Completed");
  const weeklyAvg=averageHoursPerLearningDay(data.sessions,data.settings.learningDays);
  const completedDSA=data.dsa.filter(x=>x.status==="Solved"||x.status==="Mastered").length;
  const projectCount=data.projects.length;
  const readPapers=data.papers.filter(x=>["Read","Summarized","Implemented"].includes(String(x.status))).length;

  function updateRecord(key:CollectionKey,id:string,patch:Record<string,unknown>) {
    setData(prev=>({...prev,[key]:(prev[key] as RecordItem[]).map(row=>row.id===id?{...row,...patch,updatedAt:new Date().toISOString()}:row)}));
  }
  function deleteRecord(key:CollectionKey,id:string) {
    if(!window.confirm("Delete this record? This cannot be undone."))return;
    setData(prev=>({...prev,[key]:(prev[key] as RecordItem[]).filter(row=>row.id!==id)}));
    setNotice("Record deleted.");
  }
  function saveRecord(values:Record<string,unknown>) {
    if(!editor)return;
    const key=editor.collection;
    const cleaned={...values};
    ["estimatedHours","actualHours","progress","totalLectures","completedLectures","rating","year","timeMinutes","conceptual","practical","math","projectsScore","consistency","completion","phase"].forEach(k=>{if(cleaned[k]!==undefined&&cleaned[k]!=="" )cleaned[k]=Number(cleaned[k])});
    if(editor.item) updateRecord(key,editor.item.id,cleaned);
    else setData(prev=>({...prev,[key]:[makeRecord(cleaned),...(prev[key] as RecordItem[])]}));
    setEditor(null);setNotice(editor.item?"Changes saved.":"Record created.");
  }
  function toggleTaskStatus(task:RecordItem,status:TaskStatus) { updateRecord("tasks",task.id,{status,completedAt:status==="Completed"?new Date().toISOString():null}); }
  function startTimer(taskId="",subject="",note="") {
    if(data.timer.running)return;
    setData(prev=>({...prev,timer:{...prev.timer,taskId,subject,note,running:true,startedAt:Date.now()}}));
  }
  function pauseTimer() {
    if(!data.timer.running||!data.timer.startedAt)return;
    setData(prev=>({...prev,timer:{...prev.timer,running:false,startedAt:null,accumulatedMs:prev.timer.accumulatedMs+Math.max(0,Date.now()-(prev.timer.startedAt??Date.now()))}}));
  }
  function stopTimer() {
    const duration=runningMs;
    if(duration<1000){setData(prev=>({...prev,timer:{...prev.timer,running:false,startedAt:null,accumulatedMs:0}}));return}
    const session=makeRecord({date:todayKey(),startedAt:new Date(Date.now()-duration).toISOString(),endedAt:new Date().toISOString(),durationHours:Number(hours(duration).toFixed(3)),subject:data.timer.subject||"Uncategorised",taskId:data.timer.taskId||"",note:data.timer.note||""});
    setData(prev=>({...prev,sessions:[session,...prev.sessions],tasks:prev.tasks.map(t=>t.id===prev.timer.taskId?{...t,actualHours:Number((Number(t.actualHours??0)+hours(duration)).toFixed(2)),updatedAt:new Date().toISOString()}:t),timer:{running:false,startedAt:null,accumulatedMs:0,taskId:"",subject:"",note:""}}));
    setNotice(`Study session saved · ${hours(duration).toFixed(2)} hours`);
  }
  function addQuickTask(title:string,subject="Other") {
    setData(prev=>({...prev,tasks:[makeRecord({title,subject,status:"Not Started",priority:"Medium",dueDate:todayKey(),estimatedHours:1,phase:currentPhase()?.id??1,month:activeMonth()?.key??upcomingMonth.key}),...prev.tasks]}));
    setNotice("Task added to your daily tracker.");
  }
  function mentorReply(question:string) {
    const q=question.toLowerCase();
    const overdue=data.tasks.filter(t=>String(t.dueDate??"")<todayKey()&&t.status!=="Completed");
    const blocked=data.tasks.filter(t=>t.status==="Blocked");
    const unreviewed=data.dsa.filter(t=>t.status==="Needs Revision");
    const noEvidence=data.tasks.length===0&&data.sessions.length===0;
    const lines:string[]=[];
    if(noEvidence) lines.push("I don’t have recorded study sessions or tasks yet, so I can’t estimate your current consistency or skill level. Start by adding today’s plan and recording a real study session.");
    else lines.push(`Your tracker currently contains ${data.tasks.length} tasks (${data.tasks.filter(t=>t.status==="Completed").length} completed), ${stats.sessionsHours.toFixed(1)} recorded study hours, ${data.projects.length} projects and ${data.papers.length} saved papers.`);
    if(overdue.length)lines.push(`There are ${overdue.length} overdue task(s): ${overdue.slice(0,3).map(t=>String(t.title)).join(", ")}. Review the due dates before adding more work.`);
    if(blocked.length)lines.push(`${blocked.length} task(s) are marked Blocked. Resolve the blocker or split the task into a smaller action.`);
    if(unreviewed.length)lines.push(`${unreviewed.length} DSA problem(s) need revision. A short spaced-revision session may be more valuable than adding new problems.`);
    if(data.settings.startDate>todayKey())lines.push(`Your roadmap begins on ${formatDate(data.settings.startDate)}. Use the time before launch to set up a realistic environment and baseline rather than marking future milestones complete.`);
    if(q.includes("next")||q.includes("plan")||q.includes("today"))lines.push("Suggested next action: choose one high-priority task, define a finish condition, and reserve a focused block. Keep the plan within your configured daily target.");
    if(q.includes("weak")||q.includes("improve")||q.includes("review"))lines.push("Evidence-based check: compare monthly assessment dimensions, DSA revision backlog, unfinished project milestones and actual study hours. Missing records are unknowns, not proof of weakness.");
    return lines.join("\n\n");
  }
  function sendMentor() {
    const q=mentorInput.trim();if(!q)return;
    setMessages(prev=>[...prev,{role:"user",text:q},{role:"assistant",text:mentorReply(q)}]);setMentorInput("");
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"sidebar-open":""}`}>
      <div className="brand"><div className="brand-mark"><Brain size={20}/></div><div><strong>ACHIEVER</strong><span>SKILLS MENTOR</span></div><button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
      <div className="profile-card"><div className="avatar">A</div><div className="profile-copy"><strong>Learning workspace</strong><span>AI · ML · Research track</span></div><span className="online-dot"/></div>
      <nav className="nav-scroll">{["WORKSPACE","LEARNING","BUILD","CAREER","INSIGHTS","SYSTEM"].map(group=><div className="nav-group" key={group}><div className="nav-caption">{group}</div>{nav.filter(n=>n.group===group).map(item=><button key={item.key} className={`nav-item ${active===item.key?"active":""}`} onClick={()=>{setActive(item.key);setSearch("");setMobileOpen(false)}}><item.icon size={17}/><span>{item.label}</span>{item.key==="mentor"&&<span className="nav-new">AI</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="focus-mini"><div className="mini-icon"><Target size={16}/></div><div><b>Stay in the process</b><span>Learn · Build · Research</span></div></div><div className="sidebar-foot"><span>v1.0.0 · Local-first</span><span className="privacy"><ShieldCheck size={12}/> Private by default</span></div></div>
    </aside>
    {mobileOpen&&<div className="mobile-backdrop" onClick={()=>setMobileOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="icon-btn menu-btn" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={13}/><b>{currentNav?.label??"Overview"}</b></div></div><div className="top-actions"><div className="date-chip"><CalendarDays size={14}/>{todayLabel}</div><button className="icon-btn" title="Notifications"><Bell size={18}/></button><div className="top-avatar">A</div></div></header>
      <div className="page-wrap">
        {active==="dashboard"&&<Dashboard data={data} stats={stats} weeklyAvg={weeklyAvg} runningMs={runningMs} onNavigate={setActive} onStart={startTimer} onPause={pauseTimer} onStop={stopTimer} onAdd={()=>setEditor({collection:"tasks"})} onQuick={addQuickTask} onStatus={toggleTaskStatus} onEdit={id=>setEditor({collection:"tasks",item:data.tasks.find(t=>t.id===id)})}/>}
        {active==="roadmap"&&<Roadmap data={data} onAddTask={m=>setEditor({collection:"tasks",defaults:{phase:String(m.phase),month:m.key,dueDate:m.key+"-01"}})} onChooseTask={()=>setActive("daily")}/>}
        {active==="weekly"&&<WeeklyPlanner data={data} onAdd={()=>setEditor({collection:"tasks"})} onStatus={toggleTaskStatus} onEdit={id=>setEditor({collection:"tasks",item:data.tasks.find(t=>t.id===id)})}/>}
        {active==="mentor"&&<Mentor messages={messages} input={mentorInput} setInput={setMentorInput} onSend={sendMentor} onAddTask={()=>setEditor({collection:"tasks"})} stats={stats}/>}
        {active==="analytics"&&<Analytics data={data} stats={stats} avg={weeklyAvg} onExport={()=>exportCsv(data.sessions,"study-sessions.csv")}/>}
        {active==="settings"&&<SettingsPage data={data} setData={setData} onBackup={()=>exportBackup(data)} onImport={()=>importRef.current?.click()} onExportTasks={()=>exportCsv(data.tasks,"learning-tasks.csv")}/>}
        {collection&&active!=="daily"&&active!=="assessments"&&<CollectionPage key={active} module={active} rows={filteredRows} total={currentRows.length} search={search} setSearch={setSearch} onAdd={()=>setEditor({collection})} onEdit={row=>setEditor({collection,item:row})} onDelete={id=>deleteRecord(collection,id)} onExport={()=>exportCsv(currentRows,`${active}-records.csv`)}/>}
        {active==="daily"&&<DailyPage rows={filteredRows} allRows={data.tasks} search={search} setSearch={setSearch} onAdd={()=>setEditor({collection:"tasks"})} onEdit={row=>setEditor({collection:"tasks",item:row})} onDelete={id=>deleteRecord("tasks",id)} onStatus={toggleTaskStatus} onExport={()=>exportCsv(data.tasks,"learning-tasks.csv")}/>}
        {active==="assessments"&&<AssessmentsPage rows={data.assessments} onAdd={()=>setEditor({collection:"assessments"})} onEdit={row=>setEditor({collection:"assessments",item:row})} onDelete={id=>deleteRecord("assessments",id)}/>}
      </div>
      <footer className="page-footer"><span>ACHIEVER SKILLS MENTOR</span><span>LEARN <i>→</i> IMPLEMENT <i>→</i> EXPERIMENT <i>→</i> RESEARCH <i>→</i> IMPROVE</span></footer>
    </main>
    <input ref={importRef} type="file" accept="application/json" hidden onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const imported=await importBackup(file);setData(imported);setNotice("Backup restored successfully.")}catch(err){setNotice(err instanceof Error?err.message:"Could not restore backup.")}e.currentTarget.value=""}}/>
    {editor&&<RecordModal editor={editor} onClose={()=>setEditor(null)} onSave={saveRecord}/>}
    {notice&&<div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
  </div>;
}

function PageHeading({eyebrow,title,subtitle,action}:{eyebrow:string;title:string;subtitle:string;action?:ReactNode}) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action&&<div className="heading-action">{action}</div>}</div>;
}
function Button({children,onClick,variant="primary",icon}:{children:ReactNode;onClick:()=>void;variant?:"primary"|"secondary"|"ghost"|"danger";icon?:ReactNode}) {
  return <button className={`btn btn-${variant}`} onClick={onClick}>{icon}{children}</button>;
}
function MetricCard({label,value,meta,icon:Icon,accent="blue",trend}:{label:string;value:string|number;meta:string;icon:typeof Activity;accent?:string;trend?:string}) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${accent}`}><Icon size={18}/></div></div><div className="metric-value">{value}</div><div className="metric-meta">{meta}{trend&&<span className="metric-trend"><ArrowUpRight size={13}/>{trend}</span>}</div></div>;
}
function ProgressBar({value,color="blue"}:{value:number;color?:string}) { return <div className="progress-track"><div className={`progress-fill ${color}`} style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div> }
function EmptyState({title,body,action}:{title:string;body:string;action?:ReactNode}) {
  return <div className="empty-state"><div className="empty-icon"><Sparkles size={20}/></div><b>{title}</b><p>{body}</p>{action}</div>;
}
function Dashboard({data,stats,runningMs,onNavigate,onStart,onPause,onStop,onAdd,onQuick,onStatus,onEdit}:{data:AppData;stats:ReturnType<typeof roadmapStats>;weeklyAvg:number;runningMs:number;onNavigate:(m:ModuleKey)=>void;onStart:(taskId:string,subject:string,note:string)=>void;onPause:()=>void;onStop:()=>void;onAdd:()=>void;onQuick:(title:string,subject?:string)=>void;onStatus:(t:RecordItem,s:TaskStatus)=>void;onEdit:(id:string)=>void}) {
  const [timerTask,setTimerTask]=useState(data.timer.taskId);const [subject,setSubject]=useState(data.timer.subject);const [note,setNote]=useState(data.timer.note);
  const [quickTitle,setQuickTitle]=useState("");
  const active=stats.active;const phase=stats.phase;const upcoming=months.find(m=>m.key>=monthKey())??months[months.length-1];
  const nextMilestones=months.filter(m=>m.key>=monthKey()).slice(0,5);
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=todayKey(d);const h=data.sessions.filter(s=>String(s.date)===key).reduce((sum,s)=>sum+Number(s.durationHours??0),0);return {day:d.toLocaleDateString("en-IN",{weekday:"short"}),hours:h}});
  const maxHours=Math.max(1,...last7.map(d=>d.hours));
  const sessionsToday=data.sessions.filter(s=>s.date===todayKey()).reduce((sum,s)=>sum+Number(s.durationHours??0),0);
  const due=data.tasks.filter(t=>t.dueDate===todayKey());
  const pct=data.settings.dailyTargetHours?Math.min(100,sessionsToday/data.settings.dailyTargetHours*100):0;
  const startDate=new Date(data.settings.startDate+"T12:00:00");const beforeStart=new Date()<startDate;
  return <>
    <PageHeading eyebrow="YOUR LEARNING COMMAND CENTER" title="Good to see you." subtitle="A clear view of your learning, building and research journey." action={<div className="heading-date"><span className="live-pulse"/>{beforeStart?"ROADMAP NOT STARTED":"TRACKER LIVE"}<small>{beforeStart?`Starts ${formatDate(data.settings.startDate)}`:"Progress updates from your records"}</small></div>}/>
    <section className="welcome-banner"><div className="welcome-content"><div className="banner-tag"><Sparkles size={13}/> THE LONG GAME</div><h2>Build skills that compound.</h2><p>Learn deeply. Implement consistently. Experiment with evidence. Turn your work into a portfolio that speaks for itself.</p><div className="banner-actions"><Button onClick={()=>onNavigate("roadmap")} icon={<CalendarDays size={16}/>}>Explore roadmap</Button><button className="banner-link" onClick={()=>onNavigate("mentor")}>Meet your AI mentor <ChevronRight size={15}/></button></div></div><div className="banner-visual"><div className="orb orb-one"/><div className="orb orb-two"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="target-core"><Brain size={31}/></div><span className="orbit-label label-a">LEARN</span><span className="orbit-label label-b">BUILD</span><span className="orbit-label label-c">RESEARCH</span></div></section>
    <div className="metric-grid">
      <MetricCard label="Study hours logged" value={stats.sessionsHours.toFixed(1)+"h"} meta={`Average ${weeklyAvg.toFixed(1)}h per learning day`} icon={Clock3} accent="violet"/>
      <MetricCard label="Weekly focus" value={stats.weeklyHours.toFixed(1)+"h"} meta={`${Math.max(0,stats.weekTarget-stats.weeklyHours).toFixed(1)}h remaining of ${stats.weekTarget.toFixed(1)}h target`} icon={Target} accent="blue"/>
      <MetricCard label="Tasks completed" value={`${stats.completed}/${stats.total}`} meta={stats.total?`${stats.taskProgress}% completion across your tasks`:"No tasks recorded yet"} icon={CheckCircle2} accent="green"/>
      <MetricCard label="DSA solved" value={data.dsa.filter(d=>d.status==="Solved"||d.status==="Mastered").length} meta={`${data.dsa.length} problems tracked in total`} icon={Code2} accent="orange"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel roadmap-progress"><div className="panel-head"><div><div className="eyebrow">ROADMAP OVERVIEW</div><h3>{phase?.title??"Your 15-month journey"}</h3></div><button className="text-action" onClick={()=>onNavigate("roadmap")}>View roadmap <ChevronRight size={14}/></button></div>
        <div className="phase-summary"><div><span className="muted-label">{phase?.period??"1 Mar 2027 – 31 May 2028"}</span><p>{phase?.summary??"Your structured AI/ML, research and placement roadmap is ready. Follow the phases month by month."}</p></div><div className="phase-circle"><b>{stats.elapsed?Math.round(stats.elapsed/stats.daysTotal*100):0}%</b><span>elapsed</span></div></div>
        <ProgressBar value={stats.elapsed?stats.elapsed/stats.daysTotal*100:0}/><div className="progress-captions"><span>{stats.elapsed} days elapsed</span><span>{stats.remaining} days remaining</span></div>
        <div className="phase-steps">{phases.map(p=><button key={p.id} className={`phase-step ${phase?.id===p.id?"selected":""} ${phase&&p.id<phase.id?"past":""}`} onClick={()=>onNavigate("roadmap")} title={p.title}><span>{phase&&p.id<phase.id?<Check size={12}/>:p.id}</span><small>{p.title.split(" ")[0]}</small></button>)}</div>
        <div className="next-month-box"><div className="next-month-icon"><BookMarked size={17}/></div><div><b>{upcoming.title} · {upcoming.focus}</b><span>{upcoming.outcomes[0]}</span></div><button className="icon-btn" onClick={()=>onNavigate("roadmap")}><ChevronRight size={17}/></button></div>
      </section>
      <section className="panel focus-panel"><div className="panel-head"><div><div className="eyebrow">FOCUS SESSION</div><h3>Study timer</h3></div><span className={`timer-state ${data.timer.running?"recording":""}`}>{data.timer.running?"● Recording":"Ready"}</span></div>
        <div className="timer-display">{durationLabel(runningMs)}</div><div className="timer-caption">{data.timer.running?"Keep your attention on the task.":"Every focused session counts. Start when you begin."}</div>
        <div className="timer-fields"><label>Link to task<select value={timerTask} onChange={e=>setTimerTask(e.target.value)}><option value="">No linked task</option>{data.tasks.filter(t=>t.status!=="Completed").map(t=><option key={t.id} value={t.id}>{String(t.title)}</option>)}</select></label><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Deep Learning"/></label><label>Session note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="What are you focusing on?"/></label></div>
        <div className="timer-controls">{!data.timer.running?<Button onClick={()=>{onStart(timerTask,subject,note);}} icon={<Play size={15}/>}>Start focus</Button>:<Button onClick={onPause} variant="secondary" icon={<Pause size={15}/>}>Pause</Button>}<Button onClick={onStop} variant="ghost" icon={<Square size={14}/>}>Stop & save</Button></div>
        <div className="timer-hint"><ShieldCheck size={13}/> Timer runs independently of browser tab changes. No webcam access.</div>
      </section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">TODAY · {todayLabel.toUpperCase()}</div><h3>Today's learning plan</h3></div><button className="text-action" onClick={()=>onNavigate("daily")}>All tasks <ChevronRight size={14}/></button></div>
        <div className="daily-target"><div><b>{sessionsToday.toFixed(1)}h <span>/ {data.settings.dailyTargetHours}h</span></b><small>Daily study target</small></div><strong>{Math.round(pct)}%</strong></div><ProgressBar value={pct} color="green"/>
        <div className="task-list compact">{due.length?due.slice(0,4).map(task=><TaskRow key={task.id} task={task} onStatus={onStatus} onEdit={()=>onEdit(task.id)}/>):<EmptyState title="Plan your first focused day" body="Add a task with a due date to make your daily plan visible here." action={<Button onClick={onAdd} variant="secondary" icon={<Plus size={14}/>}>Add a task</Button>}/>}</div>
      </section>
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">CONSISTENCY</div><h3>Last 7 days</h3></div><span className="panel-unit">Hours logged</span></div>
        <div className="bar-chart">{last7.map(d=><div className="bar-column" key={d.day}><div className="bar-value">{d.hours?d.hours.toFixed(1):""}</div><div className="bar-rail"><div className="bar-fill" style={{height:`${Math.max(d.hours?5:0,d.hours/maxHours*100)}%`}}/></div><span>{d.day}</span></div>)}</div>
        <div className="chart-foot"><span><i className="legend-dot"/> Actual recorded study hours</span><button className="text-action" onClick={()=>onNavigate("analytics")}>Full analytics <ChevronRight size={13}/></button></div>
      </section>
    </div>
    <div className="dashboard-grid bottom-grid">
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">UP NEXT</div><h3>Upcoming milestones</h3></div><button className="text-action" onClick={()=>onNavigate("roadmap")}>Full roadmap <ChevronRight size={14}/></button></div>
        <div className="milestone-list">{nextMilestones.map((m,i)=><div className="milestone" key={m.key}><div className="milestone-index">{String(i+1).padStart(2,"0")}</div><div className="milestone-copy"><b>{m.title} · {m.focus}</b><span>{m.deliverables[0]}</span></div><span className="milestone-date">{m.key.slice(0,7)}</span></div>)}</div>
      </section>
      <section className="panel insight-panel"><div className="insight-symbol"><Lightbulb size={19}/></div><div className="eyebrow">A NOTE ON PROGRESS</div><h3>Evidence over assumptions.</h3><p>Your tracker only reports what you record. A blank project list is not a failed project; it is simply data you have not entered yet.</p><Button onClick={()=>onNavigate("mentor")} variant="secondary">Review with mentor <ChevronRight size={14}/></Button></section>
    </div>
  </>;
}
function TaskRow({task,onStatus,onEdit}:{task:RecordItem;onStatus:(t:RecordItem,s:TaskStatus)=>void;onEdit:()=>void}) {
  return <div className="task-row"><button className={`task-check ${task.status==="Completed"?"checked":""}`} onClick={()=>onStatus(task,task.status==="Completed"?"Not Started":"Completed")} aria-label="Toggle completed">{task.status==="Completed"&&<Check size={12}/>}</button><button className="task-row-main" onClick={onEdit}><b className={task.status==="Completed"?"struck":""}>{String(task.title)}</b><span>{String(task.subject??"Uncategorised")} · {Number(task.estimatedHours??0)}h planned</span></button><span className={`status-badge ${statusColor(task.status)}`}>{String(task.status)}</span></div>;
}
function DailyPage({rows,allRows,search,setSearch,onAdd,onEdit,onDelete,onStatus,onExport}:{rows:RecordItem[];allRows:RecordItem[];search:string;setSearch:(s:string)=>void;onAdd:()=>void;onEdit:(r:RecordItem)=>void;onDelete:(id:string)=>void;onStatus:(r:RecordItem,s:TaskStatus)=>void;onExport:()=>void}) {
  const [filter,setFilter]=useState("All");const [date,setDate]=useState(todayKey());
  const visible=rows.filter(r=>(filter==="All"||r.status===filter)&&(date==="All"||r.dueDate===date));
  const done=allRows.filter(r=>r.status==="Completed").length;
  return <><PageHeading eyebrow="EXECUTION SYSTEM" title="Daily learning" subtitle="Turn the roadmap into small, trackable actions. Tasks are completed only when you mark them complete." action={<Button onClick={onAdd} icon={<Plus size={16}/>}>Add task</Button>}/>
    <div className="metric-grid three"><MetricCard label="Total tasks" value={allRows.length} meta="Tasks you've created" icon={ListTodo}/><MetricCard label="Completed" value={done} meta="Marked complete by you" icon={CheckCircle2} accent="green"/><MetricCard label="Still open" value={allRows.length-done} meta="Not started, active or blocked" icon={Activity} accent="orange"/></div>
    <section className="panel table-panel"><div className="table-toolbar"><div className="filter-tabs">{["All","Not Started","In Progress","Blocked","Completed"].map(f=><button key={f} className={filter===f?"selected":""} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="toolbar-right"><div className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..."/></div><select className="date-filter" value={date} onChange={e=>setDate(e.target.value)}><option value="All">All dates</option><option value={todayKey()}>Today</option><option value={todayKey(new Date(Date.now()+86400000))}>Tomorrow</option></select><button className="icon-btn" title="Export CSV" onClick={onExport}><Download size={16}/></button></div></div>
      {visible.length?<div className="table-scroll"><table><thead><tr><th>Task</th><th>Subject</th><th>Due date</th><th>Priority</th><th>Estimate</th><th>Status</th><th></th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><td><button className="table-title" onClick={()=>onEdit(r)}>{String(r.title)}</button><small>{String(r.topic??"")}</small></td><td>{String(r.subject??"—")}</td><td>{formatDate(String(r.dueDate??""))}</td><td><span className={`priority ${String(r.priority??"Medium").toLowerCase()}`}>{String(r.priority??"Medium")}</span></td><td>{Number(r.estimatedHours??0)}h</td><td><select className="inline-status" value={String(r.status??"Not Started")} onChange={e=>onStatus(r,e.target.value as TaskStatus)}>{["Not Started","In Progress","Blocked","Completed"].map(s=><option key={s}>{s}</option>)}</select></td><td><div className="row-actions"><button onClick={()=>onEdit(r)}><Pencil size={14}/></button><button onClick={()=>onDelete(r.id)}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>:<EmptyState title="No tasks match this view" body={allRows.length?"Change the filters or search terms.":"Create a task from your roadmap or add a daily action to get started."} action={!allRows.length?<Button onClick={onAdd} icon={<Plus size={14}/>}>Create first task</Button>:undefined}/>}
    </section></>;
}
function CollectionPage({module,rows,total,search,setSearch,onAdd,onEdit,onDelete,onExport}:{module:ModuleKey;rows:RecordItem[];total:number;search:string;setSearch:(s:string)=>void;onAdd:()=>void;onEdit:(r:RecordItem)=>void;onDelete:(id:string)=>void;onExport:()=>void}) {
  const cfg:Record<string,{eyebrow:string;subtitle:string;empty:string;desc:string;fields:string[]}> = {
    courses:{eyebrow:"LEARNING RESOURCES",subtitle:"Track courses, lectures, completion and learning notes in one place.",empty:"No courses or resources",desc:"Add a course or start with the curated resource list below.",fields:["title","platform","subject","status","progress","url"]},
    papers:{eyebrow:"RESEARCH WORKSPACE",subtitle:"Collect papers, capture methodology and build a searchable research memory.",empty:"Your research library is empty",desc:"Save a paper and capture what it contributes, how it works and where it falls short.",fields:["title","authors","year","domain","status","priority","url"]},
    projects:{eyebrow:"BUILD & EXPERIMENT",subtitle:"Move ideas into working implementations, measurable results and documented demos.",empty:"No projects recorded yet",desc:"Create a project entry to track scope, milestones and outcomes.",fields:["title","category","status","progress","githubUrl","targetDate"]},
    github:{eyebrow:"PORTFOLIO QUALITY",subtitle:"Track the evidence and presentation quality of your technical work.",empty:"No repositories added",desc:"Add repositories manually. Readiness is based only on the evidence you enter.",fields:["repoName","language","category","completion","readme","docs","demo","url"]},
    dsa:{eyebrow:"PROBLEM-SOLVING PRACTICE",subtitle:"Track approaches, complexity, revision and mastery — not just problem counts.",empty:"No DSA problems tracked",desc:"Log a problem after attempting it and write down the approach in your own words.",fields:["title","topic","difficulty","platform","status","timeMinutes","revisionDate","url"]},
    interviews:{eyebrow:"CAREER READINESS",subtitle:"Capture interview rounds, feedback and follow-up actions so each attempt teaches you something.",empty:"No interviews recorded",desc:"Log a mock or real interview and record specific improvement actions.",fields:["company","role","date","round","performance","topics","weakness"]}
  };
  const info=cfg[module]??cfg.courses;
  const stats:Array<[string,number]>=module==="papers"?[
    ["Papers saved",total],["Read / summarised",rows.filter(r=>["Read","Summarized","Implemented"].includes(String(r.status))).length],["To read",rows.filter(r=>r.status==="To Read").length]
  ]:module==="projects"?[["Projects",total],["In progress",rows.filter(r=>r.status==="In Progress").length],["Completed",rows.filter(r=>r.status==="Completed").length]]:
    module==="dsa"?[["Problems tracked",total],["Solved / mastered",rows.filter(r=>["Solved","Mastered"].includes(String(r.status))).length],["Need revision",rows.filter(r=>r.status==="Needs Revision").length]]:
    module==="github"?[["Repositories",total],["README complete",rows.filter(r=>r.readme==="Yes").length],["Demo available",rows.filter(r=>r.demo==="Yes").length]]:
    module==="courses"?[["Resources",total],["In progress",rows.filter(r=>r.status==="In Progress").length],["Completed",rows.filter(r=>r.status==="Completed").length]]:
    [["Records",total],["Strong / good",rows.filter(r=>["Strong","Good"].includes(String(r.performance))).length],["Needs review",rows.filter(r=>r.performance==="Needs Improvement").length]];
  const title=moduleLabels[module]??"Tracker";
  function value(row:RecordItem,key:string) {
    const raw=row[key];if(raw===undefined||raw===null||raw==="")return "—";
    if(key==="progress"||key==="completion")return String(raw)+"%";
    if(key==="url"||key.endsWith("Url"))return <a className="inline-link" href={String(raw)} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}><ExternalLink size={12}/>Open</a>;
    if(key==="targetDate"||key==="date"||key==="revisionDate")return formatDate(String(raw));
    return String(raw);
  }
  const tableHeaders=info.fields.filter(f=>f!=="url"&&f!=="githubUrl");
  return <><PageHeading eyebrow={info.eyebrow} title={title} subtitle={info.subtitle} action={<Button onClick={onAdd} icon={<Plus size={16}/>}>Add {module==="papers"?"paper":module==="dsa"?"problem":module==="github"?"repository":module==="courses"?"resource":module==="projects"?"project":"interview"}</Button>}/>
    <div className="metric-grid three">{stats.map((s,i)=><MetricCard key={s[0]} label={s[0]} value={s[1]} meta={["Recorded in this workspace","Based on saved status fields","Updated as you log progress"][i]} icon={[BookOpen,CheckCircle2,TrendingUp][i] as typeof Activity} accent={["blue","green","violet"][i]}/>)}</div>
    {module==="github"&&<div className="callout"><ShieldCheck size={18}/><div><b>Evidence-based portfolio review</b><span>Readiness uses README, documentation, demo and completion fields you provide. It does not fetch or invent GitHub statistics.</span></div></div>}
    <section className="panel table-panel"><div className="table-toolbar"><div><b className="section-table-title">Your records <span>{total}</span></b></div><div className="toolbar-right"><div className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`}/></div><button className="icon-btn" onClick={onExport} title="Export CSV"><Download size={16}/></button></div></div>
      {rows.length?<div className="table-scroll"><table><thead><tr><th>Title</th>{tableHeaders.filter(k=>!["title","repoName","company"].includes(k)).map(k=><th key={k}>{k.replace(/([A-Z])/g," $1")}</th>)}<th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><button className="table-title" onClick={()=>onEdit(r)}>{String(r.title??r.repoName??r.company??"Untitled")}</button><small>{String(r.description??r.problemStatement??"")}</small></td>{tableHeaders.filter(k=>!["title","repoName","company"].includes(k)).map(k=><td key={k}>{k==="status"||k==="performance"?<span className={`status-badge ${statusColor(r[k])}`}>{String(r[k]??"Not set")}</span>:value(r,k)}</td>)}<td><div className="row-actions"><button onClick={()=>onEdit(r)}><Pencil size={14}/></button><button onClick={()=>onDelete(r.id)}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>:<EmptyState title={info.empty} body={info.desc} action={<Button onClick={onAdd} icon={<Plus size={14}/>}>Add first record</Button>}/>}
    </section>
    {module==="courses"&&<section className="panel resource-note"><div className="resource-icon"><GraduationCap size={19}/></div><div><b>Starter resource collection</b><p>Eight resource placeholders are preloaded. Their URLs are intentionally blank until you add and verify the links you prefer.</p></div></section>}
  </>;
}
function Roadmap({data,onAddTask,onChooseTask}:{data:AppData;onAddTask:(m:RoadmapMonth)=>void;onChooseTask:(m:RoadmapMonth)=>void}) {
  const [expanded,setExpanded]=useState(activeMonth()?.key??months[0].key);
  const now=monthKey();
  return <><PageHeading eyebrow="15-MONTH MASTER PLAN" title="Your learning roadmap" subtitle="A guided progression from foundations to research and placement readiness · 1 March 2027 – 31 May 2028." action={<div className="roadmap-total"><b>7</b><span>phases · 15 months</span></div>}/>
    <div className="roadmap-intro"><div className="roadmap-intro-icon"><Brain size={24}/></div><div><b>Learn → Implement → Experiment → Build → Research → Evaluate → Improve</b><p>Use this roadmap as a curriculum template. Add your own tasks and mark completion only after the work is done.</p></div><span className="roadmap-date">ASIA / KOLKATA</span></div>
    <div className="phase-timeline">{phases.map(p=>{const pMonths=months.filter(m=>m.phase===p.id);const phaseTasks=data.tasks.filter(t=>t.phase===p.id);const done=phaseTasks.filter(t=>t.status==="Completed").length;return <div className="phase-block" key={p.id}><div className="phase-rail"><div className={`phase-number ${pMonths.some(m=>m.key===now)?"current":""}`}>{p.id}</div><div className="rail-line"/></div><div className="phase-content"><div className="phase-title-row"><div><span className="phase-period">{p.period.toUpperCase()}</span><h3>{p.title}</h3><p>{p.summary}</p></div><div className="phase-stat"><b>{phaseTasks.length?Math.round(done/phaseTasks.length*100):0}%</b><span>{phaseTasks.length?done+"/"+phaseTasks.length+" tasks":"No tasks yet"}</span></div></div><div className="month-grid">{pMonths.map(m=><MonthCard key={m.key} month={m} data={data} expanded={expanded===m.key} onToggle={()=>setExpanded(expanded===m.key?"":m.key)} onAdd={()=>onAddTask(m)} onChoose={()=>onChooseTask(m)}/>)}</div></div></div>})}</div>
  </>;
}
function MonthCard({month,data,expanded,onToggle,onAdd,onChoose}:{month:RoadmapMonth;data:AppData;expanded:boolean;onToggle:()=>void;onAdd:()=>void;onChoose:()=>void}) {
  const tasks=data.tasks.filter(t=>t.month===month.key);const done=tasks.filter(t=>t.status==="Completed").length;const past=month.key<monthKey();
  return <div className={`month-card ${expanded?"expanded":""}`}><button className="month-card-head" onClick={onToggle}><div className="month-marker">{month.key.slice(5,7)}</div><div className="month-main"><div className="month-top"><b>{month.title}</b>{past&&<span className="status-badge muted">Past</span>}{month.key===monthKey()&&<span className="status-badge blue">Current</span>}</div><span>{month.focus}</span><div className="month-progress"><ProgressBar value={tasks.length?done/tasks.length*100:0}/><small>{tasks.length?done+"/"+tasks.length+" tasks":"No tasks added"}</small></div></div><ChevronDown size={17} className="month-chevron"/></button>
    {expanded&&<div className="month-details"><div className="month-detail-col"><b>Learning outcomes</b>{month.outcomes.map(x=><div className="check-line" key={x}><CheckCircle2 size={14}/>{x}</div>)}</div><div className="month-detail-col"><b>Topics to master</b><ul>{month.topics.map(x=><li key={x}>{x}</li>)}</ul></div><div className="month-detail-col deliverables"><b>Deliverables</b><ul>{month.deliverables.map(x=><li key={x}>{x}</li>)}</ul></div><div className="month-detail-actions"><Button onClick={onAdd} icon={<Plus size={14}/>}>Create task for this month</Button><button className="text-action" onClick={onChoose}>Go to daily learning <ChevronRight size={14}/></button></div></div>}
  </div>;
}
function WeeklyPlanner({data,onAdd,onStatus,onEdit}:{data:AppData;onAdd:()=>void;onStatus:(t:RecordItem,s:TaskStatus)=>void;onEdit:(id:string)=>void}) {
  const monday=new Date();monday.setDate(monday.getDate()-((monday.getDay()+6)%7));monday.setHours(0,0,0,0);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d});
  const weekSessions=data.sessions.filter(s=>new Date(String(s.date)+"T12:00:00")>=monday);
  const total=weekSessions.reduce((n,s)=>n+Number(s.durationHours??0),0);const target=data.settings.dailyTargetHours*data.settings.learningDays.length;
  return <><PageHeading eyebrow="WEEKLY RHYTHM" title="Weekly planner" subtitle="Five focused learning days with the weekend available as a buffer or rest. Adjust your plan without losing sight of the weekly target." action={<Button onClick={onAdd} icon={<Plus size={16}/>}>Plan a task</Button>}/>
    <div className="weekly-summary"><div><span>WEEKLY STUDY HOURS</span><b>{total.toFixed(1)} <small>/ {target.toFixed(1)}h</small></b><ProgressBar value={Math.min(100,total/Math.max(target,1)*100)}/></div><div><span>TASKS THIS WEEK</span><b>{data.tasks.filter(t=>days.some(d=>t.dueDate===todayKey(d))).length}</b></div><div><span>LEARNING DAYS</span><b>{data.settings.learningDays.length} <small>per week</small></b></div></div>
    <div className="week-grid">{days.map((day,i)=>{const key=todayKey(day);const tasks=data.tasks.filter(t=>t.dueDate===key);const learning=data.settings.learningDays.includes(day.getDay()===0?7:day.getDay());const dailyH=weekSessions.filter(s=>s.date===key).reduce((n,s)=>n+Number(s.durationHours??0),0);return <div className={`week-day ${key===todayKey()?"today":""} ${!learning?"buffer":""}`} key={key}><div className="week-day-head"><span>{day.toLocaleDateString("en-IN",{weekday:"short"}).toUpperCase()}</span><b>{day.getDate()}</b><small>{!learning?"BUFFER / REST":dailyH.toFixed(1)+"h logged"}</small></div><div className="week-day-tasks">{tasks.length?tasks.map(t=><div className="week-task" key={t.id}><button className={`task-check ${t.status==="Completed"?"checked":""}`} onClick={()=>onStatus(t,t.status==="Completed"?"Not Started":"Completed")}>{t.status==="Completed"&&<Check size={11}/>}</button><button onClick={()=>onEdit(t.id)}>{String(t.title)}</button></div>):<span className="no-week-task">{learning?"No tasks planned":"Rest / flexible buffer"}</span>}</div><button className="add-day-task" onClick={onAdd}><Plus size={13}/> Add</button></div>})}</div>
  </>;
}
function Mentor({messages,input,setInput,onSend,onAddTask,stats}:{messages:ChatMessage[];input:string;setInput:(s:string)=>void;onSend:()=>void;onAddTask:()=>void;stats:ReturnType<typeof roadmapStats>}) {
  const bottom=useRef<HTMLDivElement>(null);useEffect(()=>bottom.current?.scrollIntoView({behavior:"smooth"}),[messages]);
  return <><PageHeading eyebrow="YOUR PERSONAL LEARNING GUIDE" title="AI learning mentor" subtitle="A context-aware learning companion for planning, reflection and evidence-based improvement." action={<span className="local-badge"><span className="online-dot"/> LOCAL MENTOR ACTIVE</span>}/>
    <div className="mentor-layout"><aside className="mentor-side"><div className="mentor-avatar"><Brain size={30}/><span/></div><h3>Achiever Mentor</h3><p>Learning strategy · AI/ML · Research · Career</p><div className="mentor-capabilities">{[{i:Target,t:"Plan next actions",d:"Turn your roadmap into small tasks."},{i:Activity,t:"Review progress",d:"Use only your recorded tracker data."},{i:Lightbulb,t:"Find improvement areas",d:"Surface gaps with supporting evidence."},{i:BookOpen,t:"Explain and revise",d:"Ask for conceptual learning guidance."}].map(x=><div key={x.t}><x.i size={16}/><span><b>{x.t}</b><small>{x.d}</small></span></div>)}</div><div className="mentor-note"><ShieldCheck size={15}/>Your data stays in this browser in local-first mode.</div></aside>
      <section className="panel chat-panel"><div className="chat-head"><div><span className="online-dot"/> <b>Learning conversation</b><small>Answers use your saved tracker context</small></div><button className="icon-btn" title="Clear conversation" onClick={()=>window.location.reload()}><MoreHorizontal size={18}/></button></div><div className="chat-messages">{messages.map((m,i)=><div className={`chat-message ${m.role}`} key={i}><div className="chat-avatar">{m.role==="assistant"?<Brain size={16}/>: "A"}</div><div className="chat-bubble"><span>{m.role==="assistant"?"MENTOR":"YOU"}</span><p>{m.text}</p></div></div>)}<div ref={bottom}/></div><div className="suggestion-row">{["Review my current progress","What should I focus on next?","Identify my weak areas"].map(q=><button key={q} onClick={()=>setInput(q)}>{q}</button>)}</div><form className="chat-compose" onSubmit={e=>{e.preventDefault();onSend()}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your learning, research or plan..."/><button type="submit" disabled={!input.trim()}><Send size={17}/></button></form></section>
    </div>
    <div className="mentor-action-strip"><div><Sparkles size={17}/><span><b>Turn a recommendation into a task</b><small>Task creation requires your explicit action; the mentor never silently changes your tracker.</small></span></div><Button onClick={onAddTask} variant="secondary" icon={<Plus size={14}/>}>Create a learning task</Button></div>
    <div className="integration-note"><CircleHelp size={16}/><span><b>About AI integration:</b> This first build includes a local, rule-based mentor connected to tracker data. A hosted LLM integration needs a secure server-side API endpoint and credentials; no API key is exposed in the browser.</span></div>
  </>;
}
function Analytics({data,stats,avg,onExport}:{data:AppData;stats:ReturnType<typeof roadmapStats>;avg:number;onExport:()=>void}) {
  const monthKeys=Array.from(new Set(data.sessions.map(s=>String(s.date??"").slice(0,7)))).sort().slice(-6);
  const monthly=monthKeys.map(k=>({key:k,hours:data.sessions.filter(s=>String(s.date).startsWith(k)).reduce((a,s)=>a+Number(s.durationHours??0),0)}));
  const max=Math.max(1,...monthly.map(m=>m.hours));
  const dimensions=[{key:"conceptual",label:"Conceptual mastery",weight:25},{key:"practical",label:"Practical implementation",weight:25},{key:"math",label:"Math / theory",weight:15},{key:"projectsScore",label:"Projects / experiments",weight:25},{key:"consistency",label:"Consistency",weight:10}];
  const latest=data.assessments[data.assessments.length-1];
  const portfolio=data.github.map(r=>({name:String(r.repoName??"Repository"),score:[r.readme,r.docs,r.demo].filter(x=>x==="Yes").length/3*100,completion:Number(r.completion??0)}));
  return <><PageHeading eyebrow="MEASURE WHAT MATTERS" title="Analytics" subtitle="A truthful view of the work you have recorded. Empty metrics remain empty rather than being filled with demo data." action={<Button onClick={onExport} variant="secondary" icon={<Download size={15}/>}>Export sessions</Button>}/>
    <div className="metric-grid"><MetricCard label="Total study hours" value={stats.sessionsHours.toFixed(1)+"h"} meta="Sum of saved focus sessions" icon={Clock3} accent="violet"/><MetricCard label="Average learning day" value={avg.toFixed(1)+"h"} meta="Days with recorded sessions" icon={Activity}/><MetricCard label="Projects" value={data.projects.length} meta="Projects you've created" icon={FolderGit2} accent="green"/><MetricCard label="Papers read" value={data.papers.filter(p=>["Read","Summarized","Implemented"].includes(String(p.status))).length} meta={`${data.papers.length} saved in library`} icon={FileText} accent="orange"/></div>
    <div className="dashboard-grid analytics-grid"><section className="panel"><div className="panel-head"><div><div className="eyebrow">STUDY TREND</div><h3>Monthly focus hours</h3></div><span className="panel-unit">Recorded only</span></div>{monthly.length?<div className="monthly-bars">{monthly.map(m=><div key={m.key}><span>{m.hours.toFixed(1)}h</span><div className="monthly-rail"><div style={{height:`${m.hours/max*100}%`}}/></div><small>{new Date(m.key+"-15").toLocaleDateString("en-IN",{month:"short",year:"2-digit"})}</small></div>)}</div>:<EmptyState title="No study sessions yet" body="Use the focus timer to record your actual study time. Your trend will appear here."/>}</section>
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">MONTHLY REVIEW</div><h3>Latest assessment</h3></div><span className="weight-tag">25 / 25 / 15 / 25 / 10</span></div>{latest?<><div className="assessment-total"><b>{dimensions.reduce((sum,d)=>sum+Number(latest[d.key]??0)*d.weight/100,0).toFixed(1)}</b><span>Weighted score / 100</span></div>{dimensions.map(d=><div className="dimension-row" key={d.key}><span>{d.label}</span><ProgressBar value={Number(latest[d.key]??0)}/><b>{Number(latest[d.key]??0)}%</b></div>)}</>:<EmptyState title="No assessment submitted" body="Add a monthly assessment to review conceptual, practical, mathematical, project and consistency performance."/>}</section></div>
    <div className="dashboard-grid analytics-grid"><section className="panel"><div className="panel-head"><div><div className="eyebrow">SKILL EXECUTION</div><h3>Learning tracker progress</h3></div></div>{[{label:"Tasks",done:data.tasks.filter(t=>t.status==="Completed").length,total:data.tasks.length},{label:"Courses",done:data.courses.filter(c=>c.status==="Completed").length,total:data.courses.length},{label:"Research papers",done:data.papers.filter(p=>["Read","Summarized","Implemented"].includes(String(p.status))).length,total:data.papers.length},{label:"DSA problems",done:data.dsa.filter(d=>["Solved","Mastered"].includes(String(d.status))).length,total:data.dsa.length}].map(x=><div className="skill-progress" key={x.label}><div><span>{x.label}</span><b>{x.total?Math.round(x.done/x.total*100):0}% <small>({x.done}/{x.total})</small></b></div><ProgressBar value={x.total?x.done/x.total*100:0}/></div>)}</section>
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">PORTFOLIO CHECK</div><h3>Repository readiness</h3></div></div>{portfolio.length?portfolio.map(p=><div className="repo-readiness" key={p.name}><div><b>{p.name}</b><span>{Math.round((p.score+p.completion)/2)}% evidence score</span></div><ProgressBar value={(p.score+p.completion)/2}/></div>):<EmptyState title="No portfolio evidence yet" body="Add repositories and update their README, docs, demo and completion fields to evaluate readiness."/>}</section></div>
    <div className="callout"><AlertTriangle size={17}/><div><b>Interpretation guardrail</b><span>These charts describe your saved records, not independent validation of skill mastery, placement outcomes or research quality.</span></div></div>
  </>;
}
function AssessmentsPage({rows,onAdd,onEdit,onDelete}:{rows:RecordItem[];onAdd:()=>void;onEdit:(r:RecordItem)=>void;onDelete:(id:string)=>void}) {
  const dims=[["conceptual","Conceptual mastery",25],["practical","Practical implementation",25],["math","Math / theory",15],["projectsScore","Projects / experiments",25],["consistency","Consistency",10]] as const;
  return <><PageHeading eyebrow="REFLECT · MEASURE · ADJUST" title="Monthly assessment" subtitle="Review your learning across five dimensions. Every score should be supported by a concrete example or evidence." action={<Button onClick={onAdd} icon={<Plus size={16}/>}>New assessment</Button>}/>
    <div className="assessment-guide">{dims.map(([k,label,w])=><div key={k}><span>{w}%</span><b>{label}</b></div>)}</div>
    {rows.length?<div className="assessment-cards">{rows.map(r=>{const score=dims.reduce((a,[k,,w])=>a+Number(r[k]??0)*w/100,0);return <div className="panel assessment-card" key={r.id}><div className="assessment-card-head"><div><span className="eyebrow">MONTHLY REVIEW</span><h3>{String(r.month??"Month not set")}</h3></div><div className="assessment-score"><b>{score.toFixed(1)}</b><span>/100</span></div></div>{dims.map(([k,label])=><div className="dimension-row" key={k}><span>{label}</span><ProgressBar value={Number(r[k]??0)}/><b>{Number(r[k]??0)}%</b></div>)}{Boolean(r.evidence)&&<p className="assessment-evidence">{String(r.evidence)}</p>}<div className="row-actions"><button onClick={()=>onEdit(r)}><Pencil size={14}/> Edit</button><button onClick={()=>onDelete(r.id)}><Trash2 size={14}/> Delete</button></div></div>})}</div>:<EmptyState title="Your first monthly review starts here" body="Score your understanding, implementation, mathematical depth, project work and consistency. The weighted score is calculated automatically." action={<Button onClick={onAdd} icon={<Plus size={14}/>}>Create assessment</Button>}/>}
    <div className="callout"><Lightbulb size={17}/><div><b>Scoring method</b><span>Conceptual 25% · Practical 25% · Math / theory 15% · Projects / experiments 25% · Consistency 10%. These scores are self-assessments; write the evidence behind each score.</span></div></div>
  </>;
}
function SettingsPage({data,setData,onBackup,onImport,onExportTasks}:{data:AppData;setData:Dispatch<SetStateAction<AppData>>;onBackup:()=>void;onImport:()=>void;onExportTasks:()=>void}) {
  const [target,setTarget]=useState(String(data.settings.dailyTargetHours));
  return <><PageHeading eyebrow="PERSONALISE YOUR SYSTEM" title="Settings & data" subtitle="Set your weekly rhythm, roadmap dates and data safeguards."/>
    <div className="settings-grid"><section className="panel settings-panel"><div className="settings-title"><div className="metric-icon blue"><Target size={18}/></div><div><h3>Learning preferences</h3><p>Set a sustainable schedule and your tracking targets.</p></div></div><label className="settings-field">Daily focused-study target (hours)<div className="inline-input"><input type="number" min="0.5" max="16" step="0.5" value={target} onChange={e=>setTarget(e.target.value)}/><Button onClick={()=>setData(p=>({...p,settings:{...p.settings,dailyTargetHours:Math.min(16,Math.max(.5,Number(target)||7.5))}}))} variant="secondary">Save target</Button></div></label><div className="settings-field"><span>Learning days</span><div className="day-toggle">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{const day=i+1;return <button key={d} className={data.settings.learningDays.includes(day)?"on":""} onClick={()=>setData(p=>({...p,settings:{...p.settings,learningDays:p.settings.learningDays.includes(day)?p.settings.learningDays.filter(x=>x!==day):[...p.settings.learningDays,day].sort()}}))}>{d}</button>})}</div><small>Default: Monday–Friday. Weekend days can be used as optional buffer or rest days.</small></div><div className="settings-field"><span>Roadmap dates</span><div className="two-inputs"><label>Start date<input type="date" value={data.settings.startDate} onChange={e=>setData(p=>({...p,settings:{...p.settings,startDate:e.target.value}}))}/></label><label>End date<input type="date" value={data.settings.endDate} onChange={e=>setData(p=>({...p,settings:{...p.settings,endDate:e.target.value}}))}/></label></div></div><div className="settings-readonly"><span>Timezone</span><b>Asia / Kolkata (IST)</b></div></section>
      <section className="panel settings-panel"><div className="settings-title"><div className="metric-icon green"><ShieldCheck size={18}/></div><div><h3>Privacy & data management</h3><p>Your data is stored locally in this browser in this first release.</p></div></div><div className="data-action"><div><b>Export full backup</b><span>Download all tasks, sessions, notes and settings as JSON.</span></div><Button onClick={onBackup} variant="secondary" icon={<Download size={14}/>}>Export backup</Button></div><div className="data-action"><div><b>Restore from backup</b><span>Replace current local data using a previous Achiever backup.</span></div><Button onClick={onImport} variant="secondary" icon={<Upload size={14}/>}>Import backup</Button></div><div className="data-action"><div><b>Export tasks</b><span>Download your task tracker as a CSV file.</span></div><Button onClick={onExportTasks} variant="secondary" icon={<Download size={14}/>}>Export CSV</Button></div><div className="privacy-warning"><AlertTriangle size={16}/><span>Clearing browser storage or switching browsers can remove local data. Export backups regularly. Cloud sync and authentication are not yet enabled.</span></div></section></div>
    <section className="panel roadmap-settings"><div className="settings-title"><div className="metric-icon violet"><Zap size={18}/></div><div><h3>System defaults</h3><p>Roadmap structure and starter resources are separate from personal progress records.</p></div></div><div className="default-grid"><div><b>15 months</b><span>Mar 2027 – May 2028</span></div><div><b>7 phases</b><span>Foundations → Placement</span></div><div><b>7.5 hours</b><span>Default daily focus target</span></div><div><b>37.5 hours</b><span>Default weekly target</span></div></div></section>
  </>;
}
function RecordModal({editor,onClose,onSave}:{editor:Editor;onClose:()=>void;onSave:(v:Record<string,unknown>)=>void}) {
  const defs=fields[editor.collection];const initial:Record<string,string>={};
  defs.forEach(f=>{initial[f.key]=String(editor.item?.[f.key]??editor.defaults?.[f.key]??(f.key==="dueDate"||f.key==="date"?todayKey():f.key==="status"?(editor.collection==="tasks"?"Not Started":editor.collection==="dsa"?"Not Attempted":editor.collection==="papers"?"To Read":"Not Started"):f.key==="priority"?"Medium": ""))});
  const [values,setValues]=useState(initial);
  const title=editor.item?"Edit record":editor.collection==="tasks"?"Create learning task":editor.collection==="papers"?"Add research paper":editor.collection==="projects"?"Add project":editor.collection==="dsa"?"Log DSA problem":editor.collection==="courses"?"Add learning resource":editor.collection==="github"?"Add repository":editor.collection==="interviews"?"Log interview":"Create monthly assessment";
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="record-modal" onSubmit={e=>{e.preventDefault();if(!String(values.title??values.repoName??values.company??"").trim()&&editor.collection!=="assessments")return;onSave(values)}}><div className="modal-head"><div><span className="eyebrow">TRACKER ENTRY</span><h2>{title}</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="modal-fields">{defs.map(f=><label key={f.key} className={f.type==="textarea"?"field-wide":""}>{f.label}{f.type==="textarea"?<textarea rows={3} value={values[f.key]??""} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))} placeholder={f.placeholder??f.label}/>:f.type==="select"?<select value={values[f.key]??""} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}><option value="">Select...</option>{(f.options??[]).map(o=><option key={o} value={o.includes(" · ")?o.split(" · ")[0]:o}>{o}</option>)}</select>:<input type={f.type??"text"} min={f.type==="number"?0:undefined} value={values[f.key]??""} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))} placeholder={f.placeholder??f.label}/>}</label>)}</div><div className="modal-foot"><Button onClick={onClose} variant="ghost">Cancel</Button><button type="submit" className="btn btn-primary"><Check size={15}/>{editor.item?"Save changes":"Save record"}</button></div></form></div>;
}
export default App;
