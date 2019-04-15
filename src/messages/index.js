const { Meetings } = require('../utils');

const Messages = {
  getMeetingBlock: async user => {  
        const allMeetings = await Meetings.getAll(user);
        console.log('display allMeetings', allMeetings);
        const data = allMeetings.reduce((block, meeting) => {
          console.log('meeting', meeting);
          const { id, name, description, location, day, ordinal, monthName, year, time, duration, host } = meeting;
          console.log('Is Host', host, user);
          return [...block, {
            type: 'divider'
          }, {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⏰ *${day}${ordinal} ${monthName} ${year} - ${time.hour}:${time.minutes} (${duration.minutes} mins)*\n📍 ${location} \n🗓 ${name} - ${description}`
            },
accessory: {
			type: 'overflow',
			options: [
				{
					text: {
						type: 'plain_text',
						text: 'View',
						emoji: true
					},
					value: `${id}`
				},
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
      attachments: [{
        color: '#3AA3E3',
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
          }, {
            "type": "actions",
            "elements": [
              //{
            //     value: `${date}`,
            //     type: 'button',
            //     action_id: 'yes_create_meeting',
            //     text: {
            //       type: 'plain_text',
            //       text: '🗓 Contiune',
            //       "emoji": true
            //     },                    
            // },
            {
              value: 'no',
              type: 'button',
              action_id: 'no_create_meeting',
              text: {
                type: 'plain_text',
                text: 'Cancel',
                "emoji": true
              }
          }]
        }]
      }]
    }
  }
}

module.exports = Messages;