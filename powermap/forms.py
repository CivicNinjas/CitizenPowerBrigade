from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, ButtonHolder, Submit, Field, Div
from django import forms
from powermap.models import HelpNote


class HelpNoteModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(HelpNoteModelForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.layout.append(Submit('save', 'save'))
        self.helper.form_method = 'post'
        self.helper.form_action = 'helpnote-list'
        self.helper.form_id = "helpnote-form"
        self.helper.layout = Layout(
            'address',
            'message',
            'phone_number',
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
            'phone_number',
            'location'
        ]
        widgets = {
            'location': forms.HiddenInput()
        }
        help_texts = {
            'phone_number': (
                "Enter your phone number if you'd like to recieve messages"
                + " alerting you to cars in your area."
            ),
        }

    def clean_phone_number(self):
        cleaned_num = self.cleaned_data.get('phone_number', '')
        stripped_num = ''.join(x for x in cleaned_num if x.isdigit())
        if len(stripped_num) == 10:
            return "+1" + stripped_num
        else:
            return ""


class NextLocationForm(forms.Form):

    arrival_time = forms.DateTimeField(
        label="When do you expect to arrive at this location?",
        required=True
    )

    stay_time = forms.DateTimeField(
        label="When do you expect to leave this location?",
        required=True
    )

    def __init__(self, *args, **kwargs):
        super(NextLocationForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.layout.append(Submit('save', 'save'))
        self.helper.form_method = 'post'
        self.helper.form_action = 'next_location_popup'
        self.helper.form_id = 'nextLocation-form'

        self.helper.layout = Layout(
            Div(Field('arrival_time', css_class="dateTimeField"),
                style="position: relative"),
            Div(Field('stay_time', css_class="dateTimeField"),
                style="position: relative"),
            ButtonHolder(
                Submit('submit', 'Submit', css_class='button white')
            )
        )
