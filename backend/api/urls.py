# In backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.ImageUploadView.as_view(), name='image-upload'),
    path('images/', views.ImageListView.as_view(), name='image-list'), # Add this line
    path('images/<int:pk>/', views.ImageDetailView.as_view(), name='image-detail'),
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('user/delete/', views.UserDeleteView.as_view(), name='user-delete'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('public-images/', views.PublicImageListView.as_view(), name='public-image-list'),
]