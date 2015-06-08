# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0006_remove_helpnote_road_access'),
    ]

    operations = [
        migrations.CreateModel(
            name='Diagnostic',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('timestamp', models.DateTimeField()),
                ('coolant_temp', models.DecimalField(max_digits=6, decimal_places=2)),
                ('fuel_gage', models.DecimalField(max_digits=5, decimal_places=2)),
                ('lv_batt_volts', models.DecimalField(max_digits=6, decimal_places=2)),
                ('hv_batt_volts', models.DecimalField(max_digits=6, decimal_places=2)),
                ('hv_batt_soc', models.DecimalField(max_digits=5, decimal_places=2)),
                ('hv_batt_amps', models.DecimalField(max_digits=4, decimal_places=1)),
                ('error', models.CharField(max_length=127)),
            ],
        ),
    ]
