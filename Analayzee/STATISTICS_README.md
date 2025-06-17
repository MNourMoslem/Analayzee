# Statistics Functionality - Analayzee

## Overview
The Statistics functionality in Analayzee provides comprehensive statistical analysis capabilities for your data. It offers advanced statistical computations, data insights, and automated analysis to help you understand your data better.

## Features

### Analysis Types Available

#### 1. 📊 Descriptive Statistics
- **Basic Statistics**: Count, mean, median, mode, standard deviation, variance
- **Range Statistics**: Minimum, maximum, range, quartiles (Q1, Q3), IQR
- **Distribution Shape**: Skewness and kurtosis calculations
- **Data Quality**: Missing value detection and reporting

#### 2. 🔗 Correlation Matrix
- **Pearson Correlation**: Calculate correlation coefficients between numeric variables
- **Visual Matrix**: Color-coded correlation matrix for easy interpretation
- **Strength Indicators**: 
  - Strong positive (≥ 0.7): Dark green
  - Positive (≥ 0.3): Light green
  - Neutral (-0.3 to 0.3): Gray
  - Negative (≤ -0.3): Light red
  - Strong negative (≤ -0.7): Dark red

#### 3. 🎯 Outlier Detection
- **IQR Method**: Uses 1.5 × IQR rule for outlier detection
- **Detailed Reporting**: Shows outlier values and their row indices
- **Statistics**: Count and percentage of outliers in the dataset
- **Visual Indicators**: Color-coded outlier items

#### 4. 📈 Distribution Analysis
- **Histogram Bins**: Automatic bin calculation using square root rule
- **Frequency Analysis**: Count and percentage for each bin
- **Visual Representation**: Tabular format with clear bin ranges
- **Data Distribution**: Understanding of data spread and patterns

#### 5. 💡 Data Insights
- **Automated Analysis**: AI-powered insights generation
- **Data Quality Assessment**: Missing data analysis and recommendations
- **Pattern Recognition**: Identification of data patterns and anomalies
- **Business Intelligence**: Actionable insights for data-driven decisions

### Key Features
- **Smart Column Filtering**: Automatically filters appropriate columns based on analysis type
- **Multiple Analysis**: Generate and display multiple statistical analyses simultaneously
- **Export Functionality**: Export statistical reports as text files
- **Responsive Design**: Works perfectly on all screen sizes
- **Modern UI**: Clean, modern interface with interactive elements

## Technical Implementation

### Frontend
- **CSS**: `static/css/statistics.css` - Modern styling with gradients and animations
- **JavaScript**: `static/js/statistics.js` - Comprehensive statistical computations
- **Template**: `templates/main/analysis.html` - HTML structure for statistics tab

### Backend
- **API Endpoint**: `/api/charts-data/` - Provides optimized data for statistics
- **Data Processing**: Automatic detection of numeric vs categorical columns
- **Session Storage**: Uses existing session-based data storage

### Statistical Algorithms

#### Descriptive Statistics
```javascript
// Mean calculation
const mean = values.reduce((a, b) => a + b, 0) / values.length;

// Standard deviation
const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
const stdDev = Math.sqrt(variance);

// Percentile calculation (interpolation)
const index = (percentile / 100) * (sorted.length - 1);
const lower = Math.floor(index);
const upper = Math.ceil(index);
const weight = index - lower;
return sorted[lower] * (1 - weight) + sorted[upper] * weight;
```

#### Correlation Analysis
```javascript
// Pearson correlation coefficient
const numerator = n * sum12 - sum1 * sum2;
const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
return denominator === 0 ? 0 : numerator / denominator;
```

#### Outlier Detection
```javascript
// IQR method
const q1 = calculatePercentile(sorted, 25);
const q3 = calculatePercentile(sorted, 75);
const iqr = q3 - q1;
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;
```

#### Distribution Analysis
```javascript
// Automatic bin calculation
const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
const binSize = (max - min) / binCount;
```

## Usage

### Generating Statistics
1. Navigate to the Analysis page after uploading data
2. Click on the "Statistics" tab in the sidebar
3. Select an analysis type from the dropdown
4. Choose a column for analysis (if applicable)
5. Click "Generate Analysis" to create statistical reports

### Analysis Controls
- **Analysis Type**: Determines the type of statistical analysis
- **Column**: Select specific column for single-column analysis
- **Generate Analysis**: Creates new statistical report
- **Reset All**: Removes all generated statistics
- **Export Report**: Downloads statistics as text file

### Column Type Detection
The system automatically detects column types:
- **Numeric Columns**: Suitable for all analysis types
- **Categorical Columns**: Suitable for descriptive statistics and insights

## File Structure

