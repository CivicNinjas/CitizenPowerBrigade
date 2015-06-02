from powermap.models import PowerCar
from django.contrib.auth.models import User
from rest_framework import serializers


class PowerCarSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = PowerCar
        fields = (
            'name',
            'vehicle_description',
            'license_plate',
            'eta',
            'current_location_until',
            'current_location',
            'target_location',
            'next_location',
            'owner'
        )


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('username')
