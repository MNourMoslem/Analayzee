// Statistics functionality for Analayzee
class StatisticsManager {
    constructor() {
        this.data = null;
        this.columns = [];
        this.numericColumns = [];
        this.categoricalColumns = [];
        this.statistics = {};
        this.currentAnalysis = null;
        
        this.initializeEventListeners();
        this.loadData();
    }
    
    initializeEventListeners() {
        // Analysis type selector
        const analysisTypeSelect = document.getElementById('analysisType');
        if (analysisTypeSelect) {
            analysisTypeSelect.addEventListener('change', () => {
                this.updateAnalysisOptions();
            });
        }
        
        // Column selector
        const columnSelect = document.getElementById('statisticsColumn');
        if (columnSelect) {
            columnSelect.addEventListener('change', () => {
                this.updateAnalysisOptions();
            });
        }
        
        // Generate statistics button
        const generateStatsBtn = document.getElementById('generateStatistics');
        if (generateStatsBtn) {
            generateStatsBtn.addEventListener('click', () => {
                this.generateStatistics();
            });
        }
        
        // Reset statistics button
        const resetStatsBtn = document.getElementById('resetStatistics');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => {
                this.resetStatistics();
            });
        }
        
        // Export statistics button
        const exportStatsBtn = document.getElementById('exportStatistics');
        if (exportStatsBtn) {
            exportStatsBtn.addEventListener('click', () => {
                this.exportStatistics();
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
                this.updateAnalysisOptions();
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
            this.data = parseDjangoJSON('tableData');
            this.columns = parseDjangoJSON('tableColumns');
            this.numericColumns = [];
            this.categoricalColumns = [];
            
            // Determine column types from data
            if (this.data && this.data.length > 0) {
                this.columns.forEach(column => {
                    if (this.isNumericColumn(column)) {
                        this.numericColumns.push(column);
                    } else {
                        this.categoricalColumns.push(column);
                    }
                });
            }
            
            this.populateSelectors();
            this.updateAnalysisOptions();
        } catch (error) {
            console.error('Error loading statistics data from template:', error);
            this.showError('Failed to load data for statistics');
        }
    }
    
    populateSelectors() {
        const analysisTypeSelect = document.getElementById('analysisType');
        const columnSelect = document.getElementById('statisticsColumn');
        
        if (analysisTypeSelect) {
            analysisTypeSelect.innerHTML = `
                <option value="descriptive">Descriptive Statistics</option>
                <option value="correlation">Correlation Matrix</option>
                <option value="outliers">Outlier Detection</option>
                <option value="distribution">Distribution Analysis</option>
                <option value="insights">Data Insights</option>
            `;
        }
        
        if (columnSelect) {
            columnSelect.innerHTML = '';
            
            // Add options for each column
            this.columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                columnSelect.appendChild(option);
            });
            
            // Set default selection
            if (this.columns.length > 0) {
                columnSelect.value = this.columns[0];
            }
        }
    }
    
    updateAnalysisOptions() {
        const analysisType = document.getElementById('analysisType')?.value || 'descriptive';
        const columnSelect = document.getElementById('statisticsColumn');
        
        if (columnSelect) {
            const currentColumn = columnSelect.value;
            
            // Update column options based on analysis type
            if (analysisType === 'correlation') {
                // For correlation, only show numeric columns
                Array.from(columnSelect.options).forEach(option => {
                    const column = option.value;
                    const isNumeric = this.numericColumns.includes(column);
                    option.disabled = !isNumeric;
                    if (option.disabled && option.value === currentColumn) {
                        columnSelect.value = this.numericColumns[0] || this.columns[0];
                    }
                });
            } else if (analysisType === 'outliers' || analysisType === 'distribution') {
                // For outliers and distribution, only show numeric columns
                Array.from(columnSelect.options).forEach(option => {
                    const column = option.value;
                    const isNumeric = this.numericColumns.includes(column);
                    option.disabled = !isNumeric;
                    if (option.disabled && option.value === currentColumn) {
                        columnSelect.value = this.numericColumns[0] || this.columns[0];
                    }
                });
            } else {
                // For other analyses, enable all columns
                Array.from(columnSelect.options).forEach(option => {
                    option.disabled = false;
                });
            }
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
    
    generateStatistics() {
        const analysisType = document.getElementById('analysisType')?.value || 'descriptive';
        const column = document.getElementById('statisticsColumn')?.value;
        
        if (!column) {
            this.showError('Please select a column for analysis');
            return;
        }
        
        this.currentAnalysis = { type: analysisType, column: column };
        
        try {
            switch (analysisType) {
                case 'descriptive':
                    this.generateDescriptiveStatistics(column);
                    break;
                case 'correlation':
                    this.generateCorrelationMatrix();
                    break;
                case 'outliers':
                    this.generateOutlierAnalysis(column);
                    break;
                case 'distribution':
                    this.generateDistributionAnalysis(column);
                    break;
                case 'insights':
                    this.generateDataInsights();
                    break;
                default:
                    this.generateDescriptiveStatistics(column);
            }
        } catch (error) {
            console.error('Error generating statistics:', error);
            this.showError('Failed to generate statistics');
        }
    }
    
    generateDescriptiveStatistics(column) {
        const values = this.getNumericValues(column);
        if (values.length === 0) {
            this.showError('No numeric data available for this column');
            return;
        }
        
        const stats = this.calculateDescriptiveStats(values);
        this.renderDescriptiveStatistics(column, stats);
    }
    
    generateCorrelationMatrix() {
        if (this.numericColumns.length < 2) {
            this.showError('Need at least 2 numeric columns for correlation analysis');
            return;
        }
        
        const correlationMatrix = this.calculateCorrelationMatrix();
        this.renderCorrelationMatrix(correlationMatrix);
    }
    
    generateOutlierAnalysis(column) {
        const values = this.getNumericValues(column);
        if (values.length === 0) {
            this.showError('No numeric data available for this column');
            return;
        }
        
        const outliers = this.detectOutliers(values);
        this.renderOutlierAnalysis(column, outliers);
    }
    
    generateDistributionAnalysis(column) {
        const values = this.getNumericValues(column);
        if (values.length === 0) {
            this.showError('No numeric data available for this column');
            return;
        }
        
        const distribution = this.calculateDistribution(values);
        this.renderDistributionAnalysis(column, distribution);
    }
    
    generateDataInsights() {
        const insights = this.generateInsights();
        this.renderDataInsights(insights);
    }
    
    getNumericValues(column) {
        return this.data
            .map(row => row[column])
            .filter(value => value !== null && value !== undefined && value !== '')
            .map(value => parseFloat(value))
            .filter(value => !isNaN(value));
    }
    
    calculateDescriptiveStats(values) {
        const sorted = values.sort((a, b) => a - b);
        const n = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        // Calculate quartiles
        const q1 = this.calculatePercentile(sorted, 25);
        const q2 = this.calculatePercentile(sorted, 50);
        const q3 = this.calculatePercentile(sorted, 75);
        
        // Calculate skewness and kurtosis
        const skewness = this.calculateSkewness(values, mean, stdDev);
        const kurtosis = this.calculateKurtosis(values, mean, stdDev);
        
        return {
            count: n,
            mean: mean.toFixed(4),
            median: q2.toFixed(4),
            mode: this.calculateMode(values),
            stdDev: stdDev.toFixed(4),
            variance: variance.toFixed(4),
            min: Math.min(...values).toFixed(4),
            max: Math.max(...values).toFixed(4),
            range: (Math.max(...values) - Math.min(...values)).toFixed(4),
            q1: q1.toFixed(4),
            q3: q3.toFixed(4),
            iqr: (q3 - q1).toFixed(4),
            skewness: skewness.toFixed(4),
            kurtosis: kurtosis.toFixed(4)
        };
    }
    
    calculatePercentile(sorted, percentile) {
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        
        if (upper === lower) return sorted[lower];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
    
    calculateMode(values) {
        const frequency = {};
        values.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });
        
        const maxFreq = Math.max(...Object.values(frequency));
        const modes = Object.keys(frequency).filter(key => frequency[key] === maxFreq);
        return modes.length === 1 ? parseFloat(modes[0]).toFixed(4) : 'Multiple';
    }
    
    calculateSkewness(values, mean, stdDev) {
        const n = values.length;
        const sum = values.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }
    
    calculateKurtosis(values, mean, stdDev) {
        const n = values.length;
        const sum = values.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 4), 0);
        return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3)));
    }
    
    calculateCorrelationMatrix() {
        const matrix = {};
        
        this.numericColumns.forEach(col1 => {
            matrix[col1] = {};
            this.numericColumns.forEach(col2 => {
                if (col1 === col2) {
                    matrix[col1][col2] = 1;
                } else {
                    matrix[col1][col2] = this.calculateCorrelation(col1, col2);
                }
            });
        });
        
        return matrix;
    }
    
    calculateCorrelation(col1, col2) {
        const values1 = this.getNumericValues(col1);
        const values2 = this.getNumericValues(col2);
        
        if (values1.length !== values2.length || values1.length === 0) return 0;
        
        const n = values1.length;
        const sum1 = values1.reduce((a, b) => a + b, 0);
        const sum2 = values2.reduce((a, b) => a + b, 0);
        const sum1Sq = values1.reduce((a, b) => a + b * b, 0);
        const sum2Sq = values2.reduce((a, b) => a + b * b, 0);
        const sum12 = values1.reduce((a, b, i) => a + b * values2[i], 0);
        
        const numerator = n * sum12 - sum1 * sum2;
        const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    detectOutliers(values) {
        const sorted = values.sort((a, b) => a - b);
        const q1 = this.calculatePercentile(sorted, 25);
        const q3 = this.calculatePercentile(sorted, 75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const outliers = [];
        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                outliers.push({
                    index: index,
                    value: value,
                    type: value < lowerBound ? 'lower' : 'upper'
                });
            }
        });
        
        return {
            outliers: outliers,
            bounds: { lower: lowerBound, upper: upperBound },
            count: outliers.length,
            percentage: ((outliers.length / values.length) * 100).toFixed(2)
        };
    }
    
    calculateDistribution(values) {
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
        
        return { bins, labels, binSize };
    }
    
    generateInsights() {
        const insights = [];
        
        // Data quality insights
        const totalRows = this.data.length;
        const totalColumns = this.columns.length;
        const numericCount = this.numericColumns.length;
        const categoricalCount = this.categoricalColumns.length;
        
        insights.push({
            title: 'Data Overview',
            description: `Dataset contains ${totalRows} rows and ${totalColumns} columns (${numericCount} numeric, ${categoricalCount} categorical).`
        });
        
        // Missing data insights
        const missingData = this.analyzeMissingData();
        if (missingData.totalMissing > 0) {
            insights.push({
                title: 'Missing Data Alert',
                description: `Found ${missingData.totalMissing} missing values across ${missingData.columnsWithMissing} columns. Consider data cleaning.`
            });
        }
        
        // Outlier insights
        if (this.numericColumns.length > 0) {
            const outlierInsights = this.analyzeOutliers();
            if (outlierInsights.hasOutliers) {
                insights.push({
                    title: 'Outlier Detection',
                    description: `Detected outliers in ${outlierInsights.columnsWithOutliers} numeric columns. Review for data quality issues.`
                });
            }
        }
        
        // Correlation insights
        if (this.numericColumns.length >= 2) {
            const correlationInsights = this.analyzeCorrelations();
            if (correlationInsights.strongCorrelations.length > 0) {
                insights.push({
                    title: 'Strong Correlations',
                    description: `Found ${correlationInsights.strongCorrelations.length} strong correlations (|r| > 0.7) between variables.`
                });
            }
        }
        
        return insights;
    }
    
    analyzeMissingData() {
        let totalMissing = 0;
        let columnsWithMissing = 0;
        
        this.columns.forEach(column => {
            const missing = this.data.filter(row => 
                row[column] === null || row[column] === undefined || row[column] === ''
            ).length;
            
            if (missing > 0) {
                totalMissing += missing;
                columnsWithMissing++;
            }
        });
        
        return { totalMissing, columnsWithMissing };
    }
    
    analyzeOutliers() {
        let hasOutliers = false;
        let columnsWithOutliers = 0;
        
        this.numericColumns.forEach(column => {
            const values = this.getNumericValues(column);
            const outlierResult = this.detectOutliers(values);
            if (outlierResult.count > 0) {
                hasOutliers = true;
                columnsWithOutliers++;
            }
        });
        
        return { hasOutliers, columnsWithOutliers };
    }
    
    analyzeCorrelations() {
        const strongCorrelations = [];
        const matrix = this.calculateCorrelationMatrix();
        
        this.numericColumns.forEach(col1 => {
            this.numericColumns.forEach(col2 => {
                if (col1 < col2) { // Avoid duplicates
                    const correlation = matrix[col1][col2];
                    if (Math.abs(correlation) > 0.7) {
                        strongCorrelations.push({
                            col1: col1,
                            col2: col2,
                            correlation: correlation
                        });
                    }
                }
            });
        });
        
        return { strongCorrelations };
    }
    
    renderDescriptiveStatistics(column, stats) {
        const statisticsGrid = document.getElementById('statisticsGrid');
        if (!statisticsGrid) return;
        
        const cardId = `descriptive-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'statistics-card';
        card.setAttribute('data-stat-type', 'descriptive');
        card.id = cardId;
        
        card.innerHTML = `
            <div class="statistics-card-header">
                <h3 class="statistics-card-title">Descriptive Statistics</h3>
                <p class="statistics-card-subtitle">Column: ${column}</p>
                <button class="delete-analysis-btn" onclick="window.statisticsManager.deleteAnalysis('${cardId}')" title="Delete this analysis">×</button>
            </div>
            <div class="statistics-card-body">
                <table class="statistics-table">
                    <tbody>
                        <tr><td>Count</td><td class="statistics-value">${stats.count}</td></tr>
                        <tr><td>Mean</td><td class="statistics-value">${stats.mean}</td></tr>
                        <tr><td>Median</td><td class="statistics-value">${stats.median}</td></tr>
                        <tr><td>Mode</td><td class="statistics-value">${stats.mode}</td></tr>
                        <tr><td>Standard Deviation</td><td class="statistics-value">${stats.stdDev}</td></tr>
                        <tr><td>Variance</td><td class="statistics-value">${stats.variance}</td></tr>
                        <tr><td>Minimum</td><td class="statistics-value">${stats.min}</td></tr>
                        <tr><td>Maximum</td><td class="statistics-value">${stats.max}</td></tr>
                        <tr><td>Range</td><td class="statistics-value">${stats.range}</td></tr>
                        <tr><td>Q1 (25th percentile)</td><td class="statistics-value">${stats.q1}</td></tr>
                        <tr><td>Q3 (75th percentile)</td><td class="statistics-value">${stats.q3}</td></tr>
                        <tr><td>IQR</td><td class="statistics-value">${stats.iqr}</td></tr>
                        <tr><td>Skewness</td><td class="statistics-value">${stats.skewness}</td></tr>
                        <tr><td>Kurtosis</td><td class="statistics-value">${stats.kurtosis}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        statisticsGrid.appendChild(card);
    }
    
    renderCorrelationMatrix(matrix) {
        const statisticsGrid = document.getElementById('statisticsGrid');
        if (!statisticsGrid) return;
        
        const cardId = `correlation-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'statistics-card';
        card.setAttribute('data-stat-type', 'correlation');
        card.id = cardId;
        
        let matrixHTML = '<div class="correlation-matrix" style="display: grid; grid-template-columns: repeat(' + (this.numericColumns.length + 1) + ', 1fr); gap: 0.5rem; max-width: 100%; overflow-x: auto;">';
        
        // Header row
        matrixHTML += '<div class="correlation-cell correlation-header"></div>';
        this.numericColumns.forEach(col => {
            matrixHTML += `<div class="correlation-cell correlation-header">${col}</div>`;
        });
        
        // Data rows
        this.numericColumns.forEach(col1 => {
            matrixHTML += `<div class="correlation-cell correlation-header">${col1}</div>`;
            this.numericColumns.forEach(col2 => {
                const value = matrix[col1][col2];
                const className = this.getCorrelationClass(value);
                matrixHTML += `<div class="correlation-cell correlation-value ${className}">${value.toFixed(3)}</div>`;
            });
        });
        
        matrixHTML += '</div>';
        
        card.innerHTML = `
            <div class="statistics-card-header">
                <h3 class="statistics-card-title">Correlation Matrix</h3>
                <p class="statistics-card-subtitle">Pearson correlation coefficients between numeric variables</p>
                <button class="delete-analysis-btn" onclick="window.statisticsManager.deleteAnalysis('${cardId}')" title="Delete this analysis">×</button>
            </div>
            <div class="statistics-card-body">
                ${matrixHTML}
            </div>
        `;
        
        statisticsGrid.appendChild(card);
    }
    
    getCorrelationClass(value) {
        if (value >= 0.7) return 'correlation-strong-positive';
        if (value >= 0.3) return 'correlation-positive';
        if (value >= -0.3) return 'correlation-neutral';
        if (value >= -0.7) return 'correlation-negative';
        return 'correlation-strong-negative';
    }
    
    renderOutlierAnalysis(column, outlierResult) {
        const statisticsGrid = document.getElementById('statisticsGrid');
        if (!statisticsGrid) return;
        
        const cardId = `outliers-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'statistics-card';
        card.setAttribute('data-stat-type', 'outliers');
        card.id = cardId;
        
        let outliersHTML = '';
        if (outlierResult.outliers.length > 0) {
            outlierResult.outliers.forEach(outlier => {
                outliersHTML += `
                    <div class="outlier-item">
                        <span class="outlier-value">${outlier.value.toFixed(4)}</span>
                        <span class="outlier-index">Row ${outlier.index + 1}</span>
                    </div>
                `;
            });
        } else {
            outliersHTML = '<p>No outliers detected in this column.</p>';
        }
        
        card.innerHTML = `
            <div class="statistics-card-header">
                <h3 class="statistics-card-title">Outlier Detection</h3>
                <p class="statistics-card-subtitle">Column: ${column} (${outlierResult.count} outliers, ${outlierResult.percentage}%)</p>
                <button class="delete-analysis-btn" onclick="window.statisticsManager.deleteAnalysis('${cardId}')" title="Delete this analysis">×</button>
            </div>
            <div class="statistics-card-body">
                ${outliersHTML}
            </div>
        `;
        
        statisticsGrid.appendChild(card);
    }
    
    renderDistributionAnalysis(column, distribution) {
        const statisticsGrid = document.getElementById('statisticsGrid');
        if (!statisticsGrid) return;
        
        const cardId = `distribution-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'statistics-card';
        card.setAttribute('data-stat-type', 'distribution');
        card.id = cardId;
        
        let distributionHTML = '<table class="statistics-table">';
        distributionHTML += '<thead><tr><th>Bin Range</th><th>Frequency</th><th>Percentage</th></tr></thead><tbody>';
        
        const total = distribution.bins.reduce((a, b) => a + b, 0);
        distribution.bins.forEach((bin, index) => {
            const percentage = ((bin / total) * 100).toFixed(2);
            distributionHTML += `
                <tr>
                    <td>${distribution.labels[index]}</td>
                    <td class="statistics-value">${bin}</td>
                    <td class="statistics-value">${percentage}%</td>
                </tr>
            `;
        });
        
        distributionHTML += '</tbody></table>';
        
        card.innerHTML = `
            <div class="statistics-card-header">
                <h3 class="statistics-card-title">Distribution Analysis</h3>
                <p class="statistics-card-subtitle">Column: ${column} (${distribution.bins.length} bins)</p>
                <button class="delete-analysis-btn" onclick="window.statisticsManager.deleteAnalysis('${cardId}')" title="Delete this analysis">×</button>
            </div>
            <div class="statistics-card-body">
                ${distributionHTML}
            </div>
        `;
        
        statisticsGrid.appendChild(card);
    }
    
    renderDataInsights(insights) {
        const statisticsGrid = document.getElementById('statisticsGrid');
        if (!statisticsGrid) return;
        
        const cardId = `insights-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'statistics-card';
        card.setAttribute('data-stat-type', 'insights');
        card.id = cardId;
        
        let insightsHTML = '';
        insights.forEach(insight => {
            insightsHTML += `
                <div class="insight-item">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-description">${insight.description}</div>
                </div>
            `;
        });
        
        if (insights.length === 0) {
            insightsHTML = '<p>No specific insights available for this dataset.</p>';
        }
        
        card.innerHTML = `
            <div class="statistics-card-header">
                <h3 class="statistics-card-title">Data Insights</h3>
                <p class="statistics-card-subtitle">Automated analysis and recommendations</p>
                <button class="delete-analysis-btn" onclick="window.statisticsManager.deleteAnalysis('${cardId}')" title="Delete this analysis">×</button>
            </div>
            <div class="statistics-card-body">
                ${insightsHTML}
            </div>
        `;
        
        statisticsGrid.appendChild(card);
    }
    
    resetStatistics() {
        const statisticsGrid = document.getElementById('statisticsGrid');
        if (statisticsGrid) {
            statisticsGrid.innerHTML = '';
        }
        this.currentAnalysis = null;
    }
    
    deleteAnalysis(cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            // Add fade-out animation
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(100px)';
            
            // Remove the card after animation
            setTimeout(() => {
                card.remove();
            }, 300);
        }
    }
    
    exportStatistics() {
        if (!this.currentAnalysis) {
            this.showError('No statistics to export');
            return;
        }
        
        try {
            // Create a simple text report
            let report = `Statistics Report - ${this.currentAnalysis.type}\n`;
            report += `Column: ${this.currentAnalysis.column}\n`;
            report += `Generated: ${new Date().toLocaleString()}\n\n`;
            
            // Add specific statistics based on analysis type
            switch (this.currentAnalysis.type) {
                case 'descriptive':
                    const values = this.getNumericValues(this.currentAnalysis.column);
                    const stats = this.calculateDescriptiveStats(values);
                    report += `Descriptive Statistics:\n`;
                    Object.entries(stats).forEach(([key, value]) => {
                        report += `${key}: ${value}\n`;
                    });
                    break;
                case 'correlation':
                    const matrix = this.calculateCorrelationMatrix();
                    report += `Correlation Matrix:\n`;
                    this.numericColumns.forEach(col1 => {
                        this.numericColumns.forEach(col2 => {
                            report += `${col1}-${col2}: ${matrix[col1][col2].toFixed(3)}\n`;
                        });
                    });
                    break;
                case 'outliers':
                    const values2 = this.getNumericValues(this.currentAnalysis.column);
                    const outliers = this.detectOutliers(values2);
                    report += `Outlier Analysis:\n`;
                    report += `Total outliers: ${outliers.count}\n`;
                    report += `Percentage: ${outliers.percentage}%\n`;
                    outliers.outliers.forEach(outlier => {
                        report += `Row ${outlier.index + 1}: ${outlier.value}\n`;
                    });
                    break;
            }
            
            // Create download
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `statistics-${this.currentAnalysis.type}-${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            
            this.showSuccess('Statistics exported successfully');
        } catch (error) {
            console.error('Error exporting statistics:', error);
            this.showError('Failed to export statistics');
        }
    }
    
    showError(message) {
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

// Initialize statistics when tab is clicked
function initializeStatistics() {
    const statisticsTab = document.querySelector('[data-tab="statistics"]');
    
    if (statisticsTab) {
        statisticsTab.addEventListener('click', () => {
            if (!window.statisticsManager) {
                window.statisticsManager = new StatisticsManager();
            }
        });
    }
}

// Auto-initialize if on statistics tab
document.addEventListener('DOMContentLoaded', function() {
    const statisticsTab = document.querySelector('[data-tab="statistics"]');
    const statisticsContent = document.getElementById('statistics-tab');
    
    if (statisticsTab && statisticsContent && statisticsContent.classList.contains('active')) {
        window.statisticsManager = new StatisticsManager();
    }
}); 