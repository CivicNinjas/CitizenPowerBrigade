from powermap.models import PowerCar, HelpNote
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer


class PowerCarSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PowerCar
        geo_field = 'current_location'


class HelpNoteSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = HelpNote
        geo_field = 'location'


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('username')
