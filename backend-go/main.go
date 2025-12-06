package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

/* -----------------------------
   Database Model
------------------------------*/

type Incident struct {
	ID        int       `json:"id"`
	Message   string    `json:"message"`
	Category  string    `json:"category"`
	Severity  string    `json:"severity"`
	Action    string    `json:"action"`
	CreatedAt time.Time `json:"created_at"`
}

/* -----------------------------
   Global DB
------------------------------*/

var db *sql.DB

/* -----------------------------
   DB Helpers
------------------------------*/

func connectDB() {
	connStr := "host=db port=5432 user=postgres password=postgres dbname=incidents sslmode=disable"

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("DB open error: %v", err)
	}

	for i := 0; i < 10; i++ {
		err = db.Ping()
		if err == nil {
			break
		}
		log.Println("Waiting for PostgreSQL...", err)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Could not connect to PostgreSQL: %v", err)
	}

	log.Println("Connected to PostgreSQL!")
	createTable()
}

func createTable() {
	query := `
	CREATE TABLE IF NOT EXISTS incidents (
		id SERIAL PRIMARY KEY,
		message TEXT,
		category VARCHAR(255),
		severity VARCHAR(50),
		action TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Failed creating table: %v", err)
	}

	log.Println("Table ensured OK.")
}

/* -----------------------------
   AI Call
------------------------------*/

func callAIEngine(message string) (string, string, string, error) {

	// FIXED → AI expects "text", not "message"
	bodyObj := map[string]string{"text": message}
	jsonBody, _ := json.Marshal(bodyObj)

	resp, err := http.Post("http://ai-engine:5000/predict",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)

	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()

	bodyBytes, _ := ioutil.ReadAll(resp.Body)

	var result struct {
		Category string `json:"category"`
		Severity string `json:"severity"`
	}

	json.Unmarshal(bodyBytes, &result)

	// Auto action rules
	action := "No action required"
	if result.Severity == "critical" {
		action = "Escalate immediately"
	} else if result.Severity == "high" {
		action = "Investigate within 30 minutes"
	}

	return result.Category, result.Severity, action, nil
}

/* -----------------------------
   Routes
------------------------------*/

func ingestHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Message string `json:"message"`
	}

	json.NewDecoder(r.Body).Decode(&payload)

	if payload.Message == "" {
		http.Error(w, "Message required", http.StatusBadRequest)
		return
	}

	category, severity, action, err := callAIEngine(payload.Message)
	if err != nil {
		http.Error(w, "AI Engine error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Save to DB
	query := `
	INSERT INTO incidents (message, category, severity, action)
	VALUES ($1, $2, $3, $4)
	RETURNING id, created_at;
	`

	var id int
	var created time.Time

	err = db.QueryRow(query, payload.Message, category, severity, action).Scan(&id, &created)
	if err != nil {
		http.Error(w, "DB insert error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := Incident{
		ID:        id,
		Message:   payload.Message,
		Category:  category,
		Severity:  severity,
		Action:    action,
		CreatedAt: created,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func incidentsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, message, category, severity, action, created_at FROM incidents ORDER BY id DESC")
	if err != nil {
		http.Error(w, "DB query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var list []Incident

	for rows.Next() {
		var inc Incident
		rows.Scan(&inc.ID, &inc.Message, &inc.Category, &inc.Severity, &inc.Action, &inc.CreatedAt)
		list = append(list, inc)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

/* -----------------------------
   Main
------------------------------*/

func main() {
	log.Println("Backend starting...")

	connectDB()

	router := mux.NewRouter()
	router.HandleFunc("/ingest", ingestHandler).Methods("POST")
	router.HandleFunc("/incidents", incidentsHandler).Methods("GET")

	log.Println("Backend running on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
