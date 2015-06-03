from powermap.models import PowerCar
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.utils import timezone
from rest_framework import viewsets
from serializers import PowerCarSerializer, UserSerializer
from django.shortcuts import render


class PowerCarViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows cars to be viewed or edited.
    """
    sessions = Session.objects.filter(expire_date__gte=timezone.now())
    uid_list = []

    # Build list of user IDs from session query.
    for session in sessions:
        data = session.get_decoded()
        uid_list.append(data.get('_auth_user_id', None))
    users = User.objects.filter(id__in=uid_list)
    queryset = PowerCar.objects.filter(owner__in=users)
    serializer_class = PowerCarSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer


def index(request):
    return render(request, 'powermap/index.html', {})


def popup(request, **kwargs):
    car_id = kwargs['car_id']
    car = PowerCar.objects.get(id=car_id)
    context = {
        "name": car.name,
        "vehicle_description": car.vehicle_description,
        "license_plate": car.license_plate, "owner": car.owner
    }
    return render(request, 'powermap/popup.html', context)
