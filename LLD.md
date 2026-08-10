# Low-Level Design (LLD)

## 📡 API Design

### 🔐 Auth

POST /api/auth/login

Request:
{
  "email": "",
  "password": ""
}

Response:
{
  "token": "",
  "role": ""
}

---

### 👨‍🎓 Student APIs

GET /api/student/dashboard

---

### 🧑‍🏫 Mentor APIs

GET /api/mentor/students

GET /api/logs?studentId=

POST /api/flag

Request:
{
  "studentId": "",
  "reason": "",
  "severity": "low | medium | high",
  "notes": ""
}

---

### 🛠 Admin APIs

GET /api/admin/logs

GET /api/admin/flags

PATCH /api/admin/flag/:id

---

## 🧠 Backend Logic

### Flag Creation
IF role == mentor OR admin
→ allow
ELSE
→ deny

---

### Logs Access
Mentor → only assigned students

Admin → all logs

---

## 🖥 Frontend Components

### Student
- Dashboard
- Activity logs

---

### Mentor
- Student list
- Logs viewer
- Flag modal

---

### Admin
- Dashboard
- Flag management

---

## 🧱 Flag UI

[ Flag Student ]

Reason: ________
Severity: Low | Medium | High
Notes: ________

[ Submit ]

---

## ⚙️ Data Rules

- No mock data
- Use real APIs
- Backend-driven UI

---

## 🔐 Validation

- Input validation
- Role checks
- Secure endpoints