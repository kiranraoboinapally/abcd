
This project includes:

* **Frontend**: Angular-based web app.
* **Backend**: Go server with PostgreSQL for anomaly detection results.

---

##  Project Structure

```
abcd/
├── cwd-soundbox-client/         # Frontend Angular Application
│   ├── src/
│   ├── .env                # Frontend environment variables
│   ├── angular.json
│   ├── package.json
│   └── ...
├── anomaly-go/            # Backend Go Application
│   ├── main.go
│   ├── .env                # Backend environment variables (DB config)
│   ├── go.mod
│   ├── go.sum
│   └── ...
└── README.md               # Project Documentation (this file)
```

---

##  Frontend Setup (Angular)

###  Location

```bash
cd cwd-soundbox-client/
```

###  Install Dependencies

```bash
npm install
```

###  Install Angular CLI (if not installed)

```bash
npm install -g @angular/cli@19.2
```

###  Environment Configuration

Create a `.env` file in `cwd-soundbox-client/` with the following:

```
API_URL=http://localhost:8080
```

> Make sure this `.env` is at the root of the Angular app (`cwd-soundbox-client/.env`).

###  Run the App

* For default localhost:

```bash
ng serve
```

* For running on a specific IP/server:

```bash
npm start
```

---

##  Backend Setup (Go)

###  Location

```bash
cd anomaly-go/
```

###  Requirements

* Go `v1.25+`
* PostgreSQL running and accessible

###  Environment Configuration

Create a `.env` file in `anomaly-go/`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASSWORD=Password
DB_NAME=DatabaseName
```

###  Run the Backend Server

```bash
go run main.go
```

---

##  Database Schema

Create the following table in your PostgreSQL database:

```sql
CREATE TABLE anomaly_results (
    device_id   BIGINT,
    txn_id      TEXT,
    txn_ts      TIMESTAMP,
    txn_amt     NUMERIC,
    z_score     NUMERIC,
    confidence  NUMERIC,
    label       TEXT,
    open_time   TIME,
    close_time  TIME,
    review      TEXT,
    CONSTRAINT anomaly_results_pkey PRIMARY KEY (device_id, txn_id)
);



 CREATE TABLE battery_health (
     block                INTEGER NOT NULL,
     device_id             INTEGER NOT NULL,
     CS                   INTEGER, -- 1 = charging, 2 = discharging
     start_time           TIMESTAMP ,
     end_time             TIMESTAMP ,
     start_BL             DOUBLE PRECISION ,
     end_BL               DOUBLE PRECISION ,
     n_rows               INTEGER ,
     delta_BL             DOUBLE PRECISION ,
     delta_minutes        DOUBLE PRECISION ,
     avg_rate             DOUBLE PRECISION,
     is_anomaly           INTEGER , -- 0 = normal, 1 = anomaly
     anomaly_reason       TEXT NOT NULL,
     PRIMARY KEY (block, device_id)
 );



CREATE TABLE public.bl_score (
    device_id INTEGER PRIMARY KEY,
    device_bs DOUBLE PRECISION
);


```

---

##  Summary

| Component | Tech Stack  | Port   |
| --------- | ----------- | ------ |
| Frontend  | Angular     | `4200` |
| Backend   | Go (Golang) | `8080` |
| Database  | PostgreSQL  | `5432` |

---
