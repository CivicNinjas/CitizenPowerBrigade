from rest_framework import permissions


class IsAdminOrCarOwner(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        return request.user == obj.owner or request.user.is_staff
