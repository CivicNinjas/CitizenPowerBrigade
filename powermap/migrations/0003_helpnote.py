# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0002_powercar_owner'),
    ]

    operations = [
        migrations.CreateModel(
            name='HelpNote',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('address', models.CharField(max_length=255)),
                ('message', models.CharField(max_length=512)),
                ('creator', models.CharField(max_length=63)),
                ('road_access', models.BooleanField()),
                ('location', django.contrib.gis.db.models.fields.PointField(srid=4326)),
            ],
        ),
    ]
