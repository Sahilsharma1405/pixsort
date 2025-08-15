from pathlib import Path
from django.contrib.auth.models import User
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .analysis import analyze_image_and_categorize, load_category_map_from_json
from .models import ProcessedImage
from .serializers import ProcessedImageSerializer, UserSerializer

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
    
class PublicImageListView(generics.ListAPIView):
    """
    An API view to return a list of all PUBLIC images.
    """
    queryset = ProcessedImage.objects.filter(is_public=True).select_related('owner').order_by('-uploaded_at')
    permission_classes = [AllowAny] # <-- No login required
    serializer_class = ProcessedImageSerializer