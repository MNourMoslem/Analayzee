// Component Library JavaScript
class ComponentLibrary {
    constructor() {
        this.init();
    }

    init() {
        this.initDropdowns();
        this.initModals();
        this.initCheckboxes();
        this.initAlerts();
        this.initFileUpload();
        this.initTabs();
        this.initTooltips();
    }

    // Dropdown functionality
    initDropdowns() {
        document.addEventListener('click', (e) => {
            const dropdown = e.target.closest('.dropdown');
            
            // Close all dropdowns when clicking outside
            if (!dropdown) {
                document.querySelectorAll('.dropdown.active').forEach(d => {
                    d.classList.remove('active');
                });
                return;
            }

            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (e.target === toggle || toggle.contains(e.target)) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }

            // Handle dropdown item selection
            const item = e.target.closest('.dropdown-item');
            if (item && dropdown.contains(item)) {
                const value = item.dataset.value;
                const text = item.textContent;
                
                // Update toggle text
                toggle.textContent = text;
                
                // Trigger change event
                const event = new CustomEvent('dropdownChange', {
                    detail: { value, text, dropdown }
                });
                dropdown.dispatchEvent(event);
                
                dropdown.classList.remove('active');
            }
        });
    }

    // Modal functionality
    initModals() {
        // Open modal
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-modal]')) {
                e.preventDefault();
                const modalId = e.target.dataset.modal;
                this.openModal(modalId);
            }
        });

        // Close modal
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close') || e.target.matches('.modal-overlay')) {
                e.preventDefault();
                this.closeModal(e.target.closest('.modal-overlay'));
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.closeModal(activeModal);
                }
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalOverlay) {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Checkbox functionality
    initCheckboxes() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('.checkbox')) {
                const checkbox = e.target;
                const item = checkbox.closest('.checkbox-item');
                
                if (item) {
                    if (checkbox.checked) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                }

                // Trigger change event
                const event = new CustomEvent('checkboxChange', {
                    detail: { 
                        checked: checkbox.checked, 
                        value: checkbox.value,
                        checkbox 
                    }
                });
                checkbox.dispatchEvent(event);
            }
        });
    }

    // Alert functionality
    initAlerts() {
        // Auto-dismiss alerts
        document.querySelectorAll('.alert[data-auto-dismiss]').forEach(alert => {
            const delay = parseInt(alert.dataset.autoDismiss) || 5000;
            setTimeout(() => {
                this.dismissAlert(alert);
            }, delay);
        });

        // Manual dismiss
        document.addEventListener('click', (e) => {
            if (e.target.matches('.alert-dismiss')) {
                e.preventDefault();
                this.dismissAlert(e.target.closest('.alert'));
            }
        });
    }

    dismissAlert(alert) {
        if (alert) {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }
    }

    // Show alert utility
    showAlert(message, type = 'info', autoDismiss = true) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="d-flex justify-between items-center">
                <span>${message}</span>
                <button class="alert-dismiss" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit;">×</button>
            </div>
        `;
        
        if (autoDismiss) {
            alert.dataset.autoDismiss = '5000';
        }

        // Insert at the top of the container
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alert, container.firstChild);

        if (autoDismiss) {
            setTimeout(() => {
                this.dismissAlert(alert);
            }, 5000);
        }

        return alert;
    }

    // File upload functionality
    initFileUpload() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('.file-input')) {
                const input = e.target;
                const file = input.files[0];
                
                if (file) {
                    // Update file name display
                    const fileNameDisplay = input.parentElement.querySelector('.file-name');
                    if (fileNameDisplay) {
                        fileNameDisplay.textContent = file.name;
                    }

                    // Trigger file selected event
                    const event = new CustomEvent('fileSelected', {
                        detail: { file, input }
                    });
                    input.dispatchEvent(event);
                }
            }
        });

        // Drag and drop functionality
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.file-drop-zone');
            if (dropZone) {
                dropZone.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.file-drop-zone');
            if (dropZone && !dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.file-drop-zone');
            if (dropZone) {
                dropZone.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const input = dropZone.querySelector('.file-input');
                    if (input) {
                        input.files = files;
                        input.dispatchEvent(new Event('change'));
                    }
                }
            }
        });
    }

    // Tab functionality
    initTabs() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-button')) {
                e.preventDefault();
                const tabButton = e.target;
                const tabContainer = tabButton.closest('.tab-container');
                const tabId = tabButton.dataset.tab;

                if (tabContainer && tabId) {
                    // Remove active class from all tabs and content
                    tabContainer.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    tabContainer.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });

                    // Add active class to clicked tab and corresponding content
                    tabButton.classList.add('active');
                    const tabContent = tabContainer.querySelector(`[data-tab-content="${tabId}"]`);
                    if (tabContent) {
                        tabContent.classList.add('active');
                    }
                }
            }
        });
    }

    // Tooltip functionality
    initTooltips() {
        document.addEventListener('mouseenter', (e) => {
            
        });

        document.addEventListener('mouseleave', (e) => {
            
        });
    }

    showTooltip(element, text, position) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '1000';
        tooltip.style.background = '#333';
        tooltip.style.color = 'white';
        tooltip.style.padding = '4px 8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'nowrap';

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    // Utility methods
    createDropdown(options, selectedValue = null) {
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        
        const toggle = document.createElement('div');
        toggle.className = 'dropdown-toggle';
        toggle.textContent = 'Select an option';

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = option.text;
            item.dataset.value = option.value;
            
            if (option.value === selectedValue) {
                item.classList.add('selected');
                toggle.textContent = option.text;
            }
            
            menu.appendChild(item);
        });

        dropdown.appendChild(toggle);
        dropdown.appendChild(menu);
        
        return dropdown;
    }

    createModal(id, title, content, footer = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = id;
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        `;
        
        return modal;
    }

    // Loading state management
    setLoading(element, isLoading = true) {
        if (isLoading) {
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.innerHTML = '<span class="loading"></span> Loading...';
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || '';
        }
    }

    // Form validation
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showInputError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearInputError(input);
            }
        });

        return isValid;
    }

    showInputError(input, message) {
        input.classList.add('input-error');
        let errorElement = input.parentElement.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    clearInputError(input) {
        input.classList.remove('input-error');
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }
}

// Initialize component library when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ComponentLib = new ComponentLibrary();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLibrary;
} 