// Dashboard Optimized JavaScript
const API_BASE = 'https://api.seotize.net';
let sessionToken = localStorage.getItem('session_token');
let currentUser = null;
let currentTab = 'overview';
let dashboardData = null;
let countryMap = null;
let performanceChart = null;
let selectedKeywords = [];
let selectedXPaths = [];
let currentPage = {
    tasks: 1,
    articles: 1,
    images: 1,
    billing: 1
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!sessionToken) {
        window.location.href = '/login.html';
        return;
    }
    
    initializeEventListeners();
    initializeTheme();
    await loadDashboard();
    initializeMap();
    initializeCharts();
});

// Event Listeners
function initializeEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            if (tab) {
                showTab(tab);
            }
        });
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Sidebar toggle for mobile
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // User menu
    document.querySelector('.user-menu').addEventListener('click', showUserMenu);
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    updateThemeIcon();
}

function toggleTheme() {
    const currentTheme = document.body.dataset.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('#themeToggle i');
    const isDark = document.body.dataset.theme === 'dark';
    icon.className = isDark ? 'ri-moon-line' : 'ri-sun-line';
}

// API Helper
async function api(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Session-Token': sessionToken,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('session_token');
            window.location.href = '/login.html';
            return;
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.error?.message || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message || 'An error occurred', 'error');
        throw error;
    }
}

