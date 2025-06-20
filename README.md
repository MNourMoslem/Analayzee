# Analayzee - CSV & Excel File Analyzer

A modern web application for analyzing CSV and Excel files with a beautiful, responsive UI built with Django and custom components.

## 🚀 Features

- **File Upload**: Drag & drop support for CSV, Excel, TSV, and JSON files
- **Data Analysis**: Comprehensive analysis of uploaded files
- **Modern UI**: Beautiful, responsive design with custom components
- **Interactive Components**: Dropdowns, modals, tabs, and more
- **Real-time Feedback**: Loading states, alerts, and notifications

## 🎨 Component Library

This project includes a comprehensive component library with the following reusable components:

### Buttons
- **Variants**: Primary, Secondary, Success, Danger, Warning
- **Sizes**: Small, Default, Large
- **Styles**: Solid, Outline
- **States**: Normal, Hover, Disabled, Loading

### Cards
- **Structure**: Header, Body, Footer
- **Interactive**: Hover effects and animations
- **Flexible**: Customizable content and styling

### Form Components
- **Input Fields**: Text, email, password with validation
- **Checkboxes**: Custom styled with labels
- **Dropdowns**: Searchable dropdown with selection
- **File Upload**: Drag & drop with preview

### Navigation
- **Tabs**: Tabbed interface for content organization
- **Breadcrumbs**: Navigation breadcrumbs
- **Progress Bars**: Visual progress indicators

### Feedback
- **Alerts**: Info, Success, Warning, Error messages
- **Badges**: Status indicators and labels
- **Loading States**: Spinners and loading indicators

### Modals
- **Basic Modal**: Header, body, footer structure
- **Confirmation Modal**: For important actions
- **Responsive**: Works on all screen sizes

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Django 5.2+

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Analayzee
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start the development server**
   ```bash
   python manage.py runserver
   ```

5. **Visit the showcase**
   ```
   http://localhost:8000/
   ```

## 📁 Project Structure

```
Analayzee/
├── Analayzee/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── static/
│   ├── css/
│   │   └── components.css      # Component styles
│   └── js/
│       └── components.js       # Component functionality
├── templates/
│   ├── base.html              # Base template
│   └── showcase.html          # Component showcase
├── manage.py
└── README.md
```

## 🎯 Component Usage

### Buttons

```html
<!-- Basic button -->
<button class="btn btn-primary">Primary Button</button>

<!-- Button with size -->
<button class="btn btn-success btn-lg">Large Success Button</button>

<!-- Outline button -->
<button class="btn btn-outline btn-primary">Outline Button</button>

<!-- Loading button -->
<button class="btn btn-primary">
    <span class="loading"></span>
    Loading...
</button>
```

### Cards

```html
<div class="card">
    <div class="card-header">
        <h4 class="card-title">Card Title</h4>
        <p class="card-subtitle">Card subtitle</p>
    </div>
    <div class="card-body">
        <p>Card content goes here...</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Action</button>
    </div>
</div>
```

### Form Components

```html
<!-- Input field -->
<div class="input-group">
    <label class="input-label">Email Address</label>
    <input type="email" class="input" placeholder="Enter your email">
</div>

<!-- Checkbox -->
<label class="checkbox-item">
    <input type="checkbox" class="checkbox" value="option1">
    <span class="checkbox-label">Option label</span>
</label>

<!-- Dropdown -->
<div class="dropdown">
    <div class="dropdown-toggle">Select option</div>
    <div class="dropdown-menu">
        <div class="dropdown-item" data-value="value1">Option 1</div>
        <div class="dropdown-item" data-value="value2">Option 2</div>
    </div>
</div>
```

### Alerts

```html
<!-- Static alerts -->
<div class="alert alert-success">
    <strong>Success:</strong> Operation completed successfully.
</div>

<!-- JavaScript alerts -->
<script>
ComponentLib.showAlert('This is a success message', 'success');
ComponentLib.showAlert('This is an error message', 'danger');
</script>
```

### Modals

```html
<!-- Modal trigger -->
<button class="btn btn-primary" onclick="ComponentLib.openModal('myModal')">
    Open Modal
</button>

<!-- Modal structure -->
<div class="modal-overlay" id="myModal">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">Modal Title</h3>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <p>Modal content goes here...</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ComponentLib.closeModal(document.getElementById('myModal'))">Cancel</button>
            <button class="btn btn-primary">Save</button>
        </div>
    </div>
</div>
```

## 🎨 Customization

### Colors
The component library uses a consistent color palette that can be customized in `static/css/components.css`:

- **Primary**: `#667eea` (Purple gradient)
- **Success**: `#48bb78` (Green gradient)
- **Warning**: `#ed8936` (Orange gradient)
- **Danger**: `#f56565` (Red gradient)
- **Info**: `#3182ce` (Blue)

### Typography
The library uses Inter font family for a modern, clean look. You can change the font by updating the `font-family` property in the CSS.

### Spacing
The library uses a consistent spacing scale:
- `gap-1` to `gap-6` for flex gaps
- `mt-1` to `mt-6` for margin-top
- `mb-1` to `mb-6` for margin-bottom
- `p-1` to `p-6` for padding

## 🔧 JavaScript API

### Component Library Methods

```javascript
// Show alerts
ComponentLib.showAlert(message, type, autoDismiss);

// Modal operations
ComponentLib.openModal(modalId);
ComponentLib.closeModal(modalElement);

// Form validation
ComponentLib.validateForm(formElement);

// Loading states
ComponentLib.setLoading(element, isLoading);

// Create components dynamically
ComponentLib.createDropdown(options, selectedValue);
ComponentLib.createModal(id, title, content, footer);
```

### Event Listeners

```javascript
// File selection
document.addEventListener('fileSelected', (e) => {
    const { file, input } = e.detail;
    // Handle file selection
});

// Dropdown changes
document.addEventListener('dropdownChange', (e) => {
    const { value, text, dropdown } = e.detail;
    // Handle dropdown selection
});

// Checkbox changes
document.addEventListener('checkboxChange', (e) => {
    const { checked, value, checkbox } = e.detail;
    // Handle checkbox changes
});
```

## 🚀 Next Steps

This component library provides the foundation for building the CSV/Excel analyzer application. The next steps would be:

1. **File Upload Backend**: Implement Django views for file handling
2. **Data Processing**: Add CSV/Excel parsing and analysis logic
3. **Database Integration**: Store analysis results (if needed)
4. **Advanced Features**: Charts, data visualization, export functionality
5. **User Authentication**: Add user management and file ownership

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub. 