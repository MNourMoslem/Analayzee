from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SubscriptionType, SubscriptionHistory, UserSession


@admin.register(SubscriptionType)
class SubscriptionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name', 'price', 'duration_days', 'max_file_size_mb', 'max_files_per_month', 'is_active')
    list_filter = ('is_active', 'price')
    search_fields = ('name', 'display_name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'description', 'is_active')
        }),
        ('Pricing & Duration', {
            'fields': ('price', 'duration_days')
        }),
        ('Limits', {
            'fields': ('max_file_size_mb', 'max_files_per_month')
        }),
        ('Features', {
            'fields': ('features',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'subscription_type', 'is_subscription_active', 'files_uploaded_this_month', 'is_staff', 'is_active')
    list_filter = ('is_subscription_active', 'subscription_type', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'last_login', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('email', 'username', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name')
        }),
        ('Subscription', {
            'fields': ('subscription_type', 'subscription_start_date', 'subscription_end_date', 'is_subscription_active', 'files_uploaded_this_month', 'last_file_upload_reset')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )


@admin.register(SubscriptionHistory)
class SubscriptionHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'subscription_type', 'action', 'start_date', 'end_date', 'amount_paid', 'created_at')
    list_filter = ('action', 'subscription_type', 'created_at')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Subscription Details', {
            'fields': ('user', 'subscription_type', 'action')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Payment', {
            'fields': ('amount_paid',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_id', 'ip_address', 'login_time', 'logout_time', 'is_active')
    list_filter = ('is_active', 'login_time')
    search_fields = ('user__email', 'user__username', 'session_id')
    readonly_fields = ('session_id', 'login_time', 'created_at')
    ordering = ('-login_time',)
    
    fieldsets = (
        ('Session Info', {
            'fields': ('user', 'session_id', 'is_active')
        }),
        ('Connection Details', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Timestamps', {
            'fields': ('login_time', 'logout_time', 'created_at'),
            'classes': ('collapse',)
        }),
    )


# Custom admin actions
@admin.action(description="Activate selected subscriptions")
def activate_subscriptions(modeladmin, request, queryset):
    for user in queryset:
        if user.subscription_type and not user.is_subscription_active:
            user.activate_subscription(user.subscription_type)
    modeladmin.message_user(request, f"Activated {queryset.count()} subscriptions.")


@admin.action(description="Deactivate selected subscriptions")
def deactivate_subscriptions(modeladmin, request, queryset):
    for user in queryset:
        if user.is_subscription_active:
            user.deactivate_subscription()
    modeladmin.message_user(request, f"Deactivated {queryset.count()} subscriptions.")


@admin.action(description="Reset file upload counts")
def reset_file_counts(modeladmin, request, queryset):
    for user in queryset:
        user.files_uploaded_this_month = 0
        user.save()
    modeladmin.message_user(request, f"Reset file counts for {queryset.count()} users.")


# Add custom actions to UserAdmin
CustomUserAdmin.actions = [activate_subscriptions, deactivate_subscriptions, reset_file_counts] + list(CustomUserAdmin.actions) 