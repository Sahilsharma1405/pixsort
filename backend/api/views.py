from pathlib import Path
from django.contrib.auth.models import User
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from .models import ProcessedImage, UserProfile
from bson.decimal128 import Decimal128
from .analysis import analyze_image_and_categorize, load_category_map_from_json
# from .models import ProcessedImage
from .serializers import ProcessedImageSerializer, UserSerializer,PublicImageSerializer,UserProfileSerializer
CATEGORY_MAP = load_category_map_from_json("categories.json")


class ImageUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]  # <-- FIXED: Require user to be logged in

    def post(self, request, *args, **kwargs):
        serializer = ProcessedImageSerializer(data=request.data)
        if serializer.is_valid():
            # FIXED: Save the image with the logged-in user as the owner
            instance = serializer.save(owner=self.request.user)

            image_path = Path(instance.image_file.path)
            results = analyze_image_and_categorize(
                image_path=image_path, 
                device="cpu",
                category_map=CATEGORY_MAP
            )
            
            instance.detailed_labels = results.get("detailed_labels", [])
            instance.general_categories = results.get("general_categories", [])
            instance.save()
            
            final_serializer = ProcessedImageSerializer(instance)
            return Response(final_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ImageListView(generics.ListAPIView):
    serializer_class = ProcessedImageSerializer
    permission_classes = [IsAuthenticated]  # <-- FIXED: Require user to be logged in

    def get_queryset(self):
        user = self.request.user
        # FIXED: Only return images owned by the current logged-in user
        queryset = ProcessedImage.objects.filter(owner=user).order_by('-uploaded_at')
        
        category_name = self.request.query_params.get('category')
        if category_name is not None:
            queryset = queryset.filter(general_categories__icontains=category_name)

        search_term = self.request.query_params.get('search')
        if search_term is not None:
            queryset = queryset.filter(detailed_labels__icontains=search_term)
            
        return queryset


class ImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProcessedImageSerializer
    permission_classes = [IsAuthenticated]  # <-- FIXED: Require user to be logged in
    
    def get_queryset(self):
        user = self.request.user
        # FIXED: Only allow access to images owned by the current logged-in user
        return ProcessedImage.objects.filter(owner=user)


class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer


class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = self.request.user
        images = ProcessedImage.objects.filter(owner=user)
        image_count = images.count()
        
        categories = images.values_list('general_categories', flat=True)
        unique_categories = set(cat for sublist in categories if sublist for cat in sublist)
        
        stats = {
            'image_count': image_count,
            'category_count': len(unique_categories),
            'user_since': user.date_joined.strftime("%B %Y"),
        }
        return Response(stats, status=status.HTTP_200_OK)
    
class PublicImageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        all_images = list(ProcessedImage.objects.order_by('-uploaded_at'))
        public_images = [img for img in all_images if img.is_public]
        serializer = PublicImageSerializer(public_images, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Get or create a profile for the logged-in user
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class MarketplaceListView(APIView):
    """
    Lists all images for sale using a manual Python filter for djongo compatibility.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # Fetch all images and then filter in Python
        all_images = list(ProcessedImage.objects.order_by('-uploaded_at'))
        for_sale_images = [
            img for img in all_images if img.for_sale and img.sold_to is None
        ]
        serializer = PublicImageSerializer(for_sale_images, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MyPurchasesListView(generics.ListAPIView):
    serializer_class = ProcessedImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProcessedImage.objects.filter(sold_to=self.request.user).order_by('-uploaded_at')

class PurchaseImageView(APIView):
    """Handles the purchase of an image."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            image = ProcessedImage.objects.get(pk=pk)
        except ProcessedImage.DoesNotExist:
            return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not image.for_sale or image.sold_to is not None:
            return Response({'error': 'Image is not available for purchase.'}, status=status.HTTP_400_BAD_REQUEST)

        if image.owner == request.user:
            return Response({'error': 'You cannot purchase your own image.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- FIX: Convert the price to a standard Decimal BEFORE saving ---
        if image.price is not None:
            try:
                # Convert from string or MongoDB's Decimal128 to Python's Decimal
                image.price = Decimal(str(image.price))
            except Exception as e:
                return Response({'error': f'Invalid price format: {e}'}, status=status.HTTP_400_BAD_REQUEST)
        
        image.sold_to = request.user
        image.for_sale = False
        image.save() # Now, the save method will have the correct data type
        
        serializer = ProcessedImageSerializer(image)
        return Response(serializer.data, status=status.HTTP_200_OK)