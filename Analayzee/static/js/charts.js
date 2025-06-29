// Charts functionality for Analayzee
class ChartsManager {
    constructor() {
        // Initialize properties
        this.charts = new Map();
        this.currentCharts = [];
        this.chartMetadata = new Map();
        this.data = null;
        this.columns = [];
        this.chartColors = [
            '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
            '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ];
        
        // Load data
        this.loadData();
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Chart type selector
        const chartTypeSelect = document.getElementById('chartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', () => {
                this.updateChartOptions();
            });
        }
        
        // X-axis selector
        const xAxisSelect = document.getElementById('xAxis');
        if (xAxisSelect) {
            xAxisSelect.addEventListener('change', () => {
                this.updateChartOptions();
            });
        }
        
        // Y-axis selector
        const yAxisSelect = document.getElementById('yAxis');
        if (yAxisSelect) {
            yAxisSelect.addEventListener('change', () => {
                this.updateChartOptions();
            });
        }
        
        // Create chart button
        const createChartBtn = document.getElementById('createChart');
        if (createChartBtn) {
            createChartBtn.addEventListener('click', () => {
                this.createChart();
            });
        }
        
        // Reset charts button
        const resetChartsBtn = document.getElementById('resetCharts');
        if (resetChartsBtn) {
            resetChartsBtn.addEventListener('click', () => {
                this.resetCharts();
            });
        }
        
        // Export charts button
        const exportChartsBtn = document.getElementById('exportCharts');
        if (exportChartsBtn) {
            exportChartsBtn.addEventListener('click', () => {
                this.exportCharts();
            });
        }
    }
    
    loadData() {
        // Try to load data from API first, then fallback to template data
        this.loadDataFromAPI().catch(() => {
            this.loadDataFromTemplate();
        });
    }
    
