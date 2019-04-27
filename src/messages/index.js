const moment = require('moment');
const _ = require('underscore');

const {
  Meetings
} = require('../utils');

const { reduce } = require('awaity');

const Messages = {
  getAllMeetings: async user => {
    const allMeetings = await Meetings.getAll(user);
    
    if (_.isEmpty(allMeetings)) {
      return {
        attachments: [{
          text: '📅 You `dont` have any meetings scheduled 👎',
          color: '#3AA3E3',
          attachment_type: 'default',
          callback_id: 'create_buttons',
          actions: [{
            name: 'decision',
            value: 'yes_create_meeting',
            style: 'primary',
            text: 'Create Meeting',
            type: 'button'
          }]
        }]
      };
    }
    const blocks = await Messages.getMeetingBlock(user);
    return {
      mrkdwn: true,
      as_user: false,
      blocks: [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `You have *${allMeetings.length}* meeting${allMeetings.length > 1 ? 's' : ''}`
        }
      },
      ..._.flatten(blocks)
      ]
    }
  },
  getNoMeetings: async () => {
    return {
      attachments: [{
        text: '📅 You `dont` have any meetings scheduled 👎',
        color: '#3AA3E3',
        attachment_type: 'default',
        callback_id: 'create_buttons',
        actions: [{
          name: 'decision',
          value: 'yes_create_meeting',
          style: 'primary',
          text: 'Create Meeting',
          type: 'button'
        }]
      }]
    }
  },
  getStartedAgo: async meetingId => {
    const meeting = await Meetings.get(meetingId);
    const { day, month, year, time: { hour, minutes }, duration: { minutes: durationMinutes } } = meeting;
    return moment(`${year}-${month}-${day} ${hour}:${parseInt(minutes, 10)}`).from(moment().add(1, 'hour'));
  },
  getMeetingBlock: async user => {
    const allMeetings = await Meetings.getAll(user);
    console.log('display allMeetings', allMeetings);
    const data = reduce(_.sortBy(allMeetings, 'order'), async (block, meeting) => {
      console.log('meeting', meeting);
      const {
        id,
        name,
        description,
        location,
        day,
        ordinal,
        monthName,
        year,
        time,
        duration,
        host
      } = meeting;
      console.log('Is Host', host, user);
      const descriptionText = description ? `📝 ${description}` : '';
      const hasStarted = await Meetings.hasStarted(meeting.id);
      const startedAgo = await Messages.getStartedAgo(meeting.id);
      const started = hasStarted ? ` - started ${startedAgo}` : '';

      return [...block, {
        type: 'divider'
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🗓 ${name}\n🕐 *${day}${ordinal} ${monthName} ${year} - ${time.hour}:${time.minutes} (${duration.minutes} mins)*${started}\n📍 ${location}\n${descriptionText}`
        },
        accessory: {
          type: 'overflow',
          options: [{
            text: {
              type: 'plain_text',
              text: hasStarted ? 'View Invite' : 'Set Reminder',
              emoji: true
            },
            value: `${id}`
          },
          {
            text: {
              type: 'plain_text',
              text: (user === host) ? 'Delete' : 'Leave',
              emoji: true
            },
            value: `${id}`
          }
          ],
          action_id: "meeting_menu_options"
        }
      }]
    }, []);
    return data;
  },
  getSendInvite: ({
    meetingId,
    pretext
  }) => {
    return {
      attachments: [{
        color: '#39A3E3',
        attachment_type: 'default',
        callback_id: 'invite_others',
        pretext,
        actions: [{
          name: `invite_users||${meetingId}`,
          text: 'Invite Users',
          type: 'select',
          data_source: 'users'
        }, {
          name: `invite_channels||${meetingId}`,
          text: 'Invite Channels',
          type: 'select',
          data_source: 'channels'
        }, {
          name: 'cancel_invite_others',
          value: 'cancel_invite_others',
          text: 'Cancel',
          type: 'button'
        }]
      }]
    }
  }
}

module.exports = Messages;