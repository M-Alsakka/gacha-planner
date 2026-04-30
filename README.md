# 🎯 Gacha Planner

A modern planner for gacha games designed to help you manage daily tasks, events, materials, and long-term goals — all in one place.

---

## ✨ Current Status

🚧 **Active Development (Early Public Version)**

Core planning features are implemented, with more advanced systems coming soon.

---

## ✅ Features

### 🗓️ Task Planner (Completed)

* Create, edit, and delete tasks
* Drag & drop scheduling (weekly calendar)
* Pending / Scheduled / Done workflow
* Overdue task handling
* Confirmation dialogs & validation
* Clean and responsive UI

---

## 🔜 Coming Soon

### 📦 Materials & Inventory System

* Track owned materials per game
* Link materials to tasks and goals
* Visual progress tracking

### 🎯 Planner Goals

* Define long-term farming goals
* Compare required vs owned materials
* Smart planning suggestions

### 🌐 HoYoLAB Integration

* Sync game data automatically
* Import account progress
* Reduce manual tracking

### 🧠 Smart Task Automation

* Auto-generated recurring tasks
* Event-based tasks (limited-time events)
* Game-specific schedules

---

## 🧩 Project Structure

```txt
frontend/   → React + Vite (UI)
backend/    → NestJS + Prisma (API)
```

---

## 🚀 Modes

Gacha Planner supports two modes:

### 🧍 Single-User Mode (Default)

* Designed for personal use
* HoYoLAB tokens stored in `.env`
* No account system
* Recommended for self-hosting

### 👥 Multi-User Mode (Planned)

* User accounts & authentication
* Per-user encrypted HoYoLAB tokens
* Shared global tasks + personal state
* Intended for public hosting

---

## ⚙️ Getting Started (Coming Soon)

Full setup guide will be available in the documentation website.

For now, you can expect:

* Docker-based setup
* PostgreSQL database
* Environment configuration via `.env`

---

## 📚 Documentation

A full documentation website is planned, including:

* User guide (non-developers)
* Self-hosting guide
* Developer/API reference
* Architecture overview

---

## 🔐 Security Note (Future Multi-User Mode)

When multi-user mode is released:

* Sensitive tokens will be **encrypted at rest**
* Tokens will **never be exposed to the frontend**
* Users will be able to **remove their data at any time**

For maximum privacy, self-hosting will always be supported.

---

## 🛠️ Tech Stack

* **Frontend:** React + Vite + TypeScript
* **Backend:** NestJS + Prisma
* **Database:** PostgreSQL
* **Auth:** JWT (planned for multi-user)
* **Storage:** (planned for assets/materials)

---

## 📌 Roadmap

* [x] Task system (manual + scheduling)
* [x] Calendar UI
* [ ] Materials system
* [ ] Planner goals
* [ ] HoYoLAB integration
* [ ] Multi-user support
* [ ] Documentation website
* [ ] Smart automation system

---

## 🤝 Contributing

Not open for contributions yet — project structure is still evolving.

---

## 📄 License

To be defined.
