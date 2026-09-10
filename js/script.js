/* ============================================================
   DRIVEPRIME — VEHICLE RENTAL MANAGEMENT SYSTEM
   Premium, client-side demo logic with LocalStorage persistence.
   ============================================================ */
"use strict";

const STORAGE_KEY = "vehicleRentalSystem";

let appData = {
    customers: [],
    vehicles: [],
    rentals: [],
    payments: [],
    transactions: []
};

let editingId = null;
let editingType = null;

/* ------------------------------------------------------------
   INITIALIZATION
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    migrateAndRepairData();
    setupNavigation();
    setupSidebar();
    setupModals();
    setupButtons();
    setupForms();
    setupSearchAndFilters();
    setupNotifications();
    setupGlobalSearch();
    updateHeaderDate();
    syncVehicleStatuses(false);
    updateDashboard();
    renderAllTables();
    showSection("dashboard");
});

/* ------------------------------------------------------------
   DATA + STORAGE
   ------------------------------------------------------------ */
function emptyData() {
    return { customers: [], vehicles: [], rentals: [], payments: [], transactions: [] };
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        appData = {
            customers: Array.isArray(parsed.customers) ? parsed.customers : [],
            vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
            rentals: Array.isArray(parsed.rentals) ? parsed.rentals : [],
            payments: Array.isArray(parsed.payments) ? parsed.payments : [],
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
        };
    } catch (error) {
        console.error("Unable to load saved data:", error);
        appData = emptyData();
        showToast("Saved data could not be loaded. Starting with a clean workspace.", "warning");
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.error("Unable to save data:", error);
        showToast("Unable to save data in this browser.", "error");
    }
}

function migrateAndRepairData() {
    // Normalize older records so missing optional fields never break rendering.
    appData.customers = appData.customers.map(c => ({
        id: String(c.id ?? createId()),
        full_name: String(c.full_name ?? ""),
        email: String(c.email ?? ""),
        phone: String(c.phone ?? ""),
        license_number: String(c.license_number ?? ""),
        address: String(c.address ?? "")
    }));

    appData.vehicles = appData.vehicles.map(v => ({
        id: String(v.id ?? createId()),
        license_plate: String(v.license_plate ?? ""),
        model: String(v.model ?? ""),
        year: Number(v.year) || "",
        type: String(v.type ?? ""),
        daily_rate: Number(v.daily_rate) || 0,
        availability_status: String(v.availability_status ?? "available")
    }));

    appData.rentals = appData.rentals.map(r => ({
        id: String(r.id ?? createId()),
        customer_id: String(r.customer_id ?? ""),
        vehicle_id: String(r.vehicle_id ?? ""),
        rental_date: String(r.rental_date ?? ""),
        expected_return_date: String(r.expected_return_date ?? ""),
        status: String(r.status ?? "active")
    }));

    appData.payments = appData.payments.map(p => ({
        id: String(p.id ?? createId()),
        rental_id: String(p.rental_id ?? ""),
        amount: Number(p.amount) || 0,
        payment_date: String(p.payment_date ?? ""),
        payment_method: String(p.payment_method ?? ""),
        status: String(p.status ?? "success")
    }));

    appData.transactions = appData.transactions.map(t => ({
        id: String(t.id ?? createId()),
        type: String(t.type ?? "payment"),
        reference: String(t.reference ?? ""),
        date: String(t.date ?? ""),
        amount: Number(t.amount) || 0,
        status: String(t.status ?? "success"),
        payment_id: t.payment_id ? String(t.payment_id) : null
    }));

    // Legacy versions created payment + transaction with different IDs.
    // Link those records by a conservative signature match, then create any
    // missing transaction rows. This makes future edit/delete operations safe.
    const usedTransactions = new Set();

    appData.payments.forEach(payment => {
        let transaction = appData.transactions.find(t =>
            !usedTransactions.has(t.id) &&
            t.type === "payment" &&
            !t.payment_id &&
            t.reference === payment.rental_id &&
            Number(t.amount) === Number(payment.amount) &&
            t.date === payment.payment_date &&
            t.status === payment.status
        );

        if (transaction) {
            transaction.payment_id = payment.id;
            usedTransactions.add(transaction.id);
        }
    });

    appData.payments.forEach(payment => {
        const hasTransaction = appData.transactions.some(
            t => t.payment_id === payment.id
        );

        if (!hasTransaction) {
            appData.transactions.push(makePaymentTransaction(payment));
        }
    });

    saveData();
}

function makePaymentTransaction(payment) {
    return {
        id: createId(),
        type: "payment",
        reference: payment.rental_id,
        date: payment.payment_date,
        amount: Number(payment.amount) || 0,
        status: payment.status,
        payment_id: payment.id
    };
}

function createId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ------------------------------------------------------------
   NAVIGATION + SIDEBAR
   ------------------------------------------------------------ */
function setupNavigation() {
    document
        .querySelectorAll(".nav-item, [data-section]")
        .forEach(button => {
            button.addEventListener("click", event => {
                const section = event.currentTarget.dataset.section;

                if (!section) return;

                showSection(section);
            });
        });
}

function showSection(sectionName) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active-section", "active");
    });

    document
        .getElementById(sectionName)
        ?.classList.add("active-section", "active");

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );
    });

    const titles = {
        dashboard: "Dashboard",
        customers: "Customers",
        vehicles: "Vehicles",
        rentals: "Rentals",
        payments: "Payments",
        transactions: "Transactions"
    };

    const pageTitle = document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || "Dashboard";
    }

    closeSidebar();
}

function setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarClose = document.getElementById("sidebarClose");

    menuToggle?.addEventListener("click", () => {
        sidebar?.classList.add("open");
    });

    sidebarClose?.addEventListener("click", closeSidebar);

    document.addEventListener("click", event => {
        if (
            window.innerWidth <= 900 &&
            sidebar?.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuToggle?.contains(event.target)
        ) {
            closeSidebar();
        }
    });
}

function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
}

/* ------------------------------------------------------------
   MODALS
   ------------------------------------------------------------ */
function setupModals() {
    document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeModal);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document
                .querySelectorAll(".modal-overlay.active")
                .forEach(modal => {
                    closeModal(modal.id);
                });
        }
    });
}

