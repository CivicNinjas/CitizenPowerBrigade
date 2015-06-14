from powermap.forms import HelpNoteModelForm
from powermap.models import PowerCar, HelpNote, Diagnostic, Inverter, GPS

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.contrib.sessions.models import Session
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone


from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from serializers import (
    PowerCarSerializer,
    UserSerializer,
    HelpNoteSerializer,
    DiagnosticSerializer,
    InverterSerializer,
    GPSSerializer
)

import json


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


class HelpNoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows help notes to be viewed or edited.
    """
    queryset = HelpNote.objects.all()
    serializer_class = HelpNoteSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer


def create_note(request):
    """
    List all snippets, or create a new snippet.
    """
    if request.method == 'POST':
        form = HelpNoteModelForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('index')
        return redirect('index')


def index(request):
    if request.method == 'POST':
        form = HelpNoteModelForm(request.POST)
        if form.is_valid():
            form.save()
            form = HelpNoteModelForm()
            return redirect('index')
    form = HelpNoteModelForm()
    if request.user.is_authenticated():
        return render(
            request,
            'powermap/index.html',
            {"form": form, "authuser": True}
        )
    else:
        return render(
            request,
            'powermap/index.html',
            {"form": form, "authuser": False}
        )


def popup(request, **kwargs):
    car_id = kwargs['car_id']
    car = PowerCar.objects.get(id=car_id)
    context = {
        "name": car.name,
        "vehicle_description": car.vehicle_description,
        "license_plate": car.license_plate, "owner": car.owner
    }
    return render(request, 'powermap/popup.html', context)


def note_popup(request, **kwargs):
    help_note_id = kwargs['note_id']
    note = HelpNote.objects.get(id=help_note_id)
    context = {
        "address": note.address, "message": note.message,
        "creator": note.creator
    }
    return render(request, 'powermap/note_popup.html', context)


def note_form(request, **kwargs):
    form = HelpNoteModelForm()
    return render(request, 'powermap/note_form.html', {"form": form})


def change_location(request, *args, **kwargs):
    if request.method == "POST":
        identified_user = get_object_or_404(User, pk=request.user.id)
        user_car = get_object_or_404(PowerCar, owner=identified_user)
        response_data = {}
        car_id = kwargs.get('car_id')
        if user_car.id != int(car_id):
            return HttpResponse(
                json.dumps({"result": "Cars don't match"}),
                content_type="application/json"
            )
        lat = request.POST.get("lat")
        lng = request.POST.get("lng")
        new_point = Point(float(lng), float(lat))
        car = get_object_or_404(PowerCar, pk=car_id)
        car.next_location = new_point
        car.save()

        response_data['result'] = 'Change next successfully'
        response_data['car_id'] = car_id

        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )

    else:
        return HttpResponse(
            json.dumps({"result": "Not successfull"}),
            content_type="application/json"
        )


def update_current_location(request, *args, **kwargs):
    if request.method == "POST":
        identified_user = get_object_or_404(User, pk=request.user.id)
        user_car = get_object_or_404(PowerCar, owner=identified_user)
        response_data = {}
        car_id = kwargs.get('car_id')
        if user_car.id != int(car_id):
            return HttpResponse(
                json.dumps({"result": "Cars don't match"}),
                content_type="application/json"
            )
        lat = request.POST.get("lat")
        lng = request.POST.get("lng")
        new_point = Point(float(lng), float(lat))
        car = get_object_or_404(PowerCar, pk=car_id)
        car.current_location = new_point
        car.save()

        response_data['result'] = 'Change next successfully'
        response_data['car_id'] = car_id

        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )

    else:
        return HttpResponse(
            json.dumps({"result": "Not successfull"}),
            content_type="application/json"
        )


def logout_view(request):
    logout(request)
    return redirect('index')


def get_user_car(request):
    uid = request.user.id
    user = User.objects.get(id=uid)
    car = PowerCar.objects.get(owner=user)
    serializer = PowerCarSerializer(car)
    return JsonResponse(serializer.data)

def login_user(request):
    logout(request)
    username = password = ''
    if request.POST:
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return redirect('index')
    form = HelpNoteModelForm()
    return render(request, 'powermap/login.html', {'form': form})

def get_other_cars(request):
    sessions = Session.objects.filter(expire_date__gte=timezone.now())
    uid_list = []

    # Build list of user IDs from session query.
    for session in sessions:
        data = session.get_decoded()
        uid_list.append(data.get('_auth_user_id', None))
    uid = request.user.id
    users = User.objects.filter(id__in=uid_list)
    print users
    users = [x for x in users if x.id != uid]
    queryset = PowerCar.objects.filter(owner__in=users)
    serializer = PowerCarSerializer(queryset, many=True)
    return JsonResponse(serializer.data)
