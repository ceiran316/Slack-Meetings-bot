const _ = require('underscore');
const moment = require('moment');

moment.locale('en');

const web = require('../webClient');

const Meetings = require('./meetings');

const { bot } = require('../constants');

const store = require('../store')('reminders');

const Reminders = {
    add: async ({
        user,
        channel,
        meetingId,
        reminderTime
    }) => {
      const meeting = await Meetings.get(meetingId);
      
      const { day, month, year, time: { hour, minutes } } = meeting;
      
      const meetingWhen = moment(`${year}-${month}-${day} ${hour}:${minutes}`);
      const reminderWhen = meetingWhen.subtract(parseInt(reminderTime, 10), 'minutes');
      const post_at = (reminderWhen.unix() - 3600);

        const friendlyMeetingDate = meetingWhen.format('dddd, MMMM Do YYYY, HH:mm');
        const friendlyReminderDate = reminderWhen.format('dddd, MMMM Do YYYY, HH:mm');
      
        const text = `*You have a Meeting*\n🕐 ${friendlyMeetingDate}\n🗓 ${meeting.name}`;
        if(!_.isEmpty(meeting.description)) {
          text += `\n📝 ${meeting.description}`;
        }
        
        console.log('channel', channel);

        return await web.chat.scheduleMessage({
            user,
            channel,
            post_at,
            attachments: [{
              text: `⏰ *ALERT* ${text}`,
              color: '#ffbf00',
              attachment_type: 'default',
            }]
        }).then(async ({
            scheduled_message_id,
            message
        }) => {
            await store.update(user, [{
                scheduled_message_id,
                channel,
                message,
                text: `⏰ ${text}`
            }]);
            return {
              user,
              channel,
              attachments: [{
                text: `👍 Meeting Reminder Scheduled\n\n⏰ *${friendlyReminderDate}*`,
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
      return _.where(allSchedules, { scheduled_message_id, channel });
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

        if(_.isEmpty(allSheduledMessages)) {
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
            text: '⏰ You `do not` have any Reminders set 👎'
          };
        }

        const blocks = allReminders.reduce((block, { scheduled_message_id, text }) => {

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
                                text: 'Remove Reminder',
                                emoji: true
                            },
                            value: JSON.stringify({ channel, scheduled_message_id })
                        }
                    ]
                }
            }, {
                type: 'divider'
            }]
        }, [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Your ${allReminders.length} Meeting Reminder${allReminders.length > 1 ? 's' : '' }:*`
              }
            }, {
                type: 'divider'
            }]);

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
        
      const hasReminder = await Reminders.get({ user, channel, scheduled_message_id });
        
      await web.chat.deleteScheduledMessage({
            user,
            channel,
            scheduled_message_id
        }).catch(console.error);

        if(_.isEmpty(hasReminder)) {
            return {
              user,
              channel,
              attachments: [{
                text: '⏰ Reminder was already `deleted` 👍',
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
            text: '⏰ Reminder Deleted 👍',
            color: '#E01E5A',
            attachment_type: 'default'
          }],
        }
    },
    clear: async ({
        user,
        channel
    }) => {
      store.clear();
    }
}

module.exports = Reminders;