function openModal(modalId, record = null, type = null) {
    const modal = document.getElementById(modalId);

    if (!modal) return;

    if (type === "rental") {
        populateRentalDropdowns(record?.vehicle_id);
    }

    if (type === "payment") {
        populatePaymentDropdowns(record?.rental_id);
    }

    editingId = record?.id ?? null;
    editingType = record ? type : null;

    const form = modal.querySelector("form");

    if (form) {
        form.reset();
        clearErrors(form);
    }

    if (record && type) {
        fillForm(type, record);
    } else {
        setDefaultValues(type);
    }

    updateModalTitle(type, Boolean(record));

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        const first = modal.querySelector(
            "input, select, textarea"
        );

        first?.focus();
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    editingId = null;
    editingType = null;
}

function updateModalTitle(type, isEditing) {
    const config = {
        customer: [
            "customerModalTitle",
            isEditing ? "Edit Customer" : "Add Customer"
        ],

        vehicle: [
            "vehicleModalTitle",
            isEditing ? "Edit Vehicle" : "Add Vehicle"
        ],

        rental: [
            "rentalModalTitle",
            isEditing ? "Edit Rental" : "Create Rental"
        ],

        payment: [
            "paymentModalTitle",
            isEditing ? "Edit Payment" : "Record Payment"
        ]
    };

    if (!config[type]) return;

    const [id, title] = config[type];
    const element = document.getElementById(id);

    if (element) {
        element.textContent = title;
    }

    if (type === "payment") {
        const subtitle = document.getElementById(
            "paymentModalSubtitle"
        );

        if (subtitle) {
            subtitle.textContent = isEditing
                ? "Update the payment record and its transaction."
                : "Add a payment against a rental.";
        }

        const submit = document.getElementById(
            "paymentSubmitBtn"
        );

        if (submit) {
            submit.textContent = isEditing
                ? "Save Changes"
                : "Record Payment";
        }
    }
}

function fillForm(type, record) {
    if (type === "customer") {
        const form = document.getElementById("customerForm");

        if (!form) return;

        form.customerName.value = record.full_name || "";
        form.customerEmail.value = record.email || "";
        form.customerPhone.value = record.phone || "";
        form.customerLicense.value = record.license_number || "";
        form.customerAddress.value = record.address || "";
    }

    if (type === "vehicle") {
        const form = document.getElementById("vehicleForm");

        if (!form) return;

        form.licensePlate.value = record.license_plate || "";
        form.vehicleModel.value = record.model || "";
        form.vehicleYear.value = record.year || "";
        form.vehicleType.value = record.type || "";
        form.dailyRate.value = record.daily_rate ?? "";
        form.vehicleStatus.value =
            record.availability_status || "available";
    }

    if (type === "rental") {
        const form = document.getElementById("rentalForm");

        if (!form) return;

        form.rentalCustomer.value = record.customer_id || "";
        form.rentalVehicle.value = record.vehicle_id || "";
        form.rentalDate.value = record.rental_date || "";
        form.expectedReturnDate.value =
            record.expected_return_date || "";
        form.rentalStatus.value = record.status || "active";
    }

    if (type === "payment") {
        const form = document.getElementById("paymentForm");

        if (!form) return;

        form.paymentRental.value = record.rental_id || "";
        form.paymentAmount.value = record.amount ?? "";
        form.paymentDate.value = record.payment_date || "";
        form.paymentMethod.value = record.payment_method || "";
        form.paymentStatus.value = record.status || "success";
    }
}

function setDefaultValues(type) {
    const today = localDateInputValue();

    if (type === "customer") {
        document.getElementById("customerName")?.focus();
    }

    if (type === "vehicle") {
        document.getElementById("licensePlate")?.focus();
    }

    if (type === "rental") {
        const form = document.getElementById("rentalForm");

        if (form) {
            form.rentalDate.value = today;
            form.rentalStatus.value = "active";
            form.rentalDate.min = today;
            form.expectedReturnDate.min = today;
        }
    }

    if (type === "payment") {
        const form = document.getElementById("paymentForm");

        if (form) {
            form.paymentDate.value = today;
        }
    }
}

function clearErrors(form) {
    form
        .querySelectorAll(".form-error")
        .forEach(error => error.remove());

    form
        .querySelectorAll(".input-error")
        .forEach(input => input.classList.remove("input-error"));
}

function showFormError(form, message, field) {
    clearErrors(form);

    if (field) {
        field.classList.add("input-error");
        field.focus();
    }

    const error = document.createElement("div");

    error.className = "form-error";
    error.textContent = message;

    form.querySelector(".modal-footer")?.before(error);
}

/* ------------------------------------------------------------
   BUTTONS + FORMS
   ------------------------------------------------------------ */
function setupButtons() {
    document
        .getElementById("addCustomerBtn")
        ?.addEventListener("click", () => {
            openModal("customerModal", null, "customer");
        });

    document
        .getElementById("addVehicleBtn")
        ?.addEventListener("click", () => {
            openModal("vehicleModal", null, "vehicle");
        });

    document
        .getElementById("addRentalBtn")
        ?.addEventListener("click", () => {
            openModal("rentalModal", null, "rental");
        });

    document
        .getElementById("addPaymentBtn")
        ?.addEventListener("click", () => {
            openModal("paymentModal", null, "payment");
        });

    document
        .getElementById("quickAddCustomer")
        ?.addEventListener("click", () => {
            openModal("customerModal", null, "customer");
        });

    document
        .getElementById("quickAddVehicle")
        ?.addEventListener("click", () => {
            openModal("vehicleModal", null, "vehicle");
        });

    document
        .getElementById("quickCreateRental")
        ?.addEventListener("click", () => {
            openModal("rentalModal", null, "rental");
        });

    document
        .getElementById("quickRecordPayment")
        ?.addEventListener("click", () => {
            openModal("paymentModal", null, "payment");
        });
}

function setupForms() {
    document
        .getElementById("customerForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();
            saveCustomer();
        });

    document
        .getElementById("vehicleForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();
            saveVehicle();
        });

    document
        .getElementById("rentalForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();
            saveRental();
        });

    document
        .getElementById("paymentForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();
            savePayment();
        });

    document
        .getElementById("rentalDate")
        ?.addEventListener("change", event => {
            const end = document.getElementById(
                "expectedReturnDate"
            );

            if (end) {
                end.min =
                    event.target.value || localDateInputValue();
            }
        });
}

