/* ============================================================
   VEHICLE RENTAL MANAGEMENT SYSTEM
   Frontend JavaScript
   ============================================================ */

"use strict";

/* ============================================================
   1. APPLICATION DATA
   ============================================================ */

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


/* ============================================================
   2. INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    loadData();

    setupNavigation();
    setupSidebar();
    setupModals();
    setupButtons();
    setupForms();
    setupSearchAndFilters();
    setupNotifications();

    updateDashboard();
    renderAllTables();

    showSection("dashboard");

});


/* ============================================================
   3. LOCAL STORAGE
   ============================================================ */

function loadData() {

    try {

        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {

            const parsed = JSON.parse(savedData);

            appData = {
                customers: Array.isArray(parsed.customers)
                    ? parsed.customers
                    : [],

                vehicles: Array.isArray(parsed.vehicles)
                    ? parsed.vehicles
                    : [],

                rentals: Array.isArray(parsed.rentals)
                    ? parsed.rentals
                    : [],

                payments: Array.isArray(parsed.payments)
                    ? parsed.payments
                    : [],

                transactions: Array.isArray(parsed.transactions)
                    ? parsed.transactions
                    : []
            };

        }

    } catch (error) {

        console.error("Error loading data:", error);

        appData = {
            customers: [],
            vehicles: [],
            rentals: [],
            payments: [],
            transactions: []
        };

    }

}


function saveData() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(appData)
        );

    } catch (error) {

        console.error("Error saving data:", error);

        showToast(
            "Unable to save data in this browser.",
            "error"
        );

    }

}


/* ============================================================
   4. NAVIGATION
   ============================================================ */

function setupNavigation() {

    document.querySelectorAll(".nav-item").forEach(button => {

        button.addEventListener("click", () => {

            const section = button.dataset.section;

            if (section) {
                showSection(section);
            }

        });

    });


    document.querySelectorAll(".text-button").forEach(button => {

        button.addEventListener("click", () => {

            const section = button.dataset.section;

            if (section) {
                showSection(section);
            }

        });

    });


    document
        .querySelector(".btn-primary[data-section='rentals']")
        ?.addEventListener("click", () => {

            showSection("rentals");
            openModal("rentalModal", null, "rental");

        });

}


function showSection(sectionName) {

    document
        .querySelectorAll(".content-section")
        .forEach(section => {

            section.classList.remove("active-section");
            section.classList.remove("active");

        });


    const targetSection =
        document.getElementById(sectionName);

    if (targetSection) {

        targetSection.classList.add("active-section");
        targetSection.classList.add("active");

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.section === sectionName
            ) {
                button.classList.add("active");
            }

        });


    const pageTitle =
        document.getElementById("pageTitle");

    const titles = {

        dashboard: "Dashboard",
        customers: "Customers",
        vehicles: "Vehicles",
        rentals: "Rentals",
        payments: "Payments",
        transactions: "Transactions"

    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] || "Dashboard";

    }


    closeSidebar();

}


/* ============================================================
   5. SIDEBAR
   ============================================================ */

function setupSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const menuToggle =
        document.getElementById("menuToggle");

    const sidebarClose =
        document.getElementById("sidebarClose");


    menuToggle?.addEventListener("click", () => {

        sidebar?.classList.add("open");

    });


    sidebarClose?.addEventListener("click", () => {

        closeSidebar();

    });


    document.addEventListener("click", event => {

        if (
            window.innerWidth <= 800 &&
            sidebar?.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuToggle?.contains(event.target)
        ) {

            closeSidebar();

        }

    });

}


function closeSidebar() {

    document
        .getElementById("sidebar")
        ?.classList.remove("open");

}


/* ============================================================
   6. MODALS
   ============================================================ */

