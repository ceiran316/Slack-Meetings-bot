const queryStrings = require('query-string');
const _ = require('underscore');

const web = require('../../../webClient');

const { Meetings, Reminders } = require('../../../utils');

const reminders = [5,10,15,20,30,60];

const getReminders = () => {
    return reminders.map(reminder => ({ label: `${reminder} mins`, value: reminder }))
}

const isMeetingStillValid = async (payload, meetingId) => {
  const { user: { id: user }, channel: { id: channel }, message_ts: ts } = payload;
  
  const meeting = await Meetings.get(meetingId);

  if (_.isEmpty(meeting)) {
    web.chat.postEphemeral({
      user,
      channel,
      text: `👎 The meeting may have already \`ended\` or been removed`
    });
    return false
  }

  const { name } = meeting;

  const hasEnded = await Meetings.hasEnded(meetingId);
  if (hasEnded) {
    web.chat.postEphemeral({
      ts,
      user,
      channel,
      text: `📅 The meeting *${name}* has already \`ended\` 👎`
    });
    return false;
  }

  const hasStarted = await Meetings.hasStarted(meetingId);
  if (hasStarted) {
    web.chat.postEphemeral({
      user,
      channel,
      text: `📅 The meeting *${name}* has already \`started\` 🕐`
    });
    return false;
  }
  
  return true;
}

const buttonsTest = async (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received buttonsTest body', body);
    const payload = JSON.parse(body.payload);

    const {
        user: { id: user },
        actions: [action],
        channel: { id: channel },
        message_ts: ts,
      trigger_id
    } = payload;
  
  
  switch(action.name) {
    case 'set_meeting_reminder': {
      const meeting = await Meetings.get(action.value);
      
      const isValidMeeting = await isMeetingStillValid(payload, meeting.id);
      console.log('set_meeting_reminder isValidMeeting', isValidMeeting);
      if (!isValidMeeting) {
        res.send();
        break;
      }
      
      web.dialog.open({
        trigger_id,
        dialog: {
            callback_id: 'set_meeting_reminder',
            title: 'Set Reminder',
            submit_label: 'Set',
            notify_on_cancel: false,
            state: meeting.id,
            elements: [{
                value: meeting.name,
                label: 'Reminder Description',
                name: 'reminder_label',
                placeholder: meeting.name,
                type: 'text',
                hint: 'eg. Meeting Title'
            }, {
                label: 'Set Reminder Time',
                name: 'reminder_time',
                placeholder: 'Choose Reminder Time',
                type: 'select',
                options: getReminders(),
            }]
          } 
      });
      res.send();
      break;
    }
    default:
  }
  
  switch(action.name) {
    case 'delete_reminder': {
      const { channel, scheduled_message_id } = JSON.parse(action.value);
      console.log('delete_reminder', channel, scheduled_message_id);
      
      const deleteResponse = await Reminders.remove({ user, channel, scheduled_message_id });
      web.chat.postEphemeral(deleteResponse).catch(console.error);
      res.send();
      break;
    }
    case 'view_reminders': {
      const { channel } = JSON.parse(action.value);
      const response = await Reminders.getAll({ user, channel });
      web.chat.postEphemeral(response).catch(console.error);
      res.send();
      break;
    }
    default:
      res.send();
  }
}

module.exports = buttonsTest;