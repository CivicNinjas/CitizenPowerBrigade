from powermap.models import PowerCar, HelpNote, Diagnostic, Inverter, GPS
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
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

    def validate_phone_number(self, value):
        """
        Ensure that the phone number is valid.
        If it is still a working number, strip useful info from it.
        """
        cleaned_num = value
        if cleaned_num != "":
            stripped_num = ''.join(x for x in cleaned_num if x.isdigit())
            if len(stripped_num) == 10:
                return "+1" + stripped_num
            elif len(stripped_num) == 11 and stripped_num[0] == "1":
                return "+" + stripped_num
            else:
                raise serializers.ValidationError(
                    _("Invalid phone number: %(number)s."),
                    code="invalid",
                    params={"number": cleaned_num},
                )
        return cleaned_num


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
