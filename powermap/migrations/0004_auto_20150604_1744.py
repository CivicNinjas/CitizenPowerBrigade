# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0003_helpnote'),
    ]

    operations = [
        migrations.AlterField(
            model_name='helpnote',
            name='road_access',
            field=models.NullBooleanField(),
        ),
    ]
