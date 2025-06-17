// Column Analysis functionality
class ColumnAnalyzer {
    constructor(data, columns) {
        this.data = data;
        this.columns = columns;
        this.analysis = {};
        this.initializeAnalysis();
    }
    
    initializeAnalysis() {
        this.columns.forEach(column => {
            this.analysis[column] = this.analyzeColumn(column);
        });
    }
    
    analyzeColumn(column) {
        const values = this.data.map(row => row[column]).filter(val => 
            val !== null && val !== undefined && val !== '' && val !== 'nan'
        );
        
        if (values.length === 0) {
            return this.getEmptyAnalysis(column);
        }
        
        const isNumeric = values.every(val => !isNaN(parseFloat(val)));
        
        if (isNumeric) {
            return this.analyzeNumericColumn(column, values.map(v => parseFloat(v)));
        } else {
            return this.analyzeCategoricalColumn(column, values);
        }
    }
    
    analyzeNumericColumn(column, values) {
        const sorted = values.sort((a, b) => a - b);
        const n = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const median = this.calculateMedian(sorted);
        const q1 = this.calculatePercentile(sorted, 25);
        const q3 = this.calculatePercentile(sorted, 75);
        const iqr = q3 - q1;
        const skewness = this.calculateSkewness(values, mean, stdDev);
        const kurtosis = this.calculateKurtosis(values, mean, stdDev);
        
        // Outliers using IQR method
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = values.filter(val => val < lowerBound || val > upperBound);
        
        return {
            type: 'numeric',
            column: column,
            basic: {
                count: n,
                missing: this.data.length - n,
                min: Math.min(...values),
                max: Math.max(...values),
                range: Math.max(...values) - Math.min(...values),
                sum: sum,
                mean: mean,
                median: median,
                mode: this.calculateMode(values)
            },
            dispersion: {
                variance: variance,
                stdDev: stdDev,
                coefficientOfVariation: (stdDev / mean) * 100,
                iqr: iqr,
                q1: q1,
                q3: q3
            },
            shape: {
                skewness: skewness,
                kurtosis: kurtosis,
                outliers: outliers.length,
                outlierPercentage: (outliers.length / n) * 100
            },
            percentiles: {
                p10: this.calculatePercentile(sorted, 10),
                p25: q1,
                p50: median,
                p75: q3,
                p90: this.calculatePercentile(sorted, 90)
            },
            distribution: this.calculateDistribution(values, 10)
        };
    }
    
    analyzeCategoricalColumn(column, values) {
        const valueCounts = {};
        values.forEach(val => {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
        });
        
        const uniqueValues = Object.keys(valueCounts);
        const totalCount = values.length;
        const mostFrequent = Object.entries(valueCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        return {
            type: 'categorical',
            column: column,
            basic: {
                count: totalCount,
                missing: this.data.length - totalCount,
                uniqueValues: uniqueValues.length,
                mostFrequent: mostFrequent[0],
                mostFrequentCount: mostFrequent[1],
                mostFrequentPercentage: (mostFrequent[1] / totalCount) * 100
            },
            distribution: Object.entries(valueCounts).map(([value, count]) => ({
                value: value,
                count: count,
                percentage: (count / totalCount) * 100
            })).sort((a, b) => b.count - a.count)
        };
    }
    
    getEmptyAnalysis(column) {
        return {
            type: 'empty',
            column: column,
            basic: {
                count: 0,
                missing: this.data.length
            }
        };
    }
    
    calculateMedian(sortedValues) {
        const n = sortedValues.length;
        if (n % 2 === 0) {
            return (sortedValues[n/2 - 1] + sortedValues[n/2]) / 2;
        } else {
            return sortedValues[Math.floor(n/2)];
        }
    }
    
    calculatePercentile(sortedValues, percentile) {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        
        if (upper === lower) return sortedValues[lower];
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
    
    calculateMode(values) {
        const counts = {};
        values.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(counts));
        return Object.keys(counts).filter(key => counts[key] === maxCount);
    }
    
    calculateSkewness(values, mean, stdDev) {
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
        return (sum / n) * Math.sqrt(n * (n - 1)) / (n - 2);
    }
    
    calculateKurtosis(values, mean, stdDev) {
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
        return (sum / n) - 3;
    }
    
    calculateDistribution(values, bins) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / bins;
        
        const distribution = Array(bins).fill(0);
        values.forEach(val => {
            const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
            distribution[binIndex]++;
        });
        
        return distribution.map((count, index) => ({
            range: `${(min + index * binSize).toFixed(2)} - ${(min + (index + 1) * binSize).toFixed(2)}`,
            count: count,
            percentage: (count / values.length) * 100
        }));
    }
    
