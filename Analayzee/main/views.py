from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
import pandas as pd
import numpy as np
import os
import json
from accounts.utils import set_dataframe_in_store, get_dataframe_from_store


def home_view(request):
    """Main page with file upload functionality"""
    return render(request, 'main/home.html', {
        'title': 'Analayzee - CSV & Excel Analyzer'
    })


@csrf_exempt
@require_http_methods(["POST"])
def upload_file_view(request):
    """Handle file upload and redirect to analysis"""
    if 'file' not in request.FILES:
        messages.error(request, 'No file uploaded.')
        return redirect('main:home')
    
    uploaded_file = request.FILES['file']
    
    # Check file type
    allowed_extensions = ['.csv', '.xlsx', '.xls']
    file_extension = os.path.splitext(uploaded_file.name)[1].lower()
    
    if file_extension not in allowed_extensions:
        messages.error(request, f'Unsupported file type. Please upload: {", ".join(allowed_extensions)}')
        return redirect('main:home')
    
    try:
        # Read file based on extension
        if file_extension == '.csv':
            df = pd.read_csv(uploaded_file)
        else:  # Excel files
            df = pd.read_excel(uploaded_file)
        
        # Store DataFrame in session
        set_dataframe_in_store(request, df)
        
        messages.success(request, f'File "{uploaded_file.name}" uploaded successfully!')
        return redirect('main:analysis')
        
    except Exception as e:
        messages.error(request, f'Error reading file: {str(e)}')
        return redirect('main:home')


def analysis_view(request):
    """Analysis page showing the uploaded file data"""
    df = get_dataframe_from_store(request)
    
    if df is None:
        messages.warning(request, 'No file data found. Please upload a file first.')
        return redirect('main:home')
    
    # Prepare data for template
    context = {
        'title': 'File Analysis - Analayzee',
        'file_info': {
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': list(df.columns),
            'data_types': df.dtypes.to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
        },
        'table_data': df.head(50).to_dict('records'),  # First 50 rows
        'column_names': list(df.columns),
    }
    
    return render(request, 'main/analysis.html', context)


def api_file_info(request):
    """API endpoint to get file info for AJAX requests"""
    df = get_dataframe_from_store(request)
    
    if df is None:
        return JsonResponse({'error': 'No file data found'}, status=404)
    
    return JsonResponse({
        'rows': len(df),
        'columns': len(df.columns),
        'column_names': list(df.columns),
        'data_types': df.dtypes.astype(str).to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
    })


