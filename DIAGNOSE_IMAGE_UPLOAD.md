# Image Upload Diagnosis Steps

## Critical Issue: Images Not Saving to Disk

Follow these steps to diagnose why images aren't being saved:

### Step 1: Check Django Server Logs
When you upload an image in Django admin, **watch the terminal where Django is running**. Look for:
- Any error messages
- File path information
- Permission errors

### Step 2: Verify MEDIA_ROOT Path
Run this command in your terminal:
```bash
python manage.py shell
```

Then in the shell:
```python
from django.conf import settings
import os
print("MEDIA_ROOT:", settings.MEDIA_ROOT)
print("MEDIA_ROOT exists:", os.path.exists(str(settings.MEDIA_ROOT)))
print("MEDIA_ROOT writable:", os.access(str(settings.MEDIA_ROOT), os.W_OK))
```

### Step 3: Test File Upload Manually
After uploading an image in admin, check the database:
```python
from projects.models import Project
p = Project.objects.first()
print("Image field:", p.image)
print("Image name:", p.image.name if p.image else None)
print("Image URL:", p.image.url if p.image else None)
```

### Step 4: Check if File Exists on Disk
```python
from projects.models import Project
import os
from django.conf import settings

p = Project.objects.first()
if p.image:
    file_path = os.path.join(settings.MEDIA_ROOT, p.image.name)
    print("Expected file path:", file_path)
    print("File exists:", os.path.exists(file_path))
else:
    print("No image in database")
```

### Step 5: Check File Permissions
Make sure the `media/` directory has write permissions:
- On Windows: Right-click `media` folder → Properties → Security → Make sure your user has "Write" permission
- On Linux/Mac: `chmod 755 media` and `chmod 755 media/projects`

## Common Causes

1. **MEDIA_ROOT path is wrong** - Check if it points to the correct directory
2. **File permissions** - Django can't write to the directory
3. **Form not submitting file** - Check browser network tab when saving
4. **File size too large** - Try a small image (< 1MB) first
5. **Pillow not installed** - Run `pip install pillow`

## What I've Fixed

✅ Added file upload size limits to settings
✅ Added automatic directory creation
✅ Added image preview in admin
✅ Improved error handling in serializer

## Next Steps

1. **Restart Django server** after these changes
2. **Try uploading a small image** (< 1MB) in Django admin
3. **Check the Django server terminal** for any errors
4. **Share the output** from the diagnostic commands above
