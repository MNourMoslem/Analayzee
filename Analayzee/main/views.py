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
    try:
        df = get_dataframe_from_store(request)
        
        if df is None:
            messages.warning(request, 'No file data found. Please upload a file first.')
            return redirect('main:home')
        
        # Clean the data for JSON serialization
        def clean_for_json(obj):
            if pd.isna(obj):
                return None
            elif isinstance(obj, (np.integer, np.floating)):
                return float(obj) if not np.isnan(obj) else None
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, pd.Timestamp):
                return obj.isoformat()
            else:
                return obj
        
        # Clean the DataFrame data
        cleaned_data = []
        for _, row in df.head(50).iterrows():
            cleaned_row = {}
            for col in df.columns:
                cleaned_row[col] = clean_for_json(row[col])
            cleaned_data.append(cleaned_row)
        
        # Serialize to JSON with error handling
        try:
            table_data_json = json.dumps(cleaned_data)
            column_names_json = json.dumps(list(df.columns))
        except Exception as e:
            print(f"JSON serialization error: {e}")
            # Fallback to empty data
            table_data_json = json.dumps([])
            column_names_json = json.dumps([])
        
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
            'table_data': cleaned_data,  # Use cleaned data
            'column_names': list(df.columns),
            'table_data_json': table_data_json,  # Pre-serialized JSON
            'column_names_json': column_names_json,  # Pre-serialized JSON
        }
        
        return render(request, 'main/analysis.html', context)
        
    except Exception as e:
        print(f"Error in analysis_view: {e}")
        messages.error(request, f'Error processing data: {str(e)}')
        return redirect('main:home')


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
    elif action == 'fill-mode':
        mode_value = df[column].mode().iloc[0] if not df[column].mode().empty else None
        df[column].fillna(mode_value, inplace=True)
    elif action == 'fill-zero':
        df[column].fillna(0, inplace=True)
    elif action == 'fill-custom':
        custom_value = params.get('custom_value', '')
        df[column].fillna(custom_value, inplace=True)
    elif action == 'drop':
        df.dropna(subset=[column], inplace=True)
        stats['rows_dropped'] = missing_count
    
    return stats


def handle_outliers(df, column, params):
    """Handle outliers in a column"""
    method = params.get('method', 'iqr')
    action = params.get('action', 'cap')
    threshold = params.get('threshold', 1.5)
    
    if not pd.api.types.is_numeric_dtype(df[column]):
        return {'error': 'Column is not numeric'}
    
    outliers_mask = pd.Series([False] * len(df))
    
    if method == 'iqr':
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - threshold * IQR
        upper_bound = Q3 + threshold * IQR
        outliers_mask = (df[column] < lower_bound) | (df[column] > upper_bound)
    elif method == 'zscore':
        z_scores = np.abs((df[column] - df[column].mean()) / df[column].std())
        outliers_mask = z_scores > threshold
    elif method == 'percentile':
        lower_percentile = (100 - threshold * 100) / 2
        upper_percentile = 100 - lower_percentile
        lower_bound = df[column].quantile(lower_percentile / 100)
        upper_bound = df[column].quantile(upper_percentile / 100)
        outliers_mask = (df[column] < lower_bound) | (df[column] > upper_bound)
    
    outlier_count = outliers_mask.sum()
    stats = {'outliers_found': outlier_count}
    
    if action == 'cap':
        if method == 'iqr':
            df.loc[df[column] < lower_bound, column] = lower_bound
            df.loc[df[column] > upper_bound, column] = upper_bound
        elif method == 'zscore':
            mean_val = df[column].mean()
            std_val = df[column].std()
            df.loc[df[column] < mean_val - threshold * std_val, column] = mean_val - threshold * std_val
            df.loc[df[column] > mean_val + threshold * std_val, column] = mean_val + threshold * std_val
        elif method == 'percentile':
            df.loc[df[column] < lower_bound, column] = lower_bound
            df.loc[df[column] > upper_bound, column] = upper_bound
        stats['outliers_capped'] = outlier_count
    elif action == 'remove':
        df.drop(df[outliers_mask].index, inplace=True)
        stats['outliers_removed'] = outlier_count
    elif action == 'mark':
        df[f'{column}_is_outlier'] = outliers_mask
        stats['outliers_marked'] = outlier_count
    
    return stats


