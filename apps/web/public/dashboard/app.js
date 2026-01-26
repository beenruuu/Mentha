/**
 * Mentha Dashboard - Application Logic
 * Connects to Mentha API and renders dashboard data
 */

// Configuration
const API_BASE = '/api/v1';

// State
let currentProjectId = localStorage.getItem('mentha_project_id') || null;
let projects = [];
let chartInstance = null;
let dashboardData = null;
let keywordsData = null;
let citationsData = null;

// ============================================
// API Functions
// ============================================

async function fetchProjects() {
    try {
        const response = await fetch(`${API_BASE}/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        const { data } = await response.json();
        return data || [];
    } catch (error) {
        console.error('Projects fetch error:', error);
        return [];
    }
}

async function fetchDashboardData(projectId, days = 30) {
    try {
        const response = await fetch(`${API_BASE}/dashboard/share-of-model?project_id=${projectId}&days=${days}`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        return null;
    }
}

async function fetchKeywords(projectId) {
    try {
        const response = await fetch(`${API_BASE}/dashboard/keywords?project_id=${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch keywords');
        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error('Keywords fetch error:', error);
        return [];
    }
}

async function fetchCitations(projectId, limit = 20) {
    try {
        const response = await fetch(`${API_BASE}/dashboard/citations?project_id=${projectId}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch citations');
        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error('Citations fetch error:', error);
        return [];
    }
}

// ============================================
// Project Dropdown
// ============================================

function initProjectDropdown() {
    const dropdown = document.querySelector('.project-dropdown');
    const selector = document.getElementById('projectSelector');
    const menu = document.getElementById('projectMenu');
    const projectList = document.getElementById('projectList');
    const addBrandBtn = document.getElementById('addBrandBtn');

    if (!selector || !menu) return;

    // Toggle dropdown
    selector.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });

    // Add brand button
    if (addBrandBtn) {
        addBrandBtn.addEventListener('click', () => {
            alert('To add a new brand, use the CLI: npm run cli');
            dropdown.classList.remove('open');
        });
    }
}

function renderProjectList() {
    const projectList = document.getElementById('projectList');
    const projectName = document.getElementById('projectName');

    if (!projectList) return;

    if (projects.length === 0) {
        projectList.innerHTML = `
            <div class="dropdown-item" style="color: var(--text-muted); cursor: default;">
                No projects found
            </div>
        `;
        projectName.textContent = 'Select Project';
        return;
    }

    projectList.innerHTML = projects.map(p => `
        <button class="dropdown-item ${p.id === currentProjectId ? 'active' : ''}" data-id="${p.id}">
            <span>${escapeHtml(p.name)}</span>
            <span style="color: var(--text-muted); font-size: 12px;">${escapeHtml(p.domain || '')}</span>
        </button>
    `).join('');

    // Set current project name and favicon
    const current = projects.find(p => p.id === currentProjectId);
    if (current) {
        projectName.textContent = current.name;
        updateFavicon(current.domain);
    } else if (projects.length > 0) {
        // Auto-select first project
        selectProject(projects[0].id);
    } else {
        projectName.textContent = 'Select Project';
    }

    // Add click handlers
    projectList.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            if (id) selectProject(id);
            document.querySelector('.project-dropdown').classList.remove('open');
        });
    });
}

function updateFavicon(domain) {
    const favicon = document.getElementById('brandFavicon');
    if (!favicon) return;

    if (domain) {
        // Extract hostname if it's a full URL
        let hostname = domain;
        try {
            if (domain.startsWith('http')) {
                hostname = new URL(domain).hostname;
            }
        } catch (e) {
            console.warn('Invalid domain for favicon:', domain);
        }

        favicon.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        favicon.style.display = 'block';
        favicon.onerror = () => { favicon.style.display = 'none'; };
    } else {
        favicon.style.display = 'none';
    }
}

async function selectProject(projectId) {
    currentProjectId = projectId;
    localStorage.setItem('mentha_project_id', projectId);

    // Update UI
    const current = projects.find(p => p.id === projectId);
    if (current) {
        document.getElementById('projectName').textContent = current.name;
        updateFavicon(current.domain);
    }

    // Update active state in dropdown
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === projectId);
    });

    // Reload dashboard data
    await loadDashboard();
}

// ============================================
// Dashboard Data Loading
// ============================================

async function loadDashboard() {
    if (!currentProjectId) {
        showEmptyState();
        return;
    }

    // Show loading state
    document.getElementById('totalScans').textContent = '...';
    document.getElementById('visibleCount').textContent = '...';
    document.getElementById('absentRate').textContent = '...';
    document.getElementById('avgSentiment').textContent = '...';

    // Fetch data
    dashboardData = await fetchDashboardData(currentProjectId);
    keywordsData = await fetchKeywords(currentProjectId);
    citationsData = null; // Reset, will load on demand

    if (dashboardData) {
        updateMetrics(dashboardData);
        renderChart(dashboardData.timeline || []);
        renderMiniBars(dashboardData.timeline || []);
    } else {
        showEmptyState();
    }

    renderKeywordsTable(keywordsData);
}

function showEmptyState() {
    document.getElementById('totalScans').textContent = '0';
    document.getElementById('visibleCount').textContent = '0';
    document.getElementById('absentRate').textContent = '0%';
    document.getElementById('avgSentiment').textContent = '--';
    updateVisibilityScore(0);

    const container = document.getElementById('tableContent');
    if (container) {
        container.innerHTML = `
            <div class="table-row">
                <span class="table-keyword" style="color: var(--text-muted)">No data available</span>
                <span class="table-value">--</span>
            </div>
        `;
    }
}

// ============================================
// Render Functions
// ============================================

function updateMetrics(data) {
    if (!data?.summary) return;

    const { totalScans, visibleCount, visibilityRate, avgSentiment } = data.summary;
    const absentRate = data.byType?.absent && totalScans > 0
        ? Math.round((data.byType.absent / totalScans) * 100)
        : 0;

    // Update metric values with animation
    animateNumber('totalScans', totalScans || 0);
    animateNumber('visibleCount', visibleCount || 0);
    document.getElementById('absentRate').textContent = `${absentRate}%`;
    document.getElementById('avgSentiment').textContent = avgSentiment !== null ? avgSentiment.toFixed(2) : '--';

    // Update visibility score
    updateVisibilityScore(visibilityRate || 0);
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (targetValue - start) * easeOut);
        element.textContent = value.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateVisibilityScore(rate) {
    const scoreValue = document.getElementById('visibilityScore');
    const scoreProgress = document.getElementById('scoreProgress');
    const scoreLabel = document.getElementById('scoreLabel');
    const scoreDescription = document.getElementById('scoreDescription');

    if (scoreValue) scoreValue.textContent = rate;

    // Update circular progress
    if (scoreProgress) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (rate / 100) * circumference;
        scoreProgress.style.strokeDashoffset = offset;

        if (rate >= 80) {
            scoreProgress.style.stroke = '#34d399';
            if (scoreValue) scoreValue.style.color = '#34d399';
        } else if (rate >= 50) {
            scoreProgress.style.stroke = '#fbbf24';
            if (scoreValue) scoreValue.style.color = '#fbbf24';
        } else {
            scoreProgress.style.stroke = '#f87171';
            if (scoreValue) scoreValue.style.color = '#f87171';
        }
    }

    if (scoreLabel && scoreDescription) {
        if (rate >= 80) {
            scoreLabel.textContent = 'Excellent';
            scoreDescription.textContent = 'Your brand has strong AI visibility.';
        } else if (rate >= 50) {
            scoreLabel.textContent = 'Good';
            scoreDescription.textContent = 'Your brand appears in most AI responses.';
        } else if (rate >= 20) {
            scoreLabel.textContent = 'Needs Work';
            scoreDescription.textContent = 'AI engines rarely mention your brand.';
        } else {
            scoreLabel.textContent = 'No Data';
            scoreDescription.textContent = 'Run scans to measure visibility.';
        }
    }
}

function renderChart(timeline) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    if (!timeline || timeline.length === 0) {
        // Empty chart
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    const labels = timeline.map(t => t.date);
    const scansData = timeline.map(t => t.scans);
    const visibleData = timeline.map(t => t.visible);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Total Scans',
                    data: scansData,
                    borderColor: '#9CA3AF',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: 'Visible',
                    data: visibleData,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 147, 0.1)',
                    fill: true,
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 17, 17, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderRadius: 8,
                }
            },
            scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });

    const xAxisEl = document.querySelector('.chart-x-axis');
    if (xAxisEl && labels.length > 0) {
        xAxisEl.innerHTML = labels.map(l => `<span>${l.slice(5)}</span>`).join('');
    }
}

function renderMiniBars(timeline) {
    const container = document.getElementById('miniBars');
    if (!container) return;

    if (!timeline || timeline.length === 0) {
        container.innerHTML = '';
        document.getElementById('recentScans').textContent = '0';
        return;
    }

    const maxScans = Math.max(...timeline.map(t => t.scans), 1);

    container.innerHTML = timeline.map(t => {
        const height = Math.max(4, (t.scans / maxScans) * 100);
        return `<div class="mini-bar" style="height: ${height}%"></div>`;
    }).join('');

    const recentScans = document.getElementById('recentScans');
    if (recentScans) {
        const lastDay = timeline[timeline.length - 1];
        recentScans.textContent = lastDay?.scans || 0;
    }
}

function renderKeywordsTable(keywords) {
    const container = document.getElementById('tableContent');
    if (!container) return;

    if (!keywords || keywords.length === 0) {
        container.innerHTML = `
            <div class="table-row">
                <span class="table-keyword" style="color: var(--text-muted)">No keywords tracked</span>
                <span class="table-value">--</span>
            </div>
        `;
        return;
    }

    container.innerHTML = keywords.map(kw => `
        <div class="table-row">
            <span class="table-keyword">${escapeHtml(kw.keyword)}</span>
            <span class="table-value">${kw.visibilityRate}%</span>
        </div>
    `).join('');
}

function renderCitationsTable(citations) {
    const container = document.getElementById('tableContent');
    if (!container) return;

    if (!citations || citations.length === 0) {
        container.innerHTML = `
            <div class="table-row">
                <span class="table-keyword" style="color: var(--text-muted)">No citations found</span>
                <span class="table-value">--</span>
            </div>
        `;
        return;
    }

    container.innerHTML = citations.map(c => `
        <div class="table-row">
            <span class="table-keyword">${escapeHtml(c.domain)}</span>
            <span class="table-value">${c.count}</span>
        </div>
    `).join('');
}

function renderEnginesTable(byEngine) {
    const container = document.getElementById('tableContent');
    if (!container) return;

    const engines = Object.entries(byEngine || {});

    if (engines.length === 0) {
        container.innerHTML = `
            <div class="table-row">
                <span class="table-keyword" style="color: var(--text-muted)">No engine data</span>
                <span class="table-value">--</span>
            </div>
        `;
        return;
    }

    container.innerHTML = engines.map(([engine, stats]) => `
        <div class="table-row">
            <span class="table-keyword">${capitalize(engine)}</span>
            <span class="table-value">${stats.rate}% (${stats.visible}/${stats.total})</span>
        </div>
    `).join('');
}

// ============================================
// Utilities
// ============================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ============================================
// Tab Navigation
// ============================================

function initTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;

            switch (tabName) {
                case 'keywords':
                case 'top':
                    renderKeywordsTable(keywordsData);
                    break;
                case 'engines':
                    if (dashboardData) renderEnginesTable(dashboardData.byEngine);
                    break;
                case 'sources':
                case 'citations':
                case 'referrer':
                    if (!citationsData && currentProjectId) {
                        citationsData = await fetchCitations(currentProjectId);
                    }
                    renderCitationsTable(citationsData);
                    break;
                default:
                    renderKeywordsTable(keywordsData);
            }
        });
    });
}

// ============================================
// Initialize
// ============================================

async function init() {
    console.log('🌿 Mentha Dashboard initializing...');

    initProjectDropdown();
    initTabs();

    // Load projects
    projects = await fetchProjects();
    renderProjectList();

    // Load dashboard if project selected
    if (currentProjectId) {
        await loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', init);
