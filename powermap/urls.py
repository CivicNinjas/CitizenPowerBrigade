from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^popup/(?P<car_id>\d+)/$', views.popup, name='popup')
]
