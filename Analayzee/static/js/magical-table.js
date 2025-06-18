// Magical Table functionality
class MagicalTable {
    constructor() {
        const tableData = parseDjangoJSON('tableData');
        const tableColumns = parseDjangoJSON('tableColumns');
        
        if (!tableData || !tableColumns) {
            console.error('Failed to load table data or columns');
            this.data = [];
            this.columns = [];
        } else {
            this.data = tableData;
            this.columns = tableColumns;
        }
        
        this.currentPage = 1;
        this.rowsPerPage = 25;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.visibleColumns = [...this.columns];
        this.filteredData = [...this.data];
        
        this.initializeEventListeners();
        this.render();
    }
    
    initializeEventListeners() {
        // Rows per page
        document.getElementById('rowsPerPage').addEventListener('change', (e) => {
            this.rowsPerPage = e.target.value === 'all' ? this.data.length : parseInt(e.target.value);
            this.currentPage = 1;
            this.render();
        });
        
        // Search
        document.getElementById('searchBox').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.filterData();
            this.render();
        });
        
        // Column customization
        document.getElementById('customizeColumns').addEventListener('click', () => {
            const customizer = document.querySelector('.column-customizer');
            if (customizer.classList.contains('show')) {
                customizer.classList.remove('show');
                setTimeout(() => {
                    customizer.style.display = 'none';
                }, 300);
            } else {
                customizer.style.display = 'block';
                setTimeout(() => {
                    customizer.classList.add('show');
                }, 10);
            }
        });
        
        // Reset
        document.getElementById('resetTable').addEventListener('click', () => {
            this.reset();
        });
    }
    
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    filterData() {
        this.filteredData = this.data.filter(row => {
            if (!this.searchTerm) return true;
            
            return this.visibleColumns.some(column => {
                const value = row[column];
                return value && value.toString().toLowerCase().includes(this.searchTerm);
            });
        });
    }
    
    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Try to convert to numbers for numeric sorting
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                aVal = aNum;
                bVal = bNum;
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.render();
    }
    
    toggleColumn(column) {
        const index = this.visibleColumns.indexOf(column);
        if (index > -1) {
            this.visibleColumns.splice(index, 1);
        } else {
            this.visibleColumns.push(column);
        }
        this.render();
    }
    
    updateColumnToggles() {
        document.querySelectorAll('.column-item').forEach(item => {
            const column = item.getAttribute('data-column');
            const toggle = item.querySelector('.column-toggle');
            const isVisible = this.visibleColumns.includes(column);
            
            if (isVisible) {
                toggle.classList.add('active');
                item.classList.remove('hidden');
            } else {
                toggle.classList.remove('active');
                item.classList.add('hidden');
            }
        });
    }
    
    reset() {
        this.currentPage = 1;
        this.rowsPerPage = 25;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.visibleColumns = [...this.columns];
        this.filteredData = [...this.data];
        
        document.getElementById('rowsPerPage').value = '25';
        document.getElementById('searchBox').value = '';
        
        const customizer = document.getElementById('columnCustomizer');
        customizer.classList.remove('show');
        setTimeout(() => {
            customizer.style.display = 'none';
        }, 300);
        
        this.render();
    }
    
    render() {
        // Update table headers
        const thead = document.querySelector('.magical-table thead tr');
        thead.innerHTML = '';
        
        this.visibleColumns.forEach(column => {
            const th = document.createElement('th');
            th.className = 'sortable';
            th.setAttribute('data-column', column);
            th.textContent = column;
            
            if (this.sortColumn === column) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
            
            th.addEventListener('click', () => this.sort(column));
            thead.appendChild(th);
        });
        
        // Calculate pagination
        const totalPages = Math.ceil(this.filteredData.length / this.rowsPerPage);
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const pageData = this.rowsPerPage === this.data.length ? this.filteredData : this.filteredData.slice(startIndex, endIndex);
        
        // Update table body
        const tbody = document.querySelector('.magical-table tbody');
        tbody.innerHTML = '';
        
        if (pageData.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = this.visibleColumns.length;
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '3rem 1rem';
            emptyCell.style.color = '#6b7280';
            emptyCell.style.fontStyle = 'italic';
            emptyCell.textContent = 'No data available';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        } else {
            pageData.forEach(row => {
                const tr = document.createElement('tr');
                this.visibleColumns.forEach(column => {
                    const td = document.createElement('td');
                    const value = row[column];
                    
                    // Format the value based on its type
                    if (value === null || value === undefined) {
                        td.textContent = '';
                        td.style.color = '#9ca3af';
                        td.style.fontStyle = 'italic';
                    } else if (typeof value === 'number') {
                        td.textContent = value.toLocaleString();
                        td.style.fontFamily = 'monospace';
                    } else {
                        td.textContent = value;
                    }
                    
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
        
        // Update pagination
        this.renderPagination(totalPages);
        
        // Update info
        const infoElement = document.getElementById('tableInfo');
        if (infoElement) {
            const totalRows = this.filteredData.length;
            const startRow = totalRows === 0 ? 0 : startIndex + 1;
            const endRow = Math.min(endIndex, totalRows);
            infoElement.textContent = `Showing ${startRow} to ${endRow} of ${totalRows} entries`;
        }
    }
    
    renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.textContent = '1';
            firstBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.render();
            });
            pagination.appendChild(firstBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem 0.75rem';
                ellipsis.style.color = '#6b7280';
                pagination.appendChild(ellipsis);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === this.currentPage);
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.render();
            });
            pagination.appendChild(pageBtn);
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem 0.75rem';
                ellipsis.style.color = '#6b7280';
                pagination.appendChild(ellipsis);
            }
            
            const lastBtn = document.createElement('button');
            lastBtn.textContent = totalPages;
            lastBtn.addEventListener('click', () => {
                this.currentPage = totalPages;
                this.render();
            });
            pagination.appendChild(lastBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });
        pagination.appendChild(nextBtn);
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

