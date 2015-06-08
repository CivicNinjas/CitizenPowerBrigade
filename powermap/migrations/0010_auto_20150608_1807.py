# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0009_gps'),
    ]

    operations = [
        migrations.AddField(
            model_name='diagnostic',
            name='vehicle',
            field=models.ForeignKey(default=None, to='powermap.PowerCar'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='gps',
            name='vehicle',
            field=models.ForeignKey(default=None, to='powermap.PowerCar'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='inverter',
            name='vehicle',
            field=models.ForeignKey(default=None, to='powermap.PowerCar'),
            preserve_default=False,
        ),
    ]
