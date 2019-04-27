const _ = require('underscore');
const moment = require('moment');
const web = require('../webClient');
const Meetings = require('./meetings');
const { bot } = require('../constants');
const store = require('../store')('reminders');

moment.locale('en');

const Reminders = {
  getReminderValues: () => {
    const reminders = [5, 10, 15, 20, 30, 60];
    return reminders.map(reminder => ({ label: `${reminder} mins`, value: reminder }));
  },
  add: async ({
        user,
    channel,
    meetingId,
    reminderName,
    reminderTime
    }) => {
    const meeting = await Meetings.get(meetingId);
    const { day, month, year, time: { hour, minutes } } = meeting;
    const meetingWhen = moment(`${year}-${month}-${day} ${hour}:${minutes}`);
    const reminderWhen = moment(meetingWhen).subtract(parseInt(reminderTime, 10), 'minutes');
    const post_at = (reminderWhen.unix() - 3600);
    const friendlyMeetingDate = meetingWhen.format('dddd, MMMM Do YYYY, HH:mm');
    const friendlyReminderDate = reminderWhen.format('dddd, MMMM Do YYYY, HH:mm');

    let alertPreText = `*ALERT* *Reminder:* \`${reminderName}\` - (${reminderTime} mins before)`;
    let alertText = `\n⏰ ${friendlyMeetingDate}\n🗓 ${meeting.name}`;
    let text = `*Reminder:* \`${reminderName}\` - (${reminderTime} mins before)\n🕐 ${friendlyReminderDate}\n📅  ${meeting.name}`;

    if (!_.isEmpty(meeting.description)) {
      text += `\n📝 ${meeting.description}`;
      alertText += `\n📝 ${meeting.description}`;
    }

    console.log('channel', channel);

    return await web.chat.scheduleMessage({
      user,
      channel,
      post_at,
      as_user: false,
      attachments: [{
        pretext: alertPreText,
        text: alertText,
        color: '#ffbf00',
        attachment_type: 'default',
      }]
    }).then(async ({
            scheduled_message_id,
      message
        }) => {
      console.log('scheduleMessage response', user, scheduled_message_id, message);
      await store.update(user, [{
        scheduled_message_id,
        channel,
        message,
        text: `⏰ ${text}`,
        reminderName,
        reminderTime,
        meetingId,
        order: reminderWhen.valueOf()
      }]);
      return {
        user,
        channel,
        attachments: [{
          pretext: `👍 Meeting Reminder \`${reminderName}\` Scheduled\n\n⏰ *${friendlyReminderDate}*`,
          color: '#3AA3E3',
          attachment_type: 'default',
          callback_id: 'add_reminder_action',
          actions: [{
            name: 'delete_reminder',
            text: 'Delete Reminder',
            type: 'button',
            style: 'danger',
            value: JSON.stringify({ scheduled_message_id, channel }),
            confirm: {
              title: 'Are you sure?',
              ok_text: 'Yes',
              dismiss_text: 'No'
            }
          }, {
            name: 'view_reminders',
            text: 'View All Reminders',
            type: 'button',
            value: JSON.stringify({ scheduled_message_id, channel }),
          }]
        }],
      };
    }).catch(err => {
      console.error(err);
      const { data: { error } } = err;
      if (error === 'time_in_past') {
        console.log('error time in past', user, channel);
        return {
          user,
          channel,
          attachments: [{
            text: `👎 Meeting is closer than ${reminderTime} minutes`,
            color: '#ff6465',
            attachment_type: 'default',
          }]
        }
      }
    });
  },
  get: async ({
        user,
    scheduled_message_id,
    channel
    }) => {
    const allSchedules = await store.get(user);
    return _.chain(allSchedules).where({ scheduled_message_id, channel }).first().value();
  },
  getAll: async ({
        user,
    channel
    }) => {
    const {
            scheduled_messages = []
        } = await web.chat.scheduledMessages.list({
        channel
      });

    let allSchedules = [];
    const allSheduledMessages = _.pluck(scheduled_messages, 'id');

    if (_.isEmpty(allSheduledMessages)) {
      await store.set(user, []);
    } else {
      allSchedules = await store.get(user);
    }

    const allReminders = _.filter(allSchedules, ({ scheduled_message_id }) => allSheduledMessages.includes(scheduled_message_id));

    if (_.isEmpty(allReminders)) {
      await store.set(user, []);
      return {
        user,
        channel,
        mrkdwn: true,
        attachments: [{
          pretext: '⏰ You `do not` have any Reminders 👎',
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
      };
    }

    console.log('allReminders', allReminders);

    const blocks = _.chain(allReminders).sortBy('order').reduce((block, { scheduled_message_id, text, reminderTime }) => {
      return [...block, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        },
        accessory: {
          type: 'overflow',
          action_id: 'reminder_options',
          options: [{
            text: {
              type: 'plain_text',
              text: 'Edit Reminder',
              emoji: true
            },
            value: JSON.stringify({ channel, scheduled_message_id })
          },
          {
            text: {
              type: 'plain_text',
              text: 'Delete Reminder',
              emoji: true
            },
            value: JSON.stringify({ channel, scheduled_message_id })
          }]
        }
      }, {
        type: 'divider'
      }]
    }, [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Your ${allReminders.length} Meeting Reminder${allReminders.length > 1 ? 's' : ''}:*`
      }
    }, {
      type: 'divider'
    }]).value();

    return {
      user,
      channel,
      mrkdwn: true,
      attachment_type: 'default',
      attachments: [{
        color: '#FACB65',
        blocks: _.chain(blocks).initial().flatten().value()
      }]
    }
  },
  remove: async ({
        user,
    channel,
    scheduled_message_id
    }) => {

    console.log('remove', user,
      channel,
      scheduled_message_id);

    const reminder = await Reminders.get({ user, channel, scheduled_message_id });

    console.log('remove reminder', reminder);

    await web.chat.deleteScheduledMessage({
      user,
      channel,
      scheduled_message_id
    }).catch(console.error);

    if (_.isEmpty(reminder)) {
      return {
        user,
        channel,
        attachments: [{
          pretext: `⏰ Reminder was already \`deleted\` 👍`,
          color: '#3AA3E3',
          attachment_type: 'default',
          callback_id: 'add_reminder_action',
          actions: [{
            name: 'view_reminders',
            text: 'View All Reminders',
            type: 'button',
            value: JSON.stringify({ scheduled_message_id, channel }),
          }]
        }],
      };
    }

    const reminders = await store.get(user);
    await store.set(user, _.reject(reminders, obj => obj.scheduled_message_id === scheduled_message_id));

    return {
      user,
      channel,
      attachments: [{
        pretext: `⏰ Reminder \`${reminder.reminderName}\` was Deleted 👍`,
        color: '#3AA3E3',
        attachment_type: 'default',
        callback_id: 'add_reminder_action',
        actions: [{
          name: 'view_reminders',
          text: 'View All Reminders',
          type: 'button',
          value: JSON.stringify({ scheduled_message_id, channel }),
        }]
      }],
    };
  },
  update: async ({ scheduled_message_id, user, channel, reminderName, reminderTime, meetingId }) => {
    console.log('update reminder', scheduled_message_id, user, channel, reminderName, reminderTime, meetingId);
    await Reminders.remove({ user, channel, scheduled_message_id });
    console.log('removed');
    const newReminder = await Reminders.add({ user, channel, meetingId, reminderName, reminderTime });
    console.log('update reminder newReminder', newReminder);
    return newReminder;
  },
  removeParticipantReminders: async ({ meetingId, user }) => {
    console.log('removeParticipantReminders', meetingId, user)
    const reminders = await store.get(user);
    console.log('removeParticipantReminders reminders', reminders);

    if (!_.isEmpty(reminders)) {
      reminders.forEach(async ({
        channel,
        scheduled_message_id,
        meetingId: id
      }) => {
        console.log('removeParticipantReminders id', id, meetingId);

        if (id === meetingId) {
          return await Reminders.remove({ user, scheduled_message_id, channel });
        }
      });
    }
  },
  removeMeetingReminders: async (meetingId) => {
    const meeting = await Meetings.get(meetingId);
    
    if (!_.isEmpty(meeting)) {
      const { participants } = meeting;
      participants.forEach(async user => Reminders.removeParticipantReminders({ meetingId, user }));
    }
  },
  clear: async ({ user, channel }) => { store.clear(); }
}

module.exports = Reminders;
