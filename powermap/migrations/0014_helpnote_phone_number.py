# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0013_powercar_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='helpnote',
            name='phone_number',
            field=models.CharField(max_length=15, blank=True),
        ),
    ]
