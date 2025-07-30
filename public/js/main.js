// Main JavaScript file for ElderCare Portal

// Session Management with Local Storage
const SessionManager = {
    // Get user session from localStorage
    getUser: function() {
        try {
            const userJson = localStorage.getItem('eldercare_user');
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('Error parsing user session:', error);
            return null;
        }
    },

    // Set user session in localStorage
    setUser: function(user) {
        try {
            localStorage.setItem('eldercare_user', JSON.stringify(user));
            this.updateNavbar();
            this.updateIndexPage();
        } catch (error) {
            console.error('Error saving user session:', error);
        }
    },

    // Clear user session
    clearUser: function() {
        localStorage.removeItem('eldercare_user');
        this.updateNavbar();
        this.updateIndexPage();
    },

    // Check if user is logged in
    isLoggedIn: function() {
        return this.getUser() !== null;
    },

    // Update navbar based on session
    updateNavbar: function() {
        const user = this.getUser();
        const navbar = document.querySelector('.navbar');
        
        if (!navbar) return;

        // Get navigation elements
        const navLinks = navbar.querySelector('.navbar-nav.me-auto');
        const userNav = navbar.querySelector('.navbar-nav:last-child');

        if (user && user.id) {
            // User is logged in - show role-specific navigation
            this.renderUserNavigation(navLinks, user);
            this.renderUserDropdown(userNav, user);
        } else {
            // User is not logged in - show login/register links
            this.renderGuestNavigation(navLinks, userNav);
        }
    },

    // Render navigation for logged-in users
    renderUserNavigation: function(navLinks, user) {
        let navigationHtml = '';

        switch (user.role) {
            case 'elder':
                navigationHtml = `
                    <li class="nav-item">
                        <a class="nav-link" href="/elder/dashboard">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/elder/create-request">Create Request</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/elder/my-requests">My Requests</a>
                    </li>
                `;
                break;
            case 'volunteer':
                navigationHtml = `
                    <li class="nav-item">
                        <a class="nav-link" href="/volunteer/dashboard">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/volunteer/browse-requests">Browse Requests</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/volunteer/my-tasks">My Tasks</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/volunteer/profile">Profile</a>
                    </li>
                `;
                break;
            case 'admin':
                navigationHtml = `
                    <li class="nav-item">
                        <a class="nav-link" href="/admin/dashboard">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/admin/manage-users">Manage Users</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/admin/verify-volunteers">Verify Volunteers</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/admin/manage-requests">Manage Requests</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/admin/analytics">Analytics</a>
                    </li>
                `;
                break;
        }

        if (navLinks) {
            navLinks.innerHTML = navigationHtml;
        }
    },

    // Render user dropdown
    renderUserDropdown: function(userNav, user) {
        const userDropdownHtml = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle"></i>
                    ${user.name}
                </a>
                <ul class="dropdown-menu">
                    <li><span class="dropdown-header">Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button type="button" class="dropdown-item" onclick="SessionManager.logout()">
                            <i class="bi bi-box-arrow-right"></i> Logout
                        </button>
                    </li>
                </ul>
            </li>
        `;

        if (userNav) {
            userNav.innerHTML = userDropdownHtml;
        }
    },

    // Render navigation for guests
    renderGuestNavigation: function(navLinks, userNav) {
        if (navLinks) {
            navLinks.innerHTML = '';
        }

        const guestNavHtml = `
            <li class="nav-item">
                <a class="nav-link" href="/login">Login</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/register">Register</a>
            </li>
        `;

        if (userNav) {
            userNav.innerHTML = guestNavHtml;
        }
    },

    // Update index page based on session
    updateIndexPage: function() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;

        const user = this.getUser();
        const buttonsContainer = heroSection.querySelector('.d-flex.gap-3');

        if (user && user.id) {
            // User is logged in - show dashboard link
            const dashboardUrl = this.getDashboardUrl(user.role);
            buttonsContainer.innerHTML = `
                <a href="${dashboardUrl}" class="btn btn-light btn-lg">Go to Dashboard</a>
                <button type="button" class="btn btn-outline-light btn-lg" onclick="SessionManager.logout()">Logout</button>
            `;
        } else {
            // User is not logged in - show original buttons
            buttonsContainer.innerHTML = `
                <a href="/register" class="btn btn-light btn-lg">Get Started</a>
                <a href="/login" class="btn btn-outline-light btn-lg">Sign In</a>
            `;
        }
    },

    // Get dashboard URL based on role
    getDashboardUrl: function(role) {
        switch (role) {
            case 'elder': return '/elder/dashboard';
            case 'volunteer': return '/volunteer/dashboard';
            case 'admin': return '/admin/dashboard';
            default: return '/';
        }
    },

    // Handle successful login - to be called from login page
    handleLoginSuccess: function(userData) {
        this.setUser(userData);
        // Redirect to appropriate dashboard
        const dashboardUrl = this.getDashboardUrl(userData.role);
        window.location.href = dashboardUrl;
    },

    // Handle logout
    logout: function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear localStorage
            this.clearUser();
            
            // Make server request to clear session
            fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(() => {
                // Redirect to home page
                window.location.href = '/';
            })
            .catch(error => {
                console.error('Logout error:', error);
                // Still redirect even if server request fails
                window.location.href = '/';
            });
        }
    },

    // Sync with server session
    syncWithServer: function() {
        fetch('/api/session-check', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                this.setUser(data.user);
            } else {
                this.clearUser();
            }
        })
        .catch(error => {
            console.error('Session sync error:', error);
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Initialize session management
    SessionManager.syncWithServer();
    SessionManager.updateNavbar();
    SessionManager.updateIndexPage();
});

// Volunteer request acceptance
function acceptRequest(requestId) {
    if (confirm('Are you sure you want to accept this request?')) {
        fetch(`/volunteer/accept-request/${requestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', data.message);
                location.reload();
            } else {
                showAlert('danger', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('danger', 'An error occurred while accepting the request.');
        });
    }
}

