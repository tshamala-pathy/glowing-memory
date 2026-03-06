from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0011_task"),
    ]

    operations = [
        migrations.AddField(
            model_name="client",
            name="internal_notes",
            field=models.TextField(
                blank=True,
                help_text="Internal notes (admin/staff only; not visible to clients)",
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="internal_notes",
            field=models.TextField(
                blank=True,
                help_text="Internal notes (admin/staff only; not visible to clients)",
            ),
        ),
    ]

