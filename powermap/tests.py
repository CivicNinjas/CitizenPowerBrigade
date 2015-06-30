from django.test import TestCase
from models import HelpNote
from serializers import HelpNoteSerializer
from forms import HelpNoteModelForm
from django.contrib.gis.geos import Point, GEOSGeometry


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

    def test_init(self):
        """
        Test to ensure that HelpNoteModelForm's init accepts a note.
        """
        HelpNoteModelForm(self.note)

    def test_valid_data(self):
        form = HelpNoteModelForm({
            'creator': "Test McTest",
            'address': "Test Address",
            'message': "Please help quick",
            'location': "POINT(55.3454 23.435)",
            'phone_number': "(555) 555-5555"
        })
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
