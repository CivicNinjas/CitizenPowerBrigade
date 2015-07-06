from django.core.urlresolvers import reverse
from django.test import TestCase, RequestFactory
from django.contrib.auth.models import AnonymousUser, User
from models import HelpNote

from serializers import HelpNoteSerializer
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from forms import HelpNoteModelForm
from django.contrib.gis.geos import Point, GEOSGeometry

from .views import HelpNoteViewSet

class HelpNoteTest(TestCase):
    """
    Tests for anything involving the HelpNote model.
    """

    def setUp(self):
        self.note = HelpNote.objects.create(
            address="S Test Ave",
            message="Help me",
            creator="Test A. Test",
            location=Point(45.50, 55.6)
        )

        self.demo_form_data = {
            'creator': "Test McTest",
            'address': "Test Address",
            'message': "Please help quick",
            'location': "POINT(55.3454 23.435)",
            'phone_number': "(555) 555-5555"
        }

    def test_init(self):
        """
        Test to ensure that HelpNoteModelForm's init accepts a note.
        """
        HelpNoteModelForm(self.note)

    def test_valid_data(self):
        form = HelpNoteModelForm(self.demo_form_data)
        self.assertTrue(form.is_valid())
        help_note = form.save()
        self.assertEqual(help_note.creator, "Test McTest")
        self.assertEqual(help_note.address, "Test Address")
        self.assertEqual(help_note.message, "Please help quick")
        self.assertEqual(help_note.location, Point(55.3454, 23.435))
        self.assertEqual(help_note.phone_number, "+15555555555")

    def test_blank_data(self):
        form = HelpNoteModelForm({})
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {
            'creator': ['This field is required.'],
            'address': ['This field is required.'],
            'message': ['This field is required.'],
            'location': ['No geometry value provided.'],
        })

    def test_invalid_phone_number(self):
        data = self.demo_form_data
        data['phone_number'] = "(34) 945-3433"
        form = HelpNoteModelForm(data)
        self.assertFalse(form.is_valid())
        self.assertIn(
            "Invalid phone number: (34) 945-3433.",
            form.errors['__all__']
        )

    def test_valid_phone_number_with_prefix(self):
        data = self.demo_form_data
        data['phone_number'] = "+1 223 4567 891"
        form = HelpNoteModelForm(data)
        self.assertTrue(form.is_valid())
        help_note = form.save()
        self.assertEqual(help_note.phone_number, "+12234567891")


class HelpNoteViewSetTest(APITestCase):
    """
    Test the results and authentication of
    the HelpNoteViewSet
    """
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='jacob', email='jacob@cool.com', password="x"
        )
        HelpNote.objects.create(
            address="S Test Ave",
            message="Help me",
            creator="Test A. Test",
            location=Point(45.50, 55.6)
        )

    def test_list(self):
        """
        Test the list API endpoint.
        """
        url = '/helpnotes/?format=json'

        # Request is not authenticated, so it should return a 403
        # unauthorized status code.
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 403)

        # Test for whether a valid, logged-in user can access the list.
        factory = APIRequestFactory()
        user = self.user
        view = HelpNoteViewSet.as_view({'get': 'list'})

        request = factory.get(url)
        force_authenticate(request, user=user)
        response = view(request)

        self.assertEqual(response.status_code, 200)