function saveCustomer() {
    const form = document.getElementById("customerForm");

    if (!form) return;

    const data = {
        full_name: form.customerName.value.trim(),
        email: form.customerEmail.value.trim(),
        phone: form.customerPhone.value.trim(),
        license_number: form.customerLicense.value.trim(),
        address: form.customerAddress.value.trim()
    };

    if (
        !data.full_name ||
        !data.email ||
        !data.phone ||
        !data.license_number ||
        !data.address
    ) {
        showFormError(
            form,
            "Please complete every customer field.",
            form.querySelector(":invalid")
        );

        return;
    }

    const duplicate = appData.customers.find(
        c =>
            c.id !== editingId &&
            (
                c.email.toLowerCase() ===
                    data.email.toLowerCase() ||
                c.license_number.toLowerCase() ===
                    data.license_number.toLowerCase()
            )
    );

    if (duplicate) {
        showFormError(
            form,
            "Email or license number is already registered.",
            form.customerEmail
        );

        return;
    }

    if (editingId) {
        const index = appData.customers.findIndex(
            c => c.id === editingId
        );

        if (index === -1) {
            return showToast(
                "Customer no longer exists.",
                "error"
            );
        }

        appData.customers[index] = {
            ...appData.customers[index],
            ...data
        };

        showToast(
            "Customer updated successfully",
            "success"
        );
    } else {
        appData.customers.push({
            id: createId(),
            ...data
        });

        showToast(
            "Customer added successfully",
            "success"
        );
    }

    saveData();

    renderCustomersTable();
    renderRentalsTable();
    renderDashboardRentals();
    updateDashboard();

    closeModal("customerModal");
}

function saveVehicle() {
    const form = document.getElementById("vehicleForm");

    if (!form) return;

    const data = {
        license_plate: form.licensePlate.value
            .trim()
            .toUpperCase(),

        model: form.vehicleModel.value.trim(),

        year: Number.parseInt(
            form.vehicleYear.value,
            10
        ),

        type: form.vehicleType.value,

        daily_rate: Number.parseFloat(
            form.dailyRate.value
        ),

        availability_status:
            form.vehicleStatus.value
    };

    if (
        !data.license_plate ||
        !data.model ||
        !Number.isInteger(data.year) ||
        !data.type ||
        !Number.isFinite(data.daily_rate) ||
        data.daily_rate < 0
    ) {
        showFormError(
            form,
            "Please enter valid vehicle details.",
            form.querySelector(":invalid")
        );

        return;
    }

    const duplicate = appData.vehicles.find(
        v =>
            v.id !== editingId &&
            v.license_plate.toLowerCase() ===
                data.license_plate.toLowerCase()
    );

    if (duplicate) {
        showFormError(
            form,
            "That license plate is already registered.",
            form.licensePlate
        );

        return;
    }

    const activeRental = appData.rentals.find(
        r =>
            r.vehicle_id === editingId &&
            r.status === "active"
    );

    if (
        editingId &&
        activeRental &&
        data.availability_status !== "rented"
    ) {
        showFormError(
            form,
            "This vehicle is attached to an active rental, so its status must remain Rented.",
            form.vehicleStatus
        );

        return;
    }

    if (editingId) {
        const index = appData.vehicles.findIndex(
            v => v.id === editingId
        );

        if (index === -1) {
            return showToast(
                "Vehicle no longer exists.",
                "error"
            );
        }

        appData.vehicles[index] = {
            ...appData.vehicles[index],
            ...data
        };

        showToast(
            "Vehicle updated successfully",
            "success"
        );
    } else {
        appData.vehicles.push({
            id: createId(),
            ...data
        });

        showToast(
            "Vehicle added successfully",
            "success"
        );
    }

    syncVehicleStatuses(false);
    saveData();

    renderVehiclesTable();
    renderRentalsTable();
    updateDashboard();

    closeModal("vehicleModal");
}

function saveRental() {
    const form = document.getElementById("rentalForm");

    if (!form) return;

    const data = {
        customer_id: form.rentalCustomer.value,
        vehicle_id: form.rentalVehicle.value,
        rental_date: form.rentalDate.value,
        expected_return_date:
            form.expectedReturnDate.value,
        status: form.rentalStatus.value
    };

    if (!data.customer_id || !data.vehicle_id) {
        showFormError(
            form,
            "Please select both a customer and a vehicle.",
            !data.customer_id
                ? form.rentalCustomer
                : form.rentalVehicle
        );

        return;
    }

    if (
        !data.rental_date ||
        !data.expected_return_date
    ) {
        showFormError(
            form,
            "Both rental dates are required.",
            !data.rental_date
                ? form.rentalDate
                : form.expectedReturnDate
        );

        return;
    }

    if (
        data.expected_return_date <
        data.rental_date
    ) {
        showFormError(
            form,
            "Expected return date cannot be before the rental date.",
            form.expectedReturnDate
        );

        return;
    }

    const customerExists = appData.customers.some(
        c => c.id === data.customer_id
    );

    if (!customerExists) {
        showFormError(
            form,
            "Selected customer no longer exists.",
            form.rentalCustomer
        );

        return;
    }

    const vehicle = appData.vehicles.find(
        v => v.id === data.vehicle_id
    );

    if (!vehicle) {
        showFormError(
            form,
            "Selected vehicle no longer exists.",
            form.rentalVehicle
        );

        return;
    }

    const previousRental = editingId
        ? appData.rentals.find(r => r.id === editingId)
        : null;

    const changingVehicle =
        previousRental &&
        previousRental.vehicle_id !== data.vehicle_id;

    const otherActiveRental = appData.rentals.find(
        r =>
            r.id !== editingId &&
            r.vehicle_id === data.vehicle_id &&
            r.status === "active"
    );

    if (
        data.status === "active" &&
        otherActiveRental
    ) {
        showFormError(
            form,
            "That vehicle is already assigned to another active rental.",
            form.rentalVehicle
        );

        return;
    }

    if (
        data.status === "active" &&
        vehicle.availability_status === "maintenance"
    ) {
        showFormError(
            form,
            "A vehicle under maintenance cannot be rented.",
            form.rentalVehicle
        );

        return;
    }

    if (
        data.status === "active" &&
        !changingVehicle &&
        previousRental?.status === "active"
    ) {
        // Same active rental is allowed.
    } else if (
        data.status === "active" &&
        vehicle.availability_status === "rented" &&
        previousRental?.vehicle_id !== vehicle.id
    ) {
        showFormError(
            form,
            "That vehicle is currently rented.",
            form.rentalVehicle
        );

        return;
    }

    if (editingId) {
        const index = appData.rentals.findIndex(
            r => r.id === editingId
        );

        if (index === -1) {
            return showToast(
                "Rental no longer exists.",
                "error"
            );
        }

        appData.rentals[index] = {
            ...appData.rentals[index],
            ...data
        };

        showToast(
            "Rental updated successfully",
            "success"
        );
    } else {
        appData.rentals.push({
            id: createId(),
            ...data
        });

        showToast(
            "Rental created successfully",
            "success"
        );
    }

    syncVehicleStatuses(false);

    saveData();

    renderAllTables();
    updateDashboard();

    closeModal("rentalModal");
}

