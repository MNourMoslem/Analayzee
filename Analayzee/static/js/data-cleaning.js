// Data Cleaning Premium Functionality
class DataCleaningManager {
    constructor() {
        this.originalData = []; // Backup of original data
        this.data = []; // Current working data
        this.columns = [];
        this.cleaningHistory = [];
        this.currentOperation = null;
        
        console.log('DataCleaningManager initialized');
        
        this.loadData();
        this.initializeEventListeners();
        
        // Debug: Check if data was loaded
        setTimeout(() => {
            console.log('DataCleaningManager data check:', {
                originalDataLength: this.originalData.length,
                currentDataLength: this.data.length,
                columnsLength: this.columns.length
            });
        }, 1000);
    }
    
    loadData() {
        try {
            const tableData = parseDjangoJSON('tableData');
            const tableColumns = parseDjangoJSON('tableColumns');
            
            if (!tableData || !tableColumns) {
                console.error('Failed to load data for cleaning');
                this.showError('Failed to load data for cleaning');
                return;
            }
            
            // Store original data as backup
            this.originalData = JSON.parse(JSON.stringify(tableData));
            this.data = JSON.parse(JSON.stringify(tableData)); // Working copy
            this.columns = tableColumns;
            
            this.populateColumnSelect();
            console.log('Data loaded for cleaning:', {
                originalRows: this.originalData.length,
                currentRows: this.data.length,
                columns: this.columns.length
            });
            
        } catch (error) {
            console.error('Error loading data for cleaning:', error);
            this.showError('Error loading data for cleaning');
        }
    }
    
