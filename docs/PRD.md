# Product Requirements Document (PRD) — Linia MVP

## 1. Vision & Strategy

- **Product Name:** Linia
- **Value Proposition:** A single-page, real-time checklist matrix that replaces manual Excel sheets ("chronos") for high-risk IT cutovers by enforcing linear dependencies, proof-of-work, and tracking automated audit trails.
- **The Solo-Dev Scope Strategy:** No complex permission matrices, no drag-and-drop workflow builders, and no multi-tenant organizational hierarchies. It is built as a single-workspace utility designed to prove core utility to a single team first.

## 2. Core Concepts & Simplified Data Model

To maximize development speed, the entire technical structure uses a single, flat execution paradigm rather than complex nested layers:

- **Template:** A saved, repeatable checklist sequence (the master blueprint).
- **Task:** A single line item within a template. Has a description, assigned owner (text field), estimated duration, and optional flag for *Requires Evidence*.
- **Dependency:** A simple rule: *Task B cannot start until Task A is complete.*
- **Run:** A live, stamped instantiation of a Template for an active maintenance window.
- **Evidence:** A text snippet or an uploaded file confirming a task was performed.
- **Audit Entry:** An unalterable log row saved instantly upon any status change.

## 3. High-Priority Functional Requirements (The Scope)

### 3.1 Template Construction (The Planning Engine)

- **FR-1.1: File Import Engine.** The user must be able to upload a basic data file (such as a CSV or formatted spreadsheet) to instantly build a list of tasks, avoiding manual form entry.
- **FR-1.2: Simple Linear Dependencies.** Users must be able to specify that a task relies on the ID of a preceding task. (Limit to basic structural blocks: Task 3 depends on Task 2).

### 3.2 The Live Execution Matrix (The Execution Engine)

- **FR-2.1: The Live Status Board.** A single dashboard displaying all tasks in the active Run. Statuses are strictly limited to: *Blocked*, *Ready*, *In Progress*, *Completed*, or *Failed*.
- **FR-2.2: Hard Dependency Blocking.** If Task B depends on Task A, the interface must physically disable the "Start" button for Task B until Task A’s status updates to *Completed*.
- **FR-2.3: Visual "Blocking Now" Highlight.** The dashboard must automatically highlight any active, uncompleted tasks that are currently preventing downstream tasks from unlocking.

### 3.3 Governance & Compliance

- **FR-3.1: Evidence Gate.** If a task is flagged as *Requires Evidence*, the system must prevent the user from clicking "Complete" until they have provided a text log or attached a file.
- **FR-3.2: Append-Only Compliance Ledger.** Every single state transition (e.g., *Task 1 marked In Progress by John at 22:01*) must write immediately to an immutable log table. The system must never provide an "Edit" or "Delete" function for these logs.

## 4. Out of Scope for MVP (Strictly Excluded)

To protect the limited personal calendar, the following features are **explicitly cut** and will not be built during these 3 months:

- Multi-tenancy or separate company subdomains.
- Automated system integrations (no native Slack alerts, no Webhooks, no cloud monitoring connections). All status updates are driven entirely by human interaction.
- Dynamic drag-and-drop UI charts or interactive visual node network graphs.
- Complex notification engines (no SMS text integrations or automated emails).

## 5. Strategic 3-Month Execution Roadmap (12 Weeks)

Based on a realistic allocation of **10 hours/week**, the project budget is broken down into four distinct 3-week blocks:

### Weeks 1–3: The Core Database Foundation & Single Workspace

- **Focus:** Set up your project environment, build the core database layout, and implement the basic authentication layers.
- **Milestone:** You can log in, create a project name, and manually save a list of 5 tasks sequentially to the database.

### Weeks 4–6: The Dependency Engine & Import Engine

- **Focus:** Build the backend logic that calculates whether a task is "Blocked" or "Ready" based on its requirements. Create the simple spreadsheet file parser.
- **Milestone:** You can upload a 10-line CSV file, and the application populates a template where Task 2 is locked behind Task 1.

### Weeks 7–9: The Live Run Screen & Evidence Guardrails

- **Focus:** Build the active "Run" screen interface. Implement the code logic that physically locks user interaction buttons and mandates file uploads or text input for critical steps.
- **Milestone:** A live run can be initiated where clicking "Complete" on a critical task is blocked until evidence is added, immediately shifting the next item from *Blocked* to *Ready*.

### Weeks 10–12: The Ledger, UI Polishing, & Production Launch

- **Focus:** Add the read-only audit log dashboard display. Address glaring interface alignment issues, clean up database index logic, and deploy the application to a reliable live hosting environment.
- **Milestone:** A fully functional, production-ready system capable of managing a live 20-step infrastructure cutover end-to-end with zero spreadsheet tracking.

## 6. Verification Criteria (When is it Done?)

The MVP is complete when you can execute the following **"Golden Path" test case** flawlessly:

1. Log into a single **Linia** dashboard view.
2. Upload a simple spreadsheet file containing a 5-step operational plan with 1 explicit dependency.
3. Launch a live "Run instance" from that plan.
4. Verify that step 2 cannot be clicked initially.
5. Mark step 1 complete (attaching a mock text log as proof).
6. Verify that step 2 immediately unlocks automatically.
7. Open the history tab and confirm a clean, timestamped, unalterable log record is displayed for each action.
