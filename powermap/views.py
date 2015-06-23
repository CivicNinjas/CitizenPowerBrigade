from powermap.forms import HelpNoteModelForm, NextLocationForm
from powermap.models import PowerCar, HelpNote, Diagnostic, Inverter, GPS

from datetime import date, datetime, time

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.contrib.sessions.models import Session
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone, dateparse
from twilio_utils import send_alerts


from rest_framework import viewsets
from rest_framework.decorators import api_view, list_route, detail_route
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from serializers import (
    PowerCarSerializer,
    PowerCarMinSerializer,
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

    @list_route()
    def other_active_cars(self, request):
        """
        API endpoint that allows all active cars but the users to be viewed.
        """
        sessions = Session.objects.filter(expire_date__gte=timezone.now())
        uid_list = []

        # Build list of user IDs from session query.
        for session in sessions:
            data = session.get_decoded()
            uid_list.append(data.get('_auth_user_id', None))
        uid = request.user.id
        users = User.objects.filter(id__in=uid_list).exclude(id=uid)
        queryset = PowerCar.objects.filter(owner__in=users, active=True)
        serializer = PowerCarMinSerializer(queryset, many=True)
        return JsonResponse(serializer.data)

    @list_route()
    def get_user_car(self, request):
        car = PowerCar.objects.get(owner=request.user)
        serializer = PowerCarMinSerializer(car)
        return JsonResponse(serializer.data)


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
        already_at = car.at_next_location()
        car.current_location = new_point
        car.save()
        if not already_at and car.at_next_location():
            alert_notes = HelpNote.objects.filter(
                location__distance_lte=(car.next_location, 500)
            )
            alert_notes = alert_notes.exclude(phone_number="")
            alert_numbers = [notes.phone_number for notes in alert_notes]
            send_alerts(alert_numbers, car, "Arrival")
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
    users = User.objects.filter(id__in=uid_list).exclude(id=uid)
    print users
    queryset = PowerCar.objects.filter(owner__in=users, active=True)
    serializer = PowerCarMinSerializer(queryset, many=True)
    return JsonResponse(serializer.data)


def set_active(request, *args, **kwargs):
    response_data = {}
    if request.method == "POST":
        identified_user = get_object_or_404(User, pk=request.user.id)
        user_car = get_object_or_404(PowerCar, owner=identified_user)
        car_id = kwargs.get('car_id')
        if user_car.id != int(car_id):
            return HttpResponse(
                json.dumps({"result": "Cars don't match"}),
                content_type="application/json"
            )
        user_car.active = not user_car.active
        user_car.save()
        response_data['result'] = 'Change active successfully'
        response_data['car_id'] = car_id

        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )
    else:
        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )


def next_location_popup(request, *args, **kwargs):
    if request.method == "GET":
        form = NextLocationForm()
        return render(
            request,
            "powermap/next_location_popup.html",
            {"form": form}
        )
    if request.method == "POST":
        identified_user = request.user
        car = get_object_or_404(PowerCar, owner=identified_user)
        response_data = {}
        lat = request.POST.get("lat")
        lng = request.POST.get("lng")
        arrival_time = dateparse.parse_time(request.POST.get("arrival_time"))
        stay_time = dateparse.parse_time(request.POST.get("stay_time"))
        arrival_datetime = datetime.combine(date.today(), arrival_time)
        stay_datetime = datetime.combine(date.today(), stay_time)
        new_point = Point(float(lng), float(lat))
        car.next_location = new_point
        car.eta = arrival_datetime
        car.current_location_until = stay_datetime
        alert_notes = HelpNote.objects.filter(
            location__distance_lte=(car.next_location, 500)
        )
        alert_notes = alert_notes.exclude(phone_number="")
        alert_numbers = [notes.phone_number for notes in alert_notes]
        send_alerts(alert_numbers, car, "SetDestination")
        car.save()

        response_data['result'] = 'Change next successfully'

        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )
