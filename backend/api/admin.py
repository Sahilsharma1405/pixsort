from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import ProcessedImage

@admin.register(ProcessedImage)
class ProcessedImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'image_file', 'owner', 'is_public', 'uploaded_at')
    list_filter = ('is_public', 'owner')
    search_fields = ('detailed_labels',)