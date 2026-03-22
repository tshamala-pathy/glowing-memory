from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0006_project_client_to_entity"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="completed_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text="Timestamp when the project was marked as completed",
            ),
        ),
    ]