// Flag to prevent multiple initializations
let columnCustomizerInitialized = false;

// Initialize magical table
function initializeMagicalTable() {
    try {
        if (document.getElementById('tableData')) {
            window.magicalTable = new MagicalTable();
            // Initialize column customizer after table is ready
            setTimeout(() => {
                if (!columnCustomizerInitialized) {
                    initializeColumnCustomizer();
                    columnCustomizerInitialized = true;
                }
            }, 100);
        } else {
            console.warn('Table data element not found');
        }
    } catch (error) {
        console.error('Error initializing magical table:', error);
    }
}

// Column Customizer functionality
function initializeColumnCustomizer() {
    const columnTags = document.getElementById('columnTags');
    if (!columnTags) return;

    // Clear existing tags to prevent duplicates
    columnTags.innerHTML = '';

    // Get column names from the magical table's current state
    let headers = [];
    if (window.magicalTable && window.magicalTable.visibleColumns) {
        headers = [...window.magicalTable.visibleColumns];
    } else {
        // Fallback to Django column data
        const columnData = parseDjangoJSON('tableColumns');
        if (columnData) {
            headers = columnData;
        }
    }
    
    if (headers.length === 0) {
        console.warn('No column headers found for customizer');
        return;
    }
    
    // Create column tags in the current order
    headers.forEach((column, index) => {
        const tag = document.createElement('div');
        tag.className = 'column-tag';
        tag.draggable = true;
        tag.dataset.column = column;
        tag.dataset.index = index;
        
        tag.innerHTML = `
            <input type="checkbox" id="col_${index}" checked>
            <label for="col_${index}">${column}</label>
        `;
        
        columnTags.appendChild(tag);
    });

    // Remove existing event listeners to prevent duplicates
    const newColumnTags = columnTags.cloneNode(true);
    columnTags.parentNode.replaceChild(newColumnTags, columnTags);
    
    // Drag and drop functionality
    let draggedElement = null;

    newColumnTags.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('column-tag')) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }
    });

    newColumnTags.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('column-tag')) {
            e.target.style.opacity = '1';
            draggedElement = null;
        }
    });

    newColumnTags.addEventListener('dragover', (e) => {
        e.preventDefault();
        const tag = e.target.closest('.column-tag');
        if (tag && draggedElement && tag !== draggedElement) {
            const rect = tag.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                tag.style.borderLeft = '2px solid #007bff';
                tag.style.borderRight = '';
            } else {
                tag.style.borderLeft = '';
                tag.style.borderRight = '2px solid #007bff';
            }
        }
    });

    newColumnTags.addEventListener('dragleave', (e) => {
        const tag = e.target.closest('.column-tag');
        if (tag) {
            tag.style.borderLeft = '';
            tag.style.borderRight = '';
        }
    });

    newColumnTags.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetTag = e.target.closest('.column-tag');
        if (targetTag && draggedElement && targetTag !== draggedElement) {
            const rect = targetTag.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            // Clear borders
            targetTag.style.borderLeft = '';
            targetTag.style.borderRight = '';
            
            // Reorder tags
            if (e.clientY < midY) {
                newColumnTags.insertBefore(draggedElement, targetTag);
            } else {
                newColumnTags.insertBefore(draggedElement, targetTag.nextSibling);
            }
            
            // Apply changes immediately
            applyColumnChanges();
        }
    });

    // Checkbox change handler
    newColumnTags.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            // Apply changes immediately
            applyColumnChanges();
        }
    });

    // Export functionality
    const exportButton = document.getElementById('exportTableData');
    if (exportButton) {
        exportButton.addEventListener('click', showExportOptions);
    }
}

