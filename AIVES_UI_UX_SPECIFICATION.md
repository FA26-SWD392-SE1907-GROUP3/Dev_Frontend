# AIVES – AI Viva Examination System
## Comprehensive UI/UX Design Specification & Architecture Document

---

### Executive Summary & Design Philosophy

**AIVES (AI Viva Examination System)** is a specialized, academic web application designed for university-level oral examinations (viva voce). Unlike generic Learning Management Systems (LMS) or open-ended conversational AI chatbots, AIVES is purpose-built around structured academic assessment, formal oral examination protocols, and strict **Human-in-the-Loop** accountability.

#### Core Tenets:
1. **Academic Seriousness & Calm Aesthetics**: Clean, distraction-free SaaS design utilizing soft slate backgrounds (`#F8FAFC`), crisp white content surfaces (`#FFFFFF`), professional indigo-blue accents (`#2563EB`), and high-contrast typography (`#111827`). No neon gradients, no glassmorphism, and no decorative AI visual tropes.
2. **Strict Workflow Confinement**: Limited strictly to the 3 approved core workflows:
   - **Workflow 1: Question Bank & Rubric Management**
   - **Workflow 2: Exam Session & Schedule Management**
   - **Workflow 3: AI-Based Oral Examination**
3. **Human-in-the-Loop Scoring & Approval**: AI functions as an assistive evaluator, not an autonomous authority. All AI-generated questions must be approved by lecturers, and all AI-suggested scores must be reviewed and officially finalized by lecturers.
4. **Distraction-Free Student Environment**: The oral exam interface strips away standard sidebars, navigation trees, and complex controls, focusing the student exclusively on the question, text-to-speech audio, and voice response.
5. **Vendor & Technology Agnostic**: UI terminology relies strictly on system-level capabilities (`AI Service`, `Speech Service`, `System`) without referencing specific cloud vendors, proprietary LLM models, or database engines.

---

## 1. System Actors & Role-Based Access Control (RBAC)

| Actor | Scope & Primary Goal | Accessible UI Modules |
| :--- | :--- | :--- |
| **Admin** | System governance, master data maintenance, user access, and examination configuration | • Dashboard (System Overview)<br>• Users & Roles<br>• Courses / Subjects<br>• Exam Settings<br>• Question Bank (Global)<br>• Exam Sessions (Global) |
| **Lecturer** | Academic content creation, exam creation, live monitoring, and human-in-the-loop evaluation | • Dashboard (Task-Oriented)<br>• Learning Materials<br>• AI Question Generation<br>• Question Bank & Question Detail<br>• Rubric Management<br>• Exam Sessions & 5-Step Creation Wizard<br>• Live Exam Monitor<br>• Transcript & Scoring Interface |
| **Student** | Examination taker; audio question consumption and vocal response delivery | • Student Exam Dashboard (Active / Scheduled sessions)<br>• Distraction-Free Oral Viva Screen<br>• Exam Completion Summary |
| **AI Viva Examiner** *(System Role)* | Autonomous cognitive pipeline acting under human constraints | • Material document ingestion<br>• Contextual question extraction<br>• Voice transcript analysis<br>• Follow-up generation on insufficient answers<br>• Rubric-based score suggestions |
| **Speech Service** *(System Role)* | Acoustic interface layer | • Text-to-Speech (TTS) synthesizer for question delivery<br>• Speech-to-Text (STT) real-time audio transcription |

---

## 2. Visual Design System & Design Tokens

### 2.1 Color Palette
- **Primary Brand Accent**: `#2563EB` (Tailwind `blue-600`) — used for primary calls-to-action (CTAs), active navigation states, and focus outlines.
- **Primary Hover**: `#1D4ED8` (Tailwind `blue-700`)
- **Primary Subtle / Light Tint**: `#EFF6FF` (Tailwind `blue-50`) — used for active navigation item backgrounds and information accents.
- **Base Background**: `#F8FAFC` (Tailwind `slate-50`) — universal page canvas.
- **Surface / Card Background**: `#FFFFFF` (White) — all cards, tables, forms, and dialog surfaces.
- **Divider & Border**: `#E5E7EB` (Tailwind `gray-200`) or `#E2E8F0` (Tailwind `slate-200`) — 1px clean separators.
- **Text Primary**: `#111827` (Tailwind `gray-900`) — headings, table content, labels.
- **Text Secondary / Muted**: `#6B7280` (Tailwind `gray-500`) — timestamps, helper texts, table headers.
- **Text Inverted**: `#FFFFFF`.

