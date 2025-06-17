from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import uuid


class SubscriptionType(models.Model):
    """Subscription plan types"""
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_days = models.IntegerField(default=30)
    max_file_size_mb = models.IntegerField(default=10)
    max_files_per_month = models.IntegerField(default=5)
    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return self.display_name


class User(AbstractUser):
    """Custom user model with subscription support"""
    email = models.EmailField(unique=True)
    subscription_type = models.ForeignKey(
        SubscriptionType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    is_subscription_active = models.BooleanField(default=False)
    files_uploaded_this_month = models.IntegerField(default=0)
    last_file_upload_reset = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Override username to use email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    @property
    def is_free_user(self):
        """Check if user is on free plan"""
        return not self.is_subscription_active or self.subscription_type is None

    @property
    def is_premium_user(self):
        """Check if user has active premium subscription"""
        return self.is_subscription_active and self.subscription_type is not None

    @property
    def subscription_status(self):
        """Get current subscription status"""
        if not self.is_subscription_active:
            return 'free'
        if self.subscription_end_date and self.subscription_end_date < timezone.now():
            return 'expired'
        return 'active'

    @property
    def days_until_expiry(self):
        """Get days until subscription expires"""
        if not self.subscription_end_date:
            return None
        delta = self.subscription_end_date - timezone.now()
        return max(0, delta.days)

    def can_upload_file(self, file_size_mb):
        """Check if user can upload a file based on subscription limits"""
        if self.is_free_user:
            # Free users have basic limits
            return file_size_mb <= 10 and self.files_uploaded_this_month < 5
        
        # Premium users have higher limits
        return (file_size_mb <= self.subscription_type.max_file_size_mb and 
                self.files_uploaded_this_month < self.subscription_type.max_files_per_month)

    def increment_file_count(self):
        """Increment monthly file upload count"""
        # Reset counter if it's a new month
        if self.last_file_upload_reset.month != timezone.now().month:
            self.files_uploaded_this_month = 0
            self.last_file_upload_reset = timezone.now()
        
        self.files_uploaded_this_month += 1
        self.save()

    def activate_subscription(self, subscription_type, duration_days=None):
        """Activate a subscription for the user"""
        self.subscription_type = subscription_type
        self.subscription_start_date = timezone.now()
        
        if duration_days is None:
            duration_days = subscription_type.duration_days
        
        self.subscription_end_date = timezone.now() + timedelta(days=duration_days)
        self.is_subscription_active = True
        self.save()

    def deactivate_subscription(self):
        """Deactivate user subscription"""
        self.is_subscription_active = False
        self.subscription_end_date = timezone.now()
        self.save()

    def get_feature_access(self, feature_name):
        """Check if user has access to a specific feature"""
        if self.is_free_user:
            # Free features
            free_features = {
                'basic_analysis': True,
                'csv_upload': True,
                'excel_upload': True,
                'basic_export': True,
                'advanced_analysis': False,
                'bulk_processing': False,
                'api_access': False,
                'priority_support': False,
                'custom_reports': False,
            }
            return free_features.get(feature_name, False)
        
        # Premium features based on subscription type
        return self.subscription_type.features.get(feature_name, False)


class SubscriptionHistory(models.Model):
    """Track subscription changes"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription_history')
    subscription_type = models.ForeignKey(SubscriptionType, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, choices=[
        ('activated', 'Activated'),
        ('renewed', 'Renewed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('upgraded', 'Upgraded'),
        ('downgraded', 'Downgraded'),
    ])
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.subscription_type.name}"


class UserSession(models.Model):
    """Track user sessions for analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} - {self.session_id}"


# Utility functions for subscription management
def get_free_subscription_type():
    """Get or create the free subscription type"""
    free_type, created = SubscriptionType.objects.get_or_create(
        name='free',
        defaults={
            'display_name': 'Free Plan',
            'description': 'Basic features for casual users',
            'price': 0.00,
            'duration_days': 0,
            'max_file_size_mb': 10,
            'max_files_per_month': 5,
            'features': {
                'basic_analysis': True,
                'csv_upload': True,
                'excel_upload': True,
                'basic_export': True,
                'advanced_analysis': False,
                'bulk_processing': False,
                'api_access': False,
                'priority_support': False,
                'custom_reports': False,
            }
        }
    )
    return free_type


def get_premium_subscription_type():
    """Get or create the premium subscription type"""
    premium_type, created = SubscriptionType.objects.get_or_create(
        name='premium',
        defaults={
            'display_name': 'Premium Plan',
            'description': 'Advanced features for power users',
            'price': 9.99,
            'duration_days': 30,
            'max_file_size_mb': 100,
            'max_files_per_month': 100,
            'features': {
                'basic_analysis': True,
                'csv_upload': True,
                'excel_upload': True,
                'basic_export': True,
                'advanced_analysis': True,
                'bulk_processing': True,
                'api_access': True,
                'priority_support': True,
                'custom_reports': True,
            }
        }
    )
    return premium_type


def check_subscription_expiry():
    """Check and update expired subscriptions"""
    expired_users = User.objects.filter(
        is_subscription_active=True,
        subscription_end_date__lt=timezone.now()
    )
    
    for user in expired_users:
        user.deactivate_subscription()
        SubscriptionHistory.objects.create(
            user=user,
            subscription_type=user.subscription_type,
            action='expired',
            start_date=user.subscription_start_date,
            end_date=user.subscription_end_date,
            amount_paid=user.subscription_type.price
        )


def reset_monthly_file_counts():
    """Reset monthly file upload counts for all users"""
    current_month = timezone.now().month
    users_to_reset = User.objects.filter(
        last_file_upload_reset__month__lt=current_month
    )
    
    for user in users_to_reset:
        user.files_uploaded_this_month = 0
        user.last_file_upload_reset = timezone.now()
        user.save() 