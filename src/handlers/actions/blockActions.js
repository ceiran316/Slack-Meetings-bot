const queryStrings = require('query-string');
const moment = require('moment');
const _ = require('underscore');
const web = require('../../webClient');
const { Reminders, Meetings } = require('../../utils');
const Messages = require('../../messages');
const reminderStore = require('../../store')('reminders');

const blockActions = async (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  console.log('Received BLOCK ACTIONS', body);
  const payload = JSON.parse(body.payload);
  const { channel: { id: channel }, user: { id: user }, container: { message_ts: ts }, callback_id, actions: [action], trigger_id } = payload;

  console.log(action.action_id, ts);

  switch (action.action_id) {
    case 'no_create_meeting': {
      res.send();
      console.log('remove meeting');
      break;
    }
    case 'create_meeting_with_date': {
      console.log('NEW DATE', action);
      const { selected_date } = action;
      web.chat.delete({ channel, ts });
      break;
    }
    case 'meeting_menu_options': {
      const { selected_option: { value: meetingId, text: { text } } } = action;
      const meeting = await Meetings.get(meetingId);

      if (text === 'Set Reminder') {
        console.log('meeting_menu_options Set Reminder', meetingId, meeting);
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
              options: Reminders.getReminderValues(),
            }]
          }
        });
        res.send();
        break;
      }
      if (text === 'View Invite') {
        web.chat.postEphemeral({
          channel,
          user,
          ...meeting.template
        }).catch(console.error);
        res.send();
        break;
      }
      if (text === 'Leave') {
        await Meetings.removeParticipant(meetingId, user);
        await Reminders.removeParticipantReminders({ meetingId, user });
        web.chat.postEphemeral({
          user,
          channel,
          response_type: 'in_channel',
          text: `You've successfully \`Left\` this meeting. Goodbye. 👋`
        });
        res.send();
        break;
      }
      if (text === 'Delete') {
        console.log('delete meeting', meetingId);
        await Reminders.removeMeetingReminders(meetingId);
        await Meetings.remove(meetingId);
        const msg = meeting ? `the meeting: *${meeting.name}*` : 'this meeting';
        web.chat.postEphemeral({
          channel,
          user,
          attachments: [{
            pretext: `You've successfully \`deleted\` ${msg}. 👋`,
            callback_id: 'list_meetings',
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: [{
              name: 'view_all_meetings',
              value: user,
              style: 'primary',
              text: 'View All Meetings',
              type: 'button'
            }]
          }]
        });
        web.chat.postMessage({
          channel,
          user,
          response_type: 'in_channel',
          text: `HEADS UP!! ${msg} has been \`deleted\`. 👋`
        });
      }
      res.send();
      break;
    }
    case 'reminder_options': {
      const { selected_option: { value, text: { text } } } = action;
      const { channel, scheduled_message_id } = JSON.parse(value);

      if (text === 'Delete Reminder') {
        const response = await Reminders.remove({ user, channel, scheduled_message_id });
        web.chat.postEphemeral(response).catch(console.error);
        res.send();
        break;
      }

      if (text === 'Edit Reminder') {
        const reminder = await Reminders.get({ user, scheduled_message_id, channel });
        
        if (_.isEmpty(reminder)) {
          web.chat.postEphemeral({
            user,
            channel,
            text: `⏰ The Reminder may have already \`ended\` or been \`removed\` 👎`
          });
          res.send();
          break;
        }
        web.dialog.open({
          trigger_id,
          dialog: {
            callback_id: 'edit_meeting_reminder',
            title: 'Change Reminder',
            submit_label: 'Update',
            notify_on_cancel: false,
            state: JSON.stringify({ user, scheduled_message_id, channel, meetingId: reminder.meetingId }),
            elements: [{
              value: reminder.reminderName,
              label: 'Reminder Description',
              name: 'reminder_label',
              type: 'text',
              hint: 'eg. Meeting Title'
            }, {
              label: 'Set Reminder Time',
              name: 'reminder_time',
              value: parseInt(reminder.reminderTime, 10),
              type: 'select',
              options: Reminders.getReminderValues()
            }]
          }
        });
      }
      res.send();
      break;
    }
    default:
      res.send();
  }
};

module.exports = blockActions;