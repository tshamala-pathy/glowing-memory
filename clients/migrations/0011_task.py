from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0010_project_completed_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="Task",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(help_text="Task title", max_length=255)),
                ("description", models.TextField(blank=True, help_text="Task description")),
                (
                    "status",
                    models.CharField(
                        choices=[("todo", "To Do"), ("in_progress", "In Progress"), ("done", "Done")],
                        default="todo",
                        help_text="Task status",
                        max_length=20,
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
                        default="medium",
                        help_text="Task priority",
                        max_length=20,
                    ),
                ),
                ("due_date", models.DateField(blank=True, help_text="Due date for this task", null=True)),
                ("internal_notes", models.TextField(blank=True, help_text="Internal notes (admin only)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        help_text="Project this task belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tasks",
                        to="clients.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "Task",
                "verbose_name_plural": "Tasks",
                "ordering": ["-created_at"],
            },
        ),
    ]
