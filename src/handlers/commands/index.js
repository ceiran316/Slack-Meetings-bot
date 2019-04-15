const queryStrings = require('query-string');
const _ = require('underscore');
const moment = require("moment");

const web = require('../../webClient');

const Messages = require('../../messages');

const { Meetings, Users, Reminders } = require('../../utils');

const commands = async (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('slashCommands -> body', body);
    const { command, user_id: user, channel_id: channel, text, trigger_id } = body;
  
    console.log('TCL: commands -> text', text);
    switch(text) {
      case 'reminder':
      case 'reminders': {
        res.send();
        const post_at = Math.round(moment().unix() + 100);
        const ts = (post_at * 1000);
        const when = moment(ts);
        const friendlyDate = when.format('dddd, MMMM Do YYYY, h:mma');
        console.log('post_at', post_at);
        await Reminders.add({ ts, user, channel, post_at, friendlyDate, text: `⏰ *ALERT* You have a Meeting - ${moment().to(when)} (${friendlyDate})\nSome Meeting Title\nSome Meeting Description` });

        web.chat.postEphemeral({
          user,
          channel,
          post_at, //Epoch
          text: `Meeting Reminder Scheduled - for ${friendlyDate} - ${when.fromNow()}`              
        }).catch(console.error);
        
        break;
      }
      case 'getreminder': {
        const allReminders = await Reminders.getAll({ user, channel });
        const data = allReminders.reduce((block, schedule) => {
          const { scheduled_message_id, text }  = schedule;
          return [...block, {
            type: 'divider'
          }, {
            type: 'section',
            block_id: `meeting_schedule_${scheduled_message_id}`,
            text: {
              type: 'mrkdwn',
              text
            },
            accessory: {
              type: 'overflow',
              options: [
                {
                  "text": {
                    "type": "plain_text",
                    "text": "View Meeting",
                    "emoji": true
                  },
                  value: 'some_meeting_data',
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Remove Reminder",
                    "emoji": true
                  },
                  value: 'some_reminder_data',
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Delete Meeting",
                    "emoji": true
                  },
                  value: 'some_meeting_data',
                }]
            }
          }]
        }, []);
        
        web.chat.postEphemeral({
          user,
          channel,
          mrkdwn: true,
          text: '*Your Meeting Reminders:*',
          blocks: _.flatten(data)
        }).catch(console.error);
        res.send();
        break;
      }
      case 'clear': {
        res.send();
        
        await Users.clear();
        await Meetings.clear();
        await Reminders.clear({ user, channel });
        
        web.chat.postEphemeral({
          user,
          channel,
          text: 'Cleared All your Stores: Done 👍'
        }).catch(console.error);
        break;
      }
      // FOR TESTING
      case 'meetings': {
        const meetings = await Meetings.getAll();
        console.log('meetings', meetings);
        web.chat.postMessage({
          user,
          channel,
          text: JSON.stringify(meetings)
        }).catch(console.error);
        res.send();
        break;
      }
      // FOR TESTING
      case 'users': {
        const users = await Users.getAll();
        console.log('users', users);
        web.chat.postMessage({
          user,
          channel,
          text: JSON.stringify(users)
        }).catch(console.error);
        res.send();
        break;
      }
      case 'create': {
        const createMessage = Messages.selectCalendarDate((new Date()).toISOString().split('T')[0]);
        web.chat.postEphemeral({
          user,
          channel,
          ...createMessage
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
      case 'display': {
        const allMeetings = await Meetings.getAll();
        const data = allMeetings.reduce((block, meeting) => {
          console.log('meeting', meeting);
          const { id, name, description, location, day, ordinal, monthName, year, time, duration } = meeting;
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
						text: 'Delete',
						emoji: true
					},
					value: `${id}`
				}
			]
		}
          }]
        }, []);
        
        
        const meetings = allMeetings.map(({ id, name, description, location, day, ordinal, monthName, year, time, duration }) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⏰ *${day}${ordinal} ${monthName} ${year} - ${time.hour}:${time.minutes} (${duration.minutes} mins)*\n📍 ${location} \n🗓 ${name} - ${description}`
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'View'
            },
            value: id
          }
        }));
        web.chat.postEphemeral({
          user,
          channel,
          mrkdwn: true,
          text: '*Your Meetings:*',
          blocks: _.flatten(data)
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