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
    ),
    url(
        r'^next_location_popup/$',
        views.next_location_popup,
        name='next_location_popup'
    ),
    url(
        r'^cars/(?P<car_id>[0-9]+)/change_location/$',
        views.change_location,
        name='change_location'
    ),
    url(r'^cars/get_user_car/$', views.get_user_car, name='get_user_car'),
    url(
        r'^cars/get_other_cars/$',
        views.get_other_cars,
        name='get_other_cars'
    ),
    url(
        r'^cars/(?P<car_id>[0-9]+)/update_current_location/$',
        views.update_current_location,
        name='update_current_location'
    ),
    url(
        r'^cars/(?P<car_id>[0-9]+)/set_active/$',
        views.set_active,
        name='set_active'
    ),
    url(r'^logout/$', views.logout_view, name='logout'),
    url(r'^login_user/$', views.login_user, name='login_user')
]
