# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='PowerCar',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=255)),
                ('vehicle_description', models.CharField(max_length=255)),
                ('license_plate', models.CharField(max_length=15)),
                ('eta', models.DateTimeField()),
                ('current_location_until', models.DateTimeField()),
                ('current_location', django.contrib.gis.db.models.fields.PointField(help_text=b'Current location', srid=4326)),
                ('target_location', django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ('next_location', django.contrib.gis.db.models.fields.PointField(srid=4326)),
            ],
        ),
    ]
