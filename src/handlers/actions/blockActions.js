const queryStrings = require('query-string');

const web = require('../../webClient');

const blockActions = (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  console.log('Received BLOCK ACTIONS', body);
  const payload = JSON.parse(body.payload);
  const { channel: { id: channel }, user: { id: user }, container: { message_ts: ts }, callback_id, actions: [action] } = payload;
  
  console.log(action.action_id, ts);

  switch(action.action_id) {
    case 'no_create_meeting': {
      console.log('remove meeting');
      web.chat.delete({
        channel,
        ts
      });
      res.send();
      break;
    }
    case 'yes_create_meeting': {
      console.log('OPEN MEETING DIALOG');
      web.chat.delete({
        channel,
        ts
      });
      // OPEN Dialog
      res.send();
      break;
    }
    case 'date_create_meeting' : {
      
      web.chat.postEphemeral({
          user,
          channel,
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
                "type": "actions",
                "elements": [{
                    value: 'yes',
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
        });
      res.send();
      break;
    } 
    default:
      res.send();
  }
};

module.exports = blockActions;