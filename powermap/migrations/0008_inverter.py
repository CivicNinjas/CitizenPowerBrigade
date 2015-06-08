# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('powermap', '0007_diagnostic'),
    ]

    operations = [
        migrations.CreateModel(
            name='Inverter',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('timestamp', models.DateTimeField()),
                ('volts', models.DecimalField(max_digits=4, decimal_places=1)),
                ('amps', models.DecimalField(max_digits=3, decimal_places=1)),
                ('kwh', models.DecimalField(max_digits=4, decimal_places=1)),
            ],
        ),
    ]
