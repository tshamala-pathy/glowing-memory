from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0002_messagethread_background'),
    ]

    operations = [
        migrations.AddField(
            model_name='messagethread',
            name='wallpaper_preset',
            field=models.CharField(
                default='workspace',
                help_text='Preset chat wallpaper key when no custom wallpaper is uploaded',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='messagethread',
            name='wallpaper_image',
            field=models.ImageField(
                blank=True,
                help_text='Optional custom wallpaper for the chat message area',
                null=True,
                upload_to='messaging/wallpapers/%Y/%m/',
            ),
        ),
        migrations.AlterField(
            model_name='messagethread',
            name='background_image',
            field=models.ImageField(
                blank=True,
                help_text='Optional custom cover photo for the sidebar (left panel)',
                null=True,
                upload_to='messaging/covers/%Y/%m/',
            ),
        ),
        migrations.AlterField(
            model_name='messagethread',
            name='background_preset',
            field=models.CharField(
                default='workspace',
                help_text='Preset sidebar cover photo when no custom cover is uploaded',
                max_length=32,
            ),
        ),
    ]
