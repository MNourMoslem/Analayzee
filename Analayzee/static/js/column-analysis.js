// Column Analysis functionality
class ColumnAnalyzer {
    constructor(data, columns) {
        this.data = data;
        this.columns = columns;
        this.analysis = {};
        this.initializeAnalysis();
    }
    
    // Utility function to format column names
    formatColumnName(columnName) {
        // Replace underscores with spaces
        let formatted = columnName.replace(/_/g, ' ');
        
        // Handle camelCase by adding spaces before capital letters
        formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
        
        // Capitalize first letter of each word
        formatted = formatted.replace(/\b\w/g, l => l.toUpperCase());
        
        // Handle special cases like "ID" -> "ID", "URL" -> "URL"
        formatted = formatted.replace(/\b(Id|Url|Api|Sql|Html|Css|Js|Xml|Json)\b/gi, (match) => match.toUpperCase());
        
        return formatted;
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
        
        // Additional insights
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const coefficientOfVariation = (stdDev / mean) * 100;
        
        // Data quality insights
        const missingPercentage = ((this.data.length - n) / this.data.length) * 100;
        const zeroCount = values.filter(v => v === 0).length;
        const negativeCount = values.filter(v => v < 0).length;
        const positiveCount = values.filter(v => v > 0).length;
        
        // Distribution insights
        const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis) < 2;
        const isSkewed = Math.abs(skewness) > 1;
        const hasHighVariability = coefficientOfVariation > 50;
        
        return {
            type: 'numeric',
            column: column,
            basic: {
                count: n,
                missing: this.data.length - n,
                missingPercentage: missingPercentage,
                min: min,
                max: max,
                range: range,
                sum: sum,
                mean: mean,
                median: median,
                mode: this.calculateMode(values)
            },
            dispersion: {
                variance: variance,
                stdDev: stdDev,
                coefficientOfVariation: coefficientOfVariation,
                iqr: iqr,
                q1: q1,
                q3: q3
            },
            shape: {
                skewness: skewness,
                kurtosis: kurtosis,
                outliers: outliers.length,
                outlierPercentage: (outliers.length / n) * 100,
                isNormal: isNormal,
                isSkewed: isSkewed,
                hasHighVariability: hasHighVariability
            },
            percentiles: {
                p10: this.calculatePercentile(sorted, 10),
                p25: q1,
                p50: median,
                p75: q3,
                p90: this.calculatePercentile(sorted, 90)
            },
            dataQuality: {
                zeroCount: zeroCount,
                zeroPercentage: (zeroCount / n) * 100,
                negativeCount: negativeCount,
                negativePercentage: (negativeCount / n) * 100,
                positiveCount: positiveCount,
                positivePercentage: (positiveCount / n) * 100
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
        
        // Additional insights
        const missingPercentage = ((this.data.length - totalCount) / this.data.length) * 100;
        const emptyStringCount = values.filter(v => v === '' || v === ' ').length;
        const nullLikeCount = values.filter(v => v === 'null' || v === 'NULL' || v === 'None' || v === 'none').length;
        
        // Distribution insights
        const isBalanced = uniqueValues.length > 1 && 
            Math.max(...Object.values(valueCounts)) / Math.min(...Object.values(valueCounts)) < 3;
        const hasHighCardinality = uniqueValues.length > totalCount * 0.5;
        const isLowCardinality = uniqueValues.length < 5;
        
        return {
            type: 'categorical',
            column: column,
            basic: {
                count: totalCount,
                missing: this.data.length - totalCount,
                missingPercentage: missingPercentage,
                uniqueValues: uniqueValues.length,
                mostFrequent: mostFrequent[0],
                mostFrequentCount: mostFrequent[1],
                mostFrequentPercentage: (mostFrequent[1] / totalCount) * 100
            },
            dataQuality: {
                emptyStringCount: emptyStringCount,
                emptyStringPercentage: (emptyStringCount / totalCount) * 100,
                nullLikeCount: nullLikeCount,
                nullLikePercentage: (nullLikeCount / totalCount) * 100,
                validValues: totalCount - emptyStringCount - nullLikeCount,
                validPercentage: ((totalCount - emptyStringCount - nullLikeCount) / totalCount) * 100
            },
            insights: {
                isBalanced: isBalanced,
                hasHighCardinality: hasHighCardinality,
                isLowCardinality: isLowCardinality,
                diversityIndex: uniqueValues.length / totalCount
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
        
        if (analysis.type === 'empty') {
            card.innerHTML = `
                <div class="column-card-header">
                    <div class="column-name">${this.formatColumnName(analysis.column)}</div>
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
                <div class="column-card-footer">
                    <div class="card-actions">
                        <button class="view-details-btn">View Details</button>
                        <button class="export-btn" title="Export Analysis">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        } else if (analysis.type === 'numeric') {
            card.innerHTML = `
                <div class="column-card-header">
                    <div class="column-name">${this.formatColumnName(analysis.column)}</div>
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
                    <div class="card-actions">
                        <button class="view-details-btn">View Details</button>
                        <button class="export-btn" title="Export Analysis">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="column-card-header">
                    <div class="column-name">${this.formatColumnName(analysis.column)}</div>
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
                    <div class="card-actions">
                        <button class="view-details-btn">View Details</button>
                        <button class="export-btn" title="Export Analysis">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Store analysis data and analyzer reference
        card.analysis = analysis;
        card.analyzer = this;
        
        // Add event listeners
        const viewDetailsBtn = card.querySelector('.view-details-btn');
        const exportBtn = card.querySelector('.export-btn');
        
        viewDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDetailedAnalysis(analysis);
        });
        
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exportAnalysis(analysis);
        });
        
        return card;
    }
    
