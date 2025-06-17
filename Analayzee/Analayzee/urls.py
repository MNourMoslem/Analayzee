"""
URL configuration for Analayzee project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render

def showcase_view(request):
    """View to display the component showcase page."""
    return render(request, 'showcase.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),  # Main app (home page, analysis, etc.)
    path('accounts/', include('accounts.urls')),
    path('showcase/', showcase_view, name='showcase'),  # Component showcase
]
