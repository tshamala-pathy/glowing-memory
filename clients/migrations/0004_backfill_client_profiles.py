# Data migration: ensure every User has exactly one Client profile

from django.db import migrations


def create_client_for_users_without(apps, schema_editor):
    User = apps.get_model('users', 'CustomUser')
    Client = apps.get_model('clients', 'Client')
    for user in User.objects.all():
        if not Client.objects.filter(user=user).exists():
            name = (user.first_name and user.last_name and f"{user.first_name} {user.last_name}".strip()
                    or user.email or getattr(user, 'username', '') or 'Client')
            Client.objects.create(user=user, name=name or 'Client')


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0003_client_user_onetoone'),
    ]

    operations = [
        migrations.RunPython(create_client_for_users_without, noop),
    ]