function setupModals() {

    document
        .querySelectorAll(".modal-overlay")
        .forEach(modal => {

            modal.addEventListener("click", event => {

                if (event.target === modal) {

                    closeModal(modal.id);

                }

            });

        });


    document
        .querySelectorAll("[data-close-modal]")
        .forEach(button => {

            button.addEventListener("click", () => {

                closeModal(
                    button.dataset.closeModal
                );

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


function openModal(
    modalId,
    record = null,
    type = null
) {

    const modal =
        document.getElementById(modalId);

    if (!modal) return;


    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");


    if (record && type) {

        editingId = record.id;
        editingType = type;

        updateModalTitle(type, true);

        fillForm(type, record);

        /*
           Important:
           fillForm() already populates the rental
           dropdown with the current vehicle.
        */

    } else {

        editingId = null;
        editingType = null;

        const form =
            modal.querySelector("form");

        if (form) {

            form.reset();
            clearErrors(form);

        }

        setDefaultValues(type);

        updateModalTitle(type, false);

    }

}


function closeModal(modalId) {

    const modal =
        document.getElementById(modalId);

    if (!modal) return;


    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    editingId = null;
    editingType = null;

}


/* ============================================================
   7. BUTTONS
   ============================================================ */

function setupButtons() {

    document
        .getElementById("addCustomerBtn")
        ?.addEventListener("click", () => {

            openModal(
                "customerModal",
                null,
                "customer"
            );

        });


    document
        .getElementById("addVehicleBtn")
        ?.addEventListener("click", () => {

            openModal(
                "vehicleModal",
                null,
                "vehicle"
            );

        });


    document
        .getElementById("newRentalBtn")
        ?.addEventListener("click", () => {

            openModal(
                "rentalModal",
                null,
                "rental"
            );

        });


    document
        .getElementById("addPaymentBtn")
        ?.addEventListener("click", () => {

            openModal(
                "paymentModal",
                null,
                "payment"
            );

        });

}


/* ============================================================
   8. FORM SETUP
   ============================================================ */

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


    /*
       Clear validation errors when user starts
       correcting a field.
    */

    document
        .querySelectorAll(
            "input, textarea, select"
        )
        .forEach(input => {

            input.addEventListener("input", () => {

                input.classList.remove("invalid");

                const error =
                    input.parentElement
                        ?.querySelector(".form-error");

                error?.remove();

            });


            input.addEventListener("change", () => {

                input.classList.remove("invalid");

                const error =
                    input.parentElement
                        ?.querySelector(".form-error");

                error?.remove();

            });

        });


    /* ========================================================
       RENTAL DATE LOGIC
       ======================================================== */

    const rentalForm =
        document.getElementById("rentalForm");

    if (rentalForm) {

        const rentalDate =
            rentalForm.querySelector(
                'input[name="rental_date"]'
            );

        const returnDate =
            rentalForm.querySelector(
                'input[name="expected_return_date"]'
            );


        rentalDate?.addEventListener(
            "change",
            () => {

                if (
                    !rentalDate.value ||
                    !returnDate
                ) {
                    return;
                }


                /*
                   The return date cannot be before
                   the rental date.
                */

                returnDate.min =
                    rentalDate.value;


                /*
                   If the existing return date is
                   invalid, automatically set it
                   to the next day.
                */

                if (
                    !returnDate.value ||
                    returnDate.value <
                    rentalDate.value
                ) {

                    returnDate.value =
                        addDaysToDate(
                            rentalDate.value,
                            1
                        );

                }

            }
        );


        returnDate?.addEventListener(
            "change",
            () => {

                if (
                    rentalDate?.value &&
                    returnDate.value &&
                    returnDate.value <
                    rentalDate.value
                ) {

                    returnDate.value =
                        addDaysToDate(
                            rentalDate.value,
                            1
                        );

                    showToast(
                        "Return date was adjusted to a valid date.",
                        "warning"
                    );

                }

            }
        );

    }

}


/* ============================================================
   9. CUSTOMER
   ============================================================ */

function saveCustomer() {

    const form =
        document.getElementById("customerForm");

    if (!validateForm(form)) return;


    const customer = {

        id:
            editingType === "customer"
                ? editingId
                : generateId(
                    "C",
                    appData.customers
                ),

        name:
            getField(form, "name").value.trim(),

        phone:
            getField(form, "phone").value.trim(),

        email:
            getField(form, "email").value.trim(),

        address:
            getField(form, "address").value.trim(),

        license_number:
            getField(
                form,
                "license_number"
            ).value.trim()

    };


    if (editingType === "customer") {

        const index =
            appData.customers.findIndex(
                item => item.id === editingId
            );


        if (index !== -1) {

            appData.customers[index] =
                customer;

        }


        showToast(
            "Customer updated successfully."
        );

    } else {

        appData.customers.push(customer);

        showToast(
            "Customer added successfully."
        );

    }


    saveData();

    closeModal("customerModal");

    renderAllTables();

    updateDashboard();

}


/* ============================================================
   10. VEHICLE
   ============================================================ */

function saveVehicle() {

    const form =
        document.getElementById("vehicleForm");

    if (!validateForm(form)) return;


    const vehicle = {

        id:
            editingType === "vehicle"
                ? editingId
                : generateId(
                    "V",
                    appData.vehicles
                ),

        vehicle_type:
            getField(
                form,
                "vehicle_type"
            ).value.trim(),

        model:
            getField(
                form,
                "model"
            ).value.trim(),

        rate_per_day:
            Number(
                getField(
                    form,
                    "rate_per_day"
                ).value
            ),

        availability_status:
            getField(
                form,
                "availability_status"
            ).value

    };


    if (editingType === "vehicle") {

        const index =
            appData.vehicles.findIndex(
                item => item.id === editingId
            );


        if (index !== -1) {

            appData.vehicles[index] =
                vehicle;

        }


        showToast(
            "Vehicle updated successfully."
        );

    } else {

        appData.vehicles.push(vehicle);

        showToast(
            "Vehicle added successfully."
        );

    }


    saveData();

    closeModal("vehicleModal");

    renderAllTables();

    updateDashboard();

}


/* ============================================================
   11. RENTAL
   ============================================================ */

function saveRental() {

    const form =
        document.getElementById("rentalForm");

    if (!validateForm(form)) return;


    const customerId =
        getField(
            form,
            "customer_id"
        ).value;


    const vehicleId =
        getField(
            form,
            "vehicle_id"
        ).value;


    const rentalDate =
        getField(
            form,
            "rental_date"
        ).value;


    const expectedReturnDate =
        getField(
            form,
            "expected_return_date"
        ).value;


    const status =
        getField(
            form,
            "status"
        ).value;


    /* ========================================================
       RELATIONSHIP CHECKS
       ======================================================== */

    const customerExists =
        appData.customers.some(
            customer =>
                customer.id === customerId
        );


    if (!customerExists) {

        showToast(
            "Please select a valid customer.",
            "error"
        );

        return;

    }


    const vehicle =
        appData.vehicles.find(
            item =>
                item.id === vehicleId
        );


    if (!vehicle) {

        showToast(
            "Please select a valid vehicle.",
            "error"
        );

        return;

    }


    /*
       Make sure the return date is valid.
    */

    if (
        expectedReturnDate <
        rentalDate
    ) {

        showToast(
            "Return date cannot be before rental date.",
            "error"
        );

        return;

    }


    /*
       When creating a new rental, vehicle must
       actually be available.
    */

    if (
        editingType !== "rental" &&
        vehicle.availability_status !==
            "available"
    ) {

        showToast(
            "This vehicle is not currently available.",
            "error"
        );

        return;

    }


    /*
       When editing, make sure the selected
       vehicle isn't being used by another
       active rental.
    */

    if (
        editingType === "rental"
    ) {

        const conflictingRental =
            appData.rentals.find(
                rental =>
                    rental.id !== editingId &&
                    rental.vehicle_id === vehicleId &&
                    rental.status !== "completed" &&
                    rental.status !== "cancelled"
            );


        if (conflictingRental) {

            showToast(
                "This vehicle is already assigned to another rental.",
                "error"
            );

            return;

        }

    }


    const rental = {

        id:
            editingType === "rental"
                ? editingId
                : generateId(
                    "R",
                    appData.rentals
                ),

        customer_id:
            customerId,

        vehicle_id:
            vehicleId,

        rental_date:
            rentalDate,

        expected_return_date:
            expectedReturnDate,

        actual_return_date:
            editingType === "rental"
                ? getExistingRentalValue(
                    editingId,
                    "actual_return_date"
                )
                : "",

        status:
            status

    };


    /* ========================================================
       SAVE / UPDATE
       ======================================================== */

    if (editingType === "rental") {

        const oldRental =
            appData.rentals.find(
                item =>
                    item.id === editingId
            );


        /*
           If vehicle changed, release the
           previous vehicle.
        */

        if (
            oldRental &&
            oldRental.vehicle_id !==
                vehicleId
        ) {

            updateVehicleStatus(
                oldRental.vehicle_id,
                "available"
            );

        }


        const index =
            appData.rentals.findIndex(
                item =>
                    item.id === editingId
            );


        if (index !== -1) {

            appData.rentals[index] =
                rental;

        }


        updateVehicleStatus(
            vehicleId,
            rental.status === "completed" ||
            rental.status === "cancelled"
                ? "available"
                : "rented"
        );


        showToast(
            "Rental updated successfully."
        );

    } else {

        appData.rentals.push(rental);


        updateVehicleStatus(
            vehicleId,
            rental.status === "completed" ||
            rental.status === "cancelled"
                ? "available"
                : "rented"
        );


        showToast(
            "Rental created successfully."
        );

    }


    saveData();

    closeModal("rentalModal");

    renderAllTables();

    updateDashboard();

}


/* ============================================================
   12. PAYMENT
   ============================================================ */

function savePayment() {

    const form =
        document.getElementById("paymentForm");

    if (!validateForm(form)) return;


    const rentalId =
        getField(
            form,
            "rental_id"
        ).value;


    const rentalExists =
        appData.rentals.some(
            rental =>
                rental.id === rentalId
        );


    if (!rentalExists) {

        showToast(
            "Please select a valid rental.",
            "error"
        );

        return;

    }


    const payment = {

        id:
            editingType === "payment"
                ? editingId
                : generateId(
                    "P",
                    appData.payments
                ),

        rental_id:
            rentalId,

        amount:
            Number(
                getField(
                    form,
                    "amount"
                ).value
            ),

        payment_date:
            getField(
                form,
                "payment_date"
            ).value,

        payment_method:
            getField(
                form,
                "payment_method"
            ).value,

        status:
            getField(
                form,
                "status"
            ).value

    };


    if (editingType === "payment") {

        const index =
            appData.payments.findIndex(
                item =>
                    item.id === editingId
            );


        if (index !== -1) {

            appData.payments[index] =
                payment;

        }


        updateTransactionFromPayment(
            payment
        );


        showToast(
            "Payment updated successfully."
        );

    } else {

        appData.payments.push(payment);

        createTransaction(payment);

        showToast(
            "Payment recorded successfully."
        );

    }


    saveData();

    closeModal("paymentModal");

    renderAllTables();

    updateDashboard();

}


/* ============================================================
   13. TRANSACTIONS
   ============================================================ */

function createTransaction(payment) {

    const transaction = {

        id:
            generateId(
                "T",
                appData.transactions
            ),

        payment_id:
            payment.id,

        transaction_date:
            payment.payment_date,

        amount:
            payment.amount,

        status:
            payment.status

    };


    appData.transactions.push(
        transaction
    );

}


function updateTransactionFromPayment(
    payment
) {

    const transaction =
        appData.transactions.find(
            item =>
                item.payment_id ===
                payment.id
        );


    if (transaction) {

        transaction.transaction_date =
            payment.payment_date;

        transaction.amount =
            payment.amount;

        transaction.status =
            payment.status;

    }

}


/* ============================================================
   14. FORM HELPERS
   ============================================================ */

function fillForm(type, record) {

    if (type === "customer") {

        const form =
            document.getElementById(
                "customerForm"
            );


        getField(form, "name").value =
            record.name || "";

        getField(form, "phone").value =
            record.phone || "";

        getField(form, "email").value =
            record.email || "";

        getField(form, "address").value =
            record.address || "";

        /*
           FIXED:
           Previously the code accidentally assigned
           to form.license_number instead of its value.
        */

        getField(
            form,
            "license_number"
        ).value =
            record.license_number || "";

    }


    if (type === "vehicle") {

        const form =
            document.getElementById(
                "vehicleForm"
            );


        getField(
            form,
            "vehicle_type"
        ).value =
            record.vehicle_type || "";


        getField(
            form,
            "model"
        ).value =
            record.model || "";


        getField(
            form,
            "rate_per_day"
        ).value =
            record.rate_per_day ?? "";


        getField(
            form,
            "availability_status"
        ).value =
            record.availability_status ||
            "available";

    }


    if (type === "rental") {

        const form =
            document.getElementById(
                "rentalForm"
            );


        /*
           Populate first so the current vehicle
           can remain selectable during editing.
        */

        populateRentalCustomers();

        populateRentalVehicles(
            record.vehicle_id
        );


        getField(
            form,
            "customer_id"
        ).value =
            record.customer_id || "";


        getField(
            form,
            "vehicle_id"
        ).value =
            record.vehicle_id || "";


        getField(
            form,
            "rental_date"
        ).value =
            record.rental_date || "";


        getField(
            form,
            "expected_return_date"
        ).value =
            record.expected_return_date || "";


        getField(
            form,
            "status"
        ).value =
            record.status || "active";


        /*
           Keep date picker restrictions correct
           while editing.
        */

        const rentalDate =
            getField(
                form,
                "rental_date"
            );

        const returnDate =
            getField(
                form,
                "expected_return_date"
            );


        if (
            rentalDate &&
            returnDate &&
            rentalDate.value
        ) {

            returnDate.min =
                rentalDate.value;

        }

    }


    if (type === "payment") {

        const form =
            document.getElementById(
                "paymentForm"
            );


        populatePaymentRentals();


        getField(
            form,
            "rental_id"
        ).value =
            record.rental_id || "";


        getField(
            form,
            "amount"
        ).value =
            record.amount ?? "";


        getField(
            form,
            "payment_date"
        ).value =
            record.payment_date || "";


        getField(
            form,
            "payment_method"
        ).value =
            record.payment_method || "";


        getField(
            form,
            "status"
        ).value =
            record.status || "success";

    }

}


function setDefaultValues(type) {

    const today =
        getLocalDateString();


    if (type === "rental") {

        const form =
            document.getElementById(
                "rentalForm"
            );


        const rentalDate =
            getField(
                form,
                "rental_date"
            );


        const returnDate =
            getField(
                form,
                "expected_return_date"
            );


        /*
           Rental date = today
        */

        rentalDate.value =
            today;


        /*
           Expected return = tomorrow
        */

        returnDate.value =
            addDaysToDate(
                today,
                1
            );


        /*
           Browser won't allow selecting a
           return date before rental date.
        */

        returnDate.min =
            today;


        getField(
            form,
            "status"
        ).value =
            "active";


        populateRentalCustomers();

        populateRentalVehicles();

    }


    if (type === "payment") {

        const form =
            document.getElementById(
                "paymentForm"
            );


        getField(
            form,
            "payment_date"
        ).value =
            today;


        getField(
            form,
            "status"
        ).value =
            "success";


        populatePaymentRentals();

    }


    if (type === "vehicle") {

        const form =
            document.getElementById(
                "vehicleForm"
            );


        getField(
            form,
            "availability_status"
        ).value =
            "available";

    }

}


function updateModalTitle(
    type,
    editing
) {

    const titles = {

        customer: [
            "Add Customer",
            "Edit Customer"
        ],

        vehicle: [
            "Add Vehicle",
            "Edit Vehicle"
        ],

        rental: [
            "Create New Rental",
            "Edit Rental"
        ],

        payment: [
            "Record Payment",
            "Edit Payment"
        ]

    };


    const modalIds = {

        customer:
            "customerModalTitle",

        vehicle:
            "vehicleModalTitle",

        rental:
            "rentalModalTitle",

        payment:
            "paymentModalTitle"

    };


    const title =
        document.getElementById(
            modalIds[type]
        );


    if (
        title &&
        titles[type]
    ) {

        title.textContent =
            titles[type][
                editing ? 1 : 0
            ];

    }

}


/* ============================================================
   15. DROPDOWN POPULATION
   ============================================================ */

function populateRentalCustomers() {

    const select =
        document.getElementById(
            "rentalCustomer"
        );


    if (!select) return;


    const currentValue =
        select.value;


    select.innerHTML =
        `<option value="">
            Select customer
        </option>`;


    appData.customers.forEach(
        customer => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                customer.id;


            option.textContent =
                `${customer.name} (${customer.id})`;


            select.appendChild(
                option
            );

        }
    );


    if (currentValue) {

        select.value =
            currentValue;

    }

}


function populateRentalVehicles(
    selectedVehicleId = ""
) {

    const select =
        document.getElementById(
            "rentalVehicle"
        );


    if (!select) return;


    select.innerHTML =
        `<option value="">
            Select available vehicle
        </option>`;


    appData.vehicles.forEach(
        vehicle => {

            const isAvailable =
                vehicle.availability_status ===
                "available";


            const isCurrentVehicle =
                vehicle.id ===
                selectedVehicleId;


            if (
                isAvailable ||
                isCurrentVehicle
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    vehicle.id;


                option.textContent =
                    `${vehicle.model} (${vehicle.id})`;


                select.appendChild(
                    option
                );

            }

        }
    );


    if (selectedVehicleId) {

        select.value =
            selectedVehicleId;

    }

}


function populatePaymentRentals() {

    const select =
        document.getElementById(
            "paymentRental"
        );


    if (!select) return;


    const currentValue =
        select.value;


    select.innerHTML =
        `<option value="">
            Select rental
        </option>`;


    appData.rentals.forEach(
        rental => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                rental.id;


            option.textContent =
                `${rental.id} — ${rental.customer_id}`;


            select.appendChild(
                option
            );

        }
    );


    if (currentValue) {

        select.value =
            currentValue;

    }

}


/* ============================================================
   16. TABLE RENDERING
   ============================================================ */

function renderAllTables() {

    renderCustomers();
    renderVehicles();
    renderRentals();
    renderPayments();
    renderTransactions();

}


/* ============================================================
   CUSTOMERS TABLE
   ============================================================ */

function renderCustomers() {

    const tbody =
        document.getElementById(
            "customersTableBody"
        );


    if (!tbody) return;


    if (
        appData.customers.length === 0
    ) {

        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon">♙</div>
                        <h3>No customers found</h3>
                        <p>
                            Add your first customer
                            to get started.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        appData.customers
            .map(customer => `

                <tr>

                    <td>
                        ${escapeHTML(customer.id)}
                    </td>

                    <td>
                        ${escapeHTML(customer.name)}
                    </td>

                    <td>
                        ${escapeHTML(customer.phone)}
                    </td>

                    <td>
                        ${escapeHTML(customer.email)}
                    </td>

                    <td>
                        ${escapeHTML(customer.address)}
                    </td>

                    <td>
                        ${escapeHTML(
                            customer.license_number
                        )}
                    </td>

                    <td>
                        ${actionButtons(
                            "customer",
                            customer.id
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


/* ============================================================
   VEHICLES TABLE
   ============================================================ */

function renderVehicles() {

    const tbody =
        document.getElementById(
            "vehiclesTableBody"
        );


    if (!tbody) return;


    if (
        appData.vehicles.length === 0
    ) {

        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">▣</div>
                        <h3>No vehicles found</h3>
                        <p>
                            Add a vehicle to your
                            fleet to get started.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        appData.vehicles
            .map(vehicle => `

                <tr>

                    <td>
                        ${escapeHTML(vehicle.id)}
                    </td>

                    <td>
                        ${escapeHTML(
                            vehicle.vehicle_type
                        )}
                    </td>

                    <td>
                        ${escapeHTML(vehicle.model)}
                    </td>

                    <td>
                        ${formatCurrency(
                            vehicle.rate_per_day
                        )}
                    </td>

                    <td>
                        ${statusBadge(
                            vehicle.availability_status
                        )}
                    </td>

                    <td>
                        ${actionButtons(
                            "vehicle",
                            vehicle.id
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


/* ============================================================
   RENTALS TABLE
   ============================================================ */

function renderRentals() {

    const tbody =
        document.getElementById(
            "rentalsTableBody"
        );


    if (!tbody) return;


    if (
        appData.rentals.length === 0
    ) {

        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-icon">▤</div>
                        <h3>No rentals found</h3>
                        <p>
                            Create a rental to
                            see it listed here.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        appData.rentals
            .map(rental => `

                <tr>

                    <td>
                        ${escapeHTML(
                            rental.id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            rental.customer_id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            rental.vehicle_id
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            rental.rental_date
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            rental.expected_return_date
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            rental.actual_return_date
                        )}
                    </td>

                    <td>
                        ${statusBadge(
                            rental.status
                        )}
                    </td>

                    <td>
                        ${actionButtons(
                            "rental",
                            rental.id
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


/* ============================================================
   PAYMENTS TABLE
   ============================================================ */

function renderPayments() {

    const tbody =
        document.getElementById(
            "paymentsTableBody"
        );


    if (!tbody) return;


    if (
        appData.payments.length === 0
    ) {

        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon">₹</div>
                        <h3>No payments found</h3>
                        <p>
                            Recorded payments will
                            appear here.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        appData.payments
            .map(payment => `

                <tr>

                    <td>
                        ${escapeHTML(
                            payment.id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            payment.rental_id
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            payment.amount
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            payment.payment_date
                        )}
                    </td>

                    <td>
                        ${formatPaymentMethod(
                            payment.payment_method
                        )}
                    </td>

                    <td>
                        ${statusBadge(
                            payment.status
                        )}
                    </td>

                    <td>
                        ${actionButtons(
                            "payment",
                            payment.id
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


/* ============================================================
   TRANSACTIONS TABLE
   ============================================================ */

function renderTransactions() {

    const tbody =
        document.getElementById(
            "transactionsTableBody"
        );


    if (!tbody) return;


    if (
        appData.transactions.length === 0
    ) {

        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">⇄</div>
                        <h3>No transactions found</h3>
                        <p>
                            Payment transactions
                            will appear here.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        appData.transactions
            .map(transaction => `

                <tr>

                    <td>
                        ${escapeHTML(
                            transaction.id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            transaction.payment_id
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            transaction.transaction_date
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            transaction.amount
                        )}
                    </td>

                    <td>
                        ${statusBadge(
                            transaction.status
                        )}
                    </td>

                    <td>
                        ${actionButtons(
                            "transaction",
                            transaction.id
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


/* ============================================================
   17. ACTION BUTTONS
   ============================================================ */

function actionButtons(
    type,
    id
) {

    return `
        <div class="action-buttons">

            <button
                type="button"
                class="action-button"
                data-action="edit"
                data-type="${escapeHTML(type)}"
                data-id="${escapeHTML(id)}"
                title="Edit"
            >
                ✎
            </button>

            <button
                type="button"
                class="action-button delete"
                data-action="delete"
                data-type="${escapeHTML(type)}"
                data-id="${escapeHTML(id)}"
                title="Delete"
            >
                ×
            </button>

        </div>
    `;

}


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) return;


        const action =
            button.dataset.action;

        const type =
            button.dataset.type;

        const id =
            button.dataset.id;


        if (action === "edit") {

            editRecord(
                type,
                id
            );

        }


        if (action === "delete") {

            deleteRecord(
                type,
                id
            );

        }

    }
);


/* ============================================================
   18. EDIT
   ============================================================ */

function editRecord(
    type,
    id
) {

    const collection =
        getCollection(type);


    if (!collection) return;


    const record =
        collection.find(
            item =>
                item.id === id
        );


    if (!record) {

        showToast(
            "Record not found.",
            "error"
        );

        return;

    }


    const modalMap = {

        customer:
            "customerModal",

        vehicle:
            "vehicleModal",

        rental:
            "rentalModal",

        payment:
            "paymentModal"

    };


    if (!modalMap[type]) return;


    openModal(
        modalMap[type],
        record,
        type
    );

}


/* ============================================================
   19. DELETE
   ============================================================ */

function deleteRecord(
    type,
    id
) {

    const collection =
        getCollection(type);


    if (!collection) return;


    const record =
        collection.find(
            item =>
                item.id === id
        );


    if (!record) return;


    const labels = {

        customer:
            "customer",

        vehicle:
            "vehicle",

        rental:
            "rental",

        payment:
            "payment",

        transaction:
            "transaction"

    };


    const label =
        labels[type] || "record";


    if (
        !confirm(
            `Are you sure you want to delete this ${label}?`
        )
    ) {

        return;

    }


    /* ========================================================
       CUSTOMER
       ======================================================== */

    if (type === "customer") {

        const hasRental =
            appData.rentals.some(
                rental =>
                    rental.customer_id === id
            );


        if (hasRental) {

            showToast(
                "Cannot delete a customer with rental records.",
                "error"
            );

            return;

        }

    }


    /* ========================================================
       VEHICLE
       ======================================================== */

    if (type === "vehicle") {

        const hasRental =
            appData.rentals.some(
                rental =>
                    rental.vehicle_id === id
            );


        if (hasRental) {

            showToast(
                "Cannot delete a vehicle with rental records.",
                "error"
            );

            return;

        }

    }


    /* ========================================================
       RENTAL
       ======================================================== */

    if (type === "rental") {

        const rental =
            appData.rentals.find(
                item =>
                    item.id === id
            );


        if (rental) {

            updateVehicleStatus(
                rental.vehicle_id,
                "available"
            );

        }

    }


    /* ========================================================
       PAYMENT
       ======================================================== */

    if (type === "payment") {

        /*
           Remove the associated transaction too.
        */

        appData.transactions =
            appData.transactions.filter(
                transaction =>
                    transaction.payment_id !== id
            );

    }


    /* ========================================================
       TRANSACTION
       ======================================================== */

    if (type === "transaction") {

        appData.transactions =
            appData.transactions.filter(
                transaction =>
                    transaction.id !== id
            );

    } else {

        const index =
            collection.findIndex(
                item =>
                    item.id === id
            );


        if (index !== -1) {

            collection.splice(
                index,
                1
            );

        }

    }


    saveData();

    renderAllTables();

    updateDashboard();


    showToast(
        `${capitalize(label)} deleted successfully.`
    );

}


/* ============================================================
   20. SEARCH & FILTER
   ============================================================ */

function setupSearchAndFilters() {

    const searches = [

        [
            "customerSearch",
            "customersTableBody"
        ],

        [
            "vehicleSearch",
            "vehiclesTableBody"
        ],

        [
            "rentalSearch",
            "rentalsTableBody"
        ],

        [
            "transactionSearch",
            "transactionsTableBody"
        ]

    ];


    searches.forEach(
        ([inputId, tableId]) => {

            const input =
                document.getElementById(
                    inputId
                );


            input?.addEventListener(
                "input",
                () => {

                    applyFilters(
                        tableId
                    );

                }
            );

        }
    );


    document
        .getElementById(
            "vehicleStatusFilter"
        )
        ?.addEventListener(
            "change",
            () => {

                applyFilters(
                    "vehiclesTableBody"
                );

            }
        );


    document
        .getElementById(
            "rentalStatusFilter"
        )
        ?.addEventListener(
            "change",
            () => {

                applyFilters(
                    "rentalsTableBody"
                );

            }
        );


    document
        .getElementById(
            "transactionStatusFilter"
        )
        ?.addEventListener(
            "change",
            () => {

                applyFilters(
                    "transactionsTableBody"
                );

            }
        );

}


/*
   Search + status filter work together.
*/

function applyFilters(
    tbodyId
) {

    const tbody =
        document.getElementById(
            tbodyId
        );


    if (!tbody) return;


    const config = {

        customersTableBody: {
            searchId:
                "customerSearch"
        },

        vehiclesTableBody: {
            searchId:
                "vehicleSearch",
            filterId:
                "vehicleStatusFilter"
        },

        rentalsTableBody: {
            searchId:
                "rentalSearch",
            filterId:
                "rentalStatusFilter"
        },

        transactionsTableBody: {
            searchId:
                "transactionSearch",
            filterId:
                "transactionStatusFilter"
        }

    };


    const settings =
        config[tbodyId];


    if (!settings) return;


    const searchInput =
        document.getElementById(
            settings.searchId
        );


    const filterInput =
        settings.filterId
            ? document.getElementById(
                settings.filterId
            )
            : null;


    const searchTerm =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const selectedStatus =
        filterInput
            ? filterInput.value
                .toLowerCase()
            : "all";


    tbody
        .querySelectorAll("tr")
        .forEach(row => {

            if (
                row.classList.contains(
                    "empty-row"
                )
            ) {

                return;

            }


            const text =
                row.textContent
                    .toLowerCase();


            const matchesSearch =
                !searchTerm ||
                text.includes(
                    searchTerm
                );


            const matchesStatus =
                selectedStatus === "all" ||
                text.includes(
                    selectedStatus
                );


            row.style.display =
                matchesSearch &&
                matchesStatus
                    ? ""
                    : "none";

        });

}


function filterTable(
    tbody,
    searchTerm
) {

    if (!tbody) return;

    const input =
        tbody.id === "customersTableBody"
            ? "customerSearch"
            : tbody.id === "vehiclesTableBody"
                ? "vehicleSearch"
                : tbody.id === "rentalsTableBody"
                    ? "rentalSearch"
                    : "transactionSearch";


    const field =
        document.getElementById(
            input
        );


    if (field) {

        field.value =
            searchTerm;

    }


    applyFilters(
        tbody.id
    );

}


function filterStatus(
    tbodyId,
    status
) {

    const filterId = {

        vehiclesTableBody:
            "vehicleStatusFilter",

        rentalsTableBody:
            "rentalStatusFilter",

        transactionsTableBody:
            "transactionStatusFilter"

    }[tbodyId];


    const filter =
        filterId
            ? document.getElementById(
                filterId
            )
            : null;


    if (filter) {

        filter.value =
            status;

    }


    applyFilters(
        tbodyId
    );

}


/* ============================================================
   21. DASHBOARD
   ============================================================ */

function updateDashboard() {

    const statCards =
        document.querySelectorAll(
            ".stats-grid .stat-card"
        );


    if (
        statCards.length >= 4
    ) {

        /* Customers */

        const customersValue =
            statCards[0]
                .querySelector(
                    ".stat-value"
                );


        if (customersValue) {

            customersValue.textContent =
                appData.customers.length;

        }


        /* Vehicles */

        const vehiclesValue =
            statCards[1]
                .querySelector(
                    ".stat-value"
                );


        if (vehiclesValue) {

            vehiclesValue.textContent =
                appData.vehicles.length;

        }


        /* Active rentals */

        const activeRentals =
            appData.rentals.filter(
                rental =>
                    rental.status === "active"
            ).length;


        const rentalsValue =
            statCards[2]
                .querySelector(
                    ".stat-value"
                );


        if (rentalsValue) {

            rentalsValue.textContent =
                activeRentals;

        }


        /* Revenue */

        const revenue =
            appData.payments
                .filter(
                    payment =>
                        payment.status ===
                        "success"
                )
                .reduce(
                    (
                        total,
                        payment
                    ) =>
                        total +
                        Number(
                            payment.amount ||
                            0
                        ),
                    0
                );


        const revenueValue =
            statCards[3]
                .querySelector(
                    ".stat-value"
                );


        if (revenueValue) {

            revenueValue.textContent =
                formatCurrency(
                    revenue
                );

        }

    }


    updateAvailability();

    updatePaymentSummary();

    updateRecentRentals();

}


/* ============================================================
   22. VEHICLE AVAILABILITY
   ============================================================ */

function updateAvailability() {

    const available =
        appData.vehicles.filter(
            vehicle =>
                vehicle.availability_status ===
                "available"
        ).length;


    const rented =
        appData.vehicles.filter(
            vehicle =>
                vehicle.availability_status ===
                "rented"
        ).length;


    const maintenance =
        appData.vehicles.filter(
            vehicle =>
                vehicle.availability_status ===
                "maintenance"
        ).length;


    const values = [

        available,
        rented,
        maintenance

    ];


    const items =
        document.querySelectorAll(
            ".availability-item"
        );


    items.forEach(
        (item, index) => {

            const number =
                item.querySelector(
                    ":scope > strong"
                );


            if (number) {

                number.textContent =
                    values[index] || 0;

            }

        }
    );

}


/* ============================================================
   23. RECENT RENTALS
   ============================================================ */

function updateRecentRentals() {

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) return;


    const tbody =
        dashboard.querySelector(
            ".large-panel tbody"
        );


    if (!tbody) return;


    if (
        appData.rentals.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td>#R-001</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>
                    <span class="badge badge-neutral">
                        No Data
                    </span>
                </td>
            </tr>
        `;

        return;

    }


    const recent =
        [...appData.rentals]
            .sort(
                (a, b) =>
                    compareDates(
                        b.rental_date,
                        a.rental_date
                    )
            )
            .slice(0, 5);


    tbody.innerHTML =
        recent
            .map(rental => `

                <tr>

                    <td>
                        ${escapeHTML(
                            rental.id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            rental.customer_id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            rental.vehicle_id
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            rental.rental_date
                        )}
                    </td>

                    <td>
                        ${statusBadge(
                            rental.status
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


/* ============================================================
   24. PAYMENT SUMMARY
   ============================================================ */

function updatePaymentSummary() {

    const stats =
        document.querySelectorAll(
            "#payments .mini-stat"
        );


    if (
        stats.length < 4
    ) return;


    const total =
        appData.payments.reduce(
            (
                sum,
                payment
            ) =>
                sum +
                Number(
                    payment.amount ||
                    0
                ),
            0
        );


    const successful =
        appData.payments.filter(
            payment =>
                payment.status ===
                "success"
        ).length;


    const pending =
        appData.payments.filter(
            payment =>
                payment.status ===
                "pending"
        ).length;


    const failed =
        appData.payments.filter(
            payment =>
                payment.status ===
                "failed"
        ).length;


    const values = [

        formatCurrency(total),
        successful,
        pending,
        failed

    ];


    stats.forEach(
        (stat, index) => {

            const strong =
                stat.querySelector(
                    "strong"
                );


            if (strong) {

                strong.textContent =
                    values[index];

            }

        }
    );

}


/* ============================================================
   25. VALIDATION
   ============================================================ */

function validateForm(form) {

    if (!form) return false;


    clearErrors(form);


    let valid = true;


    /*
       Required fields
    */

    form
        .querySelectorAll("[required]")
        .forEach(input => {

            if (
                !String(
                    input.value || ""
                ).trim()
            ) {

                showError(
                    input,
                    "This field is required."
                );

                valid = false;

            }

        });


    /*
       Email
    */

    const email =
        form.querySelector(
            'input[type="email"]'
        );


    if (
        email &&
        email.value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                email.value.trim()
            )
    ) {

        showError(
            email,
            "Enter a valid email address."
        );

        valid = false;

    }


    /*
       Phone
    */

    const phone =
        form.querySelector(
            'input[type="tel"]'
        );


    if (
        phone &&
        phone.value &&
        !/^[0-9+\-\s()]{7,15}$/
            .test(
                phone.value.trim()
            )
    ) {

        showError(
            phone,
            "Enter a valid phone number."
        );

        valid = false;

    }


    /*
       Payment amount
    */

    const amount =
        form.querySelector(
            'input[name="amount"]'
        );


    if (
        amount &&
        amount.value &&
        Number(amount.value) <= 0
    ) {

        showError(
            amount,
            "Amount must be greater than zero."
        );

        valid = false;

    }


    /*
       Vehicle rate
    */

    const rate =
        form.querySelector(
            'input[name="rate_per_day"]'
        );


    if (
        rate &&
        rate.value &&
        Number(rate.value) < 0
    ) {

        showError(
            rate,
            "Rate cannot be negative."
        );

        valid = false;

    }


    /*
       Rental dates
    */

    const rentalDate =
        form.querySelector(
            'input[name="rental_date"]'
        );


    const returnDate =
        form.querySelector(
            'input[name="expected_return_date"]'
        );


    if (
        rentalDate &&
        returnDate &&
        rentalDate.value &&
        returnDate.value &&
        returnDate.value <
            rentalDate.value
    ) {

        showError(
            returnDate,
            "Return date cannot be before rental date."
        );

        valid = false;

    }


    return valid;

}


function showError(
    input,
    message
) {

    if (!input) return;


    input.classList.add(
        "invalid"
    );


    /*
       Avoid duplicate errors.
    */

    const existingError =
        input.parentElement
            ?.querySelector(
                ".form-error"
            );


    if (existingError) {

        existingError.textContent =
            message;

        return;

    }


    const error =
        document.createElement(
            "small"
        );


    error.className =
        "form-error";


    error.textContent =
        message;


    input.parentElement
        ?.appendChild(
            error
        );

}


function clearErrors(form) {

    if (!form) return;


    form
        .querySelectorAll(
            ".invalid"
        )
        .forEach(input => {

            input.classList.remove(
                "invalid"
            );

        });


    form
        .querySelectorAll(
            ".form-error"
        )
        .forEach(error => {

            error.remove();

        });

}


/* ============================================================
   26. UTILITY FUNCTIONS
   ============================================================ */


/*
   Safely get a form element by its name.
*/

function getField(
    form,
    name
) {

    if (!form) {

        return {
            value: ""
        };

    }


    return (
        form.elements.namedItem(name) ||
        form.querySelector(
            `[name="${name}"]`
        )
    );

}


/*
   Generate C-001, V-001, R-001, etc.
*/

function generateId(
    prefix,
    collection
) {

    let highest = 0;


    collection.forEach(item => {

        const match =
            String(item.id || "")
                .match(
                    /(\d+)$/
                );


        if (match) {

            highest =
                Math.max(
                    highest,
                    Number(
                        match[1]
                    )
                );

        }

    });


    return `${prefix}-${String(
        highest + 1
    ).padStart(3, "0")}`;

}


/*
   Get the correct data collection.
*/

function getCollection(type) {

    const map = {

        customer:
            appData.customers,

        vehicle:
            appData.vehicles,

        rental:
            appData.rentals,

        payment:
            appData.payments,

        transaction:
            appData.transactions

    };


    return map[type];

}


/*
   Update vehicle status.
*/

function updateVehicleStatus(
    vehicleId,
    status
) {

    const vehicle =
        appData.vehicles.find(
            item =>
                item.id === vehicleId
        );


    if (vehicle) {

        vehicle.availability_status =
            status;

    }

}


/*
   Get existing rental value.
*/

function getExistingRentalValue(
    rentalId,
    field
) {

    const rental =
        appData.rentals.find(
            item =>
                item.id === rentalId
        );


    return rental?.[field] || "";

}


/*
   Get local YYYY-MM-DD.

   IMPORTANT:
   We intentionally don't use
   new Date().toISOString() here because
   ISO conversion uses UTC and can cause
   date shifts for users in India.
*/

function getLocalDateString(
    date = new Date()
) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );

}


/*
   Add days without UTC conversion.
*/

function addDaysToDate(
    dateString,
    days
) {

    if (!dateString) {
        return "";
    }


    const parts =
        dateString.split("-");


    if (parts.length !== 3) {
        return "";
    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    date.setDate(
        date.getDate() + days
    );


    return getLocalDateString(
        date
    );

}


/*
   Compare YYYY-MM-DD dates safely.
*/

function compareDates(
    first,
    second
) {

    if (!first && !second) return 0;

    if (!first) return -1;

    if (!second) return 1;


    return String(first)
        .localeCompare(
            String(second)
        );

}


/*
   Format currency.
*/

function formatCurrency(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );

}


/*
   Format YYYY-MM-DD without timezone
   problems.
*/

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const parts =
        String(value).split("-");


    if (parts.length !== 3) {

        const fallback =
            new Date(value);


        if (
            Number.isNaN(
                fallback.getTime()
            )
        ) {

            return "—";

        }


        return fallback.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/*
   Payment method names.
*/

function formatPaymentMethod(
    method
) {

    const names = {

        cash:
            "Cash",

        card:
            "Card",

        upi:
            "UPI",

        net_banking:
            "Net Banking"

    };


    return escapeHTML(
        names[method] ||
        method ||
        "—"
    );

}


/*
   Status badge.
*/

function statusBadge(
    status
) {

    const value =
        String(
            status ||
            "unknown"
        ).toLowerCase();


    let className =
        "badge-neutral";


    if (
        [
            "available",
            "active",
            "success",
            "completed"
        ].includes(value)
    ) {

        className =
            "badge-success";

    }


    if (
        [
            "pending",
            "maintenance"
        ].includes(value)
    ) {

        className =
            "badge-warning";

    }


    if (
        [
            "rented",
            "cancelled",
            "failed",
            "overdue"
        ].includes(value)
    ) {

        className =
            "badge-danger";

    }


    return `
        <span class="badge ${className}">
            ${escapeHTML(
                capitalize(value)
            )}
        </span>
    `;

}


/*
   Capitalize text.
*/

function capitalize(
    value
) {

    if (!value) return "";


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/*
   Prevent HTML injection.
*/

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


/* ============================================================
   27. NOTIFICATIONS
   ============================================================ */

function setupNotifications() {

    const button =
        document.querySelector(
            ".header-button"
        );


    button?.addEventListener(
        "click",
        () => {

            const overdue =
                appData.rentals.filter(
                    rental =>
                        rental.status ===
                        "overdue"
                ).length;


            const maintenance =
                appData.vehicles.filter(
                    vehicle =>
                        vehicle.availability_status ===
                        "maintenance"
                ).length;


            if (
                !overdue &&
                !maintenance
            ) {

                showToast(
                    "No new notifications."
                );

                return;

            }


            let message = "";


            if (overdue) {

                message +=
                    `${overdue} overdue rental(s). `;

            }


            if (maintenance) {

                message +=
                    `${maintenance} vehicle(s) under maintenance.`;

            }


            showToast(
                message,
                "warning"
            );

        }
    );

}


/* ============================================================
   28. TOAST NOTIFICATIONS
   ============================================================ */

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


        Object.assign(
            container.style,
            {

                position: "fixed",

                top: "90px",

                right: "24px",

                zIndex: "9999",

                display: "flex",

                flexDirection:
                    "column",

                gap: "10px"

            }
        );


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    const backgrounds = {

        success:
            "#ecfdf5",

        error:
            "#fef2f2",

        warning:
            "#fffbeb"

    };


    const textColors = {

        success:
            "#047857",

        error:
            "#b91c1c",

        warning:
            "#b45309"

    };


    Object.assign(
        toast.style,
        {

            background:
                backgrounds[type] ||
                backgrounds.success,

            color:
                textColors[type] ||
                textColors.success,

            padding:
                "13px 18px",

            borderRadius:
                "10px",

            boxShadow:
                "0 10px 30px rgba(15,23,42,.12)",

            fontSize:
                "13px",

            fontWeight:
                "600",

            minWidth:
                "250px",

            maxWidth:
                "360px",

            opacity:
                "0",

            transform:
                "translateY(-10px)",

            transition:
                "all .25s ease"

        }
    );


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.style.opacity =
                "1";

            toast.style.transform =
                "translateY(0)";

        }
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(-10px)";


            setTimeout(
                () => toast.remove(),
                250
            );

        },
        2800
    );

}


/* ============================================================
   END OF SCRIPT
   ============================================================ */