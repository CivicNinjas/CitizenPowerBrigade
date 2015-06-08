# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0010_auto_20150608_1807'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='powercar',
            name='current_location',
        ),
    ]
