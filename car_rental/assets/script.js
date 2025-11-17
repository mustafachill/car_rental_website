/**
 * Opens a modal for adding a new record or editing an existing one.
 * This function is global because it's called directly from onclick attributes in the HTML.
 * @param {string} tableName The name of the database table.
 * @param {number|null} recordId The ID of the record to edit, or null to add a new one.
 */
function openModal(tableName, recordId = null) {
    const modal = document.getElementById('formModal');
    const modalBody = document.getElementById('modalBody');
    let url = `actions/get_form.php?table=${tableName}`;
    if (recordId !== null) {
        url += `&id=${recordId}`;
    }

    modalBody.innerHTML = '<h2>Loading Form...</h2>';
    modal.style.display = 'block';
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            modalBody.innerHTML = html;
        })
        .catch(error => {
            modalBody.innerHTML = `<p class="error-message">Error loading form: ${error.message}</p>`;
            console.error('Fetch error:', error);
        });
}

/**
 * Fetches and displays the rental history for a customer in a modal.
 * This function is global because it's called directly from onclick attributes in the HTML.
 * @param {number} customerId The ID of the customer.
 */
function viewRentalHistory(customerId) {
    const modal = document.getElementById('formModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = '<h2>Loading Rental History...</h2>';
    modal.style.display = 'block';
    fetch(`actions/get_rental_history.php?customer_id=${customerId}`)
        .then(response => response.text())
        .then(data => {
            modalBody.innerHTML = `<h2>Rental History for Customer #${customerId}</h2>${data}`;
        })
        .catch(error => {
            modalBody.innerHTML = `<p class="error-message">Error loading history: ${error}</p>`;
        });
}


// --- Main script execution after the page is loaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- MODAL SETUP ---
    const modal = document.getElementById('formModal');
    const closeBtn = document.querySelector('.close-btn');

    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // --- LIVE SEARCH & TABLE INTERACTIVITY SETUP ---
    const searchInput = document.getElementById('liveSearchInput');
    const tableBody = document.getElementById('tableBodyContent');
    const paginationContainer = document.getElementById('paginationContainer');
    const tableHeaderRow = document.getElementById('tableHeaderRow');
    let debounceTimer;

    const performSearch = (page = 1) => {
        if (!searchInput) return; // Don't run if there's no search input on the page

        const searchTerm = searchInput.value;
        const tableName = searchInput.dataset.table;
        const sortCol = searchInput.dataset.sortCol;
        const sortOrder = searchInput.dataset.sortOrder;
        const url = `actions/live_search.php?table=${tableName}&search=${encodeURIComponent(searchTerm)}&page=${page}&sort=${sortCol}&order=${sortOrder}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    tableBody.innerHTML = `<tr><td colspan="100%">${data.error}</td></tr>`;
                    return;
                }
                tableBody.innerHTML = data.tableBody;
                paginationContainer.innerHTML = data.pagination;
            })
            .catch(error => {
                console.error('Search Error:', error);
                tableBody.innerHTML = `<tr><td colspan="100%">Error loading data.</td></tr>`;
            });
    };

    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                performSearch(1);
            }, 300);
        });
    }
    
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('page-link')) {
                event.preventDefault();
                const page = event.target.dataset.page;
                performSearch(page);
            }
        });
    }
    
    if (tableHeaderRow) {
        tableHeaderRow.addEventListener('click', (event) => {
            let target = event.target.closest('.sort-link');
            if (target) {
                event.preventDefault();
                const sortCol = target.dataset.sortCol;
                const sortOrder = target.dataset.sortOrder;

                searchInput.dataset.sortCol = sortCol;
                searchInput.dataset.sortOrder = sortOrder;
                
                document.querySelectorAll('.sort-link').forEach(link => {
                    const icon = link.querySelector('.sort-icon');
                    if (icon) icon.remove();
                });
                
                const newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
                target.dataset.sortOrder = newOrder;
                target.innerHTML += ` <span class="sort-icon">${sortOrder === 'ASC' ? '▲' : '▼'}</span>`;
                
                performSearch(1);
            }
        });
    }

    // --- THEME TOGGLE SETUP ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- PROFILE PAGE EDIT TOGGLE ---
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const displayProfileDiv = document.getElementById('displayProfile');
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            displayProfileDiv.classList.add('hidden');
            editProfileForm.classList.remove('hidden');
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editProfileForm.classList.add('hidden');
            displayProfileDiv.classList.remove('hidden');
        });
    }
    
    // --- CAR DASHBOARD SCRIPT ---
    const mileageButton = document.getElementById('toggle-mileage');
    const mileageValueSpan = document.getElementById('mileage-value');
    const mileageUnitSpan = document.getElementById('mileage-unit');
    let isMiles = true;

    if (mileageButton) {
        mileageButton.addEventListener('click', () => {
            const currentMileage = parseFloat(mileageValueSpan.textContent);
            if (isMiles) {
                // Convert miles to kilometers (1 mile = 1.60934 km)
                const kilometers = (currentMileage * 1.60934).toFixed(2);
                mileageValueSpan.textContent = kilometers;
                mileageUnitSpan.textContent = 'kilometers';
                mileageButton.textContent = 'Toggle to Miles';
            } else {
                // Convert kilometers to miles
                const miles = (currentMileage / 1.60934).toFixed(2);
                mileageValueSpan.textContent = miles;
                mileageUnitSpan.textContent = 'miles';
                mileageButton.textContent = 'Toggle to Kilometers';
            }
            isMiles = !isMiles;
        });
    }
    
    // --- NEW: Table Row Selection for View Dashboard button ---
    // Use event delegation on the table body, which is a static element
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            // Find the closest row to the clicked element
            let targetRow = event.target.closest('.data-row');
            
            // If a row was found
            if (targetRow) {
                // If the same row is clicked, deselect it
                if (targetRow.classList.contains('selected')) {
                    targetRow.classList.remove('selected');
                } else {
                    // Otherwise, deselect all other rows and select the new one
                    document.querySelectorAll('.data-row').forEach(row => {
                        row.classList.remove('selected');
                    });
                    targetRow.classList.add('selected');
                }
            }
        });
    }

    const viewDashboardBtn = document.getElementById('viewDashboardBtn');
    if(viewDashboardBtn){
        viewDashboardBtn.addEventListener('click', () => {
            const selectedRow = document.querySelector('.data-row.selected');
            if(selectedRow) {
                const carId = selectedRow.dataset.id;
                window.location.href = `car_dashboard.php?id=${carId}`;
            } else {
                alert('Please select a car first.');
            }
        });
    }
    
    // --- NEW: Customer View Details button logic ---
    const viewCustomerDashboardBtn = document.getElementById('viewCustomerDashboardBtn');
    if (viewCustomerDashboardBtn) {
        viewCustomerDashboardBtn.addEventListener('click', () => {
            const selectedRow = document.querySelector('.data-row.selected');
            if (selectedRow) {
                const carId = selectedRow.dataset.id;
                window.location.href = `customer_car_dashboard.php?id=${carId}`;
            } else {
                alert('Please select a car first.');
            }
        });
    }
});


// --- THEME INITIALIZATION (Runs immediately to prevent flash) ---
const body = document.body;
const applyTheme = (theme) => {
    const themeToggle = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.textContent = '🌙';
    } else {
        body.removeAttribute('data-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
    }
};
(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
        return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
})();