function savePayment() {
    const form = document.getElementById("paymentForm");

    if (!form) return;

    const data = {
        rental_id: form.paymentRental.value,

        amount: Number.parseFloat(
            form.paymentAmount.value
        ),

        payment_date: form.paymentDate.value,

        payment_method: form.paymentMethod.value,

        status: form.paymentStatus.value
    };

    if (!data.rental_id) {
        showFormError(
            form,
            "Please select a rental.",
            form.paymentRental
        );

        return;
    }

    if (
        !Number.isFinite(data.amount) ||
        data.amount <= 0
    ) {
        showFormError(
            form,
            "Payment amount must be greater than ₹0.",
            form.paymentAmount
        );

        return;
    }

    if (!data.payment_date) {
        showFormError(
            form,
            "Payment date is required.",
            form.paymentDate
        );

        return;
    }

    if (!data.payment_method) {
        showFormError(
            form,
            "Please select a payment method.",
            form.paymentMethod
        );

        return;
    }

    if (
        !appData.rentals.some(
            r => r.id === data.rental_id
        )
    ) {
        showFormError(
            form,
            "Selected rental no longer exists.",
            form.paymentRental
        );

        return;
    }

    if (editingId) {
        const index = appData.payments.findIndex(
            p => p.id === editingId
        );

        if (index === -1) {
            return showToast(
                "Payment no longer exists.",
                "error"
            );
        }

        appData.payments[index] = {
            ...appData.payments[index],
            ...data
        };

        upsertPaymentTransaction(
            appData.payments[index]
        );

        showToast(
            "Payment updated successfully",
            "success"
        );
    } else {
        const payment = {
            id: createId(),
            ...data
        };

        appData.payments.push(payment);

        appData.transactions.push(
            makePaymentTransaction(payment)
        );

        showToast(
            "Payment recorded successfully",
            "success"
        );
    }

    saveData();

    renderPaymentsTable();
    renderTransactionsTable();
    updateDashboard();

    closeModal("paymentModal");
}
function upsertPaymentTransaction(payment) {
    let transaction = appData.transactions.find(
        t => t.payment_id === payment.id
    );

    if (!transaction) {
        transaction = makePaymentTransaction(payment);
        appData.transactions.push(transaction);
    } else {
        Object.assign(transaction, {
            type: "payment",
            reference: payment.rental_id,
            date: payment.payment_date,
            amount: payment.amount,
            status: payment.status,
            payment_id: payment.id
        });
    }
}

/* ------------------------------------------------------------
   DROPDOWNS
   ------------------------------------------------------------ */
function populateRentalDropdowns(currentVehicleId = null) {
    const customerSelect =
        document.getElementById("rentalCustomer");

    const vehicleSelect =
        document.getElementById("rentalVehicle");

    if (customerSelect) {
        customerSelect.innerHTML =
            '<option value="">Select customer</option>';

        appData.customers.forEach(customer => {
            const option = new Option(
                customer.full_name,
                customer.id
            );

            customerSelect.add(option);
        });
    }

    if (vehicleSelect) {
        vehicleSelect.innerHTML =
            '<option value="">Select vehicle</option>';

        appData.vehicles.forEach(vehicle => {
            const active = appData.rentals.some(
                r =>
                    r.vehicle_id === vehicle.id &&
                    r.status === "active"
            );

            const unavailable =
                vehicle.availability_status === "maintenance" ||
                (
                    active &&
                    vehicle.id !== currentVehicleId
                );

            const label =
                `${vehicle.license_plate} — ${vehicle.model}` +
                (
                    vehicle.availability_status ===
                    "maintenance"
                        ? " · Maintenance"
                        : active &&
                          vehicle.id !== currentVehicleId
                            ? " · Rented"
                            : ""
                );

            const option = new Option(
                label,
                vehicle.id
            );

            option.disabled = unavailable;

            vehicleSelect.add(option);
        });
    }
}

function populatePaymentDropdowns(currentRentalId = null) {
    const rentalSelect =
        document.getElementById("paymentRental");

    if (!rentalSelect) return;

    rentalSelect.innerHTML =
        '<option value="">Select rental</option>';

    appData.rentals.forEach(rental => {
        const customer = appData.customers.find(
            c => c.id === rental.customer_id
        );

        const vehicle = appData.vehicles.find(
            v => v.id === rental.vehicle_id
        );

        const option = new Option(
            `${shortId(rental.id)} — ` +
            `${customer?.full_name || "Unknown"} ` +
            `(${vehicle?.license_plate || "Unknown"})` +
            (
                rental.status !== "active"
                    ? ` · ${capitalize(rental.status)}`
                    : ""
            ),
            rental.id
        );

        rentalSelect.add(option);
    });

    if (currentRentalId) {
        rentalSelect.value = currentRentalId;
    }
}

/* ------------------------------------------------------------
   SEARCH + FILTERS
   ------------------------------------------------------------ */
