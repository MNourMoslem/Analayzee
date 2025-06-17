from django.urls import path
from . import views

app_name = 'main'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('upload/', views.upload_file_view, name='upload_file'),
    path('analysis/', views.analysis_view, name='analysis'),
    path('api/file-info/', views.api_file_info, name='api_file_info'),
    path('api/charts-data/', views.api_charts_data, name='api_charts_data'),
] 