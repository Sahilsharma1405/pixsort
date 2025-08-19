from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class UserProfile(models.Model):
    # Links this profile to a specific Django User in a one-to-one relationship
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # A simple text field to simulate storing payment information
    # WARNING: In a real app, never store financial data like this. Use a secure payment provider.
    payment_details = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.user.username

class ProcessedImage(models.Model):
    is_public = models.BooleanField(default=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    image_file = models.ImageField(upload_to='images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    general_categories = models.JSONField(default=list)
    detailed_labels = models.JSONField(default=list)

    for_sale = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    sold_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchased_images')

    def __str__(self):
        return self.image_file.name