def convert_data_type(df, column, params):
    """Convert data type of a column"""
    target_type = params.get('target_type', 'string')
    method = params.get('method', 'coerce')
    
    stats = {'original_type': str(df[column].dtype)}
    
    try:
        if target_type == 'int':
            df[column] = pd.to_numeric(df[column], errors='coerce' if method == 'coerce' else 'raise').astype('Int64')
        elif target_type == 'float':
            df[column] = pd.to_numeric(df[column], errors='coerce' if method == 'coerce' else 'raise')
        elif target_type == 'string':
            df[column] = df[column].astype(str)
        elif target_type == 'datetime':
            df[column] = pd.to_datetime(df[column], errors='coerce' if method == 'coerce' else 'raise')
        elif target_type == 'boolean':
            df[column] = df[column].map({'true': True, 'false': False, '1': True, '0': False, 1: True, 0: False})
        
        stats['new_type'] = str(df[column].dtype)
        stats['conversion_successful'] = True
        
    except Exception as e:
        stats['conversion_successful'] = False
        stats['error'] = str(e)
    
    return stats


def clean_text(df, column, params):
    """Clean text data in a column"""
    import re
    
    stats = {'rows_processed': len(df)}
    
    def clean_text_value(text):
        if pd.isna(text) or text is None:
            return text
        
        text = str(text)
        
        if params.get('trim_whitespace', True):
            text = text.strip()
        
        if params.get('lowercase', False):
            text = text.lower()
        
        if params.get('remove_special', False):
            text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        
        if params.get('remove_numbers', False):
            text = re.sub(r'\d+', '', text)
        
        if params.get('remove_duplicates', False):
            words = text.split()
            unique_words = []
            for word in words:
                if word not in unique_words:
                    unique_words.append(word)
            text = ' '.join(unique_words)
        
        # Custom replacements
        custom_replacements = params.get('custom_replacements', '')
        if custom_replacements:
            for line in custom_replacements.split('\n'):
                if ':' in line:
                    old, new = line.split(':', 1)
                    text = text.replace(old.strip(), new.strip())
        
        return text
    
    df[column] = df[column].apply(clean_text_value)
    
    return stats


def remove_duplicates(df, params):
    """Remove duplicate rows"""
    scope = params.get('scope', 'all')
    action = params.get('action', 'remove')
    keep_option = params.get('keep', 'first')
    
    original_count = len(df)
    
    if scope == 'all':
        subset = None
    elif scope == 'selected':
        column = params.get('column')
        subset = [column] if column else None
    else:  # subset
        subset = params.get('subset_columns', [])
    
    if action == 'remove':
        df.drop_duplicates(subset=subset, keep=keep_option, inplace=True)
        removed_count = original_count - len(df)
        stats = {'duplicates_removed': removed_count, 'rows_remaining': len(df)}
    elif action == 'mark':
        df['is_duplicate'] = df.duplicated(subset=subset, keep=False)
        duplicate_count = df['is_duplicate'].sum()
        stats = {'duplicates_marked': duplicate_count}
    elif action == 'count':
        duplicate_count = df.duplicated(subset=subset, keep=False).sum()
        stats = {'duplicate_count': duplicate_count}
    
    return stats


def normalize_data(df, column, params):
    """Normalize numeric data"""
    method = params.get('method', 'minmax')
    range_min = params.get('range_min', 0)
    range_max = params.get('range_max', 1)
    
    if not pd.api.types.is_numeric_dtype(df[column]):
        return {'error': 'Column is not numeric'}
    
    stats = {'original_min': df[column].min(), 'original_max': df[column].max()}
    
    if method == 'minmax':
        df[column] = (df[column] - df[column].min()) / (df[column].max() - df[column].min())
        df[column] = df[column] * (range_max - range_min) + range_min
    elif method == 'zscore':
        df[column] = (df[column] - df[column].mean()) / df[column].std()
    elif method == 'robust':
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        df[column] = (df[column] - Q1) / IQR
    elif method == 'decimal':
        max_abs = df[column].abs().max()
        if max_abs > 0:
            scale = 10 ** (len(str(int(max_abs))) - 1)
            df[column] = df[column] / scale
    
    stats['new_min'] = df[column].min()
    stats['new_max'] = df[column].max()
    
    return stats
