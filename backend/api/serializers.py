# In backend/api/serializers.py
from rest_framework import serializers
from .models import ProcessedImage
from django.contrib.auth.models import User
# from dj_rest_auth.serializers import LoginSerializer 
class ProcessedImageSerializer(serializers.ModelSerializer):
    # This will display the owner's username in the API response, which is useful.
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = ProcessedImage
        # Define all the fields we want to see in the API response
        fields = [
            'id', 'image_file', 'owner_username', 'uploaded_at', 
            'general_categories', 'detailed_labels','is_public'
        ]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # This method handles creating the user and hashing the password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    