    exportAnalysis(analysis) {
        try {
            // Create export data with version information
            const exportData = {
                metadata: {
                    version: "1.0.0",
                    format: "analayzee-column-analysis",
                    generated: new Date().toISOString(),
                    tool: "Analayzee Column Analyzer",
                    description: "Column analysis data exported from Analayzee"
                },
                dataset: {
                    totalRows: this.data.length,
                    totalColumns: this.columns.length,
                    columnName: analysis.column,
                    formattedColumnName: this.formatColumnName(analysis.column)
                },
                analysis: analysis
            };
            
            // Create and download JSON file
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `analayzee-column-analysis-${analysis.column.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showSuccess(`Exported analysis for "${this.formatColumnName(analysis.column)}"`);
        } catch (error) {
            console.error('Error exporting analysis:', error);
            this.showError('Failed to export analysis');
        }
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
                    <div class="column-modal-title">${this.formatColumnName(analysis.column)}</div>
                    <div class="column-modal-subtitle">Numeric Column Analysis</div>
                    <button class="column-modal-close">&times;</button>
                </div>
                <div class="column-modal-body">
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📊 Basic Statistics</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Total Values</div>
                                <div class="analysis-card-value">${analysis.basic.count}</div>
                                <div class="analysis-card-description">Valid data points</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Missing Values</div>
                                <div class="analysis-card-value">${analysis.basic.missing} (${analysis.basic.missingPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Empty or null entries</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Mean (Average)</div>
                                <div class="analysis-card-value">${analysis.basic.mean.toFixed(4)}</div>
                                <div class="analysis-card-description">Arithmetic average</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Median</div>
                                <div class="analysis-card-value">${analysis.basic.median.toFixed(4)}</div>
                                <div class="analysis-card-description">Middle value (50th percentile)</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Mode</div>
                                <div class="analysis-card-value">${analysis.basic.mode.join(', ')}</div>
                                <div class="analysis-card-description">Most frequent value(s)</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Range</div>
                                <div class="analysis-card-value">${analysis.basic.range.toFixed(4)}</div>
                                <div class="analysis-card-description">Max - Min</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📈 Dispersion & Variability</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Standard Deviation</div>
                                <div class="analysis-card-value">${analysis.dispersion.stdDev.toFixed(4)}</div>
                                <div class="analysis-card-description">${analysis.shape.hasHighVariability ? 'High variability' : 'Moderate variability'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Coefficient of Variation</div>
                                <div class="analysis-card-value">${analysis.dispersion.coefficientOfVariation.toFixed(2)}%</div>
                                <div class="analysis-card-description">${analysis.shape.hasHighVariability ? 'High relative variability' : 'Low relative variability'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Interquartile Range (IQR)</div>
                                <div class="analysis-card-value">${analysis.dispersion.iqr.toFixed(4)}</div>
                                <div class="analysis-card-description">Middle 50% of data</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Variance</div>
                                <div class="analysis-card-value">${analysis.dispersion.variance.toFixed(4)}</div>
                                <div class="analysis-card-description">Average squared deviation</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📊 Percentiles</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">10th Percentile</div>
                                <div class="analysis-card-value">${analysis.percentiles.p10.toFixed(4)}</div>
                                <div class="analysis-card-description">10% of values are below this</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">25th Percentile (Q1)</div>
                                <div class="analysis-card-value">${analysis.percentiles.p25.toFixed(4)}</div>
                                <div class="analysis-card-description">25% of values are below this</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">75th Percentile (Q3)</div>
                                <div class="analysis-card-value">${analysis.percentiles.p75.toFixed(4)}</div>
                                <div class="analysis-card-description">75% of values are below this</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">90th Percentile</div>
                                <div class="analysis-card-value">${analysis.percentiles.p90.toFixed(4)}</div>
                                <div class="analysis-card-description">90% of values are below this</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">🔍 Data Quality & Distribution</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Zero Values</div>
                                <div class="analysis-card-value">${analysis.dataQuality.zeroCount} (${analysis.dataQuality.zeroPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Values equal to zero</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Negative Values</div>
                                <div class="analysis-card-value">${analysis.dataQuality.negativeCount} (${analysis.dataQuality.negativePercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Values less than zero</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Positive Values</div>
                                <div class="analysis-card-value">${analysis.dataQuality.positiveCount} (${analysis.dataQuality.positivePercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Values greater than zero</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Outliers</div>
                                <div class="analysis-card-value">${analysis.shape.outliers} (${analysis.shape.outlierPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Values outside 1.5 × IQR range</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📋 Distribution Shape</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Skewness</div>
                                <div class="analysis-card-value">${analysis.shape.skewness.toFixed(4)}</div>
                                <div class="analysis-card-description">${analysis.shape.isSkewed ? (analysis.shape.skewness > 0 ? 'Right-skewed distribution' : 'Left-skewed distribution') : 'Approximately symmetric'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Kurtosis</div>
                                <div class="analysis-card-value">${analysis.shape.kurtosis.toFixed(4)}</div>
                                <div class="analysis-card-description">${Math.abs(analysis.shape.kurtosis) > 2 ? 'Heavy tails' : 'Normal tails'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Distribution Type</div>
                                <div class="analysis-card-value">${analysis.shape.isNormal ? 'Normal-like' : 'Non-normal'}</div>
                                <div class="analysis-card-description">Based on skewness and kurtosis</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Data Completeness</div>
                                <div class="analysis-card-value">${(100 - analysis.basic.missingPercentage).toFixed(1)}%</div>
                                <div class="analysis-card-description">Percentage of valid data</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📊 Value Distribution</h3>
                        <div class="distribution-section">
                            ${analysis.distribution.map(item => `
                                <div class="distribution-bar">
                                    <div class="distribution-label">${item.range}</div>
                                    <div class="distribution-bar-bg">
                                        <div class="distribution-bar-fill" style="width: ${item.percentage}%"></div>
                                    </div>
                                    <div class="distribution-value">${item.count} (${item.percentage.toFixed(1)}%)</div>
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
                    <div class="column-modal-title">${this.formatColumnName(analysis.column)}</div>
                    <div class="column-modal-subtitle">Categorical Column Analysis</div>
                    <button class="column-modal-close">&times;</button>
                </div>
                <div class="column-modal-body">
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📊 Basic Statistics</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Total Values</div>
                                <div class="analysis-card-value">${analysis.basic.count}</div>
                                <div class="analysis-card-description">Valid data points</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Missing Values</div>
                                <div class="analysis-card-value">${analysis.basic.missing} (${analysis.basic.missingPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Empty or null entries</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Unique Categories</div>
                                <div class="analysis-card-value">${analysis.basic.uniqueValues}</div>
                                <div class="analysis-card-description">Distinct values</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Most Frequent</div>
                                <div class="analysis-card-value">${analysis.basic.mostFrequent}</div>
                                <div class="analysis-card-description">Most common value</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Most Frequent Count</div>
                                <div class="analysis-card-value">${analysis.basic.mostFrequentCount} (${analysis.basic.mostFrequentPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Frequency of top value</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Data Completeness</div>
                                <div class="analysis-card-value">${(100 - analysis.basic.missingPercentage).toFixed(1)}%</div>
                                <div class="analysis-card-description">Percentage of valid data</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">🔍 Data Quality</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Empty Strings</div>
                                <div class="analysis-card-value">${analysis.dataQuality.emptyStringCount} (${analysis.dataQuality.emptyStringPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Blank or whitespace values</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Null-like Values</div>
                                <div class="analysis-card-value">${analysis.dataQuality.nullLikeCount} (${analysis.dataQuality.nullLikePercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">"null", "NULL", "None" values</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Valid Values</div>
                                <div class="analysis-card-value">${analysis.dataQuality.validValues} (${analysis.dataQuality.validPercentage.toFixed(1)}%)</div>
                                <div class="analysis-card-description">Meaningful data points</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Diversity Index</div>
                                <div class="analysis-card-value">${(analysis.insights.diversityIndex * 100).toFixed(1)}%</div>
                                <div class="analysis-card-description">Unique values / Total values</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📋 Distribution Insights</h3>
                        <div class="analysis-grid-2">
                            <div class="analysis-card">
                                <div class="analysis-card-title">Distribution Type</div>
                                <div class="analysis-card-value">${analysis.insights.isBalanced ? 'Balanced' : 'Imbalanced'}</div>
                                <div class="analysis-card-description">${analysis.insights.isBalanced ? 'Values are relatively evenly distributed' : 'Values are unevenly distributed'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Cardinality</div>
                                <div class="analysis-card-value">${analysis.insights.hasHighCardinality ? 'High' : analysis.insights.isLowCardinality ? 'Low' : 'Medium'}</div>
                                <div class="analysis-card-description">${analysis.insights.hasHighCardinality ? 'Many unique values' : analysis.insights.isLowCardinality ? 'Few unique values' : 'Moderate unique values'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Concentration</div>
                                <div class="analysis-card-value">${analysis.basic.mostFrequentPercentage > 50 ? 'High' : analysis.basic.mostFrequentPercentage > 25 ? 'Medium' : 'Low'}</div>
                                <div class="analysis-card-description">${analysis.basic.mostFrequentPercentage > 50 ? 'Top value dominates' : analysis.basic.mostFrequentPercentage > 25 ? 'Moderate concentration' : 'Well distributed'}</div>
                            </div>
                            <div class="analysis-card">
                                <div class="analysis-card-title">Data Quality Score</div>
                                <div class="analysis-card-value">${analysis.dataQuality.validPercentage > 90 ? 'Excellent' : analysis.dataQuality.validPercentage > 75 ? 'Good' : analysis.dataQuality.validPercentage > 50 ? 'Fair' : 'Poor'}</div>
                                <div class="analysis-card-description">Based on valid data percentage</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h3 class="analysis-section-title">📊 Value Distribution</h3>
                        <div class="distribution-section">
                            ${analysis.distribution.slice(0, 10).map(item => `
                                <div class="distribution-bar">
                                    <div class="distribution-label">${item.value}</div>
                                    <div class="distribution-bar-bg">
                                        <div class="distribution-bar-fill" style="width: ${item.percentage}%"></div>
                                    </div>
                                    <div class="distribution-value">${item.count} (${item.percentage.toFixed(1)}%)</div>
                                </div>
                            `).join('')}
                            ${analysis.distribution.length > 10 ? `
                                <div class="distribution-summary">
                                    <em>... and ${analysis.distribution.length - 10} more categories</em>
                                </div>
                            ` : ''}
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
                    <div class="column-modal-title">${this.formatColumnName(analysis.column)}</div>
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