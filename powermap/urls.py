from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^popup/(?P<car_id>\d+)/$', views.popup, name='popup'),
    url(r'^note_form/$', views.note_form, name='note_form'),
    url(r'^create_note/$', views.create_note, name='create_note'),
    url(
        r'^note_popup/(?P<note_id>\d+)/$',
        views.note_popup,
        name='note_popup'
    )
]
