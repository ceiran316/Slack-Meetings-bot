const { Meetings } = require('../utils');

const Messages = {
  getMeetingBlock: async user => {  
        const allMeetings = await Meetings.getAll(user);
        console.log('display allMeetings', allMeetings);
        const data = allMeetings.reduce((block, meeting) => {
          console.log('meeting', meeting);
          const { id, name, description, location, day, ordinal, monthName, year, time, duration, host } = meeting;
          console.log('Is Host', host, user);
          const descriptionText = description ? ` - ${description}` : '';
          return [...block, {
            type: 'divider'
          }, {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🕐 *${day}${ordinal} ${monthName} ${year} - ${time.hour}:${time.minutes} (${duration.minutes} mins)*\n📍 ${location} \n🗓 ${name}${descriptionText}`
            },
accessory: {
			type: 'overflow',
			options: [
        {
					text: {
						type: 'plain_text',
						text: 'Set Reminder',
						emoji: true
					},
					value: `${id}`
				},
				{
					text: {
						type: 'plain_text',
						text: (user === host) ? 'Delete': 'Leave',
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
  selectCalendarDate: date => {
    return {
        blocks: [{
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Would you like to create a :spiral_calendar_pad: *New Meeting*?"
          }
        }, {
            "type": "divider"
          }, {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Pick a date for your Meeting..."
            },
            "accessory": {
              "type": "datepicker",
              action_id: 'create_meeting_with_date',
              initial_date: `${date}`,
              "placeholder": {
                "type": "plain_text",
                "text": "Select a date",
                "emoji": true
              }
            },
          }, {
            "type": "divider"
          }]
    }
  },
  getSendInvite: ({ meetingId, pretext }) => {
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