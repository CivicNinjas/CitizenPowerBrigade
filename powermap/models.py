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