function applyColumnChanges() {
    const columnTags = document.getElementById('columnTags');
    if (!columnTags) return;

    const tags = Array.from(columnTags.querySelectorAll('.column-tag'));
    const newOrder = [];
    const hiddenColumns = [];

    tags.forEach((tag, index) => {
        const columnName = tag.dataset.column;
        const checkbox = tag.querySelector('input[type="checkbox"]');
        
        if (checkbox.checked) {
            newOrder.push(columnName);
        } else {
            hiddenColumns.push(columnName);
        }
    });

    // Update the magical table's visible columns and re-render
    if (window.magicalTable) {
        window.magicalTable.visibleColumns = newOrder;
        window.magicalTable.render();
    }
}

function showExportOptions() {
    // Create modal for export options
    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
        <div class="export-modal-content">
            <div class="export-modal-header">
                <h3>Export Data</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="export-modal-body">
                <p>Choose export format for visible data:</p>
                <div class="export-options">
                    <button class="export-option" data-format="excel">
                        <span class="export-icon">📊</span>
                        <span class="export-text">Excel (.xlsx)</span>
                    </button>
                    <button class="export-option" data-format="csv">
                        <span class="export-icon">📄</span>
                        <span class="export-text">CSV (.csv)</span>
                    </button>
                    <button class="export-option" data-format="tsv">
                        <span class="export-icon">📋</span>
                        <span class="export-text">TSV (.tsv)</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Export option handlers
    const exportOptions = modal.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            const format = option.dataset.format;
            exportTableData(format);
            document.body.removeChild(modal);
        });
    });
}

function exportTableData(format) {
    if (!window.magicalTable) return;

    // Get visible data based on current state
    const visibleColumns = window.magicalTable.visibleColumns;
    const filteredData = window.magicalTable.filteredData;
    
    if (!visibleColumns || visibleColumns.length === 0) {
        alert('No visible columns to export');
        return;
    }

    // Prepare data for export
    const exportData = filteredData.map(row => {
        const exportRow = {};
        visibleColumns.forEach(column => {
            exportRow[column] = row[column] || '';
        });
        return exportRow;
    });

    let content, mimeType, filename;

    switch (format) {
        case 'excel':
            // For Excel, we'll create a CSV-like format that Excel can open
            content = createCSVContent(exportData, visibleColumns);
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename = 'table_data.xlsx';
            break;
        case 'csv':
            content = createCSVContent(exportData, visibleColumns);
            mimeType = 'text/csv';
            filename = 'table_data.csv';
            break;
        case 'tsv':
            content = createTSVContent(exportData, visibleColumns);
            mimeType = 'text/tab-separated-values';
            filename = 'table_data.tsv';
            break;
        default:
            return;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    if (window.magicalTable.showSuccess) {
        window.magicalTable.showSuccess(`Data exported as ${format.toUpperCase()} successfully`);
    }
}

function createCSVContent(data, columns) {
    const header = columns.map(col => `"${col}"`).join(',');
    const rows = data.map(row => 
        columns.map(col => {
            const value = row[col];
            // Escape quotes and wrap in quotes
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
    );
    return [header, ...rows].join('\n');
}

function createTSVContent(data, columns) {
    const header = columns.join('\t');
    const rows = data.map(row => 
        columns.map(col => {
            const value = row[col];
            // Replace tabs with spaces to avoid breaking TSV format
            return String(value).replace(/\t/g, ' ');
        }).join('\t')
    );
    return [header, ...rows].join('\n');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMagicalTable();
}); 