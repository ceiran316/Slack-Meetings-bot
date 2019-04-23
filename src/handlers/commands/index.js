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
            {
                const response = await Reminders.getAll({ user, channel });
                web.chat.postEphemeral(response).catch(console.error);
                res.send();
                break;
            }
//         case 'clear':
//             {
//                 res.send();

//                 await Users.clear();
//                 await Meetings.clear();
//                 await Reminders.clear({
//                     user,
//                     channel
//                 });

//                 web.chat.postEphemeral({
//                     user,
//                     channel,
//                     text: 'Cleared All your Stores: Done 👍'
//                 }).catch(console.error);
//                 break;
//             }
        case 'create':
            {
                const createMessage = Messages.selectCalendarDate((new Date()).toISOString().split('T')[0]);
                web.chat.postEphemeral({
                    user,
                    channel,
                    ...createMessage
                }).catch(console.error);
                res.send();
                break;
            }
        case 'add':
        case 'new':
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
      case 'meetings':
      case 'list':
        case 'display':
            {
                const allMeetings = await Meetings.getAll(user);

              if (_.isEmpty(allMeetings)) {
                web.chat.postEphemeral({
                  user,
                  channel,
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
                });
            }
                const blocks = await Messages.getMeetingBlock(user);
              
              // #F9CA65
                
                web.chat.postEphemeral({
                    user,
                    channel,
                    mrkdwn: true,
                    blocks: [	{
                      "type": "section",
                      "text": {
                        "type": "mrkdwn",
                        "text": `You have *${allMeetings.length}* meeting${allMeetings.length > 1 ? 's' : ''}`
                      }
                    },
                    ..._.flatten(blocks)
                    ]
                }).catch(console.error);
                res.send();
                break;
            }
        default:
            {
                res.send('You can use the slash command followed by `new`, `create`, `display`, `reminders`');
            }
    }
}

module.exports = commands;