// Load Dashboard Data
async function loadDashboard() {
    try {
        const response = await api('/users/dashboard?page=1&page_size=10');
        dashboardData = response.data;
        
        if (dashboardData && dashboardData.user) {
            currentUser = dashboardData.user;
            updateUserInfo();
            updateOverviewStats();
            updateRecentTasks();
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Update User Info
function updateUserInfo() {
    if (!currentUser) return;
    
    document.getElementById('userEmail').textContent = currentUser.email;
    const avatar = document.getElementById('userAvatar');
    avatar.textContent = currentUser.email.charAt(0).toUpperCase();
}

// Update Overview Stats
function updateOverviewStats() {
    if (!currentUser) return;
    
    const stats = currentUser.usage_summary || {};
    const taskStats = currentUser.task_statistics || {};
    
    document.getElementById('totalTasks').textContent = stats.total_tasks || 0;
    document.getElementById('activeTasks').textContent = stats.active_tasks || 0;
    document.getElementById('totalViews').textContent = taskStats.total_views || 0;
    document.getElementById('totalKeywords').textContent = taskStats.total_keywords || 0;
    document.getElementById('availableBudget').textContent = (taskStats.available_charge || 0).toFixed(2);
    document.getElementById('totalBudget').textContent = (taskStats.total_charge || 0).toFixed(2);
}

// Update Recent Tasks
function updateRecentTasks() {
    if (!currentUser || !currentUser.tasks) return;
    
    const tbody = document.getElementById('recentTasksTable');
    const tasks = currentUser.tasks.slice(0, 5);
    
    if (tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No tasks found. Create your first SEO task to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tasks.map(task => `
        <tr>
            <td>
                <a href="${task.url}" target="_blank" style="color: var(--primary); text-decoration: none;">
                    ${task.url.replace(/^https?:\/\//, '').substring(0, 30)}...
                </a>
            </td>
            <td>${task.keywords_count || 0}</td>
            <td>
                <span style="padding: 0.25rem 0.5rem; background: var(--primary); color: white; border-radius: 4px; font-size: 0.75rem;">
                    ${(task.task_priority * 100).toFixed(0)}%
                </span>
            </td>
            <td>${task.views_count || 0}</td>
            <td>$${task.available_charge?.toFixed(2) || '0.00'}</td>
            <td>
                <span style="color: ${task.remaining_percentage > 50 ? 'var(--success)' : 'var(--warning)'};">
                    ${task.remaining_percentage || 0}% remaining
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-icon" onclick="viewTaskDetails('${task._id}')">
                    <i class="ri-eye-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Initialize Map for Country Views
function initializeMap() {
    if (!document.getElementById('countryMap')) return;
    
    countryMap = L.map('countryMap').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(countryMap);
    
    // Add country data if available
    if (currentUser && currentUser.tasks) {
        const countryData = {};
        currentUser.tasks.forEach(task => {
            if (task.country_visits) {
                Object.entries(task.country_visits).forEach(([country, visits]) => {
                    countryData[country] = (countryData[country] || 0) + visits;
                });
            }
        });
        
        // Add markers for countries with visits
        Object.entries(countryData).forEach(([country, visits]) => {
            const coords = getCountryCoordinates(country);
            if (coords) {
                L.circleMarker(coords, {
                    radius: Math.min(20, 5 + visits),
                    fillColor: '#6366f1',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7
                }).addTo(countryMap)
                .bindPopup(`<b>${country}</b><br>Views: ${visits}`);
            }
        });
    }
}

// Get country coordinates (simplified)
function getCountryCoordinates(countryCode) {
    const coords = {
        'US': [39.0458, -77.6413],
        'UK': [51.5074, -0.1278],
        'GB': [51.5074, -0.1278],
        'IN': [28.6139, 77.2090],
        'CA': [45.4215, -75.6972],
        'AU': [-33.8688, 151.2093],
        'DE': [52.5200, 13.4050],
        'FR': [48.8566, 2.3522],
        'JP': [35.6762, 139.6503],
        'CN': [39.9042, 116.4074]
    };
    return coords[countryCode];
}

// Initialize Charts
function initializeCharts() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: 'Views',
                data: getViewsData(),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Get last 7 days labels
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
}

// Get views data for chart
function getViewsData() {
    // This would be populated from actual data
    return [12, 19, 15, 25, 22, 30, 28];
}

// Tab Management
function showTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
        currentTab = tabName;
        
        // Update page title
        const titles = {
            'overview': 'Overview',
            'tasks': 'SEO Tasks',
            'hosting': 'Hosting',
            'articles': 'Articles',
            'images': 'Images',
            'domains': 'Domains',
            'analytics': 'Analytics',
            'billing': 'Billing',
            'seo-tools': 'SEO Tools'
        };
        document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';
        
        // Load tab content
        loadTabContent(tabName);
    }
}

// Load Tab Content
async function loadTabContent(tabName) {
    switch(tabName) {
        case 'tasks':
            await loadTasks();
            break;
        case 'hosting':
            await loadHosting();
            break;
        case 'articles':
            await loadArticles();
            break;
        case 'images':
            await loadImages();
            break;
        case 'domains':
            await loadDomains();
            break;
        case 'analytics':
            await loadAnalytics();
            break;
        case 'billing':
            await loadBilling();
            break;
    }
}

// Load SEO Tasks
async function loadTasks(page = 1) {
    const content = document.getElementById('tasksContent');
    content.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await api(`/users/dashboard?page=${page}&page_size=10`);
        const tasks = response.data.user.tasks || [];
        
        if (tasks.length === 0) {
            content.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i class="ri-task-line" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">No SEO Tasks Yet</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Create your first SEO task to start boosting your website's visibility</p>
                    <button class="btn btn-primary" onclick="createNewTask()">
                        <i class="ri-add-line"></i> Create Your First Task
                    </button>
                </div>
            `;
            return;
        }
        
        content.innerHTML = tasks.map(task => `
            <div class="card" style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 0.5rem;">
                            <a href="${task.url}" target="_blank" style="color: var(--text); text-decoration: none;">
                                ${task.url}
                            </a>
                        </h3>
                        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                            <span style="font-size: 0.875rem; color: var(--text-secondary);">
                                <i class="ri-key-line"></i> ${task.keywords_count} keywords
                            </span>
                            <span style="font-size: 0.875rem; color: var(--text-secondary);">
                                <i class="ri-eye-line"></i> ${task.views_count} views
                            </span>
                            <span style="font-size: 0.875rem; color: var(--text-secondary);">
                                <i class="ri-calendar-line"></i> ${new Date(task.date_created).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                            <div>
                                <div class="stat-label">Priority</div>
                                <div class="stat-value" style="font-size: 1.25rem;">${(task.task_priority * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                                <div class="stat-label">Total Budget</div>
                                <div class="stat-value" style="font-size: 1.25rem;">$${task.total_charge.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="stat-label">Available</div>
                                <div class="stat-value" style="font-size: 1.25rem;">$${task.available_charge.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="stat-label">Remaining</div>
                                <div class="stat-value" style="font-size: 1.25rem; color: ${task.remaining_percentage > 50 ? 'var(--success)' : 'var(--warning)'};">
                                    ${task.remaining_percentage}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-secondary" onclick="viewTaskDetails('${task._id}')">
                            <i class="ri-eye-line"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="rechargeTask('${task._id}')">
                            <i class="ri-refresh-line"></i> Recharge
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update pagination
        if (response.pagination) {
            updatePagination('tasks', response.pagination);
        }
    } catch (error) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="ri-error-warning-line" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load tasks. Please try again.</p>
            </div>
        `;
    }
}

// View Task Details
async function viewTaskDetails(taskId) {
    try {
        const response = await api('/get-task-details', {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId })
        });
        
        const task = response.data;
        
        showModal('Task Details', `
            <div class="stats-grid" style="margin-bottom: 1.5rem;">
                <div class="stat-card">
                    <div class="stat-label">URL</div>
                    <div style="font-size: 1rem;">
                        <a href="${task.url}" target="_blank" style="color: var(--primary);">
                            ${task.url}
                        </a>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Created</div>
                    <div style="font-size: 1rem;">${new Date(task.date_created).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 1.5rem;">
                <div class="stat-card">
                    <div class="stat-label">Priority</div>
                    <div class="stat-value">${(task.task_priority * 100).toFixed(0)}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Budget</div>
                    <div class="stat-value">$${task.total_charge.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Available</div>
                    <div class="stat-value">$${task.available_charge.toFixed(2)}</div>
                </div>
            </div>
            
            <h4 style="margin-bottom: 1rem;">Keywords</h4>
            <div class="keyword-grid" style="margin-bottom: 1.5rem;">
                ${task.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
            </div>
            
            ${task.html_locations && task.html_locations.length > 0 ? `
                <h4 style="margin-bottom: 1rem;">Target Locations</h4>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem;">
                    ${task.html_locations.map(loc => `<div style="margin-bottom: 0.5rem; font-family: monospace; font-size: 0.875rem;">${loc}</div>`).join('')}
                </div>
            ` : ''}
            
            ${task.country_visits ? `
                <h4 style="margin-bottom: 1rem;">Views by Country</h4>
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));">
                    ${Object.entries(task.country_visits).map(([country, visits]) => `
                        <div class="stat-card" style="text-align: center;">
                            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌍</div>
                            <div style="font-weight: 600;">${country}</div>
                            <div style="color: var(--text-secondary);">${visits} views</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `);
    } catch (error) {
        showToast('Failed to load task details', 'error');
    }
}

// Create New Task
async function createNewTask() {
    showModal('Create New SEO Task', `
        <form id="newTaskForm">
            <div class="form-group">
                <label class="form-label">Website URL</label>
                <input type="url" class="form-input" id="taskUrl" placeholder="https://example.com" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Keywords (comma separated)</label>
                <input type="text" class="form-input" id="taskKeywords" placeholder="SEO, optimization, marketing">
                <button type="button" class="btn btn-sm" style="margin-top: 0.75rem;" onclick="suggestKeywords()">
                    🤖 AI Suggest Keywords
                </button>
                <div class="keyword-grid" id="keywordSuggestions"></div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Task Priority</label>
                <select class="form-select" id="taskPriority">
                    <option value="standard">Standard - $0.12/click (3 locations)</option>
                    <option value="premium">Premium - $0.15/click (5 locations)</option>
                    <option value="basic">Basic - $0.10/click (1 location)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Total Budget ($)</label>
                <input type="number" class="form-input" id="taskBudget" min="10" step="10" value="100" required>
            </div>
            
            <button type="button" class="btn btn-primary" onclick="selectTargetElements()">
                <i class="ri-focus-3-line"></i> Select Target Elements
            </button>
            
            <div id="selectedXPaths" style="margin-top: 1rem;"></div>
        </form>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitNewTask()">Create Task</button>
    `);
}

// AI Suggest Keywords
async function suggestKeywords() {
    const url = document.getElementById('taskUrl').value;
    if (!url) {
        showToast('Please enter a URL first', 'warning');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line"></i> Analyzing...';
    
    try {
        const response = await fetch(`https://keywords.seotize.net?url=${encodeURIComponent(url)}`, {
            headers: { 'Session-Token': sessionToken }
        });
        const data = await response.json();
        
        const suggestions = document.getElementById('keywordSuggestions');
        if (data.keywords && data.keywords.length > 0) {
            suggestions.innerHTML = data.keywords.slice(0, 10).map(keyword => 
                `<span class="keyword-tag" onclick="toggleKeyword('${keyword}')">${keyword}</span>`
            ).join('');
        } else {
            suggestions.innerHTML = '<p style="color: var(--text-secondary);">No keywords found. Try a different URL.</p>';
        }
    } catch (error) {
        showToast('Failed to analyze keywords', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🤖 AI Suggest Keywords';
    }
}

// Toggle Keyword Selection
function toggleKeyword(keyword) {
    const index = selectedKeywords.indexOf(keyword);
    if (index > -1) {
        selectedKeywords.splice(index, 1);
    } else {
        selectedKeywords.push(keyword);
    }
    
    // Update input
    const input = document.getElementById('taskKeywords');
    const currentKeywords = input.value.split(',').map(k => k.trim()).filter(k => k);
    if (index > -1) {
        const kwIndex = currentKeywords.indexOf(keyword);
        if (kwIndex > -1) currentKeywords.splice(kwIndex, 1);
    } else {
        if (!currentKeywords.includes(keyword)) {
            currentKeywords.push(keyword);
        }
    }
    input.value = currentKeywords.join(', ');
    
    // Update visual
    document.querySelectorAll('.keyword-tag').forEach(tag => {
        if (tag.textContent === keyword) {
            tag.classList.toggle('selected');
        }
    });
}

// Select Target Elements
function selectTargetElements() {
    const url = document.getElementById('taskUrl').value;
    if (!url) {
        showToast('Please enter a URL first', 'warning');
        return;
    }
    
    const priority = document.getElementById('taskPriority').value;
    const maxLocations = priority === 'premium' ? 5 : priority === 'standard' ? 3 : 1;
    
    // Create website preview modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
        <div class="modal-content website-preview-modal">
            <div class="modal-header">
                <h3 class="modal-title">Select Target Elements (${selectedXPaths.length}/${maxLocations})</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Website Preview</label>
                    <div class="website-preview-container">
                        <iframe src="${url}" class="website-iframe" id="previewFrame"></iframe>
                        <div class="xpath-overlay" id="xpathOverlay"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Or Enter XPath Manually</label>
                    <input type="text" class="form-input" id="manualXPath" placeholder="/html/body/div[2]/div[1]/a">
                    <button class="btn btn-sm btn-primary" style="margin-top: 0.5rem;" onclick="addManualXPath()">
                        Add XPath
                    </button>
                </div>
                <div id="currentXPaths">
                    <h4>Selected XPaths:</h4>
                    ${selectedXPaths.map((xpath, i) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                            <code style="font-size: 0.875rem;">${xpath}</code>
                            <button class="btn btn-sm btn-danger" onclick="removeXPath(${i})">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="saveSelectedXPaths(); this.closest('.modal').remove();">
                    Save Selection
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Initialize iframe interaction
    setTimeout(() => {
        initializeXPathSelector();
    }, 2000);
}

// Initialize XPath Selector
function initializeXPathSelector() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe) return;
    
    try {
        // Note: This will only work if the iframe is same-origin
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        iframeDoc.addEventListener('click', (e) => {
            e.preventDefault();
            const xpath = getXPath(e.target);
            addXPath(xpath);
        });
        
        // Add visual overlay for clickable elements
        const links = iframeDoc.querySelectorAll('a, button');
        links.forEach(link => {
            link.style.outline = '2px dashed rgba(99, 102, 241, 0.5)';
        });
    } catch (error) {
        console.log('Cross-origin iframe - manual XPath entry only');
    }
}

// Get XPath of element
function getXPath(element) {
    if (!element) return '';
    
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }
    
    const parts = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = element.previousSibling;
        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }
        const tagName = element.nodeName.toLowerCase();
        const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
        parts.unshift(part);
        element = element.parentNode;
    }
    
    return parts.length ? `/${parts.join('/')}` : '';
}

// Add Manual XPath
function addManualXPath() {
    const input = document.getElementById('manualXPath');
    const xpath = input.value.trim();
    if (xpath) {
        addXPath(xpath);
        input.value = '';
        updateXPathDisplay();
    }
}

// Add XPath
function addXPath(xpath) {
    const priority = document.getElementById('taskPriority').value;
    const maxLocations = priority === 'premium' ? 5 : priority === 'standard' ? 3 : 1;
    
    if (selectedXPaths.length >= maxLocations) {
        showToast(`Maximum ${maxLocations} locations allowed for ${priority} priority`, 'warning');
        return;
    }
    
    if (!selectedXPaths.includes(xpath)) {
        selectedXPaths.push(xpath);
        updateXPathDisplay();
    }
}

// Remove XPath
function removeXPath(index) {
    selectedXPaths.splice(index, 1);
    updateXPathDisplay();
}

// Update XPath Display
function updateXPathDisplay() {
    const container = document.getElementById('currentXPaths');
    if (container) {
        container.innerHTML = `
            <h4>Selected XPaths:</h4>
            ${selectedXPaths.map((xpath, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                    <code style="font-size: 0.875rem;">${xpath}</code>
                    <button class="btn btn-sm btn-danger" onclick="removeXPath(${i})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `).join('')}
        `;
    }
}

// Save Selected XPaths
function saveSelectedXPaths() {
    const display = document.getElementById('selectedXPaths');
    if (display) {
        display.innerHTML = selectedXPaths.length > 0 ? `
            <h4 style="margin-top: 1rem;">Selected Target Elements:</h4>
            ${selectedXPaths.map(xpath => `
                <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                    <code style="font-size: 0.875rem;">${xpath}</code>
                </div>
            `).join('')}
        ` : '';
    }
}

// Submit New Task
async function submitNewTask() {
    const url = document.getElementById('taskUrl').value;
    const keywords = document.getElementById('taskKeywords').value.split(',').map(k => k.trim()).filter(k => k);
    const priority = document.getElementById('taskPriority').value;
    const budget = parseFloat(document.getElementById('taskBudget').value);
    
    if (!url || keywords.length === 0 || !budget) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }
    
    const priorityMap = {
        'basic': 0.10,
        'standard': 0.12,
        'premium': 0.15
    };
    
    try {
        const response = await api('/add-task', {
            method: 'POST',
            body: JSON.stringify({
                task_details: {
                    url: url,
                    keywords: keywords,
                    html_locations: selectedXPaths
                },
                task_priority: priority,
                total_charge: budget,
                provider: 'stripe',
                is_subscription: false,
                cancel_previous: false
            })
        });
        
        if (response.data.payment_url) {
            showToast('Redirecting to payment...', 'info');
            window.location.href = response.data.payment_url;
        } else {
            showToast('Task created successfully!', 'success');
            closeModal();
            loadTasks();
        }
    } catch (error) {
        showToast(error.message || 'Failed to create task', 'error');
    }
}

// Load Hosting
async function loadHosting() {
    const content = document.getElementById('hostingContent');
    content.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await api('/hosting/subscription-status');
        const hosting = response.data;
        
        content.innerHTML = `
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: var(--primary);">
                        <i class="ri-vip-crown-line"></i>
                    </div>
                    <div class="stat-label">Current Plan</div>
                    <div class="stat-value">${hosting.current_plan || 'Free'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                        <i class="ri-calendar-check-line"></i>
                    </div>
                    <div class="stat-label">Expires</div>
                    <div class="stat-value" style="font-size: 1rem;">
                        ${hosting.expiry_date ? new Date(hosting.expiry_date).toLocaleDateString() : 'N/A'}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--accent);">
                        <i class="ri-image-line"></i>
                    </div>
                    <div class="stat-label">Images</div>
                    <div class="stat-value">${hosting.images_remaining || 0}/${hosting.images_limit || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--error);">
                        <i class="ri-article-line"></i>
                    </div>
                    <div class="stat-label">Articles</div>
                    <div class="stat-value">${hosting.articles_remaining || 0}/${hosting.articles_limit || 0}</div>
                </div>
            </div>
            
            ${hosting.is_subscription ? `
                <div class="card" style="margin-bottom: 2rem;">
                    <div class="card-header">
                        <h3 class="card-title">Subscription Details</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <div class="stat-label">Status</div>
                            <span style="padding: 0.25rem 0.75rem; background: var(--success); color: white; border-radius: var(--radius-sm);">
                                ${hosting.subscription_status}
                            </span>
                        </div>
                        <div>
                            <div class="stat-label">Next Billing</div>
                            <div>${new Date(hosting.subscription_period_end).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div class="stat-label">Last Payment</div>
                            <div>$${hosting.billing?.last_payment_amount || '0.00'}</div>
                        </div>
                        <div>
                            <div class="stat-label">Payment Status</div>
                            <div>${hosting.billing?.payment_status || 'N/A'}</div>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <button class="btn btn-danger" onclick="cancelSubscription()">
                            <i class="ri-close-circle-line"></i> Cancel Subscription
                        </button>
                    </div>
                </div>
            ` : ''}
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Available Plans</h3>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="card" style="text-align: center;">
                        <h4>Basic</h4>
                        <div class="stat-value" style="margin: 1rem 0;">$9.99/mo</div>
                        <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
                            <li>✓ 100 Images</li>
                            <li>✓ 50 Articles</li>
                            <li>✓ Basic Support</li>
                        </ul>
                        <button class="btn btn-primary" onclick="purchasePlan('basic')">
                            ${hosting.current_plan === 'basic' ? 'Current Plan' : 'Select Plan'}
                        </button>
                    </div>
                    <div class="card" style="text-align: center;">
                        <h4>Professional</h4>
                        <div class="stat-value" style="margin: 1rem 0;">$29.99/mo</div>
                        <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
                            <li>✓ 500 Images</li>
                            <li>✓ 200 Articles</li>
                            <li>✓ Priority Support</li>
                        </ul>
                        <button class="btn btn-primary" onclick="purchasePlan('professional')">
                            ${hosting.current_plan === 'professional' ? 'Current Plan' : 'Select Plan'}
                        </button>
                    </div>
                    <div class="card" style="text-align: center;">
                        <h4>Enterprise</h4>
                        <div class="stat-value" style="margin: 1rem 0;">$99.99/mo</div>
                        <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
                            <li>✓ Unlimited Images</li>
                            <li>✓ Unlimited Articles</li>
                            <li>✓ 24/7 Support</li>
                        </ul>
                        <button class="btn btn-primary" onclick="purchasePlan('enterprise')">
                            ${hosting.current_plan === 'enterprise' ? 'Current Plan' : 'Select Plan'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="ri-error-warning-line" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load hosting information. Please try again.</p>
            </div>
        `;
    }
}

// Load Articles
async function loadArticles(page = 1) {
    const content = document.getElementById('articlesContent');
    content.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await api(`/dashboard/articles?page=${page}&page_size=10`);
        const articles = response.data.articles || [];
        
        if (articles.length === 0) {
            content.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i class="ri-article-line" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">No Articles Yet</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Create your first article to start publishing content</p>
                    <button class="btn btn-primary" onclick="createArticle()">
                        <i class="ri-add-line"></i> Create Your First Article
                    </button>
                </div>
            `;
            return;
        }
        
        content.innerHTML = articles.map(article => `
            <div class="article-card">
                <div class="article-header">
                    <div>
                        <h3 class="article-title">${article.subject}</h3>
                        <div class="article-meta">
                            <span><i class="ri-link"></i> ${article.url}</span>
                            <span><i class="ri-calendar-line"></i> ${new Date(article.creation_date).toLocaleDateString()}</span>
                            <span><i class="ri-eye-line"></i> ${article.total_views || 0} views</span>
                        </div>
                    </div>
                    <div class="article-actions">
                        <button class="btn btn-sm btn-secondary" onclick="viewArticle('${article.article_id}')">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editArticle('${article.article_id}')">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article.article_id}')">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
                ${article.images && article.images.length > 0 ? `
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; overflow-x: auto;">
                        ${article.images.slice(0, 4).map(img => `
                            <img src="${img}" style="width: 100px; height: 100px; object-fit: cover; border-radius: var(--radius-sm);">
                        `).join('')}
                        ${article.images.length > 4 ? `
                            <div style="width: 100px; height: 100px; background: var(--bg-tertiary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                                +${article.images.length - 4}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        // Update pagination
        if (response.pagination) {
            updatePagination('articles', response.pagination);
        }
    } catch (error) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="ri-error-warning-line" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load articles. Please try again.</p>
            </div>
        `;
    }
}

// Load Images
async function loadImages(page = 1) {
    const content = document.getElementById('imagesContent');
    content.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await api(`/images/dashboard?page=${page}&page_size=50`);
        const images = response.data.images || [];
        const user = response.data.user || {};
        
        content.innerHTML = `
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-label">Uploaded</div>
                    <div class="stat-value">${user.uploaded || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Remaining</div>
                    <div class="stat-value">${user.remaining || 0}</div>
                </div>
            </div>
            
            ${images.length > 0 ? `
                <div class="image-grid">
                    ${images.map(image => `
                        <div class="image-card" onclick="viewImageDetails('${image.image_id}')">
                            <img src="${image.cdn_url}" class="image-preview" alt="${image.original_filename}">
                            <div class="image-info">
                                <div class="image-filename">${image.original_filename}</div>
                                <div class="image-stats">
                                    <div><i class="ri-eye-line"></i> ${image.total_views || 0} views</div>
                                    <div><i class="ri-calendar-line"></i> ${new Date(image.upload_date).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i class="ri-image-line" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">No Images Yet</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Upload your first image to get started</p>
                    <button class="btn btn-primary" onclick="uploadImages()">
                        <i class="ri-upload-2-line"></i> Upload Images
                    </button>
                </div>
            `}
        `;
        
        // Update pagination
        if (response.pagination) {
            updatePagination('images', response.pagination);
        }
    } catch (error) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="ri-error-warning-line" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load images. Please try again.</p>
            </div>
        `;
    }
}

// Load Domains
async function loadDomains() {
    const content = document.getElementById('domainsContent');
    content.innerHTML = '<div class="loader"></div>';
    
    // Since there's no specific domains endpoint, we'll use the dashboard data
    try {
        const domains = JSON.parse(localStorage.getItem('user_domains') || '[]');
        
        content.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Status</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${domains.length > 0 ? domains.map(domain => `
                            <tr>
                                <td>${domain.url}</td>
                                <td>
                                    <span style="padding: 0.25rem 0.75rem; background: ${domain.verified ? 'var(--success)' : 'var(--warning)'}; color: white; border-radius: var(--radius-sm);">
                                        ${domain.verified ? 'Verified' : 'Pending'}
                                    </span>
                                </td>
                                <td>${new Date(domain.added).toLocaleDateString()}</td>
                                <td>
                                    ${!domain.verified ? `
                                        <button class="btn btn-sm btn-primary" onclick="verifyDomain('${domain.url}')">
                                            Verify
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                    No domains added yet
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="ri-error-warning-line" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load domains. Please try again.</p>
            </div>
        `;
    }
}

// Load Analytics
async function loadAnalytics() {
    const content = document.getElementById('analyticsContent');
    content.innerHTML = '<div class="loader"></div>';
    
    // Display analytics based on dashboard data
    if (dashboardData && dashboardData.user) {
        const tasks = dashboardData.user.tasks || [];
        
        // Aggregate data
        const totalViews = tasks.reduce((sum, task) => sum + (task.views_count || 0), 0);
        const totalKeywords = tasks.reduce((sum, task) => sum + (task.keywords_count || 0), 0);
        
        content.innerHTML = `
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-label">Total Views</div>
                    <div class="stat-value">${totalViews}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Keywords</div>
                    <div class="stat-value">${totalKeywords}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Tasks</div>
                    <div class="stat-value">${tasks.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Avg. Views/Task</div>
                    <div class="stat-value">${tasks.length > 0 ? (totalViews / tasks.length).toFixed(1) : 0}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Task Performance</h3>
                </div>
                <canvas id="analyticsChart" height="100"></canvas>
            </div>
        `;
        
        // Create analytics chart
        const ctx = document.getElementById('analyticsChart');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tasks.map(t => t.url.replace(/^https?:\/\//, '').substring(0, 20)),
                datasets: [{
                    label: 'Views',
                    data: tasks.map(t => t.views_count || 0),
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: '#6366f1',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem;">
                <p>No analytics data available</p>
            </div>
        `;
    }
}

// Load Billing
async function loadBilling(page = 1) {
    const content = document.getElementById('billingContent');
    content.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await api(`/dashboard/billings?page=${page}&limit=10&type=all`);
        const billing = response.data;
        
        content.innerHTML = `
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-label">Total Payments</div>
                    <div class="stat-value">
                        ${(billing.tasks?.length || 0) + (billing.hosting?.length || 0)}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Spent</div>
                    <div class="stat-value">
                        $${calculateTotalSpent(billing).toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Payment History</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${[...billing.tasks || [], ...billing.hosting || []].map(item => `
                                <tr>
                                    <td>${new Date(item.dates?.paid || item.dates?.created).toLocaleDateString()}</td>
                                    <td>${item.method}</td>
                                    <td>${getPaymentDescription(item)}</td>
                                    <td>$${item.total_payment.toFixed(2)}</td>
                                    <td>
                                        <span style="padding: 0.25rem 0.75rem; background: ${item.status === 'Paid' ? 'var(--success)' : 'var(--warning)'}; color: white; border-radius: var(--radius-sm);">
                                            ${item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary" onclick="viewPaymentDetails('${item.billing_id}')">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Update pagination
        if (response.pagination) {
            updatePagination('billing', response.pagination);
        }
    } catch (error) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="ri-error-warning-line" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load billing information. Please try again.</p>
            </div>
        `;
    }
}

// Calculate Total Spent
function calculateTotalSpent(billing) {
    let total = 0;
    if (billing.tasks) {
        total += billing.tasks.reduce((sum, task) => sum + task.total_payment, 0);
    }
    if (billing.hosting) {
        total += billing.hosting.reduce((sum, host) => sum + host.total_payment, 0);
    }
    return total;
}

// Get Payment Description
function getPaymentDescription(item) {
    if (item.method === 'create_task') {
        return `SEO Task: ${item.details?.url || 'N/A'}`;
    } else if (item.method === 'buy_package') {
        return `Hosting: ${item.details?.package || 'N/A'} (${item.details?.duration || 'N/A'})`;
    } else if (item.method === 'recharge') {
        return `Task Recharge`;
    }
    return item.method;
}

// SEO Tools Functions
async function analyzeKeywords() {
    const url = document.getElementById('keywordUrl').value;
    if (!url) {
        showToast('Please enter a URL', 'warning');
        return;
    }
    
    const resultsDiv = document.getElementById('keywordResults');
    resultsDiv.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await fetch(`https://keywords.seotize.net?url=${encodeURIComponent(url)}`, {
            headers: { 'Session-Token': sessionToken }
        });
        const data = await response.json();
        
        resultsDiv.innerHTML = `
            <h4 style="margin-top: 1rem;">Keywords Found:</h4>
            <div class="keyword-grid">
                ${data.keywords ? data.keywords.map(keyword => 
                    `<span class="keyword-tag">${keyword}</span>`
                ).join('') : '<p>No keywords found</p>'}
            </div>
            ${data.density ? `
                <h4 style="margin-top: 1rem;">Keyword Density:</h4>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius);">
                    ${Object.entries(data.density).map(([keyword, density]) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${keyword}</span>
                            <span>${density}%</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color: var(--error);">Failed to analyze keywords</p>';
    }
}

async function checkPosition() {
    const keyword = document.getElementById('positionKeyword').value;
    const url = document.getElementById('positionUrl').value;
    
    if (!keyword || !url) {
        showToast('Please enter both keyword and URL', 'warning');
        return;
    }
    
    const resultsDiv = document.getElementById('positionResults');
    resultsDiv.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await fetch(`https://search.seotize.workers.dev/?keyword=${encodeURIComponent(keyword)}&url=${encodeURIComponent(url)}`, {
            headers: { 'Session-Token': sessionToken }
        });
        const data = await response.json();
        
        resultsDiv.innerHTML = `
            <div class="stat-card" style="margin-top: 1rem;">
                <div class="stat-label">Search Position</div>
                <div class="stat-value">#${data.position || 'Not Found'}</div>
                ${data.page ? `<div>Page ${data.page}</div>` : ''}
            </div>
            ${data.competitors && data.competitors.length > 0 ? `
                <h4 style="margin-top: 1rem;">Top Competitors:</h4>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius);">
                    ${data.competitors.slice(0, 5).map(comp => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${comp.url}</span>
                            <span>#${comp.position}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color: var(--error);">Failed to check position</p>';
    }
}

// Update Pagination
function updatePagination(section, pagination) {
    const container = document.getElementById(`${section}Pagination`);
    if (!container) return;
    
    const { current, pages, has_next } = pagination;
    
    container.innerHTML = `
        <button class="pagination-btn" ${current === 1 ? 'disabled' : ''} 
                onclick="loadTabContent('${section}', ${current - 1})">
            <i class="ri-arrow-left-line"></i>
        </button>
        <span class="pagination-info">Page ${current} of ${pages}</span>
        <button class="pagination-btn" ${!has_next ? 'disabled' : ''} 
                onclick="loadTabContent('${section}', ${current + 1})">
            <i class="ri-arrow-right-line"></i>
        </button>
    `;
}

// Modal Functions
function showModal(title, body, footer = '') {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = footer || `
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    `;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    // Also close any website preview modals
    document.querySelectorAll('.modal[style*="z-index: 2000"]').forEach(m => m.remove());
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'ri-check-line',
        error: 'ri-error-warning-line',
        warning: 'ri-alert-line',
        info: 'ri-information-line'
    };
    
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// User Menu
function showUserMenu() {
    showModal('User Account', `
        <div style="text-align: center; padding: 1rem;">
            <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1rem;">
                ${currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h3>${currentUser?.email || 'User'}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                Member since ${currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
            </p>
            <button class="btn btn-danger" onclick="logout()">
                <i class="ri-logout-box-line"></i> Logout
            </button>
        </div>
    `);
}

// Logout
async function logout() {
    try {
        await api('/logout');
    } catch (error) {
        // Continue with logout even if API fails
    }
    
    localStorage.removeItem('session_token');
    window.location.href = '/login.html';
}

// Additional helper functions for specific features

// Recharge Task
async function rechargeTask(taskId) {
    showModal('Recharge Task', `
        <form id="rechargeForm">
            <div class="form-group">
                <label class="form-label">Recharge Amount ($)</label>
                <input type="number" class="form-input" id="rechargeAmount" min="10" step="10" value="50" required>
            </div>
            <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select class="form-select" id="rechargeMethod">
                    <option value="stripe">Credit/Debit Card (Stripe)</option>
                    <option value="oxapay">Cryptocurrency (OxaPay)</option>
                </select>
            </div>
        </form>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitRecharge('${taskId}')">Proceed to Payment</button>
    `);
}

// Submit Recharge
async function submitRecharge(taskId) {
    const amount = document.getElementById('rechargeAmount').value;
    const method = document.getElementById('rechargeMethod').value;
    
    try {
        const response = await api('/recharge', {
            method: 'POST',
            body: JSON.stringify({
                task_ids: [taskId],
                payment_method: method,
                cancel_previous: false
            })
        });
        
        if (response.data.payment_url) {
            showToast('Redirecting to payment...', 'info');
            window.location.href = response.data.payment_url;
        }
    } catch (error) {
        showToast('Failed to initiate recharge', 'error');
    }
}

// Create Article
function createArticle() {
    showModal('Create New Article', `
        <form id="articleForm">
            <div class="form-group">
                <label class="form-label">Article Title</label>
                <input type="text" class="form-input" id="articleTitle" placeholder="Enter article title" required>
            </div>
            <div class="form-group">
                <label class="form-label">URL</label>
                <input type="url" class="form-input" id="articleUrl" placeholder="example.com/blog" required>
            </div>
            <div class="form-group">
                <label class="form-label">Content</label>
                <textarea class="form-textarea" id="articleContent" rows="10" placeholder="Enter article content (HTML supported)" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Images</label>
                <input type="file" id="articleImages" multiple accept="image/*" style="display: none;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('articleImages').click()">
                    <i class="ri-upload-2-line"></i> Select Images
                </button>
                <div id="selectedImages" style="margin-top: 1rem;"></div>
            </div>
        </form>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitArticle()">Create Article</button>
    `);
    
    // Handle image selection
    document.getElementById('articleImages').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const display = document.getElementById('selectedImages');
        display.innerHTML = files.map(file => `
            <div style="display: inline-block; margin: 0.5rem;">
                <img src="${URL.createObjectURL(file)}" style="width: 100px; height: 100px; object-fit: cover; border-radius: var(--radius-sm);">
                <div style="font-size: 0.75rem; text-align: center;">${file.name}</div>
            </div>
        `).join('');
    });
}

