# Charts Functionality - Analayzee

## Overview
The Charts functionality in Analayzee provides interactive data visualization capabilities using Chart.js. Users can create various types of charts from their uploaded CSV/Excel data.

## Features

### Chart Types Available
1. **Bar Chart** - For comparing categorical data
2. **Line Chart** - For showing trends over time or categories
3. **Pie Chart** - For showing proportional distribution
4. **Doughnut Chart** - Alternative to pie chart with center cutout
5. **Scatter Plot** - For showing correlation between two numeric variables
6. **Histogram** - For showing frequency distribution of numeric data

### Key Features
- **Interactive Controls**: Select chart type, X-axis, and Y-axis columns
- **Smart Column Filtering**: Automatically filters appropriate columns based on chart type
- **Multiple Charts**: Create and display multiple charts simultaneously
- **Export Functionality**: Export charts as PNG images
- **Responsive Design**: Charts adapt to different screen sizes
- **Modern UI**: Clean, modern interface matching the overall design

## Technical Implementation

### Frontend
- **CSS**: `static/css/charts.css` - Modern styling with gradients and animations
- **JavaScript**: `static/js/charts.js` - Chart.js integration and data processing
- **Template**: `templates/main/analysis.html` - HTML structure for charts tab

### Backend
- **API Endpoint**: `/api/charts-data/` - Provides optimized data for charts
- **Data Processing**: Automatic detection of numeric vs categorical columns
- **Session Storage**: Uses existing session-based data storage

### Data Flow
1. User uploads CSV/Excel file
2. Data is stored in Django session
3. Charts tab loads data via API or template fallback
4. User selects chart type and columns
5. JavaScript processes data and creates Chart.js instances
6. Charts are rendered in responsive grid layout

## Usage

### Creating Charts
1. Navigate to the Analysis page after uploading data
2. Click on the "Charts" tab in the sidebar
3. Select a chart type from the dropdown
4. Choose X-axis and Y-axis columns
5. Click "Create Chart" to generate the visualization

### Chart Controls
- **Chart Type**: Determines the visualization style
- **X-Axis**: Primary data dimension (horizontal axis)
- **Y-Axis**: Secondary data dimension (vertical axis)
- **Create Chart**: Generates new chart
- **Reset All**: Removes all charts
- **Export**: Downloads chart as PNG image

### Column Type Detection
The system automatically detects column types:
- **Numeric Columns**: Suitable for Y-axis in bar/line charts, both axes in scatter plots
- **Categorical Columns**: Suitable for X-axis in bar/line charts, Y-axis in pie/doughnut charts

## File Structure

```
Analayzee/
├── static/
│   ├── css/
│   │   └── charts.css          # Charts styling
│   └── js/
│       └── charts.js           # Charts functionality
├── templates/main/
│   └── analysis.html           # Charts tab HTML
├── main/
│   ├── views.py               # API endpoints
│   └── urls.py                # URL routing
└── CHARTS_README.md           # This documentation
```

## Dependencies
- **Chart.js**: CDN-loaded charting library
- **Django**: Backend framework
- **Pandas**: Data processing (backend)

## Browser Compatibility
- Modern browsers with ES6+ support
- Responsive design for mobile and tablet
- Graceful degradation for older browsers

## Future Enhancements
- Additional chart types (bubble, radar, etc.)
- Chart customization options (colors, themes)
- Data filtering and aggregation
- Real-time chart updates
- Chart templates and presets
- Advanced export options (PDF, SVG)

## Troubleshooting

### Common Issues
1. **No data available**: Ensure a file is uploaded first
2. **Chart not rendering**: Check browser console for JavaScript errors
3. **Column options disabled**: Verify data types match chart requirements
4. **Export not working**: Ensure Chart.js is properly loaded

### Debug Mode
Enable browser developer tools to see detailed error messages and data flow information. 