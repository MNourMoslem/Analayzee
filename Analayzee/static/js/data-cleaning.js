// Data Cleaning & Transformation functionality
class DataCleaning {
    constructor() {
        this.originalData = null;
        this.currentData = null;
        this.cleaningHistory = [];
        this.isAuthenticated = false;
        
        this.initializeEventListeners();
        this.checkAuthentication();
    }
    
    checkAuthentication() {
        // Check if user is authenticated by looking for auth-required-container
        const authContainer = document.querySelector('.auth-required-container');
        this.isAuthenticated = !authContainer;
        
        if (this.isAuthenticated) {
            this.initializeCleaning();
        }
    }
    
    initializeCleaning() {
        // Get data from magical table if available
        if (window.magicalTable) {
            this.originalData = [...window.magicalTable.data];
            this.currentData = [...window.magicalTable.data];
            this.populateColumnSelect();
        }
    }
    
    populateColumnSelect() {
        const columnSelect = document.getElementById('cleaningColumn');
        if (!columnSelect || !this.originalData || this.originalData.length === 0) return;
        
        // Clear existing options
        columnSelect.innerHTML = '<option value="">Choose a column...</option>';
        
        // Get column names from the first row
        const columns = Object.keys(this.originalData[0]);
        
        columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            columnSelect.appendChild(option);
        });
    }
    
    initializeEventListeners() {
        // Column selection change
        const columnSelect = document.getElementById('cleaningColumn');
        if (columnSelect) {
            columnSelect.addEventListener('change', (e) => {
                this.onColumnChange(e.target.value);
            });
        }
        
        // Operation selection change
        const operationSelect = document.getElementById('cleaningOperation');
        if (operationSelect) {
            operationSelect.addEventListener('change', (e) => {
                this.onOperationChange(e.target.value);
            });
        }
        
        // Apply cleaning
        const applyBtn = document.getElementById('applyCleaning');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyCleaning();
            });
        }
        
        // Reset cleaning
        const resetBtn = document.getElementById('resetCleaning');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetCleaning();
            });
        }
        
        // Preview cleaning
        const previewBtn = document.getElementById('previewCleaning');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewCleaning();
            });
        }
    }
    
    onColumnChange(columnName) {
        if (!columnName) {
            this.showPreviewPlaceholder();
            return;
        }
        
        // Show column info in preview
        this.showColumnInfo(columnName);
    }
    
    onOperationChange(operation) {
        if (!operation) {
            this.showPreviewPlaceholder();
            return;
        }
        
        const columnName = document.getElementById('cleaningColumn').value;
        if (!columnName) {
            this.showPreviewPlaceholder();
            return;
        }
        
        // Show operation preview
        this.showOperationPreview(columnName, operation);
    }
    
    showPreviewPlaceholder() {
        const preview = document.getElementById('cleaningPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="preview-placeholder">
                    <p>Select a column and operation to see preview</p>
                </div>
            `;
        }
    }
    
    showColumnInfo(columnName) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        const columnData = this.currentData.map(row => row[columnName]).filter(val => val !== null && val !== undefined);
        const dataType = this.detectDataType(columnData);
        const missingCount = this.currentData.length - columnData.length;
        const uniqueCount = new Set(columnData).size;
        
        preview.innerHTML = `
            <div class="column-info">
                <h3>Column: ${columnName}</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Data Type:</span>
                        <span class="info-value">${dataType}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Rows:</span>
                        <span class="info-value">${this.currentData.length}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Missing Values:</span>
                        <span class="info-value">${missingCount}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Unique Values:</span>
                        <span class="info-value">${uniqueCount}</span>
                    </div>
                </div>
                <div class="sample-data">
                    <h4>Sample Data (first 10 rows):</h4>
                    <div class="sample-list">
                        ${columnData.slice(0, 10).map(val => `<div class="sample-item">${val}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    showOperationPreview(columnName, operation) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        let previewContent = '';
        
        switch (operation) {
            case 'missing-values':
                previewContent = this.getMissingValuesPreview(columnName);
                break;
            case 'outliers':
                previewContent = this.getOutliersPreview(columnName);
                break;
            case 'data-type':
                previewContent = this.getDataTypePreview(columnName);
                break;
            case 'text-cleaning':
                previewContent = this.getTextCleaningPreview(columnName);
                break;
            case 'duplicates':
                previewContent = this.getDuplicatesPreview();
                break;
            case 'normalize':
                previewContent = this.getNormalizePreview(columnName);
                break;
            default:
                previewContent = '<p>Operation preview not available</p>';
        }
        
        preview.innerHTML = previewContent;
    }
    
    getMissingValuesPreview(columnName) {
        const missingCount = this.currentData.filter(row => 
            row[columnName] === null || row[columnName] === undefined || row[columnName] === ''
        ).length;
        
        return `
            <div class="operation-preview">
                <h3>Handle Missing Values</h3>
                <p>Found ${missingCount} missing values in column "${columnName}"</p>
                <div class="preview-options">
                    <label>
                        <input type="radio" name="missing-action" value="fill-mean" checked>
                        Fill with mean (for numeric columns)
                    </label>
                    <label>
                        <input type="radio" name="missing-action" value="fill-median">
                        Fill with median
                    </label>
                    <label>
                        <input type="radio" name="missing-action" value="fill-zero">
                        Fill with zero
                    </label>
                    <label>
                        <input type="radio" name="missing-action" value="fill-custom">
                        Fill with custom value: <input type="text" id="custom-value" placeholder="Enter value">
                    </label>
                    <label>
                        <input type="radio" name="missing-action" value="drop">
                        Drop rows with missing values
                    </label>
                </div>
            </div>
        `;
    }
    
    getOutliersPreview(columnName) {
        const columnData = this.currentData.map(row => row[columnName]).filter(val => 
            val !== null && val !== undefined && !isNaN(val)
        );
        
        if (columnData.length === 0) {
            return '<p>No numeric data found for outlier detection</p>';
        }
        
        const sorted = columnData.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const outliers = columnData.filter(val => val < lowerBound || val > upperBound);
        
        return `
            <div class="operation-preview">
                <h3>Detect & Handle Outliers</h3>
                <p>Found ${outliers.length} outliers in column "${columnName}"</p>
                <div class="outlier-stats">
                    <p>Q1: ${q1.toFixed(2)} | Q3: ${q3.toFixed(2)} | IQR: ${iqr.toFixed(2)}</p>
                    <p>Lower bound: ${lowerBound.toFixed(2)} | Upper bound: ${upperBound.toFixed(2)}</p>
                </div>
                <div class="preview-options">
                    <label>
                        <input type="radio" name="outlier-action" value="remove" checked>
                        Remove outliers (${outliers.length} rows)
                    </label>
                    <label>
                        <input type="radio" name="outlier-action" value="cap">
                        Cap outliers to bounds
                    </label>
                    <label>
                        <input type="radio" name="outlier-action" value="flag">
                        Flag outliers (add new column)
                    </label>
                </div>
            </div>
        `;
    }
    
    getDataTypePreview(columnName) {
        const currentType = this.detectDataType(this.currentData.map(row => row[columnName]));
        
        return `
            <div class="operation-preview">
                <h3>Convert Data Type</h3>
                <p>Current type: <strong>${currentType}</strong></p>
                <div class="preview-options">
                    <label>
                        <input type="radio" name="data-type-action" value="string" ${currentType === 'string' ? 'checked' : ''}>
                        Convert to String
                    </label>
                    <label>
                        <input type="radio" name="data-type-action" value="number" ${currentType === 'number' ? 'checked' : ''}>
                        Convert to Number
                    </label>
                    <label>
                        <input type="radio" name="data-type-action" value="date" ${currentType === 'date' ? 'checked' : ''}>
                        Convert to Date
                    </label>
                    <label>
                        <input type="radio" name="data-type-action" value="boolean" ${currentType === 'boolean' ? 'checked' : ''}>
                        Convert to Boolean
                    </label>
                </div>
            </div>
        `;
    }
    
    getTextCleaningPreview(columnName) {
        return `
            <div class="operation-preview">
                <h3>Text Cleaning</h3>
                <div class="preview-options">
                    <label>
                        <input type="checkbox" name="text-action" value="trim" checked>
                        Trim whitespace
                    </label>
                    <label>
                        <input type="checkbox" name="text-action" value="lowercase">
                        Convert to lowercase
                    </label>
                    <label>
                        <input type="checkbox" name="text-action" value="uppercase">
                        Convert to uppercase
                    </label>
                    <label>
                        <input type="checkbox" name="text-action" value="titlecase">
                        Convert to title case
                    </label>
                    <label>
                        <input type="checkbox" name="text-action" value="remove-special">
                        Remove special characters
                    </label>
                </div>
            </div>
        `;
    }
    
    getDuplicatesPreview() {
        const duplicateCount = this.getDuplicateCount();
        
        return `
            <div class="operation-preview">
                <h3>Remove Duplicates</h3>
                <p>Found ${duplicateCount} duplicate rows</p>
                <div class="preview-options">
                    <label>
                        <input type="radio" name="duplicate-action" value="remove-all" checked>
                        Remove all duplicates
                    </label>
                    <label>
                        <input type="radio" name="duplicate-action" value="keep-first">
                        Keep first occurrence
                    </label>
                    <label>
                        <input type="radio" name="duplicate-action" value="keep-last">
                        Keep last occurrence
                    </label>
                </div>
            </div>
        `;
    }
    
    getNormalizePreview(columnName) {
        const columnData = this.currentData.map(row => row[columnName]).filter(val => 
            val !== null && val !== undefined && !isNaN(val)
        );
        
        if (columnData.length === 0) {
            return '<p>No numeric data found for normalization</p>';
        }
        
        return `
            <div class="operation-preview">
                <h3>Normalize Data</h3>
                <div class="preview-options">
                    <label>
                        <input type="radio" name="normalize-action" value="min-max" checked>
                        Min-Max scaling (0 to 1)
                    </label>
                    <label>
                        <input type="radio" name="normalize-action" value="z-score">
                        Z-score normalization
                    </label>
                    <label>
                        <input type="radio" name="normalize-action" value="decimal">
                        Decimal scaling
                    </label>
                </div>
            </div>
        `;
    }
    
    detectDataType(data) {
        const sample = data.filter(val => val !== null && val !== undefined).slice(0, 100);
        
        if (sample.length === 0) return 'unknown';
        
        // Check if all are numbers
        const allNumbers = sample.every(val => !isNaN(val) && typeof val !== 'boolean');
        if (allNumbers) return 'number';
        
        // Check if all are booleans
        const allBooleans = sample.every(val => typeof val === 'boolean' || val === 'true' || val === 'false');
        if (allBooleans) return 'boolean';
        
        // Check if all are dates
        const allDates = sample.every(val => !isNaN(Date.parse(val)));
        if (allDates) return 'date';
        
        return 'string';
    }
    
    getDuplicateCount() {
        const seen = new Set();
        let duplicates = 0;
        
        this.currentData.forEach(row => {
            const key = JSON.stringify(row);
            if (seen.has(key)) {
                duplicates++;
            } else {
                seen.add(key);
            }
        });
        
        return duplicates;
    }
    
    applyCleaning() {
        if (!this.isAuthenticated) {
            alert('Please log in to use data cleaning features');
            return;
        }
        
        const columnName = document.getElementById('cleaningColumn').value;
        const operation = document.getElementById('cleaningOperation').value;
        
        if (!columnName || !operation) {
            alert('Please select both a column and an operation');
            return;
        }
        
        // Send request to backend
        this.sendCleaningRequest(columnName, operation);
    }
    
    sendCleaningRequest(columnName, operation) {
        const formData = new FormData();
        formData.append('column', columnName);
        formData.append('operation', operation);
        formData.append('data', JSON.stringify(this.currentData));
        
        // Get operation-specific parameters
        const params = this.getOperationParameters(operation);
        Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
        });
        
        fetch('/apply-cleaning/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': this.getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.currentData = data.cleaned_data;
                this.addToHistory(columnName, operation, data.stats);
                this.updateMagicalTable();
                this.showSuccess('Data cleaning applied successfully');
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while applying the cleaning operation');
        });
    }
    
    getOperationParameters(operation) {
        const params = {};
        
        switch (operation) {
            case 'missing-values':
                const missingAction = document.querySelector('input[name="missing-action"]:checked');
                if (missingAction) {
                    params.action = missingAction.value;
                    if (missingAction.value === 'fill-custom') {
                        params.custom_value = document.getElementById('custom-value').value;
                    }
                }
                break;
            case 'outliers':
                const outlierAction = document.querySelector('input[name="outlier-action"]:checked');
                if (outlierAction) {
                    params.action = outlierAction.value;
                }
                break;
            case 'data-type':
                const dataTypeAction = document.querySelector('input[name="data-type-action"]:checked');
                if (dataTypeAction) {
                    params.target_type = dataTypeAction.value;
                }
                break;
            case 'text-cleaning':
                const textActions = document.querySelectorAll('input[name="text-action"]:checked');
                params.actions = Array.from(textActions).map(action => action.value);
                break;
            case 'duplicates':
                const duplicateAction = document.querySelector('input[name="duplicate-action"]:checked');
                if (duplicateAction) {
                    params.action = duplicateAction.value;
                }
                break;
            case 'normalize':
                const normalizeAction = document.querySelector('input[name="normalize-action"]:checked');
                if (normalizeAction) {
                    params.method = normalizeAction.value;
                }
                break;
        }
        
        return params;
    }
    
    addToHistory(columnName, operation, stats) {
        const historyItem = {
            id: Date.now(),
            column: columnName,
            operation: operation,
            stats: stats,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.cleaningHistory.unshift(historyItem);
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        historyList.innerHTML = this.cleaningHistory.map(item => `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-operation">${this.getOperationDisplayName(item.operation)}</span>
                    <span class="history-time">${item.timestamp}</span>
                </div>
                <div class="history-details">
                    Column: ${item.column} | ${this.getStatsDisplay(item.stats)}
                </div>
            </div>
        `).join('');
    }
    
    getOperationDisplayName(operation) {
        const names = {
            'missing-values': 'Handle Missing Values',
            'outliers': 'Handle Outliers',
            'data-type': 'Convert Data Type',
            'text-cleaning': 'Text Cleaning',
            'duplicates': 'Remove Duplicates',
            'normalize': 'Normalize Data'
        };
        return names[operation] || operation;
    }
    
    getStatsDisplay(stats) {
        if (!stats) return '';
        
        const parts = [];
        if (stats.rows_affected) parts.push(`${stats.rows_affected} rows affected`);
        if (stats.missing_filled) parts.push(`${stats.missing_filled} missing values filled`);
        if (stats.outliers_removed) parts.push(`${stats.outliers_removed} outliers removed`);
        if (stats.duplicates_removed) parts.push(`${stats.duplicates_removed} duplicates removed`);
        
        return parts.join(', ');
    }
    
    updateMagicalTable() {
        if (window.magicalTable) {
            window.magicalTable.data = [...this.currentData];
            window.magicalTable.filteredData = [...this.currentData];
            window.magicalTable.render();
        }
    }
    
    resetCleaning() {
        if (!this.isAuthenticated) {
            alert('Please log in to use data cleaning features');
            return;
        }
        
        if (confirm('Are you sure you want to reset all cleaning operations? This will restore the original data.')) {
            this.currentData = [...this.originalData];
            this.cleaningHistory = [];
            this.updateMagicalTable();
            this.updateHistoryDisplay();
            this.showPreviewPlaceholder();
            this.showSuccess('Data reset to original state');
        }
    }
    
    previewCleaning() {
        if (!this.isAuthenticated) {
            alert('Please log in to use data cleaning features');
            return;
        }
        
        // This would show a preview without actually applying changes
        alert('Preview functionality coming soon!');
    }
    
    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        return token ? token.value : '';
    }
    
    showSuccess(message) {
        if (window.magicalTable && window.magicalTable.showSuccess) {
            window.magicalTable.showSuccess(message);
        } else {
            alert(message);
        }
    }
}

// Initialize data cleaning when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.dataCleaning = new DataCleaning();
}); 