    renderColumnCards() {
        const grid = document.getElementById('columnAnalysisGrid');
        console.log('Column analysis grid found:', grid);
        
        if (!grid) {
            console.error('Column analysis grid not found');
            return;
        }
        
        grid.innerHTML = '';
        console.log('Rendering cards for columns:', this.columns);
        console.log('Analysis data:', this.analysis);
        
        this.columns.forEach(column => {
            const analysis = this.analysis[column];
            console.log(`Creating card for column: ${column}`, analysis);
            const card = this.createColumnCard(analysis);
            grid.appendChild(card);
        });
        
        console.log('Column cards rendered');
    }
    
    createColumnCard(analysis) {
        const card = document.createElement('div');
        card.className = 'column-card';
        card.onclick = () => this.showDetailedAnalysis(analysis);
        
        if (analysis.type === 'empty') {
            card.innerHTML = `
                <div class="column-card-header">
                    <div class="column-name">${analysis.column}</div>
                    <div class="column-type">Empty Column</div>
                </div>
                <div class="column-card-body">
                    <div class="quick-stats">
                        <div class="stat-item">
                            <div class="stat-value">0</div>
                            <div class="stat-label">Values</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.missing}</div>
                            <div class="stat-label">Missing</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (analysis.type === 'numeric') {
            card.innerHTML = `
                <div class="column-card-header">
                    <div class="column-name">${analysis.column}</div>
                    <div class="column-type">Numeric</div>
                </div>
                <div class="column-card-body">
                    <div class="quick-stats">
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.mean.toFixed(2)}</div>
                            <div class="stat-label">Mean</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.median.toFixed(2)}</div>
                            <div class="stat-label">Median</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.dispersion.stdDev.toFixed(2)}</div>
                            <div class="stat-label">Std Dev</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.shape.outliers}</div>
                            <div class="stat-label">Outliers</div>
                        </div>
                    </div>
                </div>
                <div class="column-card-footer">
                    <button class="view-details-btn">View Detailed Analysis</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="column-card-header">
                    <div class="column-name">${analysis.column}</div>
                    <div class="column-type">Categorical</div>
                </div>
                <div class="column-card-body">
                    <div class="quick-stats">
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.uniqueValues}</div>
                            <div class="stat-label">Unique</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.mostFrequentCount}</div>
                            <div class="stat-label">Most Freq</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.mostFrequentPercentage.toFixed(1)}%</div>
                            <div class="stat-label">Top %</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysis.basic.missing}</div>
                            <div class="stat-label">Missing</div>
                        </div>
                    </div>
                </div>
                <div class="column-card-footer">
                    <button class="view-details-btn">View Detailed Analysis</button>
                </div>
            `;
        }
        
        return card;
    }
    
    showDetailedAnalysis(analysis) {
        const modal = this.createDetailedModal(analysis);
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.column-modal-close');
        const overlay = modal.querySelector('.column-modal-overlay');
        
        closeBtn.onclick = () => document.body.removeChild(modal);
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(modal);
            }
        };
    }
    
    createDetailedModal(analysis) {
        const modal = document.createElement('div');
        modal.className = 'column-modal-overlay';
        
        if (analysis.type === 'numeric') {
            modal.innerHTML = this.createNumericModalContent(analysis);
        } else if (analysis.type === 'categorical') {
            modal.innerHTML = this.createCategoricalModalContent(analysis);
        } else {
            modal.innerHTML = this.createEmptyModalContent(analysis);
        }
        
        return modal;
    }
    
    createNumericModalContent(analysis) {
        return `
            <div class="column-modal">
                <div class="column-modal-header">
                    <div class="column-modal-title">${analysis.column}</div>
                    <div class="column-modal-subtitle">Numeric Column Analysis</div>
                    <button class="column-modal-close">&times;</button>
                </div>
                <div class="column-modal-body">
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Basic Statistics</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Count</div>
                                <div class="analysis-card-value">${analysis.basic.count}</div>
                                <div class="analysis-card-formula">n = Σ(x_i)</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Mean</div>
                                <div class="analysis-card-value">${analysis.basic.mean.toFixed(4)}</div>
                                <div class="analysis-card-formula">μ = Σ(x_i) / n</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Median</div>
                                <div class="analysis-card-value">${analysis.basic.median.toFixed(4)}</div>
                                <div class="analysis-card-formula">Q₂ = middle value</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Mode</div>
                                <div class="analysis-card-value">${analysis.basic.mode.join(', ')}</div>
                                <div class="analysis-card-formula">most frequent value(s)</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Standard Deviation</div>
                                <div class="analysis-card-value">${analysis.dispersion.stdDev.toFixed(4)}</div>
                                <div class="analysis-card-formula">σ = √(Σ(x_i - μ)² / n)</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Variance</div>
                                <div class="analysis-card-value">${analysis.dispersion.variance.toFixed(4)}</div>
                                <div class="analysis-card-formula">σ² = Σ(x_i - μ)² / n</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Dispersion & Shape</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Range</div>
                                <div class="analysis-card-value">${analysis.basic.range.toFixed(4)}</div>
                                <div class="analysis-card-formula">max - min</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">IQR</div>
                                <div class="analysis-card-value">${analysis.dispersion.iqr.toFixed(4)}</div>
                                <div class="analysis-card-formula">Q₃ - Q₁</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Coefficient of Variation</div>
                                <div class="analysis-card-value">${analysis.dispersion.coefficientOfVariation.toFixed(2)}%</div>
                                <div class="analysis-card-formula">CV = (σ/μ) × 100</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Skewness</div>
                                <div class="analysis-card-value">${analysis.shape.skewness.toFixed(4)}</div>
                                <div class="analysis-card-formula">γ₁ = Σ((x_i - μ)³/σ³) / n</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Kurtosis</div>
                                <div class="analysis-card-value">${analysis.shape.kurtosis.toFixed(4)}</div>
                                <div class="analysis-card-formula">γ₂ = Σ((x_i - μ)⁴/σ⁴) / n - 3</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Outliers</div>
                                <div class="analysis-card-value">${analysis.shape.outliers} (${analysis.shape.outlierPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-formula">IQR × 1.5 rule</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Percentiles</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">10th Percentile</div>
                                <div class="analysis-card-value">${analysis.percentiles.p10.toFixed(4)}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">25th Percentile (Q₁)</div>
                                <div class="analysis-card-value">${analysis.percentiles.p25.toFixed(4)}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">50th Percentile (Q₂)</div>
                                <div class="analysis-card-value">${analysis.percentiles.p50.toFixed(4)}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">75th Percentile (Q₃)</div>
                                <div class="analysis-card-value">${analysis.percentiles.p75.toFixed(4)}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">90th Percentile</div>
                                <div class="analysis-card-value">${analysis.percentiles.p90.toFixed(4)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="formula-section">
                        <h4 class="formula-title">Mathematical Formulas</h4>
                        <div class="formula-content">
// Mean (Arithmetic Average)
μ = (x₁ + x₂ + ... + xₙ) / n

// Variance
σ² = Σ(x_i - μ)² / n

// Standard Deviation
σ = √σ² = √(Σ(x_i - μ)² / n)

// Skewness (Fisher-Pearson coefficient)
γ₁ = [n/(n-1)(n-2)] × Σ((x_i - μ)³/σ³)

// Kurtosis (Excess kurtosis)
γ₂ = [n(n+1)/(n-1)(n-2)(n-3)] × Σ((x_i - μ)⁴/σ⁴) - 3(n-1)²/(n-2)(n-3)

// Coefficient of Variation
CV = (σ/μ) × 100%

// Interquartile Range
IQR = Q₃ - Q₁

// Outlier Detection (IQR method)
Lower bound = Q₁ - 1.5 × IQR
Upper bound = Q₃ + 1.5 × IQR
                        </div>
                        <div class="formula-explanation">
                            <strong>Skewness:</strong> Measures asymmetry. γ₁ > 0: right-skewed, γ₁ < 0: left-skewed, γ₁ ≈ 0: symmetric<br>
                            <strong>Kurtosis:</strong> Measures tail heaviness. γ₂ > 0: heavy tails, γ₂ < 0: light tails, γ₂ ≈ 0: normal distribution<br>
                            <strong>Coefficient of Variation:</strong> Relative measure of dispersion, useful for comparing different scales
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Distribution Analysis</h3>
                        <div class="distribution-section">
                            ${analysis.distribution.map(bin => `
                                <div class="distribution-bar">
                                    <div class="distribution-label">${bin.range}</div>
                                    <div class="distribution-bar-bg">
                                        <div class="distribution-bar-fill" style="width: ${bin.percentage}%"></div>
                                    </div>
                                    <div class="distribution-value">${bin.count} (${bin.percentage.toFixed(1)}%)</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createCategoricalModalContent(analysis) {
        return `
            <div class="column-modal">
                <div class="column-modal-header">
                    <div class="column-modal-title">${analysis.column}</div>
                    <div class="column-modal-subtitle">Categorical Column Analysis</div>
                    <button class="column-modal-close">&times;</button>
                </div>
                <div class="column-modal-body">
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Basic Statistics</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Total Count</div>
                                <div class="analysis-card-value">${analysis.basic.count}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Unique Values</div>
                                <div class="analysis-card-value">${analysis.basic.uniqueValues}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Most Frequent</div>
                                <div class="analysis-card-value">${analysis.basic.mostFrequent}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Frequency</div>
                                <div class="analysis-card-value">${analysis.basic.mostFrequentCount}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Percentage</div>
                                <div class="analysis-card-value">${analysis.basic.mostFrequentPercentage.toFixed(1)}%</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Missing Values</div>
                                <div class="analysis-card-value">${analysis.basic.missing}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Value Distribution</h3>
                        <div class="distribution-section">
                            ${analysis.distribution.map(item => `
                                <div class="distribution-bar">
                                    <div class="distribution-label">${item.value}</div>
                                    <div class="distribution-bar-bg">
                                        <div class="distribution-bar-fill" style="width: ${item.percentage}%"></div>
                                    </div>
                                    <div class="distribution-value">${item.count} (${item.percentage.toFixed(1)}%)</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="formula-section">
                        <h4 class="formula-title">Categorical Analysis Formulas</h4>
                        <div class="formula-content">
// Frequency
f_i = count of value i

// Relative Frequency
p_i = f_i / n

// Percentage
P_i = p_i × 100%

// Mode
Mode = value with highest frequency

// Entropy (Information Theory)
H = -Σ(p_i × log₂(p_i))

// Gini Index (Diversity Measure)
G = 1 - Σ(p_i²)

// Simpson's Diversity Index
D = Σ(p_i²)
                        </div>
                        <div class="formula-explanation">
                            <strong>Entropy:</strong> Measures uncertainty/information content. Higher entropy = more diverse data<br>
                            <strong>Gini Index:</strong> Measures inequality/diversity. G = 0: single category, G = 1: maximum diversity<br>
                            <strong>Simpson's Index:</strong> Probability that two randomly selected items are the same category
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createEmptyModalContent(analysis) {
        return `
            <div class="column-modal">
                <div class="column-modal-header">
                    <div class="column-modal-title">${analysis.column}</div>
                    <div class="column-modal-subtitle">Empty Column</div>
                    <button class="column-modal-close">&times;</button>
                </div>
                <div class="column-modal-body">
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">Column Status</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Valid Values</div>
                                <div class="analysis-card-value">0</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Missing Values</div>
                                <div class="analysis-card-value">${analysis.basic.missing}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Missing Percentage</div>
                                <div class="analysis-card-value">100%</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="formula-section">
                        <h4 class="formula-title">Data Quality Metrics</h4>
                        <div class="formula-content">
// Completeness Rate
Completeness = (Valid Values / Total Rows) × 100%

// Missing Rate
Missing Rate = (Missing Values / Total Rows) × 100%

// Data Quality Score
Quality Score = Completeness Rate / 100
                        </div>
                        <div class="formula-explanation">
                            This column contains no valid data. Consider removing it or investigating the data source.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize column analysis when tab is clicked
function initializeColumnAnalysis() {
    const columnAnalysisTab = document.querySelector('[data-tab="column-analysis"]');
    console.log('Column analysis tab found:', columnAnalysisTab);
    
    if (columnAnalysisTab) {
        columnAnalysisTab.addEventListener('click', () => {
            console.log('Column analysis tab clicked');
            console.log('window.magicalTable:', window.magicalTable);
            console.log('window.magicalTable.data:', window.magicalTable?.data);
            console.log('window.magicalTable.columns:', window.magicalTable?.columns);
            
            if (window.magicalTable && window.magicalTable.data) {
                console.log('Creating ColumnAnalyzer...');
                const analyzer = new ColumnAnalyzer(window.magicalTable.data, window.magicalTable.columns);
                console.log('Rendering column cards...');
                analyzer.renderColumnCards();
            } else {
                console.error('No magical table data available');
            }
        });
    } else {
        console.error('Column analysis tab not found');
    }
} 