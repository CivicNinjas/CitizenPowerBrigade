from powermap.models import PowerCar, HelpNote, Diagnostic, Inverter, GPS
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer


class PowerCarSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PowerCar
        geo_field = 'current_location'


class PowerCarMinSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PowerCar
        fields = ('id', 'current_location', 'next_location')
        geo_field = 'current_location'


class HelpNoteSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = HelpNote
        geo_field = 'location'


class DiagnosticSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Diagnostic


class InverterSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Inverter


class GPSSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = GPS
        geo_field = 'location'


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('username')
