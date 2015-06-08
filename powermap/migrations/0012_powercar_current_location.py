# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0011_remove_powercar_current_location'),
    ]

    operations = [
        migrations.AddField(
            model_name='powercar',
            name='current_location',
            field=django.contrib.gis.db.models.fields.PointField(default='POINT(45 45)', help_text=b'Current location', srid=4326),
            preserve_default=False,
        ),
    ]
