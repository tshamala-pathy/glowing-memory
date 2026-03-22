# Generated manually: add avatar and email_verified to CustomUser
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='avatar',
            field=models.ImageField(blank=True, help_text='Optional profile picture', null=True, upload_to='users/avatars/'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='email_verified',
            field=models.BooleanField(default=False, help_text='Whether the email address has been verified'),
        ),
    ]
