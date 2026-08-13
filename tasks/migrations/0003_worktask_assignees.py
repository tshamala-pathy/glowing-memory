from django.conf import settings
from django.db import migrations, models


def copy_assigned_to_assignees(apps, schema_editor):
    WorkTask = apps.get_model('tasks', 'WorkTask')
    for task in WorkTask.objects.exclude(assigned_to_id__isnull=True).iterator():
        task.assignees.add(task.assigned_to_id)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tasks', '0002_worktask_priority_completed_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='worktask',
            name='assignees',
            field=models.ManyToManyField(
                blank=True,
                help_text='Project manager and team members responsible for this task.',
                related_name='assigned_work_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(copy_assigned_to_assignees, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='worktask',
            name='assigned_to',
        ),
    ]
