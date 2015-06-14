# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0012_powercar_current_location'),
    ]

    operations = [
        migrations.AddField(
            model_name='powercar',
            name='active',
            field=models.BooleanField(default=False),
        ),
    ]
