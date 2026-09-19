# 🚗 DrivePrime — Vehicle Rental Management System

DrivePrime is a **Vehicle Rental Management System** designed to simplify the management of customers, vehicles, rentals, payments, and payment transactions through a centralized web-based application.

The project combines a responsive frontend with a Python-based backend and MySQL database to provide a functional management system for vehicle rental operations.

---

## ✨ Features

* 📊 **Dashboard**

  * Overview of customers, vehicles, rentals, and payments
  * Quick access to major system modules

* 👥 **Customer Management**

  * Add, view, edit, and delete customer records
  * Search and manage customer information

* 🚘 **Vehicle Management**

  * Manage available vehicles
  * Store vehicle details and rental information
  * Track vehicle status

* 📅 **Rental Management**

  * Create and manage rental records
  * Track rental periods and associated customers/vehicles
  * Update rental information

* 💳 **Payment Management**

  * Record and manage payments
  * Track payment status and rental-related transactions

* 🧾 **Transaction Management**

  * View payment transactions
  * Track transaction details associated with rentals

* 🔎 **Search & Filtering**

  * Quickly find customers, vehicles, rentals, and transactions

* 📱 **Responsive Interface**

  * Clean web interface designed for convenient use across different screen sizes

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Font Awesome

### Backend

* Python
* FastAPI
* Uvicorn

### Database

* MySQL

### Architecture

```text
Frontend (HTML / CSS / JavaScript)
                │
                ▼
        FastAPI Backend
                │
                ▼
          MySQL Database
```

---

## 📁 Project Structure

```text
Vehicle-Rental-Management-System/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
│
├── main.py
│
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Vehicle-Rental-Management-System
```

### 2. Install dependencies

Make sure Python is installed, then install the required packages:

```bash
pip install fastapi uvicorn mysql-connector-python
```

### 3. Configure MySQL

Create a MySQL database and configure the database connection using the following environment variables:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Example:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vehicle_rental
```

Make sure the required database tables are created before starting the application.

### 4. Start the backend

From the project root:

```bash
uvicorn main:app --reload
```

The application will be available at:

```text
http://localhost:8000
```

---

## 🔗 API Endpoints

The frontend communicates with the FastAPI backend through REST API endpoints.

| Module       | Endpoint        |
| ------------ | --------------- |
| Customers    | `/customers`    |
| Vehicles     | `/vehicles`     |
| Rentals      | `/rentals`      |
| Payments     | `/payments`     |
| Transactions | `/transactions` |

The frontend automatically communicates with the backend using the application's current host.

---

## 🖥️ Application Modules

### Dashboard

Provides a centralized overview of the rental system and quick access to its major functions.

### Customers

Stores and manages customer information required for vehicle rentals.

### Vehicles

Maintains vehicle records and their current rental-related information.

### Rentals

Connects customers with vehicles and manages rental records.

### Payments

Handles payment records associated with rentals.

### Payment Transactions

Provides a detailed view of recorded payment transactions.

---

## 🎯 Project Objective

The primary objective of DrivePrime is to provide a simple and centralized system for managing the core operations of a vehicle rental business.

Instead of maintaining customer, vehicle, rental, and payment information separately, the system brings these operations together into a single web application.

---

## 🚀 Future Improvements

Possible future improvements include:

* User authentication and role-based access
* Advanced reporting and analytics
* Vehicle availability calendars
* Automated payment processing
* Email/SMS notifications
* Online vehicle booking
* Improved validation and error handling
* Deployment to a cloud platform

---

## 👨‍💻 Project

**DrivePrime — Vehicle Rental Management System**

Developed as an academic DBMS project using **HTML, CSS, JavaScript, FastAPI, Python, and MySQL**.

---

## 📄 License

This project was developed for educational purposes.
