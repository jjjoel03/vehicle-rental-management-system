# DrivePrime — Vehicle Rental Management System

DrivePrime is a full-stack, DBMS-based vehicle rental management system designed to simplify vehicle bookings, customer management, fleet operations and payment tracking.

The application provides separate interfaces for customers and administrators, backed by a relational MySQL database and a FastAPI REST API.

## Features

### Customer Portal
- Customer registration and secure login
- Vehicle availability search
- Pickup and drop-off scheduling
- Hour-based rental price calculation
- Pillion add-on option
- Simulated payments
- Booking history

### Admin Dashboard
- Dashboard with fleet and revenue statistics
- Customer management
- Vehicle management
- Rental management
- Payment tracking
- Transaction history
- Pending payment monitoring

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python, FastAPI |
| Database | MySQL |
| Authentication | JWT |
| Password Security | bcrypt |
| Application Server | Uvicorn |
| Version Control | Git and GitHub |

## Database Architecture

The relational database consists of five primary tables:

- `Customer`
- `Vehicle`
- `Rental`
- `Payment`
- `PaymentTransaction`

The database uses primary keys, foreign keys, constraints, views and triggers to maintain data integrity and synchronize payment records.

## Security Features

- bcrypt password hashing
- JWT-based authentication
- Role-based access control
- Parameterized SQL queries
- Environment-based credential management
- Restricted MySQL application privileges

## Project Structure

```text
vehicle-rental-management-system/
├── database/
│   └── driveprime.sql
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── index.html
├── main.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Prerequisites

- Python 3
- MySQL 8.0 or later
- Git

### 2. Clone the Repository

Clone this repository using its GitHub URL and open the project directory.

### 3. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate on Windows CMD:

```cmd
.venv\Scripts\activate.bat
```

Activate on Linux or macOS:

```bash
source .venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure the Database

Import `database/driveprime.sql` using MySQL Workbench or the MySQL command-line client.

Use a fresh database installation, as the schema script may replace existing database objects.

Create a dedicated MySQL application user with SELECT, INSERT, UPDATE and DELETE privileges on the DrivePrime database.

### 6. Configure Environment Variables

Create a `.env` file using `.env.example` as a template.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=driveprime
SECRET_KEY=your_random_secret_key
```

Generate a secure JWT secret using:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Never commit the actual `.env` file to version control.

### 7. Run the Application

```bash
python -m uvicorn main:app --reload
```

Open the application:

http://127.0.0.1:8000

### 8. Create an Administrator Account

Register a customer account through the application and use an authorized MySQL administrator account to assign the admin role.

```sql
UPDATE Customer
SET role = 'admin'
WHERE email = 'your_admin_email@example.com';
```

Log out and sign in again to access the admin dashboard.

## API Documentation

FastAPI provides interactive API documentation at:

http://127.0.0.1:8000/docs

## Future Enhancements

- Real payment gateway integration
- Vehicle maintenance management
- Advanced reporting and analytics
- Email notifications
- Cloud deployment

## Disclaimer

DrivePrime is an academic DBMS project developed for educational purposes. Payment transactions are simulated and do not involve real financial charges.

---

**DrivePrime — Vehicle Rental Management System**