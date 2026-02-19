from django.contrib import admin
from django.utils.html import format_html
from django.conf import settings
import os
from .models import Project

# Register your models here.
# Admin configuration for the Project model.

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'category', 'created_at', 'has_image', 'image_preview')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'description', 'technologies', 'tags')
    fields = ('title', 'description', 'technologies', 'tags', 'status', 'category', 'image', 'image_preview', 'github_url', 'live_url')
    readonly_fields = ('created_at', 'updated_at', 'image_preview')
    
    def save_model(self, request, obj, form, change):
        """Override save to log and verify image file upload."""
        # Log file upload information for debugging
        print("\n" + "="*60)
        print("[ADMIN] Saving Project - Image Upload Debug")
        print("="*60)
        print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        print(f"MEDIA_ROOT exists: {os.path.exists(str(settings.MEDIA_ROOT))}")
        print(f"MEDIA_ROOT writable: {os.access(str(settings.MEDIA_ROOT), os.W_OK)}")
        
        # Check if image is in the form's cleaned_data (after form validation)
        if form.is_valid():
            if 'image' in form.cleaned_data:
                img = form.cleaned_data['image']
                if img:
                    print(f"[OK] Image in form.cleaned_data: {img.name if hasattr(img, 'name') else 'File object'}")
                elif img is False:
                    print("[WARN] Image field cleared (False)")
                else:
                    print("[WARN] Image field is None/empty in cleaned_data")
        
        # Check request.FILES (raw upload before form processing)
        if 'image' in request.FILES:
            uploaded_file = request.FILES['image']
            print(f"[OK] Image file in request.FILES: {uploaded_file.name}")
            print(f"   Size: {uploaded_file.size} bytes")
            print(f"   Content type: {uploaded_file.content_type}")
        else:
            print("[WARN] No image file in request.FILES")
            if change and obj.pk and obj.image:
                print(f"   Keeping existing image: {obj.image.name}")
        
        # Call parent save - Django ModelForm handles file upload automatically
        # The image from form.cleaned_data['image'] will be assigned to obj.image
        super().save_model(request, obj, form, change)
        
        # Refresh from database to get the latest state
        if obj.pk:
            obj.refresh_from_db()
        
        # Verify file was saved
        if obj.image:
            file_path = os.path.join(settings.MEDIA_ROOT, obj.image.name)
            print(f"\n[ADMIN] After save:")
            print(f"   Image field value: {obj.image.name}")
            print(f"   Full file path: {file_path}")
            print(f"   File exists on disk: {os.path.exists(file_path)}")
            if os.path.exists(file_path):
                print(f"   File size: {os.path.getsize(file_path)} bytes")
                print("[SUCCESS] Image file saved to disk!")
            else:
                print("[ERROR] Image field set but file not found on disk!")
                print(f"   Expected path: {file_path}")
                print(f"   MEDIA_ROOT: {settings.MEDIA_ROOT}")
                print(f"   Image name: {obj.image.name}")
        else:
            print("[ERROR] No image after save!")
            print("   This means the file was not saved to the image field")
        print("="*60 + "\n")
    
    def has_image(self, obj):
        """Display whether the project has an image."""
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Has Image'
    
    def image_preview(self, obj):
        """Display image preview in admin."""
        if obj.image:
            try:
                return format_html(
                    '<img src="{}" style="max-height: 100px; max-width: 100px; object-fit: cover; border-radius: 4px;" />',
                    obj.image.url
                )
            except (ValueError, AttributeError):
                return "Image file missing"
        return "No image"
    image_preview.short_description = 'Image Preview'
