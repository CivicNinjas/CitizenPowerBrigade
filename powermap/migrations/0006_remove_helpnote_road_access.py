# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0005_auto_20150604_1746'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='helpnote',
            name='road_access',
        ),
    ]
