from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0001_internal_messaging'),
    ]

    operations = [
        migrations.AddField(
            model_name='messagethread',
            name='background_preset',
            field=models.CharField(
                default='workspace',
                help_text='Preset cover image key when no custom background is uploaded',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='messagethread',
            name='background_image',
            field=models.ImageField(
                blank=True,
                help_text='Optional custom cover image for the chat sidebar',
                null=True,
                upload_to='messaging/backgrounds/%Y/%m/',
            ),
        ),
    ]
