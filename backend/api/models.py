from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class ProcessedImage(models.Model):
    is_public = models.BooleanField(default=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    image_file = models.ImageField(upload_to='images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    general_categories = models.JSONField(default=list)
    detailed_labels = models.JSONField(default=list)

    def __str__(self):
        return self.image_file.name