from django.contrib.gis.db import models
from django.contrib.auth.models import User


class PowerCar(models.Model):
    # A car outfitted to provied power.
    name = models.CharField(max_length=255)
    vehicle_description = models.CharField(max_length=255)
    license_plate = models.CharField(max_length=15)
    eta = models.DateTimeField()
    current_location_until = models.DateTimeField()
    current_location = models.PointField(help_text="Current location")
    target_location = models.PointField()
    next_location = models.PointField()
    owner = models.ForeignKey(User, null=True)
    objects = models.GeoManager()


class HelpNote(models.Model):
    # A note posted by a user that needs help.
    address = models.CharField(max_length=255)
    message = models.CharField(max_length=512)
    creator = models.CharField(max_length=63)
    location = models.PointField()
    objects = models.GeoManager()


class Diagnostic(models.Model):
    # An onboard diagnostic log.
    timestamp = models.DateTimeField()
    coolant_temp = models.DecimalField(max_digits=6, decimal_places=2)
    fuel_gage = models.DecimalField(max_digits=5, decimal_places=2)
    lv_batt_volts = models.DecimalField(max_digits=6, decimal_places=2)
    hv_batt_volts = models.DecimalField(max_digits=6, decimal_places=2)
    hv_batt_soc = models.DecimalField(max_digits=5, decimal_places=2)
    hv_batt_amps = models.DecimalField(max_digits=4, decimal_places=1)
    error = models.CharField(max_length=127)
    vehicle = models.ForeignKey(PowerCar)


class Inverter(models.Model):
    timestamp = models.DateTimeField()
    volts = models.DecimalField(max_digits=4, decimal_places=1)
    amps = models.DecimalField(max_digits=3, decimal_places=1)
    kwh = models.DecimalField(max_digits=4, decimal_places=1)
    vehicle = models.ForeignKey(PowerCar)


class GPS(models.Model):
    timestamp = models.DateTimeField()
    location = models.PointField()
    objects = models.GeoManager()
    vehicle = models.ForeignKey(PowerCar)
