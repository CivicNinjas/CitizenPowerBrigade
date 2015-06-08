from powermap.models import PowerCar, HelpNote
from powermap.forms import HelpNoteModelForm
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.utils import timezone
from rest_framework import viewsets
from serializers import PowerCarSerializer, UserSerializer, HelpNoteSerializer
from django.shortcuts import render, redirect


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
        return render(request, 'powermap/index.html', {'form': form})


def index(request):
    if request.method == 'POST':
        form = HelpNoteModelForm(request.POST)
        if form.is_valid():
            form.save()
            form = HelpNoteModelForm()
            return redirect('index')
        return render(request, 'powermap/index.html', {'form': form})
    else:
        form = HelpNoteModelForm()
        return render(request, 'powermap/index.html', {"form": form})


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