function setupSearchAndFilters() {
    document
        .getElementById("customerSearch")
        ?.addEventListener(
            "input",
            renderCustomersTable
        );

    document
        .getElementById("vehicleSearch")
        ?.addEventListener(
            "input",
            renderVehiclesTable
        );

    document
        .getElementById("vehicleStatusFilter")
        ?.addEventListener(
            "change",
            renderVehiclesTable
        );

    document
        .getElementById("rentalSearch")
        ?.addEventListener(
            "input",
            renderRentalsTable
        );

    document
        .getElementById("rentalStatusFilter")
        ?.addEventListener(
            "change",
            renderRentalsTable
        );

    document
        .getElementById("paymentSearch")
        ?.addEventListener(
            "input",
            renderPaymentsTable
        );

    document
        .getElementById("paymentStatusFilter")
        ?.addEventListener(
            "change",
            renderPaymentsTable
        );

    document
        .getElementById("transactionSearch")
        ?.addEventListener(
            "input",
            renderTransactionsTable
        );
}

function setupGlobalSearch() {
    const input =
        document.getElementById("globalSearch");

    input?.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;

        const query =
            input.value.trim().toLowerCase();

        if (!query) return;

        const targets = [
            [
                "customers",
                appData.customers.some(c =>
                    `${c.full_name} ${c.email} ${c.phone}`
                        .toLowerCase()
                        .includes(query)
                )
            ],

            [
                "vehicles",
                appData.vehicles.some(v =>
                    `${v.license_plate} ${v.model} ${v.type}`
                        .toLowerCase()
                        .includes(query)
                )
            ],

            [
                "rentals",
                appData.rentals.some(r =>
                    `${r.id} ${r.status}`
                        .toLowerCase()
                        .includes(query)
                )
            ],

            [
                "payments",
                appData.payments.some(p =>
                    `${p.id} ${p.rental_id} ${p.payment_method}`
                        .toLowerCase()
                        .includes(query)
                )
            ]
        ];

        const match = targets.find(
            ([, found]) => found
        );

        if (!match) {
            return showToast(
                "No matching record found.",
                "warning"
            );
        }

        showSection(match[0]);

        const field = document.getElementById(
            `${match[0].slice(0, -1)}Search`
        );

        if (field) {
            field.value = query;
            field.dispatchEvent(
                new Event("input")
            );
        }
    });
}

/* ------------------------------------------------------------
   TABLE RENDERERS
   ------------------------------------------------------------ */
function renderAllTables() {
    renderCustomersTable();
    renderVehiclesTable();
    renderRentalsTable();
    renderPaymentsTable();
    renderTransactionsTable();
    renderDashboardPayments();
}

function renderCustomersTable() {
    const tbody =
        document.querySelector(
            "#customersTable tbody"
        );

    if (!tbody) return;

    const query =
        valueOf("customerSearch").toLowerCase();

    const filtered =
        appData.customers.filter(c =>
            `${c.full_name} ${c.email} ${c.phone} ${c.license_number}`
                .toLowerCase()
                .includes(query)
        );

    if (!filtered.length) {
        setTableEmpty(
            tbody,
            true,
            5,
            "No customers found"
        );

        return;
    }

    tbody.innerHTML = filtered
        .map(c => `
            <tr>
                <td>
                    <div class="table-person">
                        <span class="table-avatar">
                            ${initials(c.full_name)}
                        </span>

                        <div>
                            <strong>
                                ${escapeHTML(c.full_name)}
                            </strong>

                            <small>
                                ${escapeHTML(c.license_number)}
                            </small>
                        </div>
                    </div>
                </td>

                <td>
                    ${escapeHTML(c.email)}
                </td>

                <td>
                    ${escapeHTML(c.phone)}
                </td>

                <td>
                    ${escapeHTML(
                        truncate(c.address, 34)
                    )}
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            class="action-button"
                            onclick="editCustomer('${safeAttr(c.id)}')"
                            title="Edit"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="action-button danger-action"
                            onclick="deleteCustomer('${safeAttr(c.id)}')"
                            title="Delete"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}

function renderVehiclesTable() {
    const tbody =
        document.querySelector(
            "#vehiclesTable tbody"
        );

    if (!tbody) return;

    const query =
        valueOf("vehicleSearch").toLowerCase();

    const status =
        valueOf("vehicleStatusFilter");

    const filtered =
        appData.vehicles.filter(v =>
            `${v.license_plate} ${v.model} ${v.type}`
                .toLowerCase()
                .includes(query) &&
            (!status ||
                v.availability_status === status)
        );

    if (!filtered.length) {
        setTableEmpty(
            tbody,
            true,
            7,
            "No vehicles found"
        );

        return;
    }

    tbody.innerHTML = filtered
        .map(v => `
            <tr>
                <td>
                    <strong class="plate-pill">
                        ${escapeHTML(v.license_plate)}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(v.model)}
                    </strong>
                </td>

                <td>
                    ${v.year || "—"}
                </td>

                <td>
                    ${capitalize(v.type)}
                </td>

                <td>
                    ₹${Number(v.daily_rate)
                        .toLocaleString("en-IN")}
                </td>

                <td>
                    ${statusBadge(
                        v.availability_status
                    )}
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            class="action-button"
                            onclick="editVehicle('${safeAttr(v.id)}')"
                            title="Edit"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="action-button danger-action"
                            onclick="deleteVehicle('${safeAttr(v.id)}')"
                            title="Delete"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}

