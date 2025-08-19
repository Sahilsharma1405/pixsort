from rest_framework import serializers
from .models import ProcessedImage, UserProfile
from django.contrib.auth.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user', 'payment_details']
        read_only_fields = ['user']

class ProcessedImageSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    sold_to_username = serializers.ReadOnlyField(source='sold_to.username') 

    class Meta:
        model = ProcessedImage
        fields = [
            'id', 'image_file', 'owner_username', 'uploaded_at', 
            'general_categories', 'detailed_labels', 'is_public',
            'for_sale', 'price', 'title', 'description', 'sold_to_username'
        ]

class PublicImageSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = ProcessedImage
        fields = ['id', 'image_file', 'owner_username', 'detailed_labels', 'title', 'description', 'price']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user