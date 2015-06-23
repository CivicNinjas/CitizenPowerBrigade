from twilio.rest import TwilioRestClient
from pttp.settings import TWILIO_AUTH


def send_alerts(numbers, car, event_type):
    """
    Takes an array of numbers to send alerts to, the car triggering the
    alerts, and the type of event, then sends a message to all numbers
    """
    account_sid = TWILIO_AUTH["SID"]
    auth_token = TWILIO_AUTH["AUTH_TOKEN"]
    client = TwilioRestClient(account_sid, auth_token)
    message_body = ""
    if event_type == "Arrival":
        message_body = (
            "A PowerCar has arrived in your area!"
            + "It will be there until {leave_time}."
        ).format(
            leave_time=car.current_location_until
        )
    elif event_type == "SetDestination":
        message_body = (
            "A PowerCar will be in your area!"
            + " It expects to arrive at {arrive_time} and to be"
            + " there until {leave_time}."
        ).format(
            arrive_time=car.eta,
            leave_time=car.current_location_until
        )
    for number in numbers:
        message = client.messages.create(
            body=message_body,
            to=number,
            from_=TWILIO_AUTH["TWILIO_NUMBER"]
        )
        print message.sid
