# Achiever Skills Mentor

A focused learning, research and placement-preparation workspace for the 15-month AI/ML roadmap running from **1 March 2027 to 31 May 2028**.

## Product direction

**LEARN → IMPLEMENT → EXPERIMENT → BUILD → RESEARCH → EVALUATE → IMPROVE**

The application turns the roadmap into a practical operating system: track what you plan, record what you actually do, and use the evidence to decide what to improve next.

## Included in this first release

- **Dashboard:** study-time metrics, weekly target, today's tasks, a persistent focus timer, actual last-seven-day study chart and upcoming roadmap milestones.
- **15-month roadmap:** seven phases, all 15 months, topic maps, learning outcomes and concrete deliverables.
- **Daily learning & weekly planner:** task creation, editing, deletion, status updates, due dates, priorities and estimated hours. Timer sessions add actual time to a linked task but never mark it complete automatically.
- **Course tracker:** eight editable starter-resource records with intentionally blank URLs until you add verified links.
- **Research library:** paper metadata, reading state, contributions, methodology, limitations, equations and observations.
- **Projects & GitHub portfolio:** milestones, results, progress, repository links and evidence-based portfolio checks.
- **DSA & interview trackers:** problem approach, complexity, revision date, interview rounds and feedback.
- **Monthly assessments:** weighted self-assessment (25% conceptual, 25% practical, 15% maths/theory, 25% project/experiments, 10% consistency).
- **Analytics:** charts and completion ratios derived only from the records you enter.
- **Learning mentor:** a local rule-based assistant that reads tracker context and surfaces evidence-based suggestions. It never silently edits data; task creation remains a user action.
- **Data safeguards:** browser-local persistence, JSON backup/restore and CSV exports.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/alok-yd/Achiever-Skills-Mentor.git
cd Achiever-Skills-Mentor
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

Production build:

```bash
npm run build
npm run preview
```

## Deploy

This is a Vite static web application. On Vercel, Netlify or Render Static Sites, use:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Configure the hosting provider to serve `index.html` for application routes if client-side routes are added later. The current release uses in-app view state and does not require rewrite rules.

## Data and security notes

- This release is **local-first**. App data is saved in the current browser's local storage. Browser profiles and devices do not sync automatically. Export a JSON backup regularly.
- The Supabase SQL starter schema is in `supabase/schema.sql`, but authentication and cloud-sync wiring are not yet enabled. Do not assume that deploying the schema alone turns on syncing.
- The learning mentor is currently rule-based and runs in the browser. A hosted LLM integration needs a server-side API route or secure function. Never put a private model API key in a `VITE_*` variable or ship it to the browser.
- The starter course records are resource names only; their URL fields are blank intentionally. Add links after you verify the exact resource.
- Analytics do not contain fabricated study hours, scores, project counts or completion values. Empty records remain empty.

## Architecture

- React + TypeScript + Vite
- Custom responsive dark UI (no CSS framework)
- Lucide icons
- Local storage persistence with JSON backup/restore
- Supabase schema starter for a future authenticated cloud workspace

## Roadmap phases

1. Mar–Apr 2027: Programming & Mathematical Foundations
2. May–Jun 2027: Machine Learning
3. Jul–Aug 2027: Deep Learning
4. Sep–Oct 2027: NLP, Transformers & LLMs
5. Nov–Dec 2027: Advanced AI Research
6. Jan–Feb 2028: Major Research Project
7. Mar–May 2028: Placement Preparation

## Product guardrails

- Recording time is not the same as proving mastery.
- A timer does not mark a task complete.
- The application reports only what you have entered.
- Recommendations are suggestions, and edits require explicit user action.
- ₹1cr+ compensation is an ambition, not a guaranteed outcome.

---

Built to support deliberate, evidence-based skill development.
