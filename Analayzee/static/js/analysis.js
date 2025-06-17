// Analysis Page JavaScript
  
// Tab switching functionality
function initializeTabs() {
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId + '-tab').classList.add('active');
        });
    });
}

// Helper function to parse escaped JSON from Django
function parseDjangoJSON(elementId) {
    const raw = document.getElementById(elementId).textContent.trim();
    const fixed = raw.replace(/\\u0027/g, '"').replace(/\\u0022/g, '"').replace(/nan/g, '"nan"');
    const parsed = JSON.parse(fixed);
    return parsed;
}

// The Magical Table functionality
class MagicalTable {
    constructor() {
        this.data = parseDjangoJSON('tableData');
        this.columns = parseDjangoJSON('tableColumns');
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
            const customizer = document.getElementById('columnCustomizer');
            customizer.style.display = customizer.style.display === 'none' ? 'block' : 'none';
        });
        
        // Reset
        document.getElementById('resetTable').addEventListener('click', () => {
            this.reset();
        });
        
        // Column toggles
        document.querySelectorAll('.column-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('column-toggle')) {
                    const column = item.getAttribute('data-column');
                    this.toggleColumn(column);
                    item.classList.toggle('hidden');
                }
            });
        });
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
        console.log('=== SORTING TRIGGERED ===');
        console.log('Column:', column);
        console.log('Current sort column:', this.sortColumn);
        console.log('Current sort direction:', this.sortDirection);
        
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        console.log('New sort direction:', this.sortDirection);
        
        // Show actual values before sorting
        console.log('Data before sorting (first 5 rows):');
        this.filteredData.slice(0, 5).forEach((row, index) => {
            console.log(`Row ${index}: ${column} = ${row[column]} (type: ${typeof row[column]})`);
        });
        
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
        
        // Show actual values after sorting
        console.log('Data after sorting (first 5 rows):');
        this.filteredData.slice(0, 5).forEach((row, index) => {
            console.log(`Row ${index}: ${column} = ${row[column]} (type: ${typeof row[column]})`);
        });
        
        console.log('Calling render()...');
        
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
        document.getElementById('columnCustomizer').style.display = 'none';
        
        this.render();
    }
    
    render() {
        console.log('=== RENDER CALLED ===');
        console.log('Visible columns:', this.visibleColumns);
        console.log('Filtered data length:', this.filteredData.length);
        
        // Don't call filterData() here as it resets the sorted data
        // this.filterData();
        
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
        const totalRows = this.filteredData.length;
        const totalPages = Math.ceil(totalRows / this.rowsPerPage);
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = Math.min(startIndex + this.rowsPerPage, totalRows);
        
        // Update table body
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        const pageData = this.filteredData.slice(startIndex, endIndex);
        console.log('Rendering page data (first 3 rows):', pageData.slice(0, 3));
        
        // Show what's actually being rendered
        console.log('Actual values being rendered (first 3 rows):');
        pageData.slice(0, 3).forEach((row, index) => {
            console.log(`Row ${index}:`, this.visibleColumns.map(col => `${col}=${row[col]}`).join(', '));
        });
        
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            this.visibleColumns.forEach(column => {
                const td = document.createElement('td');
                const value = row[column];
                if (value === null || value === undefined || value === '') {
                    td.innerHTML = '<span style="color: #cbd5e0; font-style: italic;">null</span>';
                } else {
                    td.textContent = value;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        // Update pagination info
        document.getElementById('startRow').textContent = totalRows > 0 ? startIndex + 1 : 0;
        document.getElementById('endRow').textContent = endIndex;
        document.getElementById('totalRows').textContent = totalRows;
        
        // Update pagination controls
        this.renderPagination(totalPages);
        
        console.log('=== RENDER COMPLETED ===');
    }
    
    renderPagination(totalPages) {
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        pageNumbers.innerHTML = '';
        
        // Previous button
        prevBtn.disabled = this.currentPage === 1;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            pageBtn.textContent = i;
            if (i === this.currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.render();
            });
            pageNumbers.appendChild(pageBtn);
        }
        
        // Next button
        nextBtn.disabled = this.currentPage === totalPages;
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    
    // Initialize the magical table if we're on the analysis page
    if (document.getElementById('tableData')) {
        new MagicalTable();
    }
}); 