    async loadDataFromAPI() {
        try {
            const response = await fetch('/api/charts-data/');
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const result = await response.json();
            
            if (result.success) {
                this.data = result.data;
                this.columns = result.columns;
                this.numericColumns = result.numeric_columns || [];
                this.categoricalColumns = result.categorical_columns || [];
                this.populateSelectors();
                this.updateChartOptions();
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error loading data from API:', error);
            throw error; // Re-throw to trigger fallback
        }
    }
    
    loadDataFromTemplate() {
        try {
            const tableData = parseDjangoJSON('tableData');
            const tableColumns = parseDjangoJSON('tableColumns');
            
            if (!tableData || !tableColumns) {
                console.error('Failed to load data from template');
                this.showError('Failed to load data from template');
                return;
            }
            
            this.data = tableData;
            this.columns = tableColumns;
            
            console.log('Loaded data from template:', {
                rows: this.data.length,
                columns: this.columns.length,
                sampleData: this.data.slice(0, 2)
            });
            
            this.populateSelectors();
            
        } catch (error) {
            console.error('Error loading data from template:', error);
            this.showError('Error loading data from template');
        }
    }
    
    populateSelectors() {
        const xAxisSelect = document.getElementById('xAxis');
        const yAxisSelect = document.getElementById('yAxis');
        
        if (xAxisSelect && yAxisSelect) {
            // Clear existing options
            xAxisSelect.innerHTML = '';
            yAxisSelect.innerHTML = '';
            
            // Add options for each column
            this.columns.forEach(column => {
                const xOption = document.createElement('option');
                xOption.value = column;
                xOption.textContent = column;
                xAxisSelect.appendChild(xOption);
                
                const yOption = document.createElement('option');
                yOption.value = column;
                yOption.textContent = column;
                yAxisSelect.appendChild(yOption);
            });
            
            // Set default selections
            if (this.columns.length >= 2) {
                xAxisSelect.value = this.columns[0];
                yAxisSelect.value = this.columns[1];
            }
        }
    }
    
    updateChartOptions() {
        const chartType = document.getElementById('chartType')?.value || 'bar';
        const xAxis = document.getElementById('xAxis')?.value;
        const yAxis = document.getElementById('yAxis')?.value;
        
        // Update Y-axis options based on chart type
        const yAxisSelect = document.getElementById('yAxis');
        if (yAxisSelect) {
            const currentYAxis = yAxisSelect.value;
            
            // For pie/doughnut charts, only show categorical columns
            if (chartType === 'pie' || chartType === 'doughnut') {
                Array.from(yAxisSelect.options).forEach(option => {
                    const column = option.value;
                    const isNumeric = this.numericColumns.includes(column);
                    option.disabled = isNumeric;
                    if (option.disabled && option.value === currentYAxis) {
                        yAxisSelect.value = this.categoricalColumns[0] || this.columns[0];
                    }
                });
            } else if (chartType === 'scatter') {
                // For scatter plots, prefer numeric columns
                Array.from(yAxisSelect.options).forEach(option => {
                    const column = option.value;
                    const isNumeric = this.numericColumns.includes(column);
                    option.disabled = !isNumeric;
                    if (option.disabled && option.value === currentYAxis) {
                        yAxisSelect.value = this.numericColumns[0] || this.columns[0];
                    }
                });
            } else if (chartType === 'histogram') {
                // For histograms, only show numeric columns
                Array.from(yAxisSelect.options).forEach(option => {
                    const column = option.value;
                    const isNumeric = this.numericColumns.includes(column);
                    option.disabled = !isNumeric;
                    if (option.disabled && option.value === currentYAxis) {
                        yAxisSelect.value = this.numericColumns[0] || this.columns[0];
                    }
                });
            } else {
                // For other charts, enable all columns
                Array.from(yAxisSelect.options).forEach(option => {
                    option.disabled = false;
                });
            }
        }
        
        // Update X-axis options for scatter plots
        const xAxisSelect = document.getElementById('xAxis');
        if (xAxisSelect && chartType === 'scatter') {
            const currentXAxis = xAxisSelect.value;
            Array.from(xAxisSelect.options).forEach(option => {
                const column = option.value;
                const isNumeric = this.numericColumns.includes(column);
                option.disabled = !isNumeric;
                if (option.disabled && option.value === currentXAxis) {
                    xAxisSelect.value = this.numericColumns[0] || this.columns[0];
                }
            });
        } else if (xAxisSelect) {
            // Enable all columns for other chart types
            Array.from(xAxisSelect.options).forEach(option => {
                option.disabled = false;
            });
        }
    }
    
    isNumericColumn(column) {
        if (!this.data || this.data.length === 0) return false;
        
        const sampleValues = this.data.slice(0, 10).map(row => row[column]);
        return sampleValues.every(value => {
            if (value === null || value === undefined || value === '') return true;
            return !isNaN(parseFloat(value));
        });
    }
    
    createChart() {
        const chartType = document.getElementById('chartType')?.value || 'bar';
        const xAxis = document.getElementById('xAxis')?.value;
        const yAxis = document.getElementById('yAxis')?.value;
        
        if (!xAxis || !yAxis) {
            this.showError('Please select both X and Y axes');
            return;
        }
        
        const chartId = `chart-${Date.now()}`;
        const chartData = this.prepareChartData(chartType, xAxis, yAxis);
        
        if (!chartData) {
            this.showError('Unable to prepare chart data');
            return;
        }
        
        this.renderChart(chartId, chartType, chartData, xAxis, yAxis);
    }
    
    prepareChartData(chartType, xAxis, yAxis) {
        if (!this.data || this.data.length === 0) return null;
        
        try {
            switch (chartType) {
                case 'bar':
                case 'line':
                    return this.prepareBarLineData(xAxis, yAxis);
                case 'pie':
                case 'doughnut':
                    return this.preparePieData(yAxis);
                case 'scatter':
                    return this.prepareScatterData(xAxis, yAxis);
                case 'histogram':
                    return this.prepareHistogramData(yAxis);
                default:
                    return this.prepareBarLineData(xAxis, yAxis);
            }
        } catch (error) {
            console.error('Error preparing chart data:', error);
            return null;
        }
    }
    
    prepareBarLineData(xAxis, yAxis) {
        const xValues = this.data.map(row => row[xAxis] || 'Unknown');
        const yValues = this.data.map(row => {
            const value = row[yAxis];
            return value === null || value === undefined || value === '' ? 0 : parseFloat(value) || 0;
        });
        
        return {
            labels: xValues,
            datasets: [{
                label: yAxis,
                data: yValues,
                backgroundColor: this.chartColors[0],
                borderColor: this.chartColors[0],
                borderWidth: 2,
                fill: false
            }]
        };
    }
    
    preparePieData(column) {
        const valueCounts = {};
        
        this.data.forEach(row => {
            const value = row[column] || 'Unknown';
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        const labels = Object.keys(valueCounts);
        const data = Object.values(valueCounts);
        const colors = labels.map((_, index) => this.chartColors[index % this.chartColors.length]);
        
        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => this.adjustBrightness(color, -20)),
                borderWidth: 2
            }]
        };
    }
    
    prepareScatterData(xAxis, yAxis) {
        const points = this.data
            .filter(row => {
                const x = row[xAxis];
                const y = row[yAxis];
                return x !== null && x !== undefined && x !== '' &&
                       y !== null && y !== undefined && y !== '';
            })
            .map(row => ({
                x: parseFloat(row[xAxis]) || 0,
                y: parseFloat(row[yAxis]) || 0
            }));
        
        return {
            datasets: [{
                label: `${yAxis} vs ${xAxis}`,
                data: points,
                backgroundColor: this.chartColors[0],
                borderColor: this.chartColors[0],
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };
    }
    
    prepareHistogramData(column) {
        const values = this.data
            .map(row => row[column])
            .filter(value => value !== null && value !== undefined && value !== '')
            .map(value => parseFloat(value))
            .filter(value => !isNaN(value));
        
        if (values.length === 0) return null;
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
        const binSize = (max - min) / binCount;
        
        const bins = new Array(binCount).fill(0);
        const labels = [];
        
        for (let i = 0; i < binCount; i++) {
            const binStart = min + i * binSize;
            const binEnd = min + (i + 1) * binSize;
            labels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
            
            values.forEach(value => {
                if (value >= binStart && value < binEnd) {
                    bins[i]++;
                }
            });
        }
        
        return {
            labels: labels,
            datasets: [{
                label: `Distribution of ${column}`,
                data: bins,
                backgroundColor: this.chartColors[0],
                borderColor: this.chartColors[0],
                borderWidth: 2,
                fill: true
            }]
        };
    }
    
    renderChart(chartId, chartType, chartData, xAxis, yAxis) {
        const chartGrid = document.getElementById('chartGrid');
        if (!chartGrid) return;
        
        // Create chart card
        const chartCard = document.createElement('div');
        chartCard.className = 'chart-card';
        chartCard.setAttribute('data-chart-type', chartType);
        chartCard.setAttribute('data-chart-id', chartId);
        
        const chartTitle = this.getChartTitle(chartType, xAxis, yAxis);
        
        chartCard.innerHTML = `
            <div class="chart-header">
                <div class="chart-header-content">
                    <h3 class="chart-title">${chartTitle}</h3>
                    <p class="chart-subtitle">${this.getChartSubtitle(chartType, xAxis, yAxis)}</p>
                </div>
                <button class="chart-delete-btn" onclick="window.chartsManager.deleteChart('${chartId}')" title="Delete chart">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="chart-body">
                <div class="chart-container">
                    <canvas id="${chartId}"></canvas>
                </div>
            </div>
            <div class="chart-legend">
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background-color: ${this.chartColors[0]}"></div>
                    <span>${yAxis}</span>
                </div>
            </div>
        `;
        
        chartGrid.appendChild(chartCard);
        
        // Create Chart.js instance
        const ctx = document.getElementById(chartId);
        if (ctx) {
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: this.getChartOptions(chartType, xAxis, yAxis)
            });
            
            this.charts.set(chartId, chart);
            this.currentCharts.push(chartId);
            
            // Store chart metadata
            this.chartMetadata.set(chartId, {
                type: chartType,
                xAxis: xAxis,
                yAxis: yAxis,
                title: chartTitle,
                subtitle: this.getChartSubtitle(chartType, xAxis, yAxis)
            });
        }
    }
    
    deleteChart(chartId) {
        // Find the chart card
        const chartCard = document.querySelector(`[data-chart-id="${chartId}"]`);
        if (!chartCard) return;
        
        // Add fade-out animation
        chartCard.style.transition = 'all 0.3s ease-out';
        chartCard.style.transform = 'scale(0.95)';
        chartCard.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            // Destroy the Chart.js instance
            const chart = this.charts.get(chartId);
            if (chart) {
                chart.destroy();
                this.charts.delete(chartId);
            }
            
            // Remove from tracking arrays
            const index = this.currentCharts.indexOf(chartId);
            if (index > -1) {
                this.currentCharts.splice(index, 1);
            }
            
            // Remove metadata
            this.chartMetadata.delete(chartId);
            
            // Remove from DOM
            chartCard.remove();
            
            this.showSuccess('Chart deleted successfully');
        }, 300);
    }
    
    getChartTitle(chartType, xAxis, yAxis) {
        const titles = {
            'bar': `${yAxis} by ${xAxis}`,
            'line': `${yAxis} Trend by ${xAxis}`,
            'pie': `Distribution of ${yAxis}`,
            'doughnut': `Distribution of ${yAxis}`,
            'scatter': `${yAxis} vs ${xAxis}`,
            'histogram': `Distribution of ${yAxis}`
        };
        return titles[chartType] || `${yAxis} by ${xAxis}`;
    }
    
    getChartSubtitle(chartType, xAxis, yAxis) {
        const subtitles = {
            'bar': 'Bar chart showing categorical data comparison',
            'line': 'Line chart showing trends over time or categories',
            'pie': 'Pie chart showing proportional distribution',
            'doughnut': 'Doughnut chart showing proportional distribution',
            'scatter': 'Scatter plot showing correlation between variables',
            'histogram': 'Histogram showing frequency distribution'
        };
        return subtitles[chartType] || 'Data visualization';
    }
    
    getChartOptions(chartType, xAxis, yAxis) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {}
        };
        
        if (chartType === 'pie' || chartType === 'doughnut') {
            baseOptions.plugins.legend = {
                display: true,
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true
                }
            };
            delete baseOptions.scales;
        } else if (chartType === 'scatter') {
            baseOptions.scales = {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xAxis
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: yAxis
                    }
                }
            };
        } else {
            baseOptions.scales = {
                x: {
                    title: {
                        display: true,
                        text: xAxis
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxis
                    }
                }
            };
        }
        
        return baseOptions;
    }
    
    resetCharts() {
        // Destroy all charts
        this.charts.forEach(chart => {
            chart.destroy();
        });
        
        // Clear chart grid
        const chartGrid = document.getElementById('chartGrid');
        if (chartGrid) {
            chartGrid.innerHTML = '';
        }
        
        // Clear tracking
        this.charts.clear();
        this.currentCharts = [];
        this.chartMetadata.clear();
    }
    
    exportCharts() {
        if (this.currentCharts.length === 0) {
            this.showError('No charts to export');
            return;
        }

        try {
            if (this.currentCharts.length === 1) {
                // Export single chart as PNG
                const chartId = this.currentCharts[0];
                const chart = this.charts.get(chartId);
                const metadata = this.chartMetadata.get(chartId);
                if (chart) {
                    const link = document.createElement('a');
                    link.download = `chart-${metadata.title ? metadata.title.replace(/[^a-zA-Z0-9]/g, '-') : 'chart'}-${Date.now()}.png`;
                    link.href = chart.toBase64Image();
                    link.click();
                    this.showSuccess('Exported chart as PNG');
                }
            } else {
                // Export multiple charts as ZIP
                if (typeof JSZip === 'undefined') {
                    this.showError('ZIP export requires JSZip library.');
                    return;
                }
                const zip = new JSZip();
                const timestamp = Date.now();
                this.currentCharts.forEach((chartId, index) => {
                    const chart = this.charts.get(chartId);
                    const metadata = this.chartMetadata.get(chartId);
                    if (chart) {
                        const base64 = chart.toBase64Image();
                        const filename = `chart-${index + 1}-${metadata.title ? metadata.title.replace(/[^a-zA-Z0-9]/g, '-') : 'chart'}.png`;
                        const base64Data = base64.split(',')[1];
                        zip.file(filename, base64Data, {base64: true});
                    }
                });
                zip.generateAsync({type: 'blob'}).then(content => {
                    const link = document.createElement('a');
                    link.download = `analayzee-charts-${timestamp}.zip`;
                    link.href = URL.createObjectURL(content);
                    link.click();
                    URL.revokeObjectURL(link.href);
                    this.showSuccess(`Exported ${this.currentCharts.length} charts as ZIP file`);
                });
            }
        } catch (error) {
            console.error('Error exporting charts:', error);
            this.showError('Failed to export charts');
        }
    }
    
    adjustBrightness(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Helper function to parse escaped JSON from Django
function parseDjangoJSON(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id '${elementId}' not found`);
        return null;
    }
    
    try {
        const raw = element.textContent.trim();
        return JSON.parse(raw);
    } catch (error) {
        console.error(`Error parsing JSON from element '${elementId}':`, error);
        console.error('Raw content:', element.textContent);
        return null;
    }
}

// Initialize charts when tab is clicked
function initializeCharts() {
    const chartsTab = document.querySelector('[data-tab="charts"]');
    
    if (chartsTab) {
        chartsTab.addEventListener('click', () => {
            if (!window.chartsManager) {
                window.chartsManager = new ChartsManager();
            }
        });
    }
}

// Auto-initialize if on charts tab
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the charts tab
    const chartsTab = document.querySelector('[data-tab="charts"]');
    const chartsContent = document.getElementById('charts-tab');
    
    if (chartsTab && chartsContent && chartsContent.classList.contains('active')) {
        window.chartsManager = new ChartsManager();
    }
}); 