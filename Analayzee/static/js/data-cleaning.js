// Data Cleaning Premium Functionality
class DataCleaningManager {
    constructor() {
        this.data = [];
        this.columns = [];
        this.cleaningHistory = [];
        this.currentOperation = null;
        this.operationConfig = {};
        
        console.log('DataCleaningManager initialized'); // Debug
        
        this.loadData();
        this.initializeEventListeners();
        
        // Debug: Check if data was loaded
        setTimeout(() => {
            console.log('DataCleaningManager data check:', {
                dataLength: this.data.length,
                columnsLength: this.columns.length,
                sampleData: this.data.slice(0, 2)
            });
        }, 1000);
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
        
        // Action buttons
        const applyBtn = document.getElementById('applyCleaning');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyCleaning());
        }
        
        const resetBtn = document.getElementById('resetCleaning');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetCleaning());
        }
        
        const previewBtn = document.getElementById('previewCleaning');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewCleaning());
        }
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
            
            this.data = tableData;
            this.columns = tableColumns;
            
            this.populateColumnSelect();
            console.log('Data loaded for cleaning:', {
                rows: this.data.length,
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
            case 'outliers':
                configHTML = this.getOutliersConfig();
                break;
            case 'data-type':
                configHTML = this.getDataTypeConfig();
                break;
            case 'text-cleaning':
                configHTML = this.getTextCleaningConfig();
                break;
            case 'duplicates':
                configHTML = this.getDuplicatesConfig();
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
    
    getOutliersConfig() {
        return `
            <div class="config-group">
                <label for="outlierMethod">Detection Method:</label>
                <select id="outlierMethod">
                    <option value="iqr">IQR Method</option>
                    <option value="zscore">Z-Score Method</option>
                    <option value="percentile">Percentile Method</option>
                </select>
            </div>
            <div class="config-group">
                <label for="outlierAction">Action:</label>
                <select id="outlierAction">
                    <option value="cap">Cap Outliers</option>
                    <option value="remove">Remove Outliers</option>
                    <option value="mark">Mark as Outlier</option>
                </select>
            </div>
            <div class="config-group">
                <label for="outlierThreshold">Threshold:</label>
                <input type="number" id="outlierThreshold" value="1.5" step="0.1" min="0.1">
            </div>
        `;
    }
    
    getDataTypeConfig() {
        return `
            <div class="config-group">
                <label for="targetType">Target Data Type:</label>
                <select id="targetType">
                    <option value="int">Integer</option>
                    <option value="float">Float</option>
                    <option value="string">String</option>
                    <option value="datetime">DateTime</option>
                    <option value="boolean">Boolean</option>
                </select>
            </div>
            <div class="config-group">
                <label for="conversionMethod">Conversion Method:</label>
                <select id="conversionMethod">
                    <option value="strict">Strict (Fail on Error)</option>
                    <option value="coerce">Coerce (Use Defaults)</option>
                    <option value="ignore">Ignore Errors</option>
                </select>
            </div>
        `;
    }
    
    getTextCleaningConfig() {
        return `
            <div class="config-group">
                <label for="textOperations">Text Operations:</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" id="lowercase" checked> Convert to Lowercase</label>
                    <label><input type="checkbox" id="removeSpecial"> Remove Special Characters</label>
                    <label><input type="checkbox" id="removeNumbers"> Remove Numbers</label>
                    <label><input type="checkbox" id="trimWhitespace" checked> Trim Whitespace</label>
                    <label><input type="checkbox" id="removeDuplicates"> Remove Duplicate Words</label>
                </div>
            </div>
            <div class="config-group">
                <label for="customReplacements">Custom Replacements:</label>
                <textarea id="customReplacements" placeholder="old_text:new_text&#10;another_old:another_new" rows="3"></textarea>
            </div>
        `;
    }
    
    getDuplicatesConfig() {
        return `
            <div class="config-group">
                <label for="duplicateScope">Scope:</label>
                <select id="duplicateScope">
                    <option value="all">All Columns</option>
                    <option value="selected">Selected Column Only</option>
                    <option value="subset">Subset of Columns</option>
                </select>
            </div>
            <div class="config-group">
                <label for="duplicateAction">Action:</label>
                <select id="duplicateAction">
                    <option value="remove">Remove Duplicates</option>
                    <option value="mark">Mark as Duplicate</option>
                    <option value="count">Count Duplicates</option>
                </select>
            </div>
            <div class="config-group">
                <label for="keepOption">Keep Option:</label>
                <select id="keepOption">
                    <option value="first">Keep First</option>
                    <option value="last">Keep Last</option>
                    <option value="none">Keep None</option>
                </select>
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
                    <option value="decimal">Decimal Scaling</option>
                </select>
            </div>
            <div class="config-group">
                <label for="normalizeRange">Target Range:</label>
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
            // Create a copy of the data
            const cleanedData = JSON.parse(JSON.stringify(this.data));
            
            switch (operation) {
                case 'missing-values':
                    return this.applyMissingValues(cleanedData, column, config);
                case 'outliers':
                    return this.applyOutliers(cleanedData, column, config);
                case 'data-type':
                    return this.applyDataType(cleanedData, column, config);
                case 'text-cleaning':
                    return this.applyTextCleaning(cleanedData, column, config);
                case 'duplicates':
                    return this.applyDuplicates(cleanedData, column, config);
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
        
        // Find missing values
        const missingIndices = [];
        data.forEach((row, index) => {
            if (row[column] === null || row[column] === undefined || row[column] === '') {
                missingIndices.push(index);
            }
        });
        
        if (missingIndices.length === 0) {
            return { success: true, cleaned_data: data, stats: { missing_filled: 0 } };
        }
        
        // Calculate fill value based on action
        let fillValue = null;
        if (action === 'fill-mean' && this.isNumericColumn(column)) {
            const numericValues = data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
            fillValue = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
        } else if (action === 'fill-median' && this.isNumericColumn(column)) {
            const numericValues = data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
            numericValues.sort((a, b) => a - b);
            fillValue = numericValues.length > 0 ? numericValues[Math.floor(numericValues.length / 2)] : 0;
        } else if (action === 'fill-mode') {
            const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
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
    
    applyOutliers(data, column, config) {
        if (!this.isNumericColumn(column)) {
            return { success: false, error: 'Outlier detection only works with numeric columns' };
        }
        
        const method = config.method || 'iqr';
        const action = config.action || 'cap';
        const threshold = config.threshold || 1.5;
        
        // Detect outliers
        const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
        let outliers = [];
        
        if (method === 'iqr') {
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - threshold * iqr;
            const upperBound = q3 + threshold * iqr;
            
            outliers = data.map((row, index) => {
                const val = row[column];
                return val < lowerBound || val > upperBound ? index : -1;
            }).filter(index => index !== -1);
        } else if (method === 'zscore') {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
            
            outliers = data.map((row, index) => {
                const val = row[column];
                return Math.abs((val - mean) / std) > threshold ? index : -1;
            }).filter(index => index !== -1);
        }
        
        let stats = { outliers_found: outliers.length };
        
        // Apply changes
        outliers.forEach(index => {
            const oldValue = data[index][column];
            
            if (action === 'cap') {
                if (method === 'iqr') {
                    const sorted = [...values].sort((a, b) => a - b);
                    const q1 = sorted[Math.floor(sorted.length * 0.25)];
                    const q3 = sorted[Math.floor(sorted.length * 0.75)];
                    const iqr = q3 - q1;
                    const lowerBound = q1 - threshold * iqr;
                    const upperBound = q3 + threshold * iqr;
                    
                    if (oldValue < lowerBound) data[index][column] = lowerBound;
                    else if (oldValue > upperBound) data[index][column] = upperBound;
                }
            } else if (action === 'remove') {
                data[index][column] = null; // Mark for removal
            } else if (action === 'mark') {
                data[index][`${column}_is_outlier`] = true;
            }
        });
        
        if (action === 'cap') stats.outliers_capped = outliers.length;
        else if (action === 'remove') stats.outliers_removed = outliers.length;
        else if (action === 'mark') stats.outliers_marked = outliers.length;
        
        return { success: true, cleaned_data: data, stats };
    }
    
    applyDataType(data, column, config) {
        const targetType = config.target_type || 'string';
        const method = config.method || 'coerce';
        
        let stats = { original_type: 'unknown', new_type: 'unknown' };
        
        try {
            if (targetType === 'int') {
                data.forEach(row => {
                    if (row[column] !== null && row[column] !== undefined) {
                        const converted = parseInt(row[column]);
                        if (!isNaN(converted) || method === 'coerce') {
                            row[column] = isNaN(converted) ? 0 : converted;
                        }
                    }
                });
            } else if (targetType === 'float') {
                data.forEach(row => {
                    if (row[column] !== null && row[column] !== undefined) {
                        const converted = parseFloat(row[column]);
                        if (!isNaN(converted) || method === 'coerce') {
                            row[column] = isNaN(converted) ? 0.0 : converted;
                        }
                    }
                });
            } else if (targetType === 'string') {
                data.forEach(row => {
                    if (row[column] !== null && row[column] !== undefined) {
                        row[column] = String(row[column]);
                    }
                });
            } else if (targetType === 'datetime') {
                data.forEach(row => {
                    if (row[column] !== null && row[column] !== undefined) {
                        const date = new Date(row[column]);
                        if (!isNaN(date.getTime()) || method === 'coerce') {
                            row[column] = isNaN(date.getTime()) ? null : date.toISOString();
                        }
                    }
                });
            } else if (targetType === 'boolean') {
                data.forEach(row => {
                    if (row[column] !== null && row[column] !== undefined) {
                        row[column] = ['true', '1', 1, true].includes(row[column]);
                    }
                });
            }
            
            stats.conversion_successful = true;
            return { success: true, cleaned_data: data, stats };
            
        } catch (error) {
            stats.conversion_successful = false;
            stats.error = error.message;
            return { success: false, error: error.message };
        }
    }
    
    applyTextCleaning(data, column, config) {
        const stats = { rows_processed: data.length };
        
        data.forEach(row => {
            if (row[column] === null || row[column] === undefined) return;
            
            let text = String(row[column]);
            
            if (config.trim_whitespace) {
                text = text.trim();
            }
            
            if (config.lowercase) {
                text = text.toLowerCase();
            }
            
            if (config.remove_special) {
                text = text.replace(/[^a-zA-Z0-9\s]/g, '');
            }
            
            if (config.remove_numbers) {
                text = text.replace(/\d+/g, '');
            }
            
            if (config.remove_duplicates) {
                const words = text.split(' ');
                const uniqueWords = [];
                words.forEach(word => {
                    if (!uniqueWords.includes(word)) {
                        uniqueWords.push(word);
                    }
                });
                text = uniqueWords.join(' ');
            }
            
            // Custom replacements
            if (config.custom_replacements) {
                config.custom_replacements.split('\n').forEach(line => {
                    if (line.includes(':')) {
                        const [old, new_] = line.split(':', 2);
                        text = text.replace(new RegExp(old.trim(), 'g'), new_.trim());
                    }
                });
            }
            
            row[column] = text;
        });
        
        return { success: true, cleaned_data: data, stats };
    }
    
    applyDuplicates(data, column, config) {
        const scope = config.scope || 'all';
        const action = config.action || 'remove';
        const keepOption = config.keep || 'first';
        
        const originalCount = data.length;
        
        let subset = null;
        if (scope === 'selected') {
            subset = [column];
        } else if (scope === 'subset') {
            subset = config.subset_columns || [];
        }
        
        let stats = {};
        
        if (action === 'remove') {
            const seen = new Set();
            const toRemove = [];
            
            data.forEach((row, index) => {
                const key = subset ? JSON.stringify(subset.map(col => row[col])) : JSON.stringify(row);
                if (seen.has(key)) {
                    toRemove.push(index);
                } else {
                    seen.add(key);
                }
            });
            
            toRemove.reverse().forEach(index => {
                data.splice(index, 1);
            });
            
            stats = { duplicates_removed: toRemove.length, rows_remaining: data.length };
        } else if (action === 'mark') {
            const seen = new Set();
            let duplicateCount = 0;
            
            data.forEach((row, index) => {
                const key = subset ? JSON.stringify(subset.map(col => row[col])) : JSON.stringify(row);
                if (seen.has(key)) {
                    row.is_duplicate = true;
                    duplicateCount++;
                } else {
                    seen.add(key);
                }
            });
            
            stats = { duplicates_marked: duplicateCount };
        }
        
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
            } else if (method === 'decimal') {
                const maxAbs = Math.max(...values.map(v => Math.abs(v)));
                const scale = Math.pow(10, Math.floor(Math.log10(maxAbs)));
                newValue = row[column] / scale;
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
        
        console.log('Getting config for operation:', this.currentOperation); // Debug
        
        switch (this.currentOperation) {
            case 'missing-values':
                config.action = document.getElementById('missingAction')?.value || 'fill-mean';
                config.custom_value = document.getElementById('customValue')?.value || '';
                break;
            case 'outliers':
                config.method = document.getElementById('outlierMethod')?.value || 'iqr';
                config.action = document.getElementById('outlierAction')?.value || 'cap';
                config.threshold = parseFloat(document.getElementById('outlierThreshold')?.value || 1.5);
                break;
            case 'data-type':
                config.target_type = document.getElementById('targetType')?.value || 'string';
                config.method = document.getElementById('conversionMethod')?.value || 'coerce';
                break;
            case 'text-cleaning':
                config.lowercase = document.getElementById('lowercase')?.checked || false;
                config.remove_special = document.getElementById('removeSpecial')?.checked || false;
                config.remove_numbers = document.getElementById('removeNumbers')?.checked || false;
                config.trim_whitespace = document.getElementById('trimWhitespace')?.checked || true;
                config.remove_duplicates = document.getElementById('removeDuplicates')?.checked || false;
                config.custom_replacements = document.getElementById('customReplacements')?.value || '';
                break;
            case 'duplicates':
                config.scope = document.getElementById('duplicateScope')?.value || 'all';
                config.action = document.getElementById('duplicateAction')?.value || 'remove';
                config.keep = document.getElementById('keepOption')?.value || 'first';
                break;
            case 'normalize':
                config.method = document.getElementById('normalizeMethod')?.value || 'minmax';
                config.range_min = parseFloat(document.getElementById('rangeMin')?.value || 0);
                config.range_max = parseFloat(document.getElementById('rangeMax')?.value || 1);
                break;
        }
        
        console.log('Generated config:', config); // Debug
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
            'outliers': 'Detect & Handle Outliers',
            'data-type': 'Convert Data Type',
            'text-cleaning': 'Text Cleaning',
            'duplicates': 'Remove Duplicates',
            'normalize': 'Normalize Data'
        };
        
        let description = operationNames[operation] || operation;
        
        if (config.action) {
            description += ` - ${config.action}`;
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
        
        // Set current operation for preview
        this.currentOperation = operation;
        
        this.showLoading();
        
        try {
            // Ensure operation config elements are created
            this.showOperationConfig(operation);
            
            const config = this.getOperationConfig();
            console.log('Preview config:', config); // Debug
            
            const previewData = this.generatePreviewData(column, operation, config);
            console.log('Preview data:', previewData); // Debug
            
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
            case 'outliers':
                return this.previewOutliers(previewData, column, config);
            case 'data-type':
                return this.previewDataType(previewData, column, config);
            case 'text-cleaning':
                return this.previewTextCleaning(previewData, column, config);
            case 'duplicates':
                return this.previewDuplicates(previewData, column, config);
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
        
        // Find missing values
        const missingIndices = [];
        before.forEach((row, index) => {
            if (row[column] === null || row[column] === undefined || row[column] === '') {
                missingIndices.push(index);
            }
        });
        
        if (missingIndices.length === 0) {
            return { before, after, changes: [{ type: 'info', message: 'No missing values found in this column' }] };
        }
        
        // Calculate fill value based on action
        let fillValue = null;
        if (action === 'fill-mean' && this.isNumericColumn(column)) {
            const numericValues = before.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
            fillValue = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
        } else if (action === 'fill-median' && this.isNumericColumn(column)) {
            const numericValues = before.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
            numericValues.sort((a, b) => a - b);
            fillValue = numericValues.length > 0 ? numericValues[Math.floor(numericValues.length / 2)] : 0;
        } else if (action === 'fill-mode') {
            const values = before.map(row => row[column]).filter(val => val !== null && val !== undefined);
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
                after.splice(index, 1);
            });
            changes.push({ type: 'removed', count: missingIndices.length, message: `${missingIndices.length} rows will be removed` });
            return { before, after, changes };
        }
        
        // Apply changes
        missingIndices.forEach(index => {
            after[index][column] = fillValue;
            changes.push({ 
                type: 'filled', 
                index, 
                oldValue: before[index][column], 
                newValue: fillValue,
                message: `Row ${index + 1}: "${before[index][column]}" → "${fillValue}"`
            });
        });
        
        return { before, after, changes };
    }
    
    previewOutliers(data, column, config) {
        const before = [...data];
        const after = [...data];
        const changes = [];
        
        if (!this.isNumericColumn(column)) {
            return { before, after, changes: [{ type: 'error', message: 'Outlier detection only works with numeric columns' }] };
        }
        
        const method = config.method || 'iqr';
        const action = config.action || 'cap';
        const threshold = config.threshold || 1.5;
        
        // Detect outliers
        const values = before.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
        let outliers = [];
        
        if (method === 'iqr') {
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - threshold * iqr;
            const upperBound = q3 + threshold * iqr;
            
            outliers = before.map((row, index) => {
                const val = row[column];
                return val < lowerBound || val > upperBound ? index : -1;
            }).filter(index => index !== -1);
        } else if (method === 'zscore') {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
            
            outliers = before.map((row, index) => {
                const val = row[column];
                return Math.abs((val - mean) / std) > threshold ? index : -1;
            }).filter(index => index !== -1);
        }
        
        if (outliers.length === 0) {
            return { before, after, changes: [{ type: 'info', message: 'No outliers detected in this column' }] };
        }
        
        // Apply changes
        outliers.forEach(index => {
            const oldValue = before[index][column];
            let newValue = oldValue;
            
            if (action === 'cap') {
                if (method === 'iqr') {
                    const sorted = [...values].sort((a, b) => a - b);
                    const q1 = sorted[Math.floor(sorted.length * 0.25)];
                    const q3 = sorted[Math.floor(sorted.length * 0.75)];
                    const iqr = q3 - q1;
                    const lowerBound = q1 - threshold * iqr;
                    const upperBound = q3 + threshold * iqr;
                    
                    if (oldValue < lowerBound) newValue = lowerBound;
                    else if (oldValue > upperBound) newValue = upperBound;
                }
            } else if (action === 'remove') {
                after[index][column] = null; // Mark for removal
            } else if (action === 'mark') {
                after[index][`${column}_is_outlier`] = true;
            }
            
            changes.push({
                type: 'outlier',
                index,
                oldValue,
                newValue,
                message: `Row ${index + 1}: Outlier "${oldValue}" ${action === 'cap' ? `→ "${newValue}"` : action === 'remove' ? 'will be removed' : 'will be marked'}`
            });
        });
        
        return { before, after, changes };
    }
    
    previewDataType(data, column, config) {
        const before = [...data];
        const after = [...data];
        const changes = [];
        
        const targetType = config.target_type || 'string';
        const method = config.method || 'coerce';
        
        // Preview conversion for first few values
        const sampleIndices = [0, 1, 2, 3, 4].filter(i => i < data.length);
        
        sampleIndices.forEach(index => {
            const oldValue = before[index][column];
            let newValue = oldValue;
            
            try {
                if (targetType === 'int') {
                    newValue = parseInt(oldValue);
                    if (isNaN(newValue)) newValue = method === 'coerce' ? 0 : oldValue;
                } else if (targetType === 'float') {
                    newValue = parseFloat(oldValue);
                    if (isNaN(newValue)) newValue = method === 'coerce' ? 0.0 : oldValue;
                } else if (targetType === 'string') {
                    newValue = String(oldValue);
                } else if (targetType === 'datetime') {
                    newValue = new Date(oldValue).toISOString();
                } else if (targetType === 'boolean') {
                    newValue = ['true', '1', 1, true].includes(oldValue);
                }
                
                if (newValue !== oldValue) {
                    changes.push({
                        type: 'conversion',
                        index,
                        oldValue,
                        newValue,
                        message: `Row ${index + 1}: "${oldValue}" → "${newValue}"`
                    });
                    after[index][column] = newValue;
                }
            } catch (error) {
                changes.push({
                    type: 'error',
                    index,
                    oldValue,
                    message: `Row ${index + 1}: Conversion failed for "${oldValue}"`
                });
            }
        });
        
        if (changes.length === 0) {
            changes.push({ type: 'info', message: 'No data type conversions needed for sample data' });
        }
        
        return { before, after, changes };
    }
    
    previewTextCleaning(data, column, config) {
        const before = [...data];
        const after = [...data];
        const changes = [];
        
        // Preview first few values
        const sampleIndices = [0, 1, 2, 3, 4].filter(i => i < data.length);
        
        sampleIndices.forEach(index => {
            const oldValue = before[index][column];
            if (oldValue === null || oldValue === undefined) return;
            
            let newValue = String(oldValue);
            
            if (config.trim_whitespace) {
                newValue = newValue.trim();
            }
            
            if (config.lowercase) {
                newValue = newValue.toLowerCase();
            }
            
            if (config.remove_special) {
                newValue = newValue.replace(/[^a-zA-Z0-9\s]/g, '');
            }
            
            if (config.remove_numbers) {
                newValue = newValue.replace(/\d+/g, '');
            }
            
            if (config.remove_duplicates) {
                const words = newValue.split(' ');
                const uniqueWords = [];
                words.forEach(word => {
                    if (!uniqueWords.includes(word)) {
                        uniqueWords.push(word);
                    }
                });
                newValue = uniqueWords.join(' ');
            }
            
            // Custom replacements
            if (config.custom_replacements) {
                config.custom_replacements.split('\n').forEach(line => {
                    if (line.includes(':')) {
                        const [old, new_] = line.split(':', 2);
                        newValue = newValue.replace(new RegExp(old.trim(), 'g'), new_.trim());
                    }
                });
            }
            
            if (newValue !== oldValue) {
                changes.push({
                    type: 'cleaned',
                    index,
                    oldValue,
                    newValue,
                    message: `Row ${index + 1}: "${oldValue}" → "${newValue}"`
                });
                after[index][column] = newValue;
            }
        });
        
        if (changes.length === 0) {
            changes.push({ type: 'info', message: 'No text cleaning needed for sample data' });
        }
        
        return { before, after, changes };
    }
    
    previewDuplicates(data, column, config) {
        const before = [...data];
        const after = [...data];
        const changes = [];
        
        const scope = config.scope || 'all';
        const action = config.action || 'remove';
        const keepOption = config.keep || 'first';
        
        let subset = null;
        if (scope === 'selected') {
            subset = [column];
        } else if (scope === 'subset') {
            subset = config.subset_columns || [];
        }
        
        // Find duplicates
        const seen = new Set();
        const duplicates = [];
        
        before.forEach((row, index) => {
            const key = subset ? JSON.stringify(subset.map(col => row[col])) : JSON.stringify(row);
            if (seen.has(key)) {
                duplicates.push(index);
            } else {
                seen.add(key);
            }
        });
        
        if (duplicates.length === 0) {
            return { before, after, changes: [{ type: 'info', message: 'No duplicate rows found' }] };
        }
        
        if (action === 'remove') {
            // Mark duplicates for removal
            duplicates.forEach(index => {
                after[index] = null; // Mark for removal
                changes.push({
                    type: 'duplicate',
                    index,
                    message: `Row ${index + 1}: Duplicate will be removed`
                });
            });
        } else if (action === 'mark') {
            duplicates.forEach(index => {
                after[index].is_duplicate = true;
                changes.push({
                    type: 'marked',
                    index,
                    message: `Row ${index + 1}: Marked as duplicate`
                });
            });
        }
        
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
        
        const values = before.map(row => row[column]).filter(val => val !== null && val !== undefined && !isNaN(val));
        
        if (values.length === 0) {
            return { before, after, changes: [{ type: 'error', message: 'No numeric values found for normalization' }] };
        }
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        
        // Preview first few values
        const sampleIndices = [0, 1, 2, 3, 4].filter(i => i < data.length);
        
        sampleIndices.forEach(index => {
            const oldValue = before[index][column];
            if (oldValue === null || oldValue === undefined || isNaN(oldValue)) return;
            
            let newValue = oldValue;
            
            if (method === 'minmax') {
                newValue = ((oldValue - min) / (max - min)) * (rangeMax - rangeMin) + rangeMin;
            } else if (method === 'zscore') {
                newValue = (oldValue - mean) / std;
            } else if (method === 'robust') {
                const sorted = [...values].sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                newValue = (oldValue - q1) / iqr;
            } else if (method === 'decimal') {
                const maxAbs = Math.max(...values.map(v => Math.abs(v)));
                const scale = Math.pow(10, Math.floor(Math.log10(maxAbs)));
                newValue = oldValue / scale;
            }
            
            changes.push({
                type: 'normalized',
                index,
                oldValue,
                newValue,
                message: `Row ${index + 1}: ${oldValue.toFixed(2)} → ${newValue.toFixed(2)}`
            });
            after[index][column] = newValue;
        });
        
        return { before, after, changes };
    }
    
    showPreviewComparison(previewData, column) {
        const preview = document.getElementById('cleaningPreview');
        if (!preview) return;
        
        const { before, after, changes } = previewData;
        
        console.log('Showing preview comparison:', { before, after, changes }); // Debug
        
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
        this.cleaningHistory = [];
        this.updateHistoryDisplay();
        this.clearPreview();
        
        // Reset form
        document.getElementById('cleaningColumn').value = '';
        document.getElementById('cleaningOperation').value = '';
        
        this.showSuccess('Cleaning history reset');
    }
    
    isNumericColumn(column) {
        if (!this.data || this.data.length === 0) return false;
        
        const sampleValues = this.data.slice(0, 100).map(row => row[column]);
        const numericCount = sampleValues.filter(val => 
            val !== null && val !== undefined && !isNaN(val)
        ).length;
        
        return numericCount > sampleValues.length * 0.5;
    }
    
    showLoading() {
        const preview = document.getElementById('cleaningPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="cleaning-loading">
                    <div class="loading-spinner"></div>
                    <span>Applying cleaning operation...</span>
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
    
    // Test method to verify operations are working
    testOperation(operation, column) {
        console.log('Testing operation:', operation, 'on column:', column);
        
        if (!this.data || this.data.length === 0) {
            console.error('No data available for testing');
            return;
        }
        
        const testConfig = this.getDefaultConfig(operation);
        console.log('Test config:', testConfig);
        
        const testData = JSON.parse(JSON.stringify(this.data.slice(0, 5)));
        console.log('Test data before:', testData);
        
        let result;
        switch (operation) {
            case 'missing-values':
                result = this.previewMissingValues(testData, column, testConfig);
                break;
            case 'outliers':
                result = this.previewOutliers(testData, column, testConfig);
                break;
            case 'data-type':
                result = this.previewDataType(testData, column, testConfig);
                break;
            case 'text-cleaning':
                result = this.previewTextCleaning(testData, column, testConfig);
                break;
            case 'duplicates':
                result = this.previewDuplicates(testData, column, testConfig);
                break;
            case 'normalize':
                result = this.previewNormalize(testData, column, testConfig);
                break;
            default:
                console.error('Unknown operation:', operation);
                return;
        }
        
        console.log('Test result:', result);
        return result;
    }
    
    getDefaultConfig(operation) {
        switch (operation) {
            case 'missing-values':
                return { action: 'fill-mean' };
            case 'outliers':
                return { method: 'iqr', action: 'cap', threshold: 1.5 };
            case 'data-type':
                return { target_type: 'string', method: 'coerce' };
            case 'text-cleaning':
                return { 
                    lowercase: true, 
                    remove_special: false, 
                    remove_numbers: false, 
                    trim_whitespace: true, 
                    remove_duplicates: false, 
                    custom_replacements: '' 
                };
            case 'duplicates':
                return { scope: 'all', action: 'remove', keep: 'first' };
            case 'normalize':
                return { method: 'minmax', range_min: 0, range_max: 1 };
            default:
                return {};
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

// Global test function for debugging
window.testDataCleaning = function(operation, column) {
    if (window.dataCleaningManager) {
        return window.dataCleaningManager.testOperation(operation, column);
    } else {
        console.error('DataCleaningManager not initialized');
        return null;
    }
};

// Global function to check data cleaning status
window.checkDataCleaningStatus = function() {
    if (window.dataCleaningManager) {
        console.log('DataCleaningManager Status:', {
            dataLength: window.dataCleaningManager.data.length,
            columns: window.dataCleaningManager.columns,
            currentOperation: window.dataCleaningManager.currentOperation,
            historyLength: window.dataCleaningManager.cleaningHistory.length
        });
        return window.dataCleaningManager;
    } else {
        console.error('DataCleaningManager not initialized');
        return null;
    }
}; 