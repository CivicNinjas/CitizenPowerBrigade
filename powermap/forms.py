from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, ButtonHolder, Submit
from django import forms
from powermap.models import HelpNote


class HelpNoteModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(HelpNoteModelForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.layout.append(Submit('save', 'save'))
        self.helper.form_method = 'post'
        self.helper.form_action = 'create_note/'
        self.helper.layout = Layout(
            'address',
            'message',
            'creator',
            'location',
            ButtonHolder(
                Submit('submit', 'Submit', css_class='button white')
            )
        )

    class Meta:
        model = HelpNote
        fields = [
            'address',
            'message',
            'creator',
            'location'
        ]
        widgets = {
            'location': forms.HiddenInput()
        }
