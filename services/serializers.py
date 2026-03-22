from rest_framework import serializers
import json
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Service model.
    Converts features and categories to/from lists; builds absolute image URLs.
    """
    features = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'title', 'description', 'short_description', 'price',
            'features', 'categories', 'icon', 'is_featured', 'sort_order', 'image',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def get_features(self, obj):
        return obj.get_features_list()

    def get_categories(self, obj):
        categories_list = obj.get_categories_list()
        return [{'id': idx, 'name': cat} for idx, cat in enumerate(categories_list)]

    def _build_media_url(self, path):
        if not path or not isinstance(path, str):
            return path
        if path.startswith(('http://', 'https://')):
            return path
        path = path if path.startswith('/') else '/' + path
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(path)
        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
        return f'{base}{path}'
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('name') == 'Service' and instance.title:
            ret['name'] = instance.title
        if instance.image:
            ret['image'] = self._build_media_url(instance.image.url)
        return ret

    def _parse_features(self, val):
        if isinstance(val, list):
            return json.dumps(val)
        if isinstance(val, str) and val.strip():
            return json.dumps([f.strip() for f in val.split(',') if f.strip()])
        return ''

    def _parse_categories(self, val):
        if isinstance(val, list):
            return ','.join(cat.get('name', cat) if isinstance(cat, dict) else str(cat) for cat in val)
        if isinstance(val, str):
            return val
        return ''

    def create(self, validated_data):
        features_raw = self.initial_data.get('features')
        categories_raw = self.initial_data.get('categories')
        validated_data['features'] = self._parse_features(features_raw) if features_raw is not None else ''
        validated_data['categories'] = self._parse_categories(categories_raw) if categories_raw is not None else ''
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'features' in self.initial_data:
            validated_data['features'] = self._parse_features(self.initial_data['features'])
        if 'categories' in self.initial_data:
            validated_data['categories'] = self._parse_categories(self.initial_data['categories'])
        return super().update(instance, validated_data)