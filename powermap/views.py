from powermap.forms import HelpNoteModelForm, NextLocationForm
from powermap.models import PowerCar, HelpNote, Diagnostic, Inverter, GPS

from datetime import date, datetime, time

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.contrib.sessions.models import Session
from django.http import HttpResponse, JsonResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone, dateparse
from twilio_utils import send_alerts

import time

from rest_framework import viewsets
from rest_framework.decorators import api_view, list_route, detail_route
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from custom_permissions import IsAdminOrCarOwner
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
        content = {"car_data": serializer.data}
        content["arrived_info"] = {}
        for each_car in queryset:
            content["arrived_info"][each_car.id] = each_car.at_next_location()
        return JsonResponse(content)

    @list_route()
    def update_others(self, request):
        """
        API endpoint that returns a dictionary of car coordinates keyed to
        their IDs.
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
        content = {"car_data": serializer.data}
        content["arrived_info"] = {}
        for each_car in serializer.data["features"]:
            content["arrived_info"][each_car["id"]] = {
                "arrived": PowerCar.objects.get(
                    id=each_car["id"]
                ).at_next_location(),
                "current_location": each_car["geometry"],
                "next_location": each_car["properties"]["next_location"]
            }
        return JsonResponse(content)

    @list_route()
    def get_user_car(self, request):
        car = PowerCar.objects.get(owner=request.user)
        serializer = PowerCarMinSerializer(car)
        content = {"car_data": serializer.data}
        content["arrived"] = car.at_next_location()
        return JsonResponse(content)

    @detail_route(methods=['post'], permission_classes=[IsAdminOrCarOwner])
    def change_next_location(self, request, pk=None):
        """
        A route to change the next_location of a PowerCar,
        as well as its ETA and time at current location.
        """
        car = self.get_object()
        partial_update = {}
        now = timezone.now().tzinfo
        partial_update["next_location"]= Point(
            float(request.data.get("lng")), 
            float(request.data.get("lat"))
        )
        arrival_time = request.data.get("arrival_time")
        arrival_time = datetime.strptime(arrival_time, "%y-%m-%d %H:%M")
        partial_update["eta"] = arrival_time.replace(tzinfo=now)
        stay_time = request.data.get("stay_time")
        stay_time = datetime.strptime(stay_time, "%y-%m-%d %H:%M")
        stay_time = stay_time.replace(tzinfo=now)
        partial_update["current_location_until"] = stay_time
        serializer = PowerCarSerializer(car, data=partial_update, partial=True)
        if serializer.is_valid():
            serializer.save()
            alert_notes = HelpNote.objects.filter(
                location__distance_lte=(car.next_location, 500)
            )
            alert_notes = alert_notes.exclude(phone_number="")
            alert_numbers = [notes.phone_number for notes in alert_notes]
            send_alerts(alert_numbers, car, "SetDestination")

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HelpNoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows help notes to be viewed or edited.
    """
    permission_classes = (IsAuthenticated,)
    queryset = HelpNote.objects.all()
    serializer_class = HelpNoteSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer


def index(request):
    if request.method == 'POST':
        form = HelpNoteModelForm(request.POST)
        if form.is_valid():
            form.save()
            form = HelpNoteModelForm()
            return redirect('index')
    form = HelpNoteModelForm()
    if request.user.is_staff:
        return render(
            request,
            'powermap/index.html',
            {"form": form, "authuser": False, "admin": True})
    if request.user.is_authenticated():
        car = get_object_or_404(PowerCar, owner=request.user)
        activity = car.active
        return render(
            request,
            'powermap/index.html',
            {"form": form, "authuser": True, "activity": activity}
        )
    else:
        return render(
            request,
            'powermap/index.html',
            {"form": form, "authuser": False}
        )


def car_popup(request, **kwargs):
    car_id = kwargs['car_id']
    car = PowerCar.objects.get(id=car_id)
    context = {
        "name": car.name,
        "vehicle_description": car.vehicle_description,
        "license_plate": car.license_plate, "owner": car.owner
    }
    return render(request, 'powermap/car_popup.html', context)


def note_popup(request, **kwargs):
    if request.user.is_authenticated():
        help_note_id = kwargs['note_id']
        note = HelpNote.objects.get(id=help_note_id)
        context = {
            "address": note.address, "message": note.message,
            "creator": note.creator
        }
        return render(request, 'powermap/note_popup.html', context)
    raise Http404


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
        response_data['arrived'] = False
        if car.at_next_location():
            response_data['arrived'] = True
            if not already_at:
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
        response_data['state'] = user_car.active
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
        now = timezone.now().tzinfo
        new_point = Point(float(lng), float(lat))
        car.next_location = new_point
        arrival_time = request.POST.get("arrival_time")
        arrival_time = datetime.strptime(arrival_time, "%y-%m-%d %H:%M")
        arrival_time = arrival_time.replace(tzinfo=now)
        car.eta = arrival_time
        stay_time = request.POST.get("stay_time")
        stay_time = datetime.strptime(stay_time, "%y-%m-%d %H:%M")
        stay_time = stay_time.replace(tzinfo=now)
        car.current_location_until = stay_time
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
