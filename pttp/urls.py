from django.conf.urls import include, url
from rest_framework import routers
from powermap import views
from django.contrib import admin


router = routers.DefaultRouter()
router.register(r'powercars', views.PowerCarViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'helpnotes', views.HelpNoteViewSet)

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^pttp/', include('powermap.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(
        r'^api-auth/',
        include('rest_framework.urls', namespace='rest_framework')
    )
]
