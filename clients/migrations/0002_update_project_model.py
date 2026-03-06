# Generated migration - manually edited to handle model changes safely

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def migrate_project_data(apps, schema_editor):
    """
    Migrate existing Project data:
    - Set default user for existing projects
    - In production, you'd want to map Client to User more carefully
    """
    Project = apps.get_model('clients', 'Project')
    User = apps.get_model(settings.AUTH_USER_MODEL)
    
    # Get first superuser as fallback for existing projects
    try:
        default_user = User.objects.filter(is_superuser=True).first()
        if not default_user:
            default_user = User.objects.first()
        
        if default_user:
            # Update all existing projects to use default_user
            Project.objects.filter(client_user__isnull=True).update(client_user=default_user)
            print(f"Updated existing projects to use default user: {default_user.email}")
    except Exception as e:
        print(f"Warning: Could not migrate project data: {e}")


def reverse_migration(apps, schema_editor):
    """Reverse migration - not fully reversible."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0001_initial'),
        ('quotes', '0002_quote_admin_response_quote_replied_at_and_more'),
        ('invoices', '0002_change_quote_to_onetoone'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Rename title to name
        migrations.RenameField(
            model_name='project',
            old_name='title',
            new_name='name',
        ),
        
        # Step 2: Add new fields (temporarily nullable)
        migrations.AddField(
            model_name='project',
            name='status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')],
                default='pending',
                help_text='Current status of the project',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='quote',
            field=models.ForeignKey(
                blank=True,
                help_text='The quote this project is based on',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='projects',
                to='quotes.quote'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='invoice',
            field=models.ForeignKey(
                blank=True,
                help_text='The invoice that triggered this project creation',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='projects',
                to='invoices.invoice'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='screenshots',
            field=models.JSONField(blank=True, default=list, help_text='List of screenshot/image URLs (JSON array)'),
        ),
        migrations.AddField(
            model_name='project',
            name='is_public',
            field=models.BooleanField(default=False, help_text='If true, project is visible to non-authenticated users on public projects page'),
        ),
        
        # Step 3: Create temporary client_user field (FK to User)
        migrations.AddField(
            model_name='project',
            name='client_user',
            field=models.ForeignKey(
                blank=True,
                help_text='The client (user) this project belongs to',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='temp_client_projects',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Step 4: Migrate data
        migrations.RunPython(migrate_project_data, reverse_migration),
        
        # Step 5: Remove old client FK (to Client model)
        migrations.RemoveField(
            model_name='project',
            name='client',
        ),
        
        # Step 6: Rename client_user to client
        migrations.RenameField(
            model_name='project',
            old_name='client_user',
            new_name='client',
        ),
        
        # Step 7: Make client non-nullable
        migrations.AlterField(
            model_name='project',
            name='client',
            field=models.ForeignKey(
                help_text='The client (user) this project belongs to',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='client_projects',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
