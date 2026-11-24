-- DrivePrime / Vehicle Rental Management System
-- Database schema for the FastAPI backend in this repository.
-- Target: MySQL 8.0+ (InnoDB, utf8mb4)
--
-- Import this file into MySQL Workbench or run:
--   mysql -u YOUR_USER -p < driveprime.sql
--
-- IMPORTANT:
-- This schema is reconstructed from the SQL statements and field names
-- used by the project's current main.py and frontend. Back up an existing
-- database before importing. Do not run this on a database containing data
-- you need to keep, because the DROP statements below recreate the objects.

CREATE DATABASE IF NOT EXISTS driveprime
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE driveprime;

-- Drop dependent objects first so the script can be re-run cleanly.
DROP VIEW IF EXISTS PendingPayments;
DROP TRIGGER IF EXISTS trg_paymenttransaction_after_insert;
DROP TRIGGER IF EXISTS trg_paymenttransaction_after_update;
DROP TRIGGER IF EXISTS trg_paymenttransaction_after_delete;
DROP TABLE IF EXISTS PaymentTransaction;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Rental;
DROP TABLE IF EXISTS Vehicle;
DROP TABLE IF EXISTS Customer;

CREATE TABLE Customer (
    customer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id),
    UNIQUE KEY uq_customer_email (email)
) ENGINE=InnoDB;

CREATE TABLE Vehicle (
    vehicle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_name VARCHAR(120) NOT NULL,
    type VARCHAR(60) NOT NULL,
    rate_per_day DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(2048) NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vehicle_id),
    KEY idx_vehicle_type (type),
    CONSTRAINT chk_vehicle_rate CHECK (rate_per_day >= 0)
) ENGINE=InnoDB;

CREATE TABLE Rental (
    rental_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    vehicle_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_return_date DATETIME NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'approved',
    rental_status VARCHAR(30) NOT NULL DEFAULT 'Active',
    pickup_time TIME NULL,
    dropoff_time TIME NULL,
    pickup_location VARCHAR(150) NULL,
    dropoff_location VARCHAR(150) NULL,
    pillion_addon DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rental_id),
    KEY idx_rental_customer (customer_id),
    KEY idx_rental_vehicle_dates (vehicle_id, start_date, end_date),
    KEY idx_rental_actual_return (actual_return_date),
    CONSTRAINT fk_rental_customer
        FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_rental_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_rental_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_rental_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_rental_pillion CHECK (pillion_addon >= 0)
) ENGINE=InnoDB;

CREATE TABLE Payment (
    payment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    rental_id INT UNSIGNED NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    late_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Pending', 'Partial', 'Paid') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    UNIQUE KEY uq_payment_rental (rental_id),
    CONSTRAINT fk_payment_rental
        FOREIGN KEY (rental_id) REFERENCES Rental(rental_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_payment_total CHECK (total_amount >= 0),
    CONSTRAINT chk_payment_late_fee CHECK (late_fee >= 0),
    CONSTRAINT chk_payment_amount_paid CHECK (amount_paid >= 0)
) ENGINE=InnoDB;

CREATE TABLE PaymentTransaction (
    transaction_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('Cash', 'Card', 'UPI') NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (transaction_id),
    KEY idx_transaction_payment (payment_id),
    CONSTRAINT fk_transaction_payment
        FOREIGN KEY (payment_id) REFERENCES Payment(payment_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_transaction_amount CHECK (amount > 0)
) ENGINE=InnoDB;

-- Keep Payment.amount_paid and Payment.payment_status in sync with
-- the individual PaymentTransaction records written by main.py.
DELIMITER $$

CREATE TRIGGER trg_paymenttransaction_after_insert
AFTER INSERT ON PaymentTransaction
FOR EACH ROW
BEGIN
    UPDATE Payment
    SET amount_paid = (
        SELECT COALESCE(SUM(amount), 0)
        FROM PaymentTransaction
        WHERE payment_id = NEW.payment_id
    ),
    payment_status = CASE
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = NEW.payment_id
        ) >= total_amount THEN 'Paid'
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = NEW.payment_id
        ) > 0 THEN 'Partial'
        ELSE 'Pending'
    END
    WHERE payment_id = NEW.payment_id;
END$$

CREATE TRIGGER trg_paymenttransaction_after_update
AFTER UPDATE ON PaymentTransaction
FOR EACH ROW
BEGIN
    UPDATE Payment
    SET amount_paid = (
        SELECT COALESCE(SUM(amount), 0)
        FROM PaymentTransaction
        WHERE payment_id = NEW.payment_id
    ),
    payment_status = CASE
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = NEW.payment_id
        ) >= total_amount THEN 'Paid'
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = NEW.payment_id
        ) > 0 THEN 'Partial'
        ELSE 'Pending'
    END
    WHERE payment_id = NEW.payment_id;

    IF OLD.payment_id <> NEW.payment_id THEN
        UPDATE Payment
        SET amount_paid = (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = OLD.payment_id
        ),
        payment_status = CASE
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM PaymentTransaction
                WHERE payment_id = OLD.payment_id
            ) >= total_amount THEN 'Paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM PaymentTransaction
                WHERE payment_id = OLD.payment_id
            ) > 0 THEN 'Partial'
            ELSE 'Pending'
        END
        WHERE payment_id = OLD.payment_id;
    END IF;
END$$

CREATE TRIGGER trg_paymenttransaction_after_delete
AFTER DELETE ON PaymentTransaction
FOR EACH ROW
BEGIN
    UPDATE Payment
    SET amount_paid = (
        SELECT COALESCE(SUM(amount), 0)
        FROM PaymentTransaction
        WHERE payment_id = OLD.payment_id
    ),
    payment_status = CASE
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = OLD.payment_id
        ) >= total_amount THEN 'Paid'
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM PaymentTransaction
            WHERE payment_id = OLD.payment_id
        ) > 0 THEN 'Partial'
        ELSE 'Pending'
    END
    WHERE payment_id = OLD.payment_id;
END$$

DELIMITER ;

-- The backend runs SELECT * FROM PendingPayments.
-- The frontend expects: payment_id, rental_id, customer_name,
-- total_amount, amount_paid, balance_due, payment_status.
CREATE OR REPLACE VIEW PendingPayments AS
SELECT
    p.payment_id,
    p.rental_id,
    c.name AS customer_name,
    p.total_amount,
    p.amount_paid,
    GREATEST(p.total_amount - p.amount_paid, 0) AS balance_due,
    p.payment_status
FROM Payment p
INNER JOIN Rental r ON r.rental_id = p.rental_id
INNER JOIN Customer c ON c.customer_id = r.customer_id
WHERE p.amount_paid < p.total_amount;

-- Optional starter vehicles can be inserted through the admin dashboard.
-- No sample users or passwords are created by this schema.