### 2.2 Status Badges & Semantics
Status badges use low-saturation, soft-tinted backgrounds with crisp dark text for high legibility:
- **Draft / Inactive**: Background `#F3F4F6`, Text `#4B5563`
- **Waiting / Scheduled**: Background `#FEF3C7` (amber-100), Text `#92400E` (amber-800)
- **In Progress / Active**: Background `#DBEAFE` (blue-100), Text `#1E40AF` (blue-800)
- **Completed / Approved / Success**: Background `#DCFCE7` (green-100), Text `#166534` (green-800)
- **Insufficient / Error / Flagged**: Background `#FEE2E2` (red-100), Text `#991B1B` (red-800)

### 2.3 Typography Scale
Font Family: **Inter**, system sans-serif fallback (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Page Title**: `28px` – `32px` (`font-bold` / `font-semibold`, line-height `1.2`, color `#111827`)
- **Section Heading**: `18px` – `20px` (`font-semibold`, line-height `1.3`, color `#111827`)
- **Card / Group Header**: `16px` (`font-medium`, color `#111827`)
- **Body / Main Table Text**: `14px` – `15px` (`font-normal`, line-height `1.5`, color `#111827`)
- **Secondary / Helper Text**: `13px` – `14px` (`font-normal`, color `#6B7280`)
- **Table Column Headers**: `12px` – `13px` (`font-semibold`, uppercase or title case, letter-spacing `0.05em`, color `#6B7280`)
- **Buttons / Actions**: `14px` – `15px` (`font-medium`)

### 2.4 Spacing, Radii & Component Geometry
- **Page Padding**: `28px` – `32px`
- **Section Spacing**: `24px` – `32px`
- **Card Padding**: `20px` – `24px`
- **Border Radius**: `8px` (`rounded-lg`) for inputs, buttons, and sub-cards; `12px` (`rounded-xl`) for main containers and modal surfaces.
- **Standard Button & Input Height**: `42px` (strictly within `40px` – `44px`).
- **Table Row Height**: `52px` standard, with `16px` horizontal cell padding.
- **Shadows**: Only subtle elevation (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`). Zero heavy floating cards.

---

## 3. General Application Layout Architecture

The application adopts a desktop-first productivity layout for Admin and Lecturer workspaces, transitioning to a specialized zero-sidebar focus mode for Student oral examinations.

```
+------------------------------------------------------------------------------------+
| AIVES LOGO & BRAND        TOP HEADER (Current Page Title | User Role & Profile)    |
+-------------------+----------------------------------------------------------------+
| LEFT SIDEBAR      | MAIN CONTENT AREA                                              |
| (Width: 230px)    | (Background: #F8FAFC, Padding: 28px-32px)                      |
|                   |                                                                |
| - Navigation Item | - Page Title & Subtitle + Single Primary Action Header CTA     |
| - Navigation Item |                                                                |
| - Navigation Item | - Clean Tables (52px row height, soft-gray thead, 3-dot menus) |
| - Navigation Item | - Standard Grouped Form Sections / 2-Column Review Grids       |
|                   |                                                                |
| [Subtle Border-R] |                                                                |
+-------------------+----------------------------------------------------------------+
```

### 3.1 Sidebar Specifications
- **Width**: `230px` fixed width.
- **Surface**: Pure white (`#FFFFFF`) with `1px` solid right border (`#E5E7EB`).
- **Item Style**: `40px` height, `12px` horizontal padding, `6px` border-radius.
- **Active State**: Light blue background (`#EFF6FF`), solid blue text (`#2563EB`), blue line indicator or subtle accent icon.
- **Inactive State**: Neutral gray text (`#4B5563`), transparent background; hover `#F9FAFB`.
- **Icons**: Single-stroke line icons (`20px` dimension), monochromatic.

---

## 4. Admin Interface Specifications

The Admin workspace focuses strictly on organizational governance, course-lecturer mapping, and global exam policies.

### 4.1 Admin Sidebar Navigation
1. **Dashboard**
2. **Users & Roles**
3. **Courses / Subjects**
4. **Exam Settings**
5. **Question Bank**
6. **Exam Sessions**

### 4.2 Admin Dashboard
- **Header**: "System Overview" (Admin Portal).
- **Summary Metric Cards** (4 compact cards in single row):
  - Total Active Users (Students, Lecturers, Admins)
  - Managed Courses / Subjects
  - System Question Bank Items
  - Active & Scheduled Exam Sessions
- **Recent Sessions Table**: Summary of recent viva schedules with course code, lead lecturer, and session state.

### 4.3 Users & Roles Management
- **Table Structure**:
  - `Name`: Full legal name and avatar badge.
  - `Account`: Institutional email and user ID.
  - `Role`: Tagged badge (`Admin`, `Lecturer`, `Student`).
  - `Permission / Status`: `Active` or `Inactive`.
  - `Action`: Single `3-dot` action button (`Edit User`, `Assign Role`, `Deactivate`).
- **Primary Header Action**: `+ Add User` (Opens clean modal with Name, Email, Role assignment).

### 4.4 Course / Subject Management
- **Table Structure**:
  - `Course Code / Subject`: e.g., `CS301 - Operating Systems`
  - `Academic Term`: e.g., `Fall 2026`
  - `Assigned Lecturer`: Lead faculty in charge.
  - `Status`: `Active` / `Archived`.
  - `Action`: `3-dot` menu (`Edit Course`, `Reassign Lecturer`, `Archive`).
- **Primary Header Action**: `+ Add Course`.
- *Explicitly excluded*: No homework submissions, gradebooks, attendance, or student discussion forums.

### 4.5 Exam Settings
Clean, grouped settings page with short field labels:
- **Group 1: Oral Examination Timing**:
  - Default Answer Timeout (seconds)
  - Maximum Follow-Up Questions per Insufficient Answer (default: 2)
- **Group 2: Speech & Transcription Configuration**:
  - Audio Input Sample Rate
  - Text-to-Speech Output Voice Model (Formal Academic Male/Female)
- **Group 3: Human Verification Enforcements**:
  - Require Lecturer Final Approval Before Result Publishing (Mandatory toggle - locked to On).

---

## 5. Lecturer Interface Specifications

The Lecturer workspace is task-oriented, organizing academic viva preparation, execution, and grading.

### 5.1 Lecturer Sidebar Navigation
1. **Dashboard**
2. **Materials**
3. **Question Bank**
4. **Rubric**
5. **Exam Sessions**
6. **Monitor Exam**
7. **Transcript & Score**

### 5.2 Lecturer Dashboard
Avoids generic statistics, focusing on immediate pending tasks:
- **Attention Tray / Work Queue**:
  - `4 Pending AI Question Reviews` (Questions generated from syllabus requiring approval)
  - `2 Upcoming Exam Sessions Today` (Operating Systems Viva Session A)
  - `14 Transcripts Waiting for Final Score` (Oral viva completed, awaiting lecturer confirmation)

---

## 6. Detailed Core Workflows

### 6.1 WORKFLOW 1: Question Bank & Rubric Management

#### User Flow Architecture:
```
[Lecturer Uploads Material]
            │
            ▼
[Request Question Generation]
            │
            ▼
[System / AI Service: Ingest & Extract]  ──► [UI Displays: "Processing material..."]
            │
            ▼
[Return Draft Questions]
            │
            ▼
[Lecturer Review & Edit Interface]  ──► (Human edits text, adjusts bloom level, approves)
            │
            ▼
[Rubric Definition & Criteria Weights]
            │
            ▼
[Approved Items Saved to Question Bank]
```

#### Screen 1: Learning Materials Page (`Materials`)
- **Primary CTA**: `Upload Material` button in header.
- **Upload Modal**: Simple dropzone accepting PDF/DOCX lecture notes or syllabi. Fields: `Material Title`, `Associated Course`.
- **Materials Table**:
  - `Material Name`: e.g., `Module_4_Concurrency_Deadlocks.pdf`
  - `Course / Subject`: `CS301 - Operating Systems`
  - `Type`: Document / Slides
  - `Status`: `Processed` / `Pending`
  - `Action`: `Generate Questions` (Direct CTA button) or `Delete`.

#### Screen 2: AI Question Generation & Review Flow
- **Generation Trigger**: Lecturer selects uploaded material and clicks `Generate Questions`.
- **Loading State**: Clean, non-distracting indicator:
  - Text: *"Processing material..."*
  - Subtitle: *"AI Service is analyzing core concepts and formulating viva questions."*
- **Draft Question Review Card List / Table**:
  - Clear banner: *"AI-generated questions require human review before publishing to Question Bank."*
  - Each item displays:
    - AI Tag: `AI Generated (Draft)`
    - Question Text (Editable inline or via modal)
    - Target Difficulty & Topic Tag
    - Direct Action Buttons: `[Edit]` `[Reject]` `[Approve & Add to Bank]`

#### Screen 3: Question Bank Page & Question Detail Modal
- **Table Columns**:
  - `Question Content`: Clamped to 1–2 lines with full text accessible via row click.
  - `Course / Subject`: Badge label.
  - `Source`: Subtle indicator (`AI Generated` or `Manual`).
  - `Status`: `Approved` / `Draft`.
  - `Action`: `3-dot` menu (`Edit`, `Duplicate`, `Archive`).
- **Question Detail Modal**: Displays full question prompt, sample ideal answer points, course tag, approval history, and `[Save Changes]` button.

#### Screen 4: Rubric Management
- **Table / Structured Form**:
  - `Criterion`: e.g., *Conceptual Clarity & Core Definition*
  - `Description`: *Student accurately articulates deadlock conditions (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait).*
  - `Weight / Max Points`: *40% (4.0 pts)*
  - `Actions`: `Edit` / `Remove`
- **Actions**: `+ Add Criterion`, `[Save Rubric]`.

---

### 6.2 WORKFLOW 2: Exam Session & Schedule Management

#### User Flow Architecture:
```
[Lecturer clicks: Create Exam Session]
            │
            ▼
[Step 1: Select Course]  ────────────► Choose accredited course
            │
            ▼
[Step 2: Add Students]   ────────────► Select eligible candidates from cohort
            │
            ▼
[Step 3: Exam Schedule]  ────────────► Set Date, Start Time, and Duration
            │
            ▼
[Step 4: Configure Questions]  ──────► Select approved questions from Question Bank
            │
            ▼
[Step 5: Review & Confirm]  ─────────► Audit summary & click "Confirm & Publish"
            │
            ▼
[System Stores Session & Publishes to Student Dashboards]
```

#### Step-by-Step Wizard UI Specifications:
The wizard uses a clean 5-step numbered progress stepper at the top:
1. `Course` ➔ 2. `Students` ➔ 3. `Schedule` ➔ 4. `Questions` ➔ 5. `Confirm`

- **Step 1 – Select Course**:
  - Card/Radio list of active courses assigned to the lecturer.
  - Displays Course Code, Name, and Student Cohort count.
  - Action: `Continue →`
- **Step 2 – Add Students**:
  - Cohort roster table with checkboxes.
  - Top indicator: `Selected: 18 / 24 students`.
  - Bulk actions: `Select All`, `Clear`.
  - Action: `Back` / `Continue →`
- **Step 3 – Set Date / Time**:
  - Date picker: `Exam Date` (e.g., `Oct 15, 2026`).
  - Time picker: `Start Time` (e.g., `09:00 AM`).
  - Expected Viva Duration per Student: `15 minutes`.
  - Action: `Back` / `Continue →`
- **Step 4 – Configure Questions**:
  - Dual-panel selector or table selection from approved Question Bank.
  - Selected question count and total estimated time.
  - Action: `Back` / `Continue →`
- **Step 5 – Confirm & Publish**:
  - Structured summary card:
    - Course: `CS301 - Operating Systems`
    - Cohort: `18 Candidates`
    - Date & Time: `Oct 15, 2026 | 09:00 AM`
    - Questions Assigned: `4 Questions`
  - Primary CTA: `Confirm & Publish Exam`.
  - On submission: Success state with direct link to `Monitor Exam`.

---

### 6.3 WORKFLOW 3: AI-Based Oral Examination (Viva Voce)

This is the primary differentiating feature of AIVES.

#### Complete Runtime Examination Loop & State Machine:
```
┌────────────────────────────────────────────────────────┐
│                   EXAM INITIALIZATION                  │
│  Lecturer Starts Session  ──►  Student Joins Session   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │    Get Next Question    │
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │  AI Formulates Question │
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │ Speech Service TTS Play │ ◄── Student clicks "Listen to Question"
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │   Student Voice Answer  │ ◄── Microphone: Ready ➔ Listening ➔ Answering
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │ Speech Service STT Conv │ ──► Transcript extracted
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │   AI Analyzes Answer    │ ──► UI: "Analyzing answer..."
               └────────────┬────────────┘
                            │
              Is Answer Sufficient / Complete?
             /                                \
           YES                                 NO
           /                                     \
          ▼                                       ▼
┌──────────────────────┐                ┌───────────────────────────┐
│   Save Transcript    │                │ Generate Follow-up Quest. │
└─────────┬────────────┘                └─────────────┬─────────────┘
          │                                           │
  More Questions?                                     ▼
     /         \                        ┌───────────────────────────┐
   YES          NO                      │ Speech Service: TTS Play  │
   /              \                     └─────────────┬─────────────┘
  ▼                ▼                                  │
[Loop Next Q]  [End Exam]                             ▼
                                        ┌───────────────────────────┐
                                        │ Student Voice Answer STT  │
                                        └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                        ┌───────────────────────────┐
                                        │ Re-analyze & Store Record │
                                        └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                                [Save & Next Q]
```

#### Student Oral Viva Screen Architecture:
- **Distraction-Free Mode**:
  - No sidebar.
  - No top navigation bars.
  - Centered card container (Max-width `720px`).
- **Top Header Bar**:
  - Left: `AIVES` minimal logo.
  - Center: Course & Exam Session Title.
  - Right: Progress pill: `Question 2 of 4`.
- **Question Card Area**:
  - Prominent question text (`22px` – `24px` Inter, `#111827`, line-height `1.4`).
  - Single audio action button: `[ 🔊 Listen to Question ]` (Plays Speech Service TTS audio with subtle animated soundbars).
- **Voice Response Controller**:
  - Visually dominant central microphone button (`80px` circular button).
  - 4 explicit operational states:
    1. **Ready**: Neutral light border, mic icon, helper text *"Click to start your answer"*.
    2. **Listening**: Blue pulsating ring, live audio waveform indicator, timer counting up.
    3. **Answering**: Solid blue accent with wave movement, displaying *"Recording voice answer..."*.
    4. **Finished**: Stop icon, transcript preview box, action button `[ Submit Answer ]`.
- **System Analysis State**:
  - When submitted, the mic transforms into a subtle spinner:
  - Text: *"Analyzing answer..."*
  - Subtitle: *"AI Service is processing your response against examination benchmarks."*
- **Follow-up Interaction Pattern**:
  - If answer is incomplete, an amber-accented sub-card appears smoothly:
  - Label: `Follow-up Question` (in soft amber badge).
  - Text: Follow-up question prompt clarifying the missing concept.
  - Reuses the identical `[Listen to Question]` and microphone recording pattern.
- **Completion Screen**:
  - Full-screen centered confirmation:
  - Heading: `Exam Completed`
  - Subtitle: `Your oral examination has been completed successfully. Your transcript and vocal responses have been securely archived for lecturer evaluation.`
  - Explicit rule: **No grades or raw AI scores are displayed to the student.**

---

## 7. Exam Monitoring Interface (Lecturer)

- **Purpose**: Calm, non-invasive overview of candidates taking the viva in real time.
- **Top Summary Header**:
  - Exam Session: `CS301 Viva Session 01` | Course: `Operating Systems` | Total: `24 Students`
  - Real-time Status Pills: `8 Completed`, `3 In Progress`, `13 Waiting`.
- **Monitoring Table**:
  - `Student Name / ID`: Candidate identification.
  - `Status`: Soft badge (`Waiting`, `In Progress`, `Completed`).
  - `Current Question`: e.g., `Question 3 of 4 (Follow-up)`.
  - `Duration`: Elapsed time (`08:42`).
  - `Action`: `View Live Feed / Transcript`.

---

## 8. Human-in-the-Loop Transcript & Scoring Interface (Lecturer)

This screen embodies the core governance philosophy: **AI Assists, Lecturer Decides**.

### 8.1 Layout Structure (Desktop Two-Column Grid)

```
+---------------------------------------------------------------------------------------------------+
| CS301 Viva Evaluation - Student: Alexander Wright (ID: STU-84920)              Status: [Pending] |
+-------------------------------------------------+-------------------------------------------------+
| LEFT COLUMN (Exam Transcript & Questions)       | RIGHT COLUMN (Scoring & Human Rubric Finalizer) |
| Width: 58%                                      | Width: 42%                                      |
|                                                 |                                                 |
| [ QUESTION 1 ]                                  | [ RUBRIC EVALUATION ]                           |
| "Explain the 4 necessary conditions for         | Criterion 1: Concept Clarity (Max 4.0)          |
|  deadlocks in multi-threaded systems."          | Criterion 2: Technical Precision (Max 4.0)      |
|                                                 | Criterion 3: Response to Follow-up (Max 2.0)    |
| [ STUDENT TRANSCRIPT ]                          |                                                 |
| "Deadlock occurs when processes are blocked...  | ----------------------------------------------- |
| Mutual exclusion, hold and wait, no preemption."| [ AI SUGGESTED SCORE ] (Secondary Treatment)    |
|                                                 | Suggested: 7.8 / 10.0                           |
| [ FOLLOW-UP QUESTION ] (AI Generated)           | Rationale: "Accurately listed 3 conditions,     |
| "What is the fourth condition that forms a      | needed follow-up to identify Circular Wait."    |
|  closed chain of dependencies?"                 | Note: "AI suggestion – Lecturer review required"|
|                                                 |                                                 |
| [ FOLLOW-UP TRANSCRIPT ]                        | ----------------------------------------------- |
| "The fourth condition is circular wait."        | [ LECTURER FINAL SCORE ] (Primary Dominant)     |
|                                                 | Score Input: [ 8.5 ] / 10.0                     |
|                                                 | Lecturer Remarks: [ Text Area ]                 |
|                                                 |                                                 |
|                                                 | [ FINALIZE SCORE BUTTON ] (Solid Blue CTA)      |
+-------------------------------------------------+-------------------------------------------------+
```

### 8.2 Architectural Distinction: AI vs. Human Decision
- **AI Suggested Score (Secondary)**:
  - Displayed inside a light gray/slate card (`#F1F5F9`).
  - Font size is modest (`16px`).
  - Clear label with info icon: *"AI suggestion – Lecturer review required."*
  - Summarizes rubric point breakdown computed by the AI Service.
- **Lecturer Final Score (Primary)**:
  - Prominently styled input box (`#2563EB` border focus, bold `20px` typography).
  - Pre-filled with suggestion for convenience, but fully editable.
  - Mandatory Lecturer Remarks field.
  - **Finalize Score** button is the sole primary action that commits the grade to the official student academic record.

---

## 9. Comprehensive Design System Component Matrix

| Component | Standard Sizing | Visual Styling | States & Interactivity |
| :--- | :--- | :--- | :--- |
| **Primary Button** | H: `42px`, P: `0 20px`, R: `8px` | Bg: `#2563EB`, Text: `#FFFFFF`, `font-medium 14px` | Hover: `#1D4ED8`, Focus: `ring-2 ring-blue-400`, Disabled: `bg-blue-300` |
| **Secondary Button** | H: `42px`, P: `0 16px`, R: `8px` | Bg: `#FFFFFF`, Border: `1px solid #E5E7EB`, Text: `#374151` | Hover: `bg-gray-50`, Active: `bg-gray-100` |
| **Data Table** | Row: `52px`, Header: `44px` | Thead: `#F8FAFC` font `12px uppercase`, Rows: `#FFFFFF` | Subtle bottom border `#F1F5F9`, hover row `#F8FAFC` |
| **Status Badge** | H: `24px`, P: `2px 10px`, R: `9999px` | Low saturation pastel background + dark readable text | Pre-mapped color semantics (Green, Amber, Blue, Gray, Red) |
| **Text Input / Select** | H: `42px`, P: `0 14px`, R: `8px` | Bg: `#FFFFFF`, Border: `1px solid #D1D5DB`, Font: `14px` | Focus: `border-blue-600 ring-1 ring-blue-600` |
| **Audio Player Trigger** | H: `40px`, P: `0 16px`, R: `8px` | Bg: `#EFF6FF`, Border: `1px solid #BFDBFE`, Text: `#1E40AF` | Click plays audio simulation with equalizer waveform |
| **Exam Mic Control** | Dim: `80px x 80px` circle | Icon: `32px`, Centered, Solid shadow | 4 visual states (Ready, Listening, Answering, Finished) |

---

## 10. Summary Verification Against Requirements

- [x] **Strict Scope**: Zero unrelated LMS features (no forums, no homework, no attendance, no file cloud drive).
- [x] **No Generic Chatbot**: Exam interaction uses formal question display, TTS audio, mic voice input, and structured follow-up card.
- [x] **Vendor Agnostic**: No references to OpenAI, Gemini, Claude, AWS, Azure, Postgres, etc. Strictly "AI Service", "Speech Service", "System".
- [x] **3 Core Workflows Implemented**:
  1. Question Bank & Rubric Management
  2. Exam Session & Schedule Management (5-step wizard)
  3. AI-Based Oral Examination
- [x] **Human-in-the-Loop Principle**: All AI-suggested scores and questions require explicit Lecturer review and finalization.
- [x] **Desktop-First SaaS Aesthetics**: Clean layout, 230px sidebar, 52px table rows, #2563EB primary, #F8FAFC background.