// Submit Article
async function submitArticle() {
    const formData = new FormData();
    formData.append('subject', document.getElementById('articleTitle').value);
    formData.append('url', document.getElementById('articleUrl').value);
    formData.append('body', document.getElementById('articleContent').value);
    
    const files = document.getElementById('articleImages').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('image_data', files[i]);
    }
    
    try {
        const response = await fetch(`${API_BASE}/add-article`, {
            method: 'POST',
            headers: {
                'Session-Token': sessionToken
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showToast('Article created successfully!', 'success');
            closeModal();
            loadArticles();
        } else {
            throw new Error(data.error?.message || 'Failed to create article');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// View Article
async function viewArticle(articleId) {
    try {
        const response = await api(`/dashboard/articles?article_id=${articleId}`);
        const article = response.data.article;
        
        showModal(article.subject, `
            <div style="margin-bottom: 1rem;">
                <strong>URL:</strong> <a href="https://${article.url}" target="_blank" style="color: var(--primary);">${article.url}</a><br>
                <strong>Created:</strong> ${new Date(article.creation_date).toLocaleString()}<br>
                <strong>Total Views:</strong> ${article.total_views || 0}
            </div>
            
            ${article.images?.length ? `
                <div style="margin-bottom: 1rem;">
                    <strong>Images:</strong>
                    <div style="display: flex; gap: 0.5rem; overflow-x: auto; margin-top: 0.5rem;">
                        ${article.images.map(img => `
                            <img src="${img}" style="width: 150px; height: 150px; object-fit: cover; border-radius: var(--radius);">
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 1rem;">
                <strong>Content:</strong>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius); margin-top: 0.5rem; max-height: 400px; overflow-y: auto;">
                    ${article.body}
                </div>
            </div>
        `);
    } catch (error) {
        showToast('Failed to load article', 'error');
    }
}

// Edit Article
async function editArticle(articleId) {
    // Implementation similar to createArticle but with pre-filled data
    showToast('Edit functionality coming soon', 'info');
}

// Delete Article
async function deleteArticle(articleId) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        const response = await api(`/delete-article/${articleId}`, {
            method: 'DELETE'
        });
        
        showToast('Article deleted successfully', 'success');
        loadArticles();
    } catch (error) {
        showToast('Failed to delete article', 'error');
    }
}

// Upload Images
function uploadImages() {
    showModal('Upload Images', `
        <form id="uploadForm">
            <div class="form-group">
                <label class="form-label">Select Images (Max 10)</label>
                <input type="file" id="imageFiles" multiple accept="image/*" style="display: none;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('imageFiles').click()">
                    <i class="ri-upload-2-line"></i> Choose Files
                </button>
                <div id="imagePreview" style="margin-top: 1rem;"></div>
            </div>
        </form>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitImages()">Upload</button>
    `);
    
    document.getElementById('imageFiles').addEventListener('change', (e) => {
        const files = Array.from(e.target.files).slice(0, 10);
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem;">
                ${files.map(file => `
                    <div>
                        <img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100px; object-fit: cover; border-radius: var(--radius-sm);">
                        <div style="font-size: 0.75rem; text-align: center; margin-top: 0.25rem;">${file.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    });
}

// Submit Images
async function submitImages() {
    const files = document.getElementById('imageFiles').files;
    if (files.length === 0) {
        showToast('Please select at least one image', 'warning');
        return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }
    
    try {
        const response = await fetch(`${API_BASE}/images/upload`, {
            method: 'POST',
            headers: {
                'Session-Token': sessionToken
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showToast(`${data.data.uploaded_images.length} images uploaded successfully!`, 'success');
            closeModal();
            loadImages();
        } else {
            throw new Error(data.error?.message || 'Failed to upload images');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// View Image Details
function viewImageDetails(imageId) {
    // For now, just show a simple modal with image details
    // In a real implementation, you'd fetch more details from the API
    showToast('Image details view coming soon', 'info');
}

// Add Domain
function addDomain() {
    showModal('Add New Domain', `
        <form id="domainForm">
            <div class="form-group">
                <label class="form-label">Domain URL</label>
                <input type="url" class="form-input" id="domainUrl" placeholder="example.com/blog" required>
            </div>
        </form>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitDomain()">Add Domain</button>
    `);
}

// Submit Domain
async function submitDomain() {
    const url = document.getElementById('domainUrl').value;
    
    try {
        const response = await api('/add-domain', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
        
        if (response.data.txt_record) {
            showModal('Domain Verification Required', `
                <p>Domain added successfully. To verify ownership, please add the following TXT record to your DNS:</p>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius); margin: 1rem 0;">
                    <code>${response.data.txt_record}</code>
                </div>
                <p>After adding the TXT record, click the Verify button to complete verification.</p>
            `, `
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-primary" onclick="verifyDomain('${url}')">Verify Now</button>
            `);
        } else {
            showToast('Domain added and verified successfully!', 'success');
            closeModal();
        }
        
        // Update local storage
        const domains = JSON.parse(localStorage.getItem('user_domains') || '[]');
        domains.push({
            url,
            verified: !response.data.txt_record,
            added: new Date().toISOString()
        });
        localStorage.setItem('user_domains', JSON.stringify(domains));
        
        loadDomains();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Verify Domain
async function verifyDomain(url) {
    try {
        const response = await api('/verify-domain', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
        
        showToast('Domain verified successfully!', 'success');
        
        // Update local storage
        const domains = JSON.parse(localStorage.getItem('user_domains') || '[]');
        const domain = domains.find(d => d.url === url);
        if (domain) {
            domain.verified = true;
            localStorage.setItem('user_domains', JSON.stringify(domains));
        }
        
        closeModal();
        loadDomains();
    } catch (error) {
        showToast(error.message || 'Verification failed. Please ensure the TXT record is added correctly.', 'error');
    }
}

// Purchase Plan
async function purchasePlan(plan) {
    showModal('Purchase Hosting Plan', `
        <form id="planForm">
            <div class="form-group">
                <label class="form-label">Duration</label>
                <select class="form-select" id="planDuration">
                    <option value="3month">3 Months</option>
                    <option value="6month">6 Months</option>
                    <option value="12month">12 Months</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Payment Type</label>
                <select class="form-select" id="planSubscription">
                    <option value="true">Subscription (Auto-renew)</option>
                    <option value="false">One-time Payment</option>
                </select>
            </div>
        </form>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitPlanPurchase('${plan}')">Proceed to Payment</button>
    `);
}

// Submit Plan Purchase
async function submitPlanPurchase(plan) {
    const duration = document.getElementById('planDuration').value;
    const subscription = document.getElementById('planSubscription').value === 'true';
    
    try {
        const response = await api('/hosting/buy-package', {
            method: 'POST',
            body: JSON.stringify({
                package: plan,
                provider: 'stripe',
                duration,
                subscription,
                cancel_previous: false,
                cancel_current_plan: false
            })
        });
        
        if (response.data.payment_url) {
            showToast('Redirecting to payment...', 'info');
            window.location.href = response.data.payment_url;
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Cancel Subscription
async function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.')) {
        return;
    }
    
    try {
        await api('/hosting/cancel-subscription');
        showToast('Subscription cancelled successfully', 'success');
        loadHosting();
    } catch (error) {
        showToast('Failed to cancel subscription', 'error');
    }
}

// View Payment Details
async function viewPaymentDetails(paymentId) {
    try {
        const response = await api(`/get-payment-status?payment_id=${paymentId}`);
        const payment = response.data;
        
        showModal('Payment Details', `
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="stat-card">
                    <div class="stat-label">Invoice Number</div>
                    <div style="font-size: 0.875rem;">${payment.invoice_number}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Amount</div>
                    <div class="stat-value">$${payment.amount.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Status</div>
                    <div>
                        <span style="padding: 0.25rem 0.75rem; background: ${payment.status === 'Paid' ? 'var(--success)' : 'var(--warning)'}; color: white; border-radius: var(--radius-sm);">
                            ${payment.status}
                        </span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Payment Date</div>
                    <div>${new Date(payment.date_of_payment).toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Payment Method</div>
                    <div>${payment.payment_method}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Transaction ID</div>
                    <div style="font-size: 0.75rem; word-break: break-all;">${payment.transaction_id || 'N/A'}</div>
                </div>
            </div>
        `);
    } catch (error) {
        showToast('Failed to load payment details', 'error');
    }
}