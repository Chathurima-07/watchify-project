📄 Product Requirements Document (PRD)
Product: Watchify – AI Online Exam Proctoring System
🧭 1. Overview

Watchify is a MERN-based AI-powered online exam proctoring platform that enables secure, monitored, and scalable online examinations with role-based access for Admin, Mentor, and Student.

The platform ensures exam integrity through:

Real-time monitoring
Violation tracking
Result evaluation
Role-based dashboards
🎯 2. Goals
Primary Goals
Provide a secure online exam system
Enable real-time monitoring of students
Detect and track suspicious behavior
Provide data-driven insights to Admin and Mentors
Maintain exam integrity
Secondary Goals
Build a scalable SaaS-style dashboard
Ensure clean UX across all roles
Enable extensibility for AI-based proctoring
👥 3. User Roles
🧑‍🎓 Student
Attempt exams
View results
Generate monitoring logs (violations)
👨‍🏫 Mentor
Create exams
View student performance
Monitor violations
Flag suspicious students
🛠 Admin
Full system control
Manage students and mentors
View analytics and reports
Manage flagged users
⚙️ 4. Core Features Implemented
🔐 4.1 Authentication & Authorization
JWT-based authentication
Role-based protected routes
Roles:
Admin
Mentor
Student
📊 4.2 Admin Dashboard
Features:
System-wide analytics:
Total students
Total mentors
Exams count
Flagged cases
Manage:
Students
Mentors
View reports
View monitoring logs
Flag/unflag students
View flagged students list
🧑‍🏫 4.3 Mentor Dashboard
Features:
Create exams
View created exams
View student submissions
Monitor violations
Flag students based on suspicious behavior
View flagged students
🧑‍🎓 4.4 Student Dashboard
Features:
View available exams
Attempt exams
View results
View monitoring logs
See flag warning (if flagged)
📝 4.5 Exam System
Features:
Mentor creates exams with:
Questions
Options
Correct answers
Students:
Attempt exams
Submit answers
Backend:
Calculates score
Stores results securely
Prevents exposure of correct answers
📈 4.6 Results System
Stores:
Score
Total marks
Percentage
Submission date
Students can:
View results
View result details
👁️ 4.7 Monitoring & Violations System
Tracks:
Tab switching
Fullscreen exit
Camera issues
Stored in DB:
Student
Exam
Type
Severity
Description
Timestamp
🚩 4.8 Flagging System (NEW)
Features:
Mentor/Admin can flag students
Based on monitoring logs
Stores:
flagged (boolean)
flagReason
flagSeverity
flaggedBy
flaggedAt
Behavior:
Flagged students:
Highlighted in dashboards
Visible in flagged list
Shown warning in student dashboard
🗄 5. Data Models (High Level)
User
name
email
password
role
flagged
flagReason
flagSeverity
flaggedBy
flaggedAt
Exam
title
duration
questions[]
createdBy (mentor)
Result
student
exam
score
total
percentage
submittedAt
Violation
student
exam
type
severity
description
timestamp
🔌 6. APIs (High-Level)
Auth
POST /api/auth/register
POST /api/auth/login
Mentor
GET /api/mentor/exams
POST /api/mentor/exams
GET /api/mentor/results
Student
GET /api/student/exams
POST /api/student/exams/:id/submit
GET /api/student/results
Admin
GET /api/admin/stats
GET /api/admin/users
Monitoring
POST /api/student/violations
GET /api/student/violations
Flagging
POST /api/flags/:studentId
PUT /api/flags/:studentId/remove
GET /api/flags
🧩 7. Functional Requirements
Must Have
Secure login system
Role-based dashboards
Real exam flow
Monitoring + violations
Result calculation backend-only
Flagging system
Should Have
Dashboard analytics
Filtering and search
Clean UI/UX
🚫 8. Non-Functional Requirements
No fake/mock data in production
Secure APIs (JWT protected)
Scalable backend
Responsive UI
Fast API response time
Clean code structure
🔐 9. Security Requirements
JWT authentication
Role-based authorization
No exposure of correct answers
Input validation
Secure DB queries
Prevent unauthorized flagging
📊 10. Current System Flow
Mentor creates exam
Student views exam
Student attempts exam
Monitoring logs are generated
Student submits answers
Backend calculates score
Result stored in DB
Mentor/Admin reviews logs
Mentor/Admin flags student (if needed)
Student sees flag warning
🚀 11. Future Enhancements
AI-based cheating detection
Face recognition / webcam tracking
Live proctoring (WebSockets)
Video recording playback
Risk scoring system
Auto-flagging based on behavior
Export reports (PDF/CSV)
Notifications system
✅ 12. Success Metrics
Accurate result calculation
Detection of suspicious behavior
Reduction in cheating cases
Smooth user experience
Real-time monitoring effectiveness
🧾 13. Summary

Watchify is a fully functional AI-assisted exam monitoring system with:

✔ Real exam workflow
✔ Monitoring + violation tracking
✔ Role-based dashboards
✔ Flagging system
✔ Secure backend-driven logic