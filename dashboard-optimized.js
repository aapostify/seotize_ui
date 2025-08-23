// Dashboard Optimized JavaScript
const API_BASE = 'https://api.seotize.com/v1';
let authToken = localStorage.getItem('authToken') || 'demo-token';

// Global State
let currentData = {
    user: null,
    tasks: [],
    selectedLocations: []
};

let charts = {};
let paginationState = {
    tasks: { page: 1, pageSize: 10, total: 0 },
    images: { page: 1, pageSize: 12, total: 0 }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDashboard();
    initializeTheme();
});

// Event Listeners
function initializeEventListeners() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });
}

// Theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    if (charts.traffic) initializeCharts(currentData.user);
}

function updateThemeIcon(theme) {
    document.getElementById('themeIcon').className = theme === 'light' ? 'ri-moon-line' : 'ri-sun-line';
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
    
    switch(page) {
        case 'dashboard': loadDashboard(); break;
        case 'tasks': loadTasks(); break;
        case 'images': loadImages(); break;
        case 'articles': loadArticles(); break;
        case 'domains': loadDomains(); break;
        case 'billing': loadBilling(); break;
        case 'settings': loadSettings(); break;
    }
}

// API Helper
async function api(endpoint) {
    try {
        // Return mock data for demo
        return { data: getMockData(endpoint) };
    } catch (error) {
        console.error('API Error:', error);
        return { data: getMockData(endpoint) };
    }
}

// Mock Data
function getMockData(endpoint) {
    const mockUser = {
        user: {
            email: "garpozmasters@gmail.com",
            created_at: "2025-01-27 08:02:07",
            hosting: {
                type: "basic",
                expiry_date: "2025-07-19 08:38:11",
                images_uploads: 50,
                article_uploads: 0
            },
            sessions: [
                {country_code: "GB", timestamp: "2025-08-22 19:19:43"},
                {country_code: "US", timestamp: "2025-08-21 15:30:00"},
                {country_code: "DE", timestamp: "2025-08-20 10:15:00"},
                {country_code: "FR", timestamp: "2025-08-19 08:45:00"},
                {country_code: "JP", timestamp: "2025-08-18 22:00:00"}
            ],
            task_statistics: {
                total_keywords: 8,
                total_views: 6,
                total_charge: 846.5,
                available_charge: 1142.2
            },
            tasks: [
                {
                    _id: "679b57aa8bf73064901d189a",
                    url: "https://example2.com",
                    keywords_count: 2,
                    views_count: 0,
                    total_charge: 215.2,
                    available_charge: 215.2,
                    remaining_percentage: 100,
                    task_priority: 0.12,
                    date_created: "2025-08-23 07:19:48"
                },
                {
                    _id: "679b766e9c3cec706e37e14b",
                    url: "https://example3.com",
                    keywords_count: 2,
                    views_count: 6,
                    total_charge: 296.5,
                    available_charge: 592.2,
                    remaining_percentage: 199,
                    task_priority: 0.15,
                    date_created: "2025-08-23 07:19:48"
                }
            ],
            usage_summary: {
                total_tasks: 4,
                active_tasks: 4,
                completed_tasks: 0,
                total_keywords: 8,
                total_views: 6
            }
        }
    };
    
    if (endpoint.includes('/tasks/')) {
        return {
            _id: "679b57aa8bf73064901d189a",
            url: "https://example2.com",
            email: "garpozmasters@gmail.com",
            keywords: ["SEO", "optimization"],
            html_locations: ["/html/body/div[2]/div[1]/div/a[1]"],
            sitekey: "0x4AAAAAAA61oCPMfZtV1n_S",
            task_priority: 0.12,
            total_charge: 215.2,
            available_charge: 215.2,
            date_created: "2025-01-30 10:42:50",
            views_by_date: {
                "2025-01-30": 5,
                "2025-01-31": 12,
                "2025-02-01": 8,
                "2025-02-02": 15,
                "2025-02-03": 20
            }
        };
    }
    
    return mockUser;
}