```
Analayzee/
├── static/
│   ├── css/
│   │   └── statistics.css          # Statistics styling
│   └── js/
│       └── statistics.js           # Statistics functionality
├── templates/main/
│   └── analysis.html               # Statistics tab HTML
├── main/
│   ├── views.py                   # API endpoints
│   └── urls.py                    # URL routing
└── STATISTICS_README.md           # This documentation
```

## Statistical Methods

### Descriptive Statistics
- **Central Tendency**: Mean, median, mode
- **Variability**: Standard deviation, variance, range, IQR
- **Shape**: Skewness (measure of asymmetry), kurtosis (measure of tail heaviness)
- **Quartiles**: Q1 (25th percentile), Q2 (median), Q3 (75th percentile)

### Correlation Analysis
- **Pearson Correlation**: Measures linear relationship between variables
- **Range**: -1 to +1 (perfect negative to perfect positive correlation)
- **Interpretation**: 
  - |r| ≥ 0.7: Strong correlation
  - 0.3 ≤ |r| < 0.7: Moderate correlation
  - |r| < 0.3: Weak correlation

### Outlier Detection
- **IQR Method**: Uses interquartile range for robust outlier detection
- **Threshold**: 1.5 × IQR from Q1 and Q3
- **Advantages**: Resistant to extreme values, works with skewed distributions

### Distribution Analysis
- **Histogram Bins**: Automatic bin calculation using square root rule
- **Frequency Analysis**: Count and percentage distribution
- **Visual Interpretation**: Understanding data spread and patterns

## Data Insights Generation

### Automated Analysis
1. **Data Overview**: Dataset size, column types, data quality
2. **Missing Data**: Detection and reporting of missing values
3. **Outlier Analysis**: Identification of potential data quality issues
4. **Correlation Insights**: Strong relationships between variables
5. **Recommendations**: Actionable insights for data analysis

### Insight Categories
- **Data Quality**: Missing data, outliers, data type issues
- **Pattern Recognition**: Correlations, distributions, trends
- **Business Intelligence**: Actionable recommendations
- **Statistical Significance**: Important statistical findings

## Export Functionality

### Report Format
- **Text Format**: Plain text with structured information
- **Comprehensive**: Includes all statistical calculations
- **Timestamped**: Generation date and time
- **Customizable**: Different formats for different analysis types

### Export Types
- **Descriptive Statistics**: Complete statistical summary
- **Correlation Matrix**: All correlation coefficients
- **Outlier Report**: Outlier details and statistics
- **Distribution Analysis**: Frequency distribution tables
- **Data Insights**: Automated insights and recommendations

## Browser Compatibility
- Modern browsers with ES6+ support
- Responsive design for mobile and tablet
- Graceful degradation for older browsers

## Performance Considerations
- **Efficient Algorithms**: Optimized statistical computations
- **Lazy Loading**: Statistics generated on-demand
- **Memory Management**: Proper cleanup of generated content
- **API Optimization**: Efficient data transfer and processing

## Future Enhancements
- **Advanced Statistics**: T-tests, ANOVA, regression analysis
- **Interactive Visualizations**: Dynamic charts and graphs
- **Statistical Tests**: Hypothesis testing and p-values
- **Machine Learning**: Predictive analytics and clustering
- **Custom Reports**: User-defined statistical reports
- **Advanced Export**: PDF, Excel, and other formats

## Troubleshooting

### Common Issues
1. **No numeric data**: Ensure dataset contains numeric columns
2. **Analysis not generating**: Check browser console for errors
3. **Column options disabled**: Verify data types match analysis requirements
4. **Export not working**: Ensure proper data is loaded

### Debug Mode
Enable browser developer tools to see detailed error messages and data flow information.

### Performance Tips
- Use smaller datasets for correlation matrices with many variables
- Generate statistics one at a time for large datasets
- Clear previous analyses before generating new ones

## Mathematical Formulas

### Descriptive Statistics
- **Mean**: μ = Σx / n
- **Variance**: σ² = Σ(x - μ)² / n
- **Standard Deviation**: σ = √σ²
- **Skewness**: γ₁ = (n / ((n-1)(n-2))) × Σ((x - μ) / σ)³
- **Kurtosis**: γ₂ = (n(n+1) / ((n-1)(n-2)(n-3))) × Σ((x - μ) / σ)⁴ - (3(n-1)² / ((n-2)(n-3)))

### Correlation
- **Pearson Correlation**: r = (nΣxy - ΣxΣy) / √((nΣx² - (Σx)²)(nΣy² - (Σy)²))

### Outlier Detection
- **IQR**: IQR = Q₃ - Q₁
- **Lower Bound**: LB = Q₁ - 1.5 × IQR
- **Upper Bound**: UB = Q₃ + 1.5 × IQR 