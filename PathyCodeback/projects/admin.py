from django.contrib import admin
from .models import Project

# Register your models here.
# 📌 Admin configuration for the Project model.
#📌 Registering the Project model with the Django admin site.

admin.site.register(Project)
