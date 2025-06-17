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
    
    // Set up tab-specific initializations
    setupTabInitializations();
});

// Set up tab-specific initializations
function setupTabInitializations() {
    const chartsTab = document.querySelector('[data-tab="charts"]');
    const chartsContent = document.getElementById('charts-tab');
    
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
} 