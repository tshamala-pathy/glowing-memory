# Image Upload Troubleshooting Guide

## Issue: Images not saving in Django Admin

### What I've Fixed:

1. ✅ Created `media/` directory at project root
2. ✅ Created `media/projects/` subdirectory for project images
3. ✅ Verified `MEDIA_ROOT` setting points to correct location
4. ✅ Added "Has Image" indicator to admin list view

### How to Test:

1. **Restart Django Server** (important after creating directories):
   ```bash
   python manage.py runserver
   ```

2. **Go to Django Admin**: http://localhost:8000/admin

3. **Navigate to Projects**: Click on "Projects" in the admin

4. **Add/Edit a Project**: 
   - Click "Add Project" or edit an existing one
   - Fill in the form fields
   - **Select an image file** in the "Image" field
   - Click "Save"

5. **Verify the Upload**:
   - Check if file appears in `media/projects/` directory
   - Check if "Has Image" column shows ✓ in the project list
   - Check browser console for any errors

### Common Issues:

#### Issue 1: "Permission Denied" Error
**Solution**: Make sure Django has write permissions to the `media/` directory

#### Issue 2: Image Field Shows but Doesn't Save
**Solution**: 
- Check Django server logs for errors
- Verify `MEDIA_ROOT` setting is correct
- Ensure `media/` directory exists and is writable

#### Issue 3: Image Saves but Doesn't Display
**Solution**: 
- Check `MEDIA_URL` setting (should be `/media/`)
- Verify `urls.py` includes media file serving in DEBUG mode
- Check browser console for 404 errors on image URLs

### File Locations:

- **Uploaded images go to**: `media/projects/filename.png`
- **MEDIA_ROOT setting**: `BASE_DIR / 'media'` (project root/media/)
- **MEDIA_URL setting**: `/media/`
- **Full URL example**: `http://localhost:8000/media/projects/image.png`

### Next Steps if Still Not Working:

1. Check Django server logs when uploading
2. Verify file permissions on `media/` directory
3. Test with a small image file first
4. Check if `media/projects/` directory gets created automatically when saving
