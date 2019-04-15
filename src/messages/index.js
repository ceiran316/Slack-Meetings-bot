const Messages = {
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
                action_id: 'date_create_meeting',
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
              "elements": [{
                  value: `${date}`,
                  type: 'button',
                  action_id: 'yes_create_meeting',
                  text: {
                    type: 'plain_text',
                    text: '🗓 Contiune',
                    "emoji": true
                  },                    
              }, {
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