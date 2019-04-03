const queryStrings = require('query-string');
const _ = require('underscore');

const web = require('../../webClient');

const commands = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('slashCommands -> body', body);
    const { command, user_id: user, channel_id: channel, text, trigger_id } = body;
  
    if(command === '/hello') {
      console.log('HELLO');
    }
  
    console.log('TCL: commands -> text', text);
    switch(text) {
      case 'users': {
        console.log('GET USERS');
        web.users.list().then(res => {
          const { members } = res;
          const people = _.reject(members, user => user.is_bot);
          console.log('USERS', people);
        }).catch(e => console.log('ERROR', e));
        res.send();
        break;
      }
      case 'create': {
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
              // ,"accessory": {
              //   "type": "image",
              //   "image_url": "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
              //   "alt_text": "calendar thumbnail"
              // }
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
                  initial_date: `${(new Date()).toISOString().split('T')[0]}`,
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Select a date",
                    "emoji": true
                  }
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
        }).catch(console.error);
        res.send();
        break;
      }
      case 'new': {
        web.chat.postEphemeral({
            user,
            channel,
            attachments: [{
                title: 'Would you like to create a new meeting?',
                callback_id: 'create_buttons',
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [{
                    name: 'decision',
                    value: 'yes',
                    style: 'primary',
                    text: 'Yes',
                    type: 'button'                      
                }, {
                    name: 'decision',
                    value: 'no',
                    text: 'No',
                    type: 'button',
                    style: 'danger',
                }]
            }]
        }).catch(console.error);
        res.send();
        break;
      }
      case 'delete': {
        web.chat.postMessage({
            channel,
            attachments: [{
                title: 'Delete a meeting?',
                callback_id: 'delete_buttons',
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [{
                    name: 'decision',
                    value: 'yes',
                    style: 'primary',
                    text: 'Yes',
                    type: 'button'/*,
                    confirm: {
                        title: 'Delete meeting?',
                        ok_text: 'Yes, im sure',
                        dismiss_text: 'Cancel'
                    }*/

                }, {
                    name: 'decision',
                    value: 'no',
                    text: 'No',
                    type: 'button',
                    style: 'danger',
                }]
            }]
        }).catch(console.error);
        res.send();
        break;
      }
      case 'display': {
        web.chat.postMessage({
            channel,
            attachments: [{
                title: 'Display a meeting?',
                callback_id: 'read_buttons',
                color: '#3AA3E3',
                attachment_type: 'default',
                footer_icon: 'https://img.icons8.com/office/16/000000/overtime.png',
                actions: [{
                    name: 'decision',
                    value: 'yes',
                    style: 'primary',
                    text: 'Yes',
                    type: 'button'/*,
                    confirm: {
                        title: 'Delete meeting?',
                        ok_text: 'Yes, im sure',
                        dismiss_text: 'Cancel'
                    }*/

                }, {
                    name: 'decision',
                    value: 'no',
                    text: 'No',
                    type: 'button',
                    style: 'danger',
                }]
            }]
        }).catch(console.error);
        res.send();
        break;
      }
      default: {
          res.send(`You can use the slash command followed by *new*, *create*, *display*, *delete*, *users*`);
      }
    }
}

module.exports = commands;