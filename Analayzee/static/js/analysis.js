// Analysis Page JavaScript - Main initialization file

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    
    // Initialize the magical table if we're on the analysis page
    if (document.getElementById('tableData')) {
        initializeMagicalTable();
    }
    
    initializeColumnAnalysis();
    
    // Initialize charts functionality
    initializeCharts();
    
    // Initialize statistics functionality
    initializeStatistics();
    
    // Initialize data cleaning
    initializeDataCleaning();
    
    // Set up tab-specific initializations
    setupTabInitializations();
});

// Set up tab-specific initializations
function setupTabInitializations() {
    const chartsTab = document.querySelector('[data-tab="charts"]');
    const chartsContent = document.getElementById('charts-tab');
    const statisticsTab = document.querySelector('[data-tab="statistics"]');
    const statisticsContent = document.getElementById('statistics-tab');
    
    if (chartsTab && chartsContent) {
        // Initialize charts when tab is clicked
        chartsTab.addEventListener('click', () => {
            if (!window.chartsManager) {
                window.chartsManager = new ChartsManager();
            }
        });
        
        // If charts tab is active by default, initialize immediately
        if (chartsContent.classList.contains('active')) {
            window.chartsManager = new ChartsManager();
        }
    }
    
    if (statisticsTab && statisticsContent) {
        // Initialize statistics when tab is clicked
        statisticsTab.addEventListener('click', () => {
            if (!window.statisticsManager) {
                window.statisticsManager = new StatisticsManager();
            }
        });
        
        // If statistics tab is active by default, initialize immediately
        if (statisticsContent.classList.contains('active')) {
            window.statisticsManager = new StatisticsManager();
        }
    }
} 