function renderRentalsTable() {
    const tbody =
        document.querySelector(
            "#rentalsTable tbody"
        );

    if (!tbody) return;

    const query =
        valueOf("rentalSearch").toLowerCase();

    const status =
        valueOf("rentalStatusFilter");

    const filtered =
        appData.rentals.filter(r => {
            const customer =
                appData.customers.find(
                    c => c.id === r.customer_id
                );

            const vehicle =
                appData.vehicles.find(
                    v => v.id === r.vehicle_id
                );

            return (
                `${r.id} ${
                    customer?.full_name || ""
                } ${
                    vehicle?.license_plate || ""
                }`
                    .toLowerCase()
                    .includes(query) &&
                (!status || r.status === status)
            );
        });

    if (!filtered.length) {
        setTableEmpty(
            tbody,
            true,
            7,
            "No rentals found"
        );

        return;
    }

    tbody.innerHTML = filtered
        .map(r => {
            const customer =
                appData.customers.find(
                    c => c.id === r.customer_id
                );

            const vehicle =
                appData.vehicles.find(
                    v => v.id === r.vehicle_id
                );

            return `
                <tr>
                    <td>
                        <strong>
                            #${escapeHTML(
                                shortId(r.id)
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            customer?.full_name ||
                            "Unknown"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            vehicle?.license_plate ||
                            "Unknown"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            r.rental_date
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            r.expected_return_date
                        )}
                    </td>

                    <td>
                        ${statusBadge(r.status)}
                    </td>

                    <td>
                        <div class="action-buttons">
                            <button
                                class="action-button"
                                onclick="editRental('${safeAttr(r.id)}')"
                                title="Edit"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                class="action-button danger-action"
                                onclick="deleteRental('${safeAttr(r.id)}')"
                                title="Delete"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderPaymentsTable() {
    const tbody =
        document.querySelector(
            "#paymentsTable tbody"
        );

    if (!tbody) return;

    const query =
        valueOf("paymentSearch").toLowerCase();

    const status =
        valueOf("paymentStatusFilter");

    const filtered =
        appData.payments.filter(p =>
            `${p.rental_id} ${p.id} ${p.payment_method}`
                .toLowerCase()
                .includes(query) &&
            (!status || p.status === status)
        );

    if (!filtered.length) {
        setTableEmpty(
            tbody,
            true,
            7,
            "No payments found"
        );

        return;
    }

    tbody.innerHTML = filtered
        .map(p => `
            <tr>
                <td>
                    <strong>
                        #${escapeHTML(
                            shortId(p.id)
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        shortId(p.rental_id)
                    )}
                </td>

                <td>
                    <strong>
                        ₹${Number(p.amount)
                            .toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                    </strong>
                </td>

                <td>
                    ${formatPaymentMethod(
                        p.payment_method
                    )}
                </td>

                <td>
                    ${formatDate(
                        p.payment_date
                    )}
                </td>

                <td>
                    ${statusBadge(p.status)}
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            class="action-button"
                            onclick="editPayment('${safeAttr(p.id)}')"
                            title="Edit"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="action-button danger-action"
                            onclick="deletePayment('${safeAttr(p.id)}')"
                            title="Delete"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}

function renderTransactionsTable() {
    const tbody =
        document.querySelector(
            "#transactionsTable tbody"
        );

    if (!tbody) return;

    const query =
        valueOf(
            "transactionSearch"
        ).toLowerCase();

    const filtered =
        appData.transactions.filter(t =>
            `${t.type} ${t.reference} ${t.status}`
                .toLowerCase()
                .includes(query)
        );

    if (!filtered.length) {
        setTableEmpty(
            tbody,
            true,
            6,
            "No transactions found"
        );

        return;
    }

    tbody.innerHTML = filtered
        .map(t => `
            <tr>
                <td>
                    <strong>
                        #${escapeHTML(
                            shortId(t.id)
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        capitalize(t.type)
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        shortId(t.reference)
                    )}
                </td>

                <td>
                    ₹${Number(t.amount)
                        .toLocaleString(
                            "en-IN",
                            {
                                minimumFractionDigits: 2
                            }
                        )}
                </td>

                <td>
                    ${formatDate(t.date)}
                </td>

                <td>
                    ${statusBadge(t.status)}
                </td>
            </tr>
        `)
        .join("");
}

function renderDashboardRentals() {
    const tbody =
        document.querySelector(
            "#dashboardRentalsTable tbody"
        );

    if (!tbody) return;

    const rows =
        [...appData.rentals]
            .sort((a, b) =>
                String(b.rental_date).localeCompare(
                    String(a.rental_date)
                )
            )
            .slice(0, 5);

    if (!rows.length) {
        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="dashboard-empty-row"
                >
                    No rental activity yet.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = rows
        .map(r => {
            const customer =
                appData.customers.find(
                    c => c.id === r.customer_id
                );

            const vehicle =
                appData.vehicles.find(
                    v => v.id === r.vehicle_id
                );

            return `
                <tr>
                    <td>
                        <strong>
                            #${escapeHTML(
                                shortId(r.id)
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            customer?.full_name ||
                            "Unknown"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            vehicle?.model ||
                            "Unknown"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            r.rental_date
                        )}
                        →
                        ${formatDate(
                            r.expected_return_date
                        )}
                    </td>

                    <td>
                        ${statusBadge(r.status)}
                    </td>

                    <td>
                        <div class="action-buttons">
                            <button
                                class="action-button"
                                onclick="editRental('${safeAttr(r.id)}')"
                                title="Edit rental"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderDashboardPayments() {
    const tbody =
        document.querySelector(
            "#dashboardPaymentsTable tbody"
        );

    if (!tbody) return;

    const rows =
        [...appData.payments]
            .sort((a, b) =>
                String(b.payment_date).localeCompare(
                    String(a.payment_date)
                )
            )
            .slice(0, 4);

    if (!rows.length) {
        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="dashboard-empty-row"
                >
                    No payments yet.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = rows
        .map(p => {
            const rental =
                appData.rentals.find(
                    r => r.id === p.rental_id
                );

            const customer =
                rental
                    ? appData.customers.find(
                        c =>
                            c.id ===
                            rental.customer_id
                    )
                    : null;

            return `
                <tr>
                    <td>
                        ${escapeHTML(
                            customer?.full_name ||
                            "Unknown"
                        )}
                    </td>

                    <td>
                        #${escapeHTML(
                            shortId(p.rental_id)
                        )}
                    </td>

                    <td>
                        ₹${Number(p.amount)
                            .toLocaleString(
                                "en-IN"
                            )}
                    </td>

                    <td>
                        ${formatPaymentMethod(
                            p.payment_method
                        )}
                    </td>

                    <td>
                        ${statusBadge(p.status)}
                    </td>
                </tr>
            `;
        })
        .join("");
}

function setTableEmpty(
    tbody,
    isEmpty,
    colspan,
    message
) {
    if (!isEmpty) return;

    tbody.innerHTML = `
        <tr>
            <td
                colspan="${colspan}"
                class="table-empty"
            >
                <div>
                    <i class="fa-regular fa-folder-open"></i>
                    <span>${escapeHTML(message)}</span>
                </div>
            </td>
        </tr>
    `;
}

/* ------------------------------------------------------------
   EDIT ACTIONS
   ------------------------------------------------------------ */
function editCustomer(id) {
    const customer =
        appData.customers.find(
            x => x.id === id
        );

    if (customer) {
        openModal(
            "customerModal",
            customer,
            "customer"
        );
    }
}

function editVehicle(id) {
    const vehicle =
        appData.vehicles.find(
            x => x.id === id
        );

    if (vehicle) {
        openModal(
            "vehicleModal",
            vehicle,
            "vehicle"
        );
    }
}

function editRental(id) {
    const rental =
        appData.rentals.find(
            x => x.id === id
        );

    if (rental) {
        openModal(
            "rentalModal",
            rental,
            "rental"
        );
    }
}

function editPayment(id) {
    const payment =
        appData.payments.find(
            x => x.id === id
        );

    if (payment) {
        openModal(
            "paymentModal",
            payment,
            "payment"
        );
    }
}

/* ------------------------------------------------------------
   DELETE ACTIONS + REFERENTIAL INTEGRITY
   ------------------------------------------------------------ */
function deleteCustomer(id) {
    const referenced =
        appData.rentals.some(
            r => r.customer_id === id
        );

    if (referenced) {
        return showToast(
            "Customer cannot be deleted because a rental references this customer.",
            "warning"
        );
    }

    if (
        !confirm(
            "Delete this customer permanently?"
        )
    ) {
        return;
    }

    appData.customers =
        appData.customers.filter(
            c => c.id !== id
        );

    saveData();

    renderCustomersTable();
    updateDashboard();

    showToast(
        "Customer deleted successfully",
        "success"
    );
}

function deleteVehicle(id) {
    const referenced =
        appData.rentals.some(
            r => r.vehicle_id === id
        );

    if (referenced) {
        return showToast(
            "Vehicle cannot be deleted because a rental references this vehicle.",
            "warning"
        );
    }

    if (
        !confirm(
            "Delete this vehicle permanently?"
        )
    ) {
        return;
    }

    appData.vehicles =
        appData.vehicles.filter(
            v => v.id !== id
        );

    saveData();

    renderVehiclesTable();
    updateDashboard();

    showToast(
        "Vehicle deleted successfully",
        "success"
    );
}

function deleteRental(id) {
    const referenced =
        appData.payments.some(
            p => p.rental_id === id
        );

    if (referenced) {
        return showToast(
            "Rental cannot be deleted because a payment references it. Delete the payment first.",
            "warning"
        );
    }

    if (
        !confirm(
            "Delete this rental permanently?"
        )
    ) {
        return;
    }

    appData.rentals =
        appData.rentals.filter(
            r => r.id !== id
        );

    syncVehicleStatuses(false);

    saveData();

    renderAllTables();
    updateDashboard();

    showToast(
        "Rental deleted successfully",
        "success"
    );
}

function deletePayment(id) {
    const payment =
        appData.payments.find(
            p => p.id === id
        );

    if (!payment) {
        return showToast(
            "Payment no longer exists.",
            "error"
        );
    }

    if (
        !confirm(
            "Delete this payment and its transaction record?"
        )
    ) {
        return;
    }

    // Capture the legacy signature before removing
    // the payment itself.
    const legacyMatches = {
        rental_id: payment.rental_id,
        amount: Number(payment.amount),
        date: payment.payment_date,
        status: payment.status
    };

    appData.payments =
        appData.payments.filter(
            p => p.id !== id
        );

    appData.transactions =
        appData.transactions.filter(t => {
            if (t.payment_id === id) {
                return false;
            }

            const legacy =
                !t.payment_id &&
                t.type === "payment" &&
                t.reference ===
                    legacyMatches.rental_id &&
                Number(t.amount) ===
                    legacyMatches.amount &&
                t.date ===
                    legacyMatches.date &&
                t.status ===
                    legacyMatches.status;

            return !legacy;
        });

    saveData();

    renderPaymentsTable();
    renderTransactionsTable();
    updateDashboard();

    showToast(
        "Payment and linked transaction deleted",
        "success"
    );
}

/* ------------------------------------------------------------
   VEHICLE AVAILABILITY CONSISTENCY
   ------------------------------------------------------------ */
function syncVehicleStatuses(
    showNotice = true
) {
    let changed = false;

    appData.vehicles.forEach(vehicle => {
        const activeRental =
            appData.rentals.some(
                r =>
                    r.vehicle_id === vehicle.id &&
                    r.status === "active"
            );

        const desired =
            activeRental
                ? "rented"
                : (
                    vehicle.availability_status ===
                    "maintenance"
                        ? "maintenance"
                        : "available"
                );

        if (
            vehicle.availability_status !==
            desired
        ) {
            vehicle.availability_status =
                desired;

            changed = true;
        }
    });

    if (changed) {
        saveData();

        if (showNotice) {
            showToast(
                "Fleet availability synchronized with active rentals.",
                "success"
            );
        }
    }
}

/* ------------------------------------------------------------
   DASHBOARD
   ------------------------------------------------------------ */
function updateDashboard() {
    const totalVehicles =
        appData.vehicles.length;

    const totalCustomers =
        appData.customers.length;

    const activeRentals =
        appData.rentals.filter(
            r => r.status === "active"
        ).length;

    const revenue =
        appData.payments
            .filter(p => p.status === "success")
            .reduce(
                (sum, p) =>
                    sum + Number(p.amount || 0),
                0
            );

    const completed =
        appData.rentals.filter(
            r => r.status === "completed"
        ).length;

    const pending =
        appData.payments.filter(
            p => p.status === "pending"
        ).length;

    const overdue =
        appData.rentals.filter(
            r =>
                r.status === "active" &&
                dateOnlyToday() >
                    r.expected_return_date
        ).length;

    const available =
        appData.vehicles.filter(
            v =>
                v.availability_status ===
                "available"
        ).length;

    const rented =
        appData.vehicles.filter(
            v =>
                v.availability_status ===
                "rented"
        ).length;

    const maintenance =
        appData.vehicles.filter(
            v =>
                v.availability_status ===
                "maintenance"
        ).length;

    setText(
        "totalVehicles",
        totalVehicles
    );

    setText(
        "totalCustomers",
        totalCustomers
    );

    setText(
        "activeRentals",
        activeRentals
    );

    setText(
        "totalRevenue",
        `₹${revenue.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0
            }
        )}`
    );

    setText(
        "completedRentals",
        completed
    );

    setText(
        "pendingPayments",
        pending
    );

    setText(
        "overdueRentals",
        overdue
    );

    setText(
        "availableVehicles",
        available
    );

    setText(
        "availabilityTotal",
        totalVehicles
    );

    setText(
        "legendAvailable",
        available
    );

    setText(
        "legendRented",
        rented
    );

    setText(
        "legendMaintenance",
        maintenance
    );

    const donut =
        document.getElementById(
            "availabilityDonut"
        );

    if (donut) {
        const availableDeg =
            totalVehicles
                ? available /
                      totalVehicles *
                      360
                : 0;

        const rentedDeg =
            totalVehicles
                ? rented /
                      totalVehicles *
                      360
                : 0;

        donut.style.setProperty(
            "--available-deg",
            `${availableDeg}deg`
        );

        donut.style.setProperty(
            "--rented-deg",
            `${availableDeg + rentedDeg}deg`
        );
    }

    [
        "sedan",
        "suv",
        "hatchback",
        "van"
    ].forEach(type => {
        const id =
            `type${capitalize(type)}`;

        setText(
            id,
            appData.vehicles.filter(
                v =>
                    String(v.type)
                        .toLowerCase() ===
                    type
            ).length
        );
    });

    renderDashboardRentals();
    renderDashboardPayments();
}

/* ------------------------------------------------------------
   UTILITIES
   ------------------------------------------------------------ */
function valueOf(id) {
    return (
        document.getElementById(id)?.value ||
        ""
    );
}

function setText(id, value) {
    const el =
        document.getElementById(id);

    if (el) {
        el.textContent = value;
    }
}

function shortId(id) {
    return String(id ?? "").slice(
        0,
        8
    );
}

function initials(name) {
    return (
        String(name || "A")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(x => x[0])
            .join("")
            .toUpperCase() ||
        "A"
    );
}

function truncate(value, length) {
    const s = String(value ?? "");

    return s.length > length
        ? `${s.slice(0, length)}…`
        : s;
}

function safeAttr(value) {
    return escapeHTML(value);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function capitalize(value) {
    const s = String(value || "");

    return s
        ? s.charAt(0).toUpperCase() +
              s.slice(1)
        : "";
}

function localDateInputValue(
    date = new Date()
) {
    const y =
        date.getFullYear();

    const m =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function dateOnlyToday() {
    return localDateInputValue();
}

function formatDate(value) {
    if (!value) return "—";

    const [y, m, d] =
        String(value)
            .split("-")
            .map(Number);

    if (!y || !m || !d) {
        return "—";
    }

    return new Date(
        y,
        m - 1,
        d
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatPaymentMethod(
    method
) {
    return escapeHTML(
        {
            cash: "Cash",
            card: "Card",
            upi: "UPI",
            net_banking: "Net Banking"
        }[method] ||
            method ||
            "—"
    );
}

function statusBadge(status) {
    const value =
        String(
            status || "unknown"
        ).toLowerCase();

    const map = {
        available: "success",
        active: "success",
        success: "success",
        completed: "success",
        pending: "warning",
        maintenance: "warning",
        rented: "danger",
        cancelled: "danger",
        failed: "danger",
        overdue: "danger"
    };

    return `
        <span class="badge badge-${
            map[value] || "neutral"
        }">
            ${escapeHTML(
                capitalize(value)
            )}
        </span>
    `;
}

function updateHeaderDate() {
    const el =
        document.getElementById(
            "currentDate"
        );

    if (el) {
        el.textContent =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
    }
}

/* ------------------------------------------------------------
   NOTIFICATIONS + TOASTS
   ------------------------------------------------------------ */
function setupNotifications() {
    document
        .getElementById(
            "notificationButton"
        )
        ?.addEventListener(
            "click",
            () => {
                const overdue =
                    appData.rentals.filter(
                        r =>
                            r.status ===
                                "active" &&
                            dateOnlyToday() >
                                r.expected_return_date
                    ).length;

                const maintenance =
                    appData.vehicles.filter(
                        v =>
                            v.availability_status ===
                            "maintenance"
                    ).length;

                if (
                    !overdue &&
                    !maintenance
                ) {
                    return showToast(
                        "Everything looks good — no new alerts.",
                        "success"
                    );
                }

                const parts = [];

                if (overdue) {
                    parts.push(
                        `${overdue} overdue rental${
                            overdue > 1
                                ? "s"
                                : ""
                        }`
                    );
                }

                if (maintenance) {
                    parts.push(
                        `${maintenance} vehicle${
                            maintenance > 1
                                ? "s"
                                : ""
                        } in maintenance`
                    );
                }

                showToast(
                    parts.join(" · "),
                    "warning"
                );
            }
        );
}

function showToast(
    message,
    type = "success"
) {
    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {
        container =
            document.createElement(
                "div"
            );

        container.id =
            "toastContainer";

        document.body.appendChild(
            container
        );
    }

    const icons = {
        success:
            "fa-circle-check",
        error:
            "fa-circle-xmark",
        warning:
            "fa-triangle-exclamation"
    };

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast toast-${type}`;

    toast.innerHTML = `
        <i class="fa-solid ${
            icons[type] ||
            icons.success
        }"></i>

        <span>
            ${escapeHTML(message)}
        </span>

        <button
            aria-label="Dismiss"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    toast
        .querySelector("button")
        ?.addEventListener(
            "click",
            () => toast.remove()
        );

    container.appendChild(
        toast
    );

    requestAnimationFrame(() => {
        toast.classList.add(
            "show"
        );
    });

    setTimeout(() => {
        toast.classList.remove(
            "show"
        );

        setTimeout(
            () => toast.remove(),
            250
        );
    }, 3600);
}

/* Expose inline-action handlers used by rendered table buttons. */
Object.assign(window, {
    editCustomer,
    deleteCustomer,
    editVehicle,
    deleteVehicle,
    editRental,
    deleteRental,
    editPayment,
    deletePayment
});