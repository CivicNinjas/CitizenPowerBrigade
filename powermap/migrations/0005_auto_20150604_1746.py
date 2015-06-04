# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0004_auto_20150604_1744'),
    ]

    operations = [
        migrations.AlterField(
            model_name='helpnote',
            name='road_access',
            field=models.BooleanField(default=True),
            preserve_default=False,
        ),
    ]
