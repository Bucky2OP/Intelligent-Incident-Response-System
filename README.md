⚡ Intelligent Incident Response System
AI-Powered Incident Classification & Automated Response Engine

The Intelligent Incident Response System is a full-stack application designed to help organizations automatically classify, prioritize, and respond to operational or security incidents.
It uses machine learning, Go backend services, React frontend, and PostgreSQL, all orchestrated using Docker Compose.

🚀 Features
✅ AI-Powered Classification

Automatically classifies incident messages into categories such as:

Infrastructure

Network

Application

Security

Determines severity levels: Low, Medium, High, Critical.

✅ Automated Response Suggestions

Based on severity, the system recommends actions such as:

"Escalate immediately"

"Investigate within 30 minutes"

"No action required"

✅ Real-Time Dashboard

Modern UI built with React + Vite

Live incident feed updated every few seconds

Severity-based filtering

Key metrics:

Total incidents

Critical incidents

High/Medium/Low counts

✅ Go Backend API

REST endpoints:

POST /ingest
GET  /incidents


Connects to AI engine and PostgreSQL

Automatically creates database table on startup

✅ AI Engine (Python)

FastAPI-based microservice

Accepts text and returns classification + severity

Simple ML model or rule-based classifier (customizable)

✅ Dockerized System

Fully containerized:

Service	Technology	Port
Frontend	React + Vite	3000
Backend	Go	8080
AI Engine	FastAPI/Python	5000
Database	PostgreSQL	5432
🧱 System Architecture
┌────────────┐      POST /predict       ┌──────────────┐
│  Backend   │ ───────────────────────▶ │  AI Engine   │
│   (Go)     │                          │ (FastAPI)    │
└─────┬──────┘                          └──────┬───────┘
      │ INSERT/SELECT                           │
      ▼                                         │
┌────────────┐                                  │
│ PostgreSQL │◀──────────────────────────────────┘
└────────────┘

Frontend (React) → Backend API → Database + AI Engine

📦 Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/your-username/intelligent-incident-response-system.git
cd intelligent-incident-response-system

🐳 Running with Docker (Recommended)

Ensure Docker Desktop is running, then start all services:

docker compose up --build


Access the app:

Service	URL
Frontend UI	http://localhost:3000

Backend API	http://localhost:8080/incidents

AI Engine	http://localhost:5000/predict

PostgreSQL	localhost:5432

To stop the system:

docker compose down --remove-orphans

🔧 Backend API (Go)
POST /ingest

Submit a new incident.

Example request:
{
  "message": "database timeout failure"
}

GET /incidents

Fetch all stored incidents.

🤖 AI Engine (Python)

Simple FastAPI service that takes a message and returns:

{
  "category": "database",
  "severity": "high"
}


Model logic is inside predict.py and can be customized or upgraded to ML/NLP later.

🗄 Database Schema

Automatically created:

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    message TEXT,
    category VARCHAR(255),
    severity VARCHAR(50),
    action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

🎨 Frontend (React)

Features:

Clean dark UI

Severity color badges

Auto refresh

Realtime notifications

Quick incident presets

Run manually (optional):

cd frontend-react
npm install
npm run dev

🛠 Technologies Used
Frontend

React

Vite

Tailwind-style UI (Custom CSS)

Backend

Go

Gorilla Mux

PostgreSQL Driver

AI Model

Python

FastAPI

Custom classification logic

Infra

Docker & Docker Compose

📚 Future Enhancements (Recommended)

Replace rule-based classifier with a small ML/NLP model

Add authentication & user roles

Add WebSocket real-time updates

Add historical analytics dashboard

Deploy using AWS / Azure

📝 License

This project can include MIT or Apache 2 license based on your preference.

🙌 Acknowledgments

Developed as a modern approach to automated incident triage using AI and distributed microservices.
