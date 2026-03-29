# ⬡ TaskFlow — Project Task Manager

A self-contained, zero-dependency task planner app that runs entirely in one `index.html` file. Host it free on GitHub Pages in under 5 minutes.

## ✅ Features
- 📊 **Advanced Dashboard** — charts (status, priority, trend), team workload, deadlines
- 📋 **Task Management** — create, edit, delete, filter, search tasks
- 🗂 **Kanban Board** — 4-column visual board
- 👥 **Team Overview** — per-member workload and completion stats
- 🔔 **Reminders Panel** — view scheduled reminders & overdue escalations
- 🔑 **User Token Access** — assignees view their tasks via magic link, no account needed
- 💬 **Replies & Evidence** — both admin and users can reply and attach files
- 📧 **Email Integration** — EmailJS support for real email notifications
- 💾 **Local Storage** — all data persists in browser storage
- 📤 **Export/Import** — backup tasks as JSON

---

## 🚀 Deploy on GitHub Pages (5 minutes, no coding)

### Step 1 — Create a GitHub account
Go to [github.com](https://github.com) and sign up (free).

### Step 2 — Create a new repository
1. Click the **+** button → **New repository**
2. Name it: `task-planner`
3. Set to **Public**
4. Click **Create repository**

### Step 3 — Upload the file
1. In your new repo, click **Add file → Upload files**
2. Drag and drop the `index.html` file from your computer
3. Scroll down and click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Click **Settings** tab in your repo
2. Left sidebar → click **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Branch: **main** | Folder: **/ (root)**
5. Click **Save**

### Step 5 — Your app is live! 🎉
After ~2 minutes, your app will be at:
```
https://YOUR-USERNAME.github.io/task-planner/
```

---

## 📧 Enable Real Email Reminders (Free)

### Using EmailJS (Recommended)
1. Sign up at [emailjs.com](https://emailjs.com) (free tier: 200 emails/month)
2. Create a **Email Service** (Gmail, Outlook, etc.)
3. Create an **Email Template** with these variables:
   - `{{to_email}}` — recipient
   - `{{task_title}}` — task name
   - `{{due_date}}` — due date
   - `{{task_link}}` — magic link URL
4. In the app: **Settings → Email Integration** — enter your Service ID, Template ID, and Public Key
5. Done! Reminders will now send real emails.

---

## 🔑 How User Token Access Works

When you create a task:
1. A unique **token** is automatically generated (e.g. `abc12xy`)
2. The user gets a **magic link**: `https://yoursite.github.io/task-planner/?token=abc12xy`
3. They can view their task, add replies, and attach files — **no account needed**
4. All replies sync back to your admin view

---

## 💾 Data Storage

Tasks are stored in **browser localStorage**. This means:
- ✅ Data persists between sessions on the same browser/device
- ✅ Works offline
- ❌ Not shared across different devices/browsers

For shared/team storage, integrate with [Supabase](https://supabase.com) (free PostgreSQL backend).

---

## 🛠 Tech Stack
- Pure HTML + CSS + JavaScript (no frameworks, no build step)
- [Chart.js](https://chartjs.org) for charts (loaded via CDN)
- Google Fonts (Syne + DM Sans)
- Browser localStorage for persistence

---

## 📁 File Structure
```
task-planner/
└── index.html    ← The entire app (everything is in here)
```

That's it. One file. Drop it anywhere and it works.
