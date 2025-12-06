from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

app = FastAPI()

# Training samples (expandable)
texts = [
    "database connection failed",
    "database timeout",
    "postgres not responding",
    "user login failed",
    "invalid credentials",
    "authentication error",
    "payment API timeout",
    "API request failed",
    "service unavailable",
    "server overheating",
    "cpu usage high",
    "disk almost full",
    "low storage warning",
    "unauthorized access attempt",
    "SSL certificate expired",
]

categories = [
    "database",
    "database",
    "database",
    "auth",
    "auth",
    "auth",
    "api",
    "api",
    "api",
    "infra",
    "infra",
    "storage",
    "storage",
    "security",
    "security",
]

severity_map = {
    "database": "high",
    "auth": "medium",
    "api": "high",
    "infra": "critical",
    "storage": "medium",
    "security": "critical",
}

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

model = LogisticRegression()
model.fit(X, categories)

class Incident(BaseModel):
    text: str

@app.post("/predict")
def predict_incident(incident: Incident):
    X_test = vectorizer.transform([incident.text])
    category = model.predict(X_test)[0]
    severity = severity_map.get(category, "low")
    return {"category": category, "severity": severity}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
