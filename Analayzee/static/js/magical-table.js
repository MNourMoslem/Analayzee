// Magical Table functionality
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
        this.updateColumnToggles();
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
        
        // Column toggles
        document.querySelectorAll('.column-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const column = item.getAttribute('data-column');
                this.toggleColumn(column);
                this.updateColumnToggles();
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
        this.updateColumnToggles();
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
    const raw = document.getElementById(elementId).textContent.trim();
    const fixed = raw.replace(/\\u0027/g, '"').replace(/\\u0022/g, '"').replace(/nan/g, '"nan"');
    const parsed = JSON.parse(fixed);
    return parsed;
}

// Initialize magical table
function initializeMagicalTable() {
    if (document.getElementById('tableData')) {
        window.magicalTable = new MagicalTable();
    }
} 