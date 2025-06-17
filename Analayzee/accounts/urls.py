from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    path('subscription/', views.subscription_view, name='subscription'),
    path('api/check-subscription/', views.check_subscription_status, name='check_subscription_status'),
    # Debug store showcase URLs
    path('debug-store/', views.debug_store_nav, name='debug_store_nav'),
    path('debug-store/upload/', views.debug_store_upload, name='debug_store_upload'),
    path('debug-store/view/', views.debug_store_view, name='debug_store_view'),
    path('debug-store/clear/', views.debug_store_clear, name='debug_store_clear'),
] 