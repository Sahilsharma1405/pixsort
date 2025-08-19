# In backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('upload/', views.ImageUploadView.as_view(), name='image-upload'),
    path('images/', views.ImageListView.as_view(), name='image-list'), # Add this line
    path('images/<int:pk>/', views.ImageDetailView.as_view(), name='image-detail'),
    path('user/delete/', views.UserDeleteView.as_view(), name='user-delete'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('public-images/', views.PublicImageListView.as_view(), name='public-image-list'),
    path('marketplace/', views.MarketplaceListView.as_view(), name='marketplace-list'),
    path('my-purchases/', views.MyPurchasesListView.as_view(), name='my-purchases-list'),
    path('images/<int:pk>/purchase/', views.PurchaseImageView.as_view(), name='purchase-image'),
]