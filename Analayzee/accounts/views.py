from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash
from .forms import (
    CustomUserCreationForm, 
    CustomAuthenticationForm, 
    ProfileUpdateForm,
    ChangePasswordForm
)
from .models import User, get_free_subscription_type
import pandas as pd
from .utils import set_dataframe_in_store, get_dataframe_from_store, clear_dataframe_store


def signup_view(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('showcase')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.email = form.cleaned_data['email']
            user.save()
            
            # Assign free subscription type to new user
            free_subscription = get_free_subscription_type()
            user.subscription_type = free_subscription
            user.save()
            
            # Authenticate the user before login to set backend
            authenticated_user = authenticate(request, username=user.email, password=form.cleaned_data['password1'])
            if authenticated_user is not None:
                login(request, authenticated_user)
                messages.success(request, 'Account created successfully! Welcome to Analayzee.')
                return redirect('showcase')
            else:
                messages.error(request, 'There was a problem logging you in. Please try logging in manually.')
                return redirect('accounts:login')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'accounts/signup.html', {
        'form': form,
        'title': 'Sign Up - Analayzee'
    })


def login_view(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('showcase')
    
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            remember_me = form.cleaned_data.get('remember_me')
            
            user = authenticate(request, username=email, password=password)
            if user is not None:
                login(request, user)
                if not remember_me:
                    request.session.set_expiry(0)
                
                messages.success(request, f'Welcome back, {user.first_name or user.username}!')
                
                # Redirect to next page or default
                next_url = request.GET.get('next', 'showcase')
                return redirect(next_url)
            else:
                messages.error(request, 'Invalid email or password.')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'accounts/login.html', {
        'form': form,
        'title': 'Login - Analayzee'
    })


@login_required
def logout_view(request):
    """User logout view"""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('showcase')


@login_required
def profile_view(request):
    """User profile view"""
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('profile')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ProfileUpdateForm(instance=request.user)
    
    return render(request, 'accounts/profile.html', {
        'form': form,
        'title': 'Profile - Analayzee'
    })


@login_required
def change_password_view(request):
    """Change password view"""
    if request.method == 'POST':
        form = ChangePasswordForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, form.user)
            messages.success(request, 'Password changed successfully!')
            return redirect('profile')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ChangePasswordForm(request.user)
    
    return render(request, 'accounts/change_password.html', {
        'form': form,
        'title': 'Change Password - Analayzee'
    })


@login_required
def subscription_view(request):
    """User subscription view"""
    user = request.user
    
    # Get subscription info
    subscription_info = {
        'status': user.subscription_status,
        'type': user.subscription_type.display_name if user.subscription_type else 'Free',
        'is_active': user.is_subscription_active,
        'days_until_expiry': user.days_until_expiry,
        'files_uploaded': user.files_uploaded_this_month,
        'max_files': user.subscription_type.max_files_per_month if user.subscription_type else 5,
        'max_file_size': user.subscription_type.max_file_size_mb if user.subscription_type else 10,
    }
    
    return render(request, 'accounts/subscription.html', {
        'subscription_info': subscription_info,
        'title': 'Subscription - Analayzee'
    })


@require_http_methods(["POST"])
@csrf_exempt
def check_subscription_status(request):
    """API endpoint to check user subscription status"""
    if not request.user.is_authenticated:
        return JsonResponse({
            'status': 'error',
            'message': 'User not authenticated'
        }, status=401)
    
    user = request.user
    feature = request.POST.get('feature')
    
    if feature:
        has_access = user.get_feature_access(feature)
        return JsonResponse({
            'status': 'success',
            'has_access': has_access,
            'subscription_status': user.subscription_status,
            'is_premium': user.is_premium_user
        })
    
    return JsonResponse({
        'status': 'success',
        'subscription_status': user.subscription_status,
        'is_premium': user.is_premium_user,
        'days_until_expiry': user.days_until_expiry,
        'files_uploaded': user.files_uploaded_this_month,
        'max_files': user.subscription_type.max_files_per_month if user.subscription_type else 5,
    })


def subscription_required(feature_name=None):
    """Decorator to require subscription for specific features"""
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                messages.warning(request, 'Please log in to access this feature.')
                return redirect('login')
            
            if feature_name:
                if not request.user.get_feature_access(feature_name):
                    messages.warning(request, 'This feature requires a premium subscription.')
                    return redirect('subscription')
            elif request.user.is_free_user:
                messages.warning(request, 'This feature requires a premium subscription.')
                return redirect('subscription')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


# Context processor to make user subscription info available in templates
def subscription_context(request):
    """Add subscription info to template context"""
    if request.user.is_authenticated:
        return {
            'user_subscription_status': request.user.subscription_status,
            'user_is_premium': request.user.is_premium_user,
            'user_is_free': request.user.is_free_user,
        }
    return {
        'user_subscription_status': 'free',
        'user_is_premium': False,
        'user_is_free': True,
    }


# === DEBUG STORE SHOWCASE VIEWS ===
@csrf_exempt
def debug_store_upload(request):
    """Upload a CSV and store as DataFrame in session store."""
    context = {'title': 'Debug Store: Upload CSV'}
    if request.method == 'POST' and request.FILES.get('csv_file'):
        csv_file = request.FILES['csv_file']
        try:
            df = pd.read_csv(csv_file)
            set_dataframe_in_store(request, df)
            context['success'] = True
            context['columns'] = list(df.columns)
            context['rows'] = len(df)
        except Exception as e:
            context['error'] = f'Failed to read CSV: {e}'
    return render(request, 'accounts/debug_store_upload.html', context)


def debug_store_view(request):
    """View the DataFrame stored in the session store."""
    df = get_dataframe_from_store(request)
    context = {'title': 'Debug Store: View DataFrame'}
    if df is not None:
        context['columns'] = list(df.columns)
        context['rows'] = len(df)
        context['head_html'] = df.head(20).to_html(classes='table table-striped', index=False)
        context['info'] = str(df.info(buf=None))
    else:
        context['error'] = 'No DataFrame in store. Please upload a CSV first.'
    return render(request, 'accounts/debug_store_view.html', context)


def debug_store_clear(request):
    """Clear the DataFrame from the session store."""
    clear_dataframe_store(request)
    return render(request, 'accounts/debug_store_clear.html', {'title': 'Debug Store: Cleared'})


def debug_store_nav(request):
    """Navigation page for debug store showcases."""
    return render(request, 'accounts/debug_store_nav.html', {'title': 'Debug Store: Navigation'}) 