const queryStrings = require('query-string');
const _ = require('underscore');
const moment = require("moment");
const web = require('../../webClient');
const Messages = require('../../messages');

const {
  Meetings,
  Users,
  Reminders
} = require('../../utils');

const commands = async (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  console.log('slashCommands -> body', body);
  const {
    command,
    user_id: user,
    channel_id: channel,
    text,
    trigger_id
  } = body;

  console.log('TCL: commands -> text', text);

  switch (text) {
    case 'reminders':
    case 'get reminders':
    case 'get reminder':
    case 'getreminders':
    case 'getreminder':
    case 'list reminders':
      {
        const response = await Reminders.getAll({ user, channel });
        web.chat.postEphemeral(response).catch(console.error);
        res.send();
        break;
      }
    case 'create':
    case 'add':
    case 'new':
    case 'new meeting':
      {
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
              value: 'yes_create_meeting',
              style: 'primary',
              text: 'Create Meeting',
              type: 'button'
            }, {
              name: 'decision',
              value: 'no',
              text: 'Cancel',
              type: 'button',
              style: 'danger',
            }]
          }]
        }).catch(console.error);
        res.send();
        break;
      }
    case 'display':
    case 'list':
    case 'meetings':
    case 'get meetings':
    case 'get meeting':
    case 'getmeetings':
    case 'getmeeting':
    case 'list meetings':
      {
        const data = await Messages.getAllMeetings(user);
        web.chat.postEphemeral({
          user,
          channel,
          ...data
        }).catch(console.error);
        res.send();
        break;
      }
    default:
      {
        res.send('You can use the slash command followed by `new`, `create`, `list`, `meetings`, `reminders`');
      }
  }
}

module.exports = commands;