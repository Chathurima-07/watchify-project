# High-Level Design (HLD)

## 🧩 Architecture

Frontend (React / Next.js)
↓
Backend (Node.js / Django / Spring Boot)
↓
Database (PostgreSQL / MongoDB)

---

## 📦 Core Modules

### 1. Auth Service
- Login
- Role-based access

---

### 2. User Service
- Manage students, mentors, admins

---

### 3. Monitoring Service
- Collect logs
- Store activity

---

### 4. Flagging Service
- Create flags
- Retrieve flagged users
- Admin review

---

## 🔄 Data Flow

### Student Activity
Student → API → Database (Logs stored)

---

### Monitoring
Mentor → Fetch Logs API → UI

---

### Flagging
Mentor/Admin → View Logs → Flag → Stored in DB

---

## 🗄 Database Overview

### Users
- id
- name
- email
- role

---

### Logs
- id
- student_id
- activity_type
- timestamp
- metadata

---

### Flags
- id
- student_id
- flagged_by
- reason
- severity
- notes
- status

---

## 🔐 Security
- JWT authentication
- Role-based authorization