// Update task status
function updateTaskStatus(taskId, status) {
    const statusText = status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (confirm(`Are you sure you want to mark this task as ${statusText}?`)) {
        fetch(`/volunteer/task/${taskId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', data.message);
                location.reload();
            } else {
                showAlert('danger', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('danger', 'An error occurred while updating the task status.');
        });
    }
}

// Update volunteer verification status
function updateVerification(volunteerId, isVerified) {
    const action = isVerified ? 'verify' : 'unverify';
    
    if (confirm(`Are you sure you want to ${action} this volunteer?`)) {
        fetch(`/admin/verify-volunteer/${volunteerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isVerified: isVerified })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', data.message);
                location.reload();
            } else {
                showAlert('danger', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('danger', 'An error occurred while updating verification status.');
        });
    }
}

// Show dynamic alerts
function showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container') || createAlertContainer();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// Create alert container if it doesn't exist
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Form validation helpers
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    });
    
    return isValid;
}

// Search and filter functionality
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;
    
    input.addEventListener('keyup', function() {
        const filter = input.value.toLowerCase();
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;
            
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
            
            row.style.display = found ? '' : 'none';
        }
    });
}

// Initialize search functionality on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add search functionality to tables with search inputs
    const searchInputs = document.querySelectorAll('[data-table-search]');
    searchInputs.forEach(input => {
        const tableId = input.getAttribute('data-table-search');
        filterTable(input.id, tableId);
    });
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Loading state management
function setLoadingState(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        element.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    } else {
        element.disabled = false;
        element.innerHTML = element.getAttribute('data-original-text') || 'Submit';
    }
}

// Copy to clipboard functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showAlert('success', 'Copied to clipboard!');
    }, function(err) {
        console.error('Could not copy text: ', err);
        showAlert('danger', 'Failed to copy to clipboard.');
    });
}
