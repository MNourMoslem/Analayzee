from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import pandas as pd
import os
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