    populateColumnSelect() {
        const columnSelect = document.getElementById('cleaningColumn');
        if (!columnSelect) return;
        
        columnSelect.innerHTML = '<option value="">Choose a column...</option>';
        
        this.columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            columnSelect.appendChild(option);
        });
    }
    
    initializeEventListeners() {
        // Column selection
        const columnSelect = document.getElementById('cleaningColumn');
        if (columnSelect) {
            columnSelect.addEventListener('change', () => this.onColumnChange());
        }
        
        // Operation selection
        const operationSelect = document.getElementById('cleaningOperation');
        if (operationSelect) {
            operationSelect.addEventListener('change', () => this.onOperationChange());
        }
        
        // Apply operation button
        const applyButton = document.getElementById('applyCleaning');
        if (applyButton) {
            applyButton.addEventListener('click', () => this.applyCleaning());
        }
        
        // Preview button
        const previewButton = document.getElementById('previewCleaning');
        if (previewButton) {
            previewButton.addEventListener('click', () => this.previewCleaning());
        }
        
        // Reset button
        const resetButton = document.getElementById('resetCleaning');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetCleaning());
        }
        
        // Listen for missing action changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'missingAction') {
                this.toggleCustomValueInput();
            }
        });
    }
    
    onColumnChange() {
        const columnSelect = document.getElementById('cleaningColumn');
        const selectedColumn = columnSelect.value;
        
        if (selectedColumn) {
            this.showColumnInfo(selectedColumn);
        } else {
            this.clearPreview();
        }
    }
    
    onOperationChange() {
        const operationSelect = document.getElementById('cleaningOperation');
        const selectedOperation = operationSelect.value;
        
        if (selectedOperation) {
            this.showOperationConfig(selectedOperation);
        } else {
            this.clearOperationConfig();
        }
    }
    
    showColumnInfo(column) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        const columnData = this.data.map(row => row[column]).filter(val => val !== null && val !== undefined);
        const uniqueValues = [...new Set(columnData)].slice(0, 10);
        const missingCount = this.data.filter(row => row[column] === null || row[column] === undefined).length;
        
        const isNumeric = this.isNumericColumn(column);
        
        let stats = '';
        if (isNumeric) {
            const numericData = columnData.filter(val => !isNaN(val));
            if (numericData.length > 0) {
                const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
                const min = Math.min(...numericData);
                const max = Math.max(...numericData);
                stats = `
                    <p><strong>Statistics:</strong> Mean: ${mean.toFixed(2)}, Min: ${min}, Max: ${max}</p>
                    <p><strong>Missing Values:</strong> ${missingCount} (${((missingCount / this.data.length) * 100).toFixed(1)}%)</p>
                `;
            }
        } else {
            stats = `
                <p><strong>Unique Values:</strong> ${uniqueValues.length}</p>
                <p><strong>Missing Values:</strong> ${missingCount} (${((missingCount / this.data.length) * 100).toFixed(1)}%)</p>
            `;
        }
        
        preview.innerHTML = `
            <h3>Column: ${column}</h3>
            <p><strong>Data Type:</strong> ${isNumeric ? 'Numeric' : 'Text'}</p>
            <p><strong>Total Rows:</strong> ${this.data.length}</p>
            ${stats}
            <h4>Sample Values:</h4>
            <div class="sample-values">
                ${uniqueValues.map(val => `<span class="value-tag">${val}</span>`).join('')}
            </div>
        `;
    }
    
    showOperationConfig(operation) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        let configHTML = '';
        
        switch (operation) {
            case 'missing-values':
                configHTML = this.getMissingValuesConfig();
                break;
            case 'normalize':
                configHTML = this.getNormalizeConfig();
                break;
        }
        
        if (configHTML) {
            preview.innerHTML += `
                <div class="operation-config">
                    <h4>Operation Configuration</h4>
                    ${configHTML}
                </div>
            `;
            
            // Initialize custom value input visibility
            if (operation === 'missing-values') {
                this.toggleCustomValueInput();
            }
        }
        
        this.currentOperation = operation;
    }
    
    getMissingValuesConfig() {
        return `
            <div class="config-group">
                <label for="missingAction">Action:</label>
                <select id="missingAction">
                    <option value="fill-mean">Fill with Mean</option>
                    <option value="fill-median">Fill with Median</option>
                    <option value="fill-mode">Fill with Mode</option>
                    <option value="fill-zero">Fill with Zero</option>
                    <option value="fill-custom">Fill with Custom Value</option>
                    <option value="drop">Drop Rows</option>
                </select>
            </div>
            <div class="config-group" id="customValueGroup" style="display: none;">
                <label for="customValue">Custom Value:</label>
                <input type="text" id="customValue" placeholder="Enter custom value">
            </div>
        `;
    }
    
    getNormalizeConfig() {
        return `
            <div class="config-group">
                <label for="normalizeMethod">Normalization Method:</label>
                <select id="normalizeMethod">
                    <option value="minmax">Min-Max Scaling (0-1)</option>
                    <option value="zscore">Z-Score Standardization</option>
                    <option value="robust">Robust Scaling</option>
                </select>
            </div>
            <div class="config-group">
                <label for="normalizeRange">Target Range (Min-Max only):</label>
                <div class="range-inputs">
                    <input type="number" id="rangeMin" value="0" placeholder="Min">
                    <span>to</span>
                    <input type="number" id="rangeMax" value="1" placeholder="Max">
                </div>
            </div>
        `;
    }
    
    clearOperationConfig() {
        const preview = document.getElementById('cleaningPreview');
        if (preview) {
            const configDiv = preview.querySelector('.operation-config');
            if (configDiv) {
                configDiv.remove();
            }
        }
        this.currentOperation = null;
    }
    
    clearPreview() {
        const preview = document.getElementById('cleaningPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="preview-placeholder">
                    <p>Select a column and operation to see preview</p>
                </div>
            `;
        }
    }
    
    async applyCleaning() {
        const columnSelect = document.getElementById('cleaningColumn');
        const operationSelect = document.getElementById('cleaningOperation');
        
        const column = columnSelect.value;
        const operation = operationSelect.value;
        
        if (!column || !operation) {
            this.showError('Please select both a column and an operation');
            return;
        }
        
        if (!this.isNumericColumn(column)) {
            this.showError('This operation only works with numeric columns');
            return;
        }
        
        this.showLoading();
        
        try {
            const config = this.getOperationConfig();
            const result = this.applyCleaningLocally(column, operation, config);
            
            if (result.success) {
                this.showSuccess('Cleaning operation applied successfully');
                this.addToHistory(column, operation, config);
                this.updateData(result.cleaned_data);
                this.showPreview(result.cleaned_data, column);
            } else {
                this.showError(result.error || 'Failed to apply cleaning operation');
            }
        } catch (error) {
            console.error('Error applying cleaning:', error);
            this.showError('Error applying cleaning operation');
        }
        
        this.hideLoading();
    }
    
    applyCleaningLocally(column, operation, config) {
        try {
            // Create a copy of the current data
            const cleanedData = JSON.parse(JSON.stringify(this.data));
            
            switch (operation) {
                case 'missing-values':
                    return this.applyMissingValues(cleanedData, column, config);
                case 'normalize':
                    return this.applyNormalize(cleanedData, column, config);
                default:
                    return { success: false, error: 'Unknown operation' };
            }
        } catch (error) {
            console.error('Error in applyCleaningLocally:', error);
            return { success: false, error: error.message };
        }
    }
    
    applyMissingValues(data, column, config) {
        const action = config.action || 'fill-mean';
        let stats = { missing_filled: 0 };
        
        // Find missing values (including NaN)
        const missingIndices = [];
        data.forEach((row, index) => {
            const value = row[column];
            if (this.isEmptyValue(value)) {
                missingIndices.push(index);
            }
        });
        
        if (missingIndices.length === 0) {
            return { success: true, cleaned_data: data, stats: { missing_filled: 0 } };
        }
        
        // Calculate fill value based on action
        let fillValue = null;
        if (action === 'fill-mean' && this.isNumericColumn(column)) {
            const numericValues = data.map(row => row[column]).filter(val => !this.isEmptyValue(val) && typeof val === 'number');
            fillValue = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
        } else if (action === 'fill-median' && this.isNumericColumn(column)) {
            const numericValues = data.map(row => row[column]).filter(val => !this.isEmptyValue(val) && typeof val === 'number');
            numericValues.sort((a, b) => a - b);
            fillValue = numericValues.length > 0 ? numericValues[Math.floor(numericValues.length / 2)] : 0;
        } else if (action === 'fill-mode') {
            const values = data.map(row => row[column]).filter(val => !this.isEmptyValue(val));
            const valueCounts = {};
            values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);
            const maxCount = Math.max(...Object.values(valueCounts));
            fillValue = Object.keys(valueCounts).find(key => valueCounts[key] === maxCount);
        } else if (action === 'fill-zero') {
            fillValue = 0;
        } else if (action === 'fill-custom') {
            fillValue = config.custom_value || 'Custom Value';
        } else if (action === 'drop') {
            // Remove rows with missing values
            missingIndices.reverse().forEach(index => {
                data.splice(index, 1);
            });
            stats = { rows_dropped: missingIndices.length };
            return { success: true, cleaned_data: data, stats };
        }
        
        // Apply changes
        missingIndices.forEach(index => {
            data[index][column] = fillValue;
        });
        
        stats.missing_filled = missingIndices.length;
        return { success: true, cleaned_data: data, stats };
    }
    
    applyNormalize(data, column, config) {
        if (!this.isNumericColumn(column)) {
            return { success: false, error: 'Normalization only works with numeric columns' };
        }
        
        const method = config.method || 'minmax';
        const rangeMin = config.range_min || 0;
        const rangeMax = config.range_max || 1;
        
        const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
        
        if (values.length === 0) {
            return { success: false, error: 'No numeric values found for normalization' };
        }
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        
        data.forEach(row => {
            if (row[column] === null || row[column] === undefined || isNaN(row[column])) return;
            
            let newValue = row[column];
            
            if (method === 'minmax') {
                newValue = ((row[column] - min) / (max - min)) * (rangeMax - rangeMin) + rangeMin;
            } else if (method === 'zscore') {
                newValue = (row[column] - mean) / std;
            } else if (method === 'robust') {
                const sorted = [...values].sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                newValue = (row[column] - q1) / iqr;
            }
            
            row[column] = newValue;
        });
        
        const stats = {
            original_min: min,
            original_max: max,
            new_min: Math.min(...data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val))),
            new_max: Math.max(...data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val)))
        };
        
        return { success: true, cleaned_data: data, stats };
    }
    
    getOperationConfig() {
        const config = {};
        
        switch (this.currentOperation) {
            case 'missing-values':
                config.action = document.getElementById('missingAction')?.value || 'fill-mean';
                config.custom_value = document.getElementById('customValue')?.value || '';
                break;
            case 'normalize':
                config.method = document.getElementById('normalizeMethod')?.value || 'minmax';
                config.range_min = parseFloat(document.getElementById('rangeMin')?.value || 0);
                config.range_max = parseFloat(document.getElementById('rangeMax')?.value || 1);
                break;
        }
        
        return config;
    }
    
    addToHistory(column, operation, config) {
        const historyItem = {
            id: Date.now(),
            column: column,
            operation: operation,
            config: config,
            timestamp: new Date().toLocaleString(),
            description: this.getOperationDescription(operation, config)
        };
        
        this.cleaningHistory.unshift(historyItem);
        this.updateHistoryDisplay();
    }
    
    getOperationDescription(operation, config) {
        const operationNames = {
            'missing-values': 'Handle Missing Values',
            'normalize': 'Normalize Data'
        };
        
        let description = operationNames[operation] || operation;
        
        if (config.action) {
            description += ` - ${config.action}`;
        } else if (config.method) {
            description += ` - ${config.method}`;
        }
        
        return description;
    }
    
    updateHistoryDisplay() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        historyList.innerHTML = this.cleaningHistory.map(item => `
            <div class="history-item">
                <h4>${item.description}</h4>
                <p>Column: ${item.column}</p>
                <div class="timestamp">${item.timestamp}</div>
            </div>
        `).join('');
    }
    
    updateData(newData) {
        this.data = newData;
        
        // Update the magical table if it exists
        if (window.magicalTable) {
            window.magicalTable.data = newData;
            window.magicalTable.filteredData = [...newData];
            window.magicalTable.render();
        }
        
        // Update charts if they exist
        if (window.chartsManager) {
            window.chartsManager.data = newData;
        }
    }
    
    showPreview(data, column) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        const sampleData = data.slice(0, 10);
        const columns = Object.keys(sampleData[0] || {});
        
        let tableHTML = `
            <h3>Preview - After Cleaning</h3>
            <table class="preview-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        sampleData.forEach(row => {
            tableHTML += '<tr>';
            columns.forEach(col => {
                const value = row[col];
                const isChanged = col === column;
                const cellClass = isChanged ? 'changes-highlight' : '';
                tableHTML += `<td class="${cellClass}">${value !== null && value !== undefined ? value : ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        preview.innerHTML = tableHTML;
    }
    
    previewCleaning() {
        const columnSelect = document.getElementById('cleaningColumn');
        const operationSelect = document.getElementById('cleaningOperation');
        
        const column = columnSelect.value;
        const operation = operationSelect.value;
        
        if (!column || !operation) {
            this.showError('Please select both a column and an operation');
            return;
        }
        
        if (!this.isNumericColumn(column)) {
            this.showError('This operation only works with numeric columns');
            return;
        }
        
        this.showLoading();
        
        try {
            const config = this.getOperationConfig();
            const previewData = this.generatePreviewData(column, operation, config);
            this.showPreviewComparison(previewData, column);
        } catch (error) {
            console.error('Error generating preview:', error);
            this.showError('Error generating preview: ' + error.message);
        }
        
        this.hideLoading();
    }
    
    generatePreviewData(column, operation, config) {
        // Create a copy of the data for preview
        const previewData = JSON.parse(JSON.stringify(this.data.slice(0, 20))); // Preview first 20 rows
        
        switch (operation) {
            case 'missing-values':
                return this.previewMissingValues(previewData, column, config);
            case 'normalize':
                return this.previewNormalize(previewData, column, config);
            default:
                return { before: previewData, after: previewData, changes: [] };
        }
    }
    
    previewMissingValues(data, column, config) {
        const before = [...data];
        const after = [...data];
        const changes = [];
        
        const action = config.action || 'fill-mean';
        
        // Find missing values (including NaN)
        const missingIndices = [];
        data.forEach((row, index) => {
            const value = row[column];
            if (this.isEmptyValue(value)) {
                missingIndices.push(index);
            }
        });
        
        if (missingIndices.length === 0) {
            changes.push({ type: 'info', message: 'No missing values found in sample data' });
            return { before, after, changes };
        }
        
        // Calculate fill value based on action
        let fillValue = null;
        if (action === 'fill-mean' && this.isNumericColumn(column)) {
            const numericValues = data.map(row => row[column]).filter(val => !this.isEmptyValue(val) && typeof val === 'number');
            fillValue = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
        } else if (action === 'fill-median' && this.isNumericColumn(column)) {
            const numericValues = data.map(row => row[column]).filter(val => !this.isEmptyValue(val) && typeof val === 'number');
            numericValues.sort((a, b) => a - b);
            fillValue = numericValues.length > 0 ? numericValues[Math.floor(numericValues.length / 2)] : 0;
        } else if (action === 'fill-mode') {
            const values = data.map(row => row[column]).filter(val => !this.isEmptyValue(val));
            const valueCounts = {};
            values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);
            const maxCount = Math.max(...Object.values(valueCounts));
            fillValue = Object.keys(valueCounts).find(key => valueCounts[key] === maxCount);
        } else if (action === 'fill-zero') {
            fillValue = 0;
        } else if (action === 'fill-custom') {
            fillValue = config.custom_value || 'Custom Value';
        } else if (action === 'drop') {
            // Remove rows with missing values
            missingIndices.reverse().forEach(index => {
                data.splice(index, 1);
            });
            changes.push({ type: 'info', message: `Removed ${missingIndices.length} rows with missing values` });
            return { before, after, changes };
        }
        
        // Apply changes
        missingIndices.forEach(index => {
            data[index][column] = fillValue;
        });
        
        changes.push({ type: 'info', message: `Filled ${missingIndices.length} missing values with ${fillValue}` });
        return { before, after, changes };
    }
    
    previewNormalize(data, column, config) {
        const before = [...data];
        const after = [...data];
        const changes = [];
        
        if (!this.isNumericColumn(column)) {
            return { before, after, changes: [{ type: 'error', message: 'Normalization only works with numeric columns' }] };
        }
        
        const method = config.method || 'minmax';
        const rangeMin = config.range_min || 0;
        const rangeMax = config.range_max || 1;
        
        const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
        
        if (values.length === 0) {
            return { before, after, changes: [{ type: 'error', message: 'No numeric values found for normalization' }] };
        }
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        
        data.forEach((row, index) => {
            if (row[column] === null || row[column] === undefined || isNaN(row[column])) return;
            
            const oldValue = row[column];
            let newValue = oldValue;
            
            if (method === 'minmax') {
                newValue = ((row[column] - min) / (max - min)) * (rangeMax - rangeMin) + rangeMin;
            } else if (method === 'zscore') {
                newValue = (row[column] - mean) / std;
            } else if (method === 'robust') {
                const sorted = [...values].sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                newValue = (row[column] - q1) / iqr;
            }
            
            if (newValue !== oldValue) {
                changes.push({
                    type: 'normalized',
                    index,
                    oldValue,
                    newValue,
                    message: `Row ${index + 1}: ${oldValue.toFixed(2)} → ${newValue.toFixed(2)}`
                });
                after[index][column] = newValue;
            }
        });
        
        if (changes.length === 0) {
            changes.push({ type: 'info', message: 'No normalization needed for sample data' });
        }
        
        return { before, after, changes };
    }
    
    showPreviewComparison(previewData, column) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        const { before, after, changes } = previewData;
        
        let comparisonHTML = `
            <h3>Preview: ${this.getOperationDescription(this.currentOperation, this.getOperationConfig())}</h3>
            <div class="preview-summary">
                <p><strong>Column:</strong> ${column}</p>
                <p><strong>Changes:</strong> ${changes.length} modifications will be applied</p>
            </div>
        `;
        
        // Show changes summary
        if (changes.length > 0) {
            comparisonHTML += `
                <div class="changes-summary">
                    <h4>Changes Summary:</h4>
                    <div class="changes-list">
            `;
            
            changes.forEach(change => {
                const changeClass = change.type === 'error' ? 'error' : 
                                  change.type === 'info' ? 'info' : 'change';
                comparisonHTML += `
                    <div class="change-item ${changeClass}">
                        <span class="change-message">${change.message}</span>
                    </div>
                `;
            });
            
            comparisonHTML += `
                    </div>
                </div>
            `;
        }
        
        // Show before/after comparison table
        const columns = Object.keys(before[0] || {});
        comparisonHTML += `
            <div class="comparison-table">
                <h4>Before vs After Comparison (First 5 rows):</h4>
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Row</th>
                            <th>Column</th>
                            <th>Before</th>
                            <th>After</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const sampleRows = before.slice(0, 5);
        sampleRows.forEach((row, rowIndex) => {
            const beforeValue = row[column];
            const afterValue = after[rowIndex] ? after[rowIndex][column] : 'REMOVED';
            const hasChanged = beforeValue !== afterValue;
            const status = hasChanged ? 'Modified' : 'Unchanged';
            const statusClass = hasChanged ? 'modified' : 'unchanged';
            
            comparisonHTML += `
                <tr class="${statusClass}">
                    <td>${rowIndex + 1}</td>
                    <td>${column}</td>
                    <td>${beforeValue !== null && beforeValue !== undefined ? beforeValue : 'null'}</td>
                    <td>${afterValue !== null && afterValue !== undefined ? afterValue : 'null'}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                </tr>
            `;
        });
        
        comparisonHTML += `
                    </tbody>
                </table>
            </div>
            
            <div class="preview-actions">
                <button class="btn btn-secondary" onclick="window.dataCleaningManager.clearPreview()">
                    Close Preview
                </button>
            </div>
        `;
        
        preview.innerHTML = comparisonHTML;
    }
    
    resetCleaning() {
        // Restore original data
        this.data = JSON.parse(JSON.stringify(this.originalData));
        this.cleaningHistory = [];
        this.updateHistoryDisplay();
        this.clearPreview();
        
        // Reset form
        document.getElementById('cleaningColumn').value = '';
        document.getElementById('cleaningOperation').value = '';
        
        // Update other components with original data
        this.updateData(this.data);
        
        this.showSuccess('Data restored to original state');
    }
    
    isNumericColumn(column) {
        if (!this.data || this.data.length === 0) return false;
        
        const sampleValues = this.data.slice(0, 100).map(row => row[column]);
        const numericCount = sampleValues.filter(val => 
            val !== null && val !== undefined && val !== '' && !this.isNaNValue(val) && typeof val === 'number'
        ).length;
        
        return numericCount > sampleValues.length * 0.5;
    }
    
    // Helper function to detect NaN values in all forms
    isNaNValue(value) {
        if (value === null || value === undefined || value === '') {
            return false; // These are handled separately
        }
        
        // Check for string "NaN"
        if (typeof value === 'string' && value.toLowerCase() === 'nan') {
            return true;
        }
        
        // Check for actual NaN
        if (typeof value === 'number' && isNaN(value)) {
            return true;
        }
        
        // Check for other NaN-like values
        if (typeof value === 'string' && (value.toLowerCase() === 'nan' || value.toLowerCase() === 'n/a' || value.toLowerCase() === 'na')) {
            return true;
        }
        
        return false;
    }
    
    // Helper function to check if a value is empty/missing
    isEmptyValue(value) {
        return value === null || value === undefined || value === '' || this.isNaNValue(value);
    }
    
    showLoading() {
        const preview = document.getElementById('cleaningPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="cleaning-loading">
                    <div class="loading-spinner"></div>
                    <span>Processing...</span>
                </div>
            `;
        }
    }
    
    hideLoading() {
        // Loading will be replaced by preview or error
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `cleaning-${type}`;
        notification.textContent = message;
        
        const container = document.querySelector('.data-cleaning-container');
        if (container) {
            container.insertBefore(notification, container.firstChild);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
    
    toggleCustomValueInput() {
        const missingAction = document.getElementById('missingAction');
        const customValueGroup = document.getElementById('customValueGroup');
        
        if (missingAction && customValueGroup) {
            if (missingAction.value === 'fill-custom') {
                customValueGroup.style.display = 'block';
            } else {
                customValueGroup.style.display = 'none';
            }
        }
    }
}

// Initialize data cleaning when tab is clicked
function initializeDataCleaning() {
    const dataCleaningTab = document.querySelector('[data-tab="data-cleaning"]');
    
    if (dataCleaningTab) {
        dataCleaningTab.addEventListener('click', () => {
            if (!window.dataCleaningManager) {
                window.dataCleaningManager = new DataCleaningManager();
            }
        });
    }
}

// Auto-initialize if on data cleaning tab
document.addEventListener('DOMContentLoaded', function() {
    const dataCleaningTab = document.querySelector('[data-tab="data-cleaning"]');
    const dataCleaningContent = document.getElementById('data-cleaning-tab');
    
    if (dataCleaningTab && dataCleaningContent && dataCleaningContent.classList.contains('active')) {
        window.dataCleaningManager = new DataCleaningManager();
    }
});

// Data Cleaning Operations
const cleaningOperations = {
    'missing-values': {
        name: 'Handle Missing Values',
        configId: 'missingValuesConfig'
    },
    'outliers': {
        name: 'Detect & Handle Outliers',
        configId: 'outliersConfig'
    },
    'data-type': {
        name: 'Convert Data Type',
        configId: 'dataTypeConfig'
    },
    'text-cleaning': {
        name: 'Text Cleaning',
        configId: 'textCleaningConfig'
    },
    'duplicates': {
        name: 'Remove Duplicates',
        configId: 'duplicatesConfig'
    },
    'normalize': {
        name: 'Normalize Data',
        configId: null
    }
};

// Operation selection handler
document.getElementById('cleaningOperation').addEventListener('change', function() {
    const selectedOperation = this.value;
    
    // Hide all config sections
    document.querySelectorAll('.operation-config').forEach(config => {
        config.style.display = 'none';
    });
    
    // Show config for selected operation
    if (selectedOperation && cleaningOperations[selectedOperation] && cleaningOperations[selectedOperation].configId) {
        const configElement = document.getElementById(cleaningOperations[selectedOperation].configId);
        if (configElement) {
            configElement.style.display = 'block';
        }
    }
    
    // Enable/disable apply button
    const applyButton = document.getElementById('applyCleaningOperation');
    if (applyButton) {
        applyButton.disabled = !selectedOperation;
    }
});

// Missing values fill method change handler
document.getElementById('fillMethod').addEventListener('change', function() {
    const customValueGroup = document.getElementById('customValueGroup');
    if (this.value === 'custom') {
        customValueGroup.style.display = 'block';
    } else {
        customValueGroup.style.display = 'none';
    }
});

// Enhanced data cleaning function
function cleanData(operation, config) {
    if (!window.currentData || !window.currentData.length) {
        showNotification('No data available for cleaning', 'error');
        return null;
    }

    const cleanedData = JSON.parse(JSON.stringify(window.currentData));
    
    switch (operation) {
        case 'missing-values':
            return handleMissingValues(cleanedData, config);
        case 'outliers':
            return handleOutliers(cleanedData, config);
        case 'data-type':
            return convertDataType(cleanedData, config);
        case 'text-cleaning':
            return cleanText(cleanedData, config);
        case 'duplicates':
            return handleDuplicates(cleanedData, config);
        case 'normalize':
            return normalizeData(cleanedData);
        default:
            showNotification('Unknown operation', 'error');
            return null;
    }
}

// Handle missing values
function handleMissingValues(data, config) {
    const { fillMethod, customValue } = config;
    
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (isNaNValue(row[key])) {
                switch (fillMethod) {
                    case 'mean':
                        row[key] = calculateMean(data, key);
                        break;
                    case 'median':
                        row[key] = calculateMedian(data, key);
                        break;
                    case 'mode':
                        row[key] = calculateMode(data, key);
                        break;
                    case 'zero':
                        row[key] = 0;
                        break;
                    case 'custom':
                        row[key] = customValue;
                        break;
                    case 'drop':
                        // This will be handled by filtering
                        break;
                }
            }
        });
    });
    
    // Remove rows with missing values if drop method is selected
    if (fillMethod === 'drop') {
        return data.filter(row => {
            return !Object.values(row).some(value => isNaNValue(value));
        });
    }
    
    return data;
}

// Handle outliers
function handleOutliers(data, config) {
    const { outlierMethod, outlierAction, outlierThreshold } = config;
    
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (isNumeric(row[key])) {
                const isOutlier = detectOutlier(row[key], data, key, outlierMethod, outlierThreshold);
                
                if (isOutlier) {
                    switch (outlierAction) {
                        case 'remove':
                            row[key] = null; // Will be filtered out
                            break;
                        case 'cap':
                            row[key] = capOutlier(row[key], data, key, outlierMethod, outlierThreshold);
                            break;
                        case 'mark':
                            row[`${key}_outlier`] = true;
                            break;
                    }
                }
            }
        });
    });
    
    // Remove rows with null values if remove action is selected
    if (outlierAction === 'remove') {
        return data.filter(row => {
            return !Object.values(row).some(value => value === null);
        });
    }
    
    return data;
}

// Convert data type
function convertDataType(data, config) {
    const { targetDataType, dateFormat } = config;
    
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (row[key] !== null && row[key] !== undefined) {
                try {
                    switch (targetDataType) {
                        case 'number':
                            row[key] = parseFloat(row[key]) || 0;
                            break;
                        case 'text':
                            row[key] = String(row[key]);
                            break;
                        case 'date':
                            row[key] = parseDate(row[key], dateFormat);
                            break;
                        case 'boolean':
                            row[key] = Boolean(row[key]);
                            break;
                    }
                } catch (error) {
                    console.warn(`Failed to convert ${key} to ${targetDataType}:`, error);
                }
            }
        });
    });
    
    return data;
}

// Clean text
function cleanText(data, config) {
    const {
        removeSpecialChars,
        convertToLowercase,
        removeExtraSpaces,
        trimWhitespace,
        removeNumbers,
        customReplacements
    } = config;
    
    // Parse custom replacements
    const replacements = {};
    if (customReplacements) {
        customReplacements.split(',').forEach(replacement => {
            const [old, new_] = replacement.split('=');
            if (old && new_) {
                replacements[old.trim()] = new_.trim();
            }
        });
    }
    
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (typeof row[key] === 'string') {
                let cleaned = row[key];
                
                // Apply custom replacements
                Object.keys(replacements).forEach(old => {
                    cleaned = cleaned.replace(new RegExp(old, 'g'), replacements[old]);
                });
                
                if (removeSpecialChars) {
                    cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, '');
                }
                
                if (convertToLowercase) {
                    cleaned = cleaned.toLowerCase();
                }
                
                if (removeExtraSpaces) {
                    cleaned = cleaned.replace(/\s+/g, ' ');
                }
                
                if (trimWhitespace) {
                    cleaned = cleaned.trim();
                }
                
                if (removeNumbers) {
                    cleaned = cleaned.replace(/\d/g, '');
                }
                
                row[key] = cleaned;
            }
        });
    });
    
    return data;
}

// Handle duplicates
function handleDuplicates(data, config) {
    const { duplicateAction, duplicateColumns } = config;
    
    const columnsToCheck = duplicateColumns ? 
        duplicateColumns.split(',').map(col => col.trim()) : 
        Object.keys(data[0] || {});
    
    const seen = new Set();
    const duplicates = [];
    
    data.forEach((row, index) => {
        const key = columnsToCheck.map(col => row[col]).join('|');
        
        if (seen.has(key)) {
            duplicates.push(index);
        } else {
            seen.add(key);
        }
    });
    
    switch (duplicateAction) {
        case 'remove':
            return data.filter((_, index) => !duplicates.includes(index));
        case 'keep_first':
            return data.filter((_, index) => !duplicates.includes(index));
        case 'keep_last':
            const toRemove = new Set();
            duplicates.forEach(index => {
                // Find the first occurrence and mark it for removal
                const key = columnsToCheck.map(col => data[index][col]).join('|');
                for (let i = 0; i < index; i++) {
                    const currentKey = columnsToCheck.map(col => data[i][col]).join('|');
                    if (currentKey === key) {
                        toRemove.add(i);
                        break;
                    }
                }
            });
            return data.filter((_, index) => !toRemove.has(index));
        case 'mark':
            data.forEach((row, index) => {
                row['_duplicate'] = duplicates.includes(index);
            });
            return data;
    }
    
    return data;
}

// Helper functions
function detectOutlier(value, data, column, method, threshold) {
    const values = data.map(row => row[column]).filter(v => isNumeric(v));
    
    switch (method) {
        case 'iqr':
            return detectOutlierIQR(value, values, threshold);
        case 'zscore':
            return detectOutlierZScore(value, values, threshold);
        case 'percentile':
            return detectOutlierPercentile(value, values, threshold);
        default:
            return false;
    }
}

function detectOutlierIQR(value, values, threshold) {
    const sorted = values.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;
    
    return value < lowerBound || value > upperBound;
}

function detectOutlierZScore(value, values, threshold) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const zScore = Math.abs((value - mean) / stdDev);
    
    return zScore > threshold;
}

function detectOutlierPercentile(value, values, threshold) {
    const sorted = values.sort((a, b) => a - b);
    const lowerPercentile = sorted[Math.floor(sorted.length * (1 - threshold / 100))];
    const upperPercentile = sorted[Math.floor(sorted.length * (threshold / 100))];
    
    return value < lowerPercentile || value > upperPercentile;
}

function capOutlier(value, data, column, method, threshold) {
    const values = data.map(row => row[column]).filter(v => isNumeric(v));
    
    switch (method) {
        case 'iqr':
            const sorted = values.sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - threshold * iqr;
            const upperBound = q3 + threshold * iqr;
            
            if (value < lowerBound) return lowerBound;
            if (value > upperBound) return upperBound;
            break;
        case 'percentile':
            const sortedValues = values.sort((a, b) => a - b);
            const lowerPercentile = sortedValues[Math.floor(sortedValues.length * (1 - threshold / 100))];
            const upperPercentile = sortedValues[Math.floor(sortedValues.length * (threshold / 100))];
            
            if (value < lowerPercentile) return lowerPercentile;
            if (value > upperPercentile) return upperPercentile;
            break;
    }
    
    return value;
}

function parseDate(value, format) {
    // Simple date parsing - can be enhanced
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString().split('T')[0];
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function calculateMean(data, column) {
    const values = data.map(row => row[column]).filter(val => !isNaN(val) && typeof val === 'number');
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateMedian(data, column) {
    const values = data.map(row => row[column]).filter(val => !isNaN(val) && typeof val === 'number').sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

function calculateMode(data, column) {
    const values = data.map(row => row[column]).filter(val => !isNaN(val));
    const valueCounts = {};
    values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);
    const maxCount = Math.max(...Object.values(valueCounts));
    return Object.keys(valueCounts).find(key => valueCounts[key] === maxCount);
}

function normalizeData(data) {
    // Implementation of normalization logic
    return data; // Placeholder, actual implementation needed
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `cleaning-${type}`;
    notification.textContent = message;
    
    const container = document.querySelector('.data-cleaning-container');
    if (container) {
        container.insertBefore(notification, container.firstChild);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Apply cleaning operation
document.getElementById('applyCleaningOperation').addEventListener('click', function() {
    const operation = document.getElementById('cleaningOperation').value;
    
    if (!operation) {
        showNotification('Please select an operation', 'error');
        return;
    }
    
    if (!window.currentData || !window.currentData.length) {
        showNotification('No data available for cleaning', 'error');
        return;
    }
    
    // Get configuration based on operation
    let config = {};
    
    switch (operation) {
        case 'missing-values':
            config = {
                fillMethod: document.getElementById('fillMethod').value,
                customValue: document.getElementById('customValue').value
            };
            break;
        case 'outliers':
            config = {
                outlierMethod: document.getElementById('outlierMethod').value,
                outlierAction: document.getElementById('outlierAction').value,
                outlierThreshold: parseFloat(document.getElementById('outlierThreshold').value)
            };
            break;
        case 'data-type':
            config = {
                targetDataType: document.getElementById('targetDataType').value,
                dateFormat: document.getElementById('dateFormat').value
            };
            break;
        case 'text-cleaning':
            config = {
                removeSpecialChars: document.getElementById('removeSpecialChars').checked,
                convertToLowercase: document.getElementById('convertToLowercase').checked,
                removeExtraSpaces: document.getElementById('removeExtraSpaces').checked,
                trimWhitespace: document.getElementById('trimWhitespace').checked,
                removeNumbers: document.getElementById('removeNumbers').checked,
                customReplacements: document.getElementById('customReplacements').value
            };
            break;
        case 'duplicates':
            config = {
                duplicateAction: document.getElementById('duplicateAction').value,
                duplicateColumns: document.getElementById('duplicateColumns').value
            };
            break;
        case 'normalize':
            config = {};
            break;
    }
    
    // Perform the cleaning operation
    const cleanedData = cleanData(operation, config);
    
    if (cleanedData) {
        // Show preview
        showCleaningPreview(cleanedData, operation, config);
    }
}); 