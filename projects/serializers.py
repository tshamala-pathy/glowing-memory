from rest_framework import serializers
from .models import Project

# 📌 Serializer for the Project model.
class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer to convert Project model instances into JSON format
    and validate incoming project data.

    Uses all model fields by default, but specific fields can be listed explicitly if needed.
    """
    class Meta:
        model = Project
        fields = '__all__'  # Includes all fields in the Project model

        # Alternatively, you can specify fields explicitly:
        # fields = ('id', 'title', 'description', 'technologies', 'image', 'tags', 'created_at')
        # This allows for flexibility in what data is serialized and deserialized.