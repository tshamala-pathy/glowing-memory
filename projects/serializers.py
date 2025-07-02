from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        # Alternatively, you can specify fields explicitly:
        # fields = ('id', 'title', 'description', 'technologies', 'image', 'tags', 'created_at')