def api_charts_data(request):
    """API endpoint to get data specifically for charts"""
    df = get_dataframe_from_store(request)
    
    if df is None:
        return JsonResponse({'error': 'No file data found'}, status=404)
    
    try:
        # Get column information for chart types
        numeric_columns = []
        categorical_columns = []
        
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                numeric_columns.append(column)
            else:
                categorical_columns.append(column)
        
        return JsonResponse({
            'success': True,
            'data': df.to_dict('records'),
            'columns': list(df.columns),
            'numeric_columns': numeric_columns,
            'categorical_columns': categorical_columns,
            'total_rows': len(df),
            'total_columns': len(df.columns)
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error processing data: {str(e)}'
        }, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def apply_cleaning_view(request):
    """Handle data cleaning operations"""
    try:
        # Get parameters from request
        column = request.POST.get('column')
        operation = request.POST.get('operation')
        data_json = request.POST.get('data')
        
        if not all([column, operation, data_json]):
            return JsonResponse({
                'success': False,
                'error': 'Missing required parameters'
            })
        
        # Parse data
        data = json.loads(data_json)
        df = pd.DataFrame(data)
        
        # Apply cleaning operation
        stats = apply_cleaning_operation(df, column, operation, request.POST)
        
        # Store updated DataFrame
        set_dataframe_in_store(request, df)
        
        return JsonResponse({
            'success': True,
            'cleaned_data': df.to_dict('records'),
            'stats': stats
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


def apply_cleaning_operation(df, column, operation, params):
    """Apply specific cleaning operation to DataFrame"""
    stats = {}
    
    if operation == 'missing-values':
        stats = handle_missing_values(df, column, params)
    elif operation == 'outliers':
        stats = handle_outliers(df, column, params)
    elif operation == 'data-type':
        stats = convert_data_type(df, column, params)
    elif operation == 'text-cleaning':
        stats = clean_text(df, column, params)
    elif operation == 'duplicates':
        stats = remove_duplicates(df, params)
    elif operation == 'normalize':
        stats = normalize_data(df, column, params)
    
    return stats


def handle_missing_values(df, column, params):
    """Handle missing values in a column"""
    action = params.get('action', 'fill-mean')
    missing_count = df[column].isnull().sum()
    stats = {'missing_filled': missing_count}
    
    if action == 'fill-mean' and pd.api.types.is_numeric_dtype(df[column]):
        df[column].fillna(df[column].mean(), inplace=True)
    elif action == 'fill-median' and pd.api.types.is_numeric_dtype(df[column]):
        df[column].fillna(df[column].median(), inplace=True)
    elif action == 'fill-zero':
        df[column].fillna(0, inplace=True)
    elif action == 'fill-custom':
        custom_value = params.get('custom_value', '')
        df[column].fillna(custom_value, inplace=True)
    elif action == 'drop':
        df.dropna(subset=[column], inplace=True)
        stats['rows_affected'] = missing_count
    
    return stats


def handle_outliers(df, column, params):
    """Handle outliers in a numeric column"""
    if not pd.api.types.is_numeric_dtype(df[column]):
        return {'error': 'Column is not numeric'}
    
    action = params.get('action', 'remove')
    
    # Calculate outliers using IQR method
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    outliers_mask = (df[column] < lower_bound) | (df[column] > upper_bound)
    outliers_count = outliers_mask.sum()
    
    stats = {'outliers_removed': outliers_count}
    
    if action == 'remove':
        df.drop(df[outliers_mask].index, inplace=True)
        stats['rows_affected'] = outliers_count
    elif action == 'cap':
        df.loc[df[column] < lower_bound, column] = lower_bound
        df.loc[df[column] > upper_bound, column] = upper_bound
    elif action == 'flag':
        df[f'{column}_outlier'] = outliers_mask
    
    return stats


def convert_data_type(df, column, params):
    """Convert data type of a column"""
    target_type = params.get('target_type', 'string')
    stats = {'type_converted': True}
    
    try:
        if target_type == 'string':
            df[column] = df[column].astype(str)
        elif target_type == 'number':
            df[column] = pd.to_numeric(df[column], errors='coerce')
        elif target_type == 'date':
            df[column] = pd.to_datetime(df[column], errors='coerce')
        elif target_type == 'boolean':
            df[column] = df[column].astype(bool)
    except Exception as e:
        stats['error'] = f'Conversion failed: {str(e)}'
    
    return stats


def clean_text(df, column, params):
    """Clean text in a column"""
    actions = params.get('actions', [])
    stats = {'text_cleaned': True}
    
    if 'trim' in actions:
        df[column] = df[column].astype(str).str.strip()
    if 'lowercase' in actions:
        df[column] = df[column].astype(str).str.lower()
    if 'uppercase' in actions:
        df[column] = df[column].astype(str).str.upper()
    if 'titlecase' in actions:
        df[column] = df[column].astype(str).str.title()
    if 'remove-special' in actions:
        df[column] = df[column].astype(str).str.replace(r'[^a-zA-Z0-9\s]', '', regex=True)
    
    return stats


def remove_duplicates(df, params):
    """Remove duplicate rows"""
    action = params.get('action', 'remove-all')
    original_count = len(df)
    
    if action == 'remove-all':
        df.drop_duplicates(inplace=True)
    elif action == 'keep-first':
        df.drop_duplicates(keep='first', inplace=True)
    elif action == 'keep-last':
        df.drop_duplicates(keep='last', inplace=True)
    
    removed_count = original_count - len(df)
    return {'duplicates_removed': removed_count, 'rows_affected': removed_count}


def normalize_data(df, column, params):
    """Normalize numeric data"""
    if not pd.api.types.is_numeric_dtype(df[column]):
        return {'error': 'Column is not numeric'}
    
    method = params.get('method', 'min-max')
    stats = {'normalized': True}
    
    if method == 'min-max':
        min_val = df[column].min()
        max_val = df[column].max()
        if max_val != min_val:
            df[column] = (df[column] - min_val) / (max_val - min_val)
    elif method == 'z-score':
        mean_val = df[column].mean()
        std_val = df[column].std()
        if std_val != 0:
            df[column] = (df[column] - mean_val) / std_val
    elif method == 'decimal':
        max_abs = df[column].abs().max()
        if max_abs != 0:
            df[column] = df[column] / max_abs
    
    return stats
