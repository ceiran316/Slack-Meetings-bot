const queryStrings = require('query-string');
const _ = require('underscore');

const { Meetings, Users, Reminders } = require('../../../utils');

const { bot } = require('../../../constants');

const web = require('../../../webClient');

const Messages = require('../../../messages');

const isMeetingStillValid = async (payload, meetingId) => {
  const { user: { id: user }, channel: { id: channel }, message_ts: ts } = payload;
  
  const meeting = await Meetings.get(meetingId);

  if (_.isEmpty(meeting)) {
    web.chat.postEphemeral({
      user,
      channel,
      text: `📅 The meeting may have already \`ended\` or been \`removed\` 👎`
    });
    return false
  }

  const { name } = meeting;

  const hasEnded = await Meetings.hasEnded(meetingId);
  if (hasEnded) {
    web.chat.postEphemeral({
      ts,
      user,
      channel,
      text: `📅 The meeting *${name}* has already \`ended\` 👎`
    });
    return false;
  }

  const hasStarted = await Meetings.hasStarted(meetingId);
  if (hasStarted) {
    web.chat.postEphemeral({
      user,
      channel,
      text: `📅 The meeting *${name}* has already \`started\` 🕐`
    });
    return false;
  }
  
  return true;
}

const buttonsTest = async (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received buttonsTest body', body);
    const payload = JSON.parse(body.payload);

    const {
      user: { id: user },
      actions: [action],
      channel: { id: channel },
      message_ts: ts,
      trigger_id,
      callback_id
    } = payload;
  
    const { value: meetingId } = action;

    switch(action.name) {
      case "accept_meeting": {
        const isValidMeeting = await isMeetingStillValid(payload, meetingId);
        console.log('accept_meeting isValidMeeting', isValidMeeting);
        if (!isValidMeeting) {
          res.send();
          break;
        }

        const hasParticipant = await Meetings.hasParticipant(meetingId, user);
        
        if (hasParticipant) {
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            attachments: [{
                text: `You're \`already\` a participant in this meeting. 👍`,
                callback_id: 'set_reminder_button',
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [{
                    name: 'set_meeting_reminder',
                    value: meetingId,
                    style: 'primary',
                    text: 'Set Reminder',
                    type: 'button'                      
                }]
            }]
          }).catch(console.error);
          res.send();
          break;
        }
        
        const sent = await Meetings.sendMeetingInvite(meetingId, user);

        let text = '';
        
        if (sent) {
          const { email } = await Users.getKeys(user, 'email');
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            attachments: [{
                text: `You've successfully \`accepted\` this meeting. We have sent a calendar invite to :email: ${email} .\nSee you then! 👍`,
                callback_id: 'set_reminder_button',
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [{
                    name: 'set_meeting_reminder',
                    value: meetingId,
                    style: 'primary',
                    text: 'Set Reminders',
                    type: 'button'                      
                }]
            }]
          }).catch(console.error);
          res.send();
          return;
        } else {
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            text: `Oops. There has been a problem. We couldn't find your email address or the meeting may have already been cancelled! 👎`
          });
        }
         web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            text
          });
        res.send();
        break;
      }
      case "decline_meeting": {
        console.log('DECLINED', meetingId);
        
        const isValidMeeting = await isMeetingStillValid(payload, meetingId);
        
        if (!isValidMeeting) {
          res.send();
          break;
        }
        
        const hasParticipant = await Meetings.hasParticipant(meetingId, user);
        
        if (!hasParticipant) {
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            text: `You \`were not\` participating in this meeting anyway. 👍`
          });
          res.send();
          break;
        }
        
        await Meetings.removeParticipant(meetingId, user);
        await Reminders.removeParticipantReminders({ meetingId, user });
        
        web.chat.postEphemeral({
          user,
          channel,
          response_type: 'in_channel',
          text: `You've successfully \`declined\` this meeting. Thanks. 👍`
        });
        res.send();
        break;
      }
      case "view_all_meetings" : {
        console.log('view_all_meetings', action.value);
        const data = await Messages.getAllMeetings(action.value);
        web.chat.postEphemeral({
            user,
            channel,
            ...data
        }).catch(console.error);
        res.send();
        break;
      }
      case 'cancel_invite_others': {
        res.send({
            'response_type': 'ephemeral',
            'text': '',
            'replace_original': true,
            'delete_original': true
        });
        break;
      }
      case 'invite_to_meeting': {
        
        const isValidMeeting = await isMeetingStillValid(payload, meetingId);
        if (!isValidMeeting) {
          res.send();
          break;
        }

        const meeting = await Meetings.get(meetingId);
        const { name } = meeting;
        const template = Messages.getSendInvite({ meetingId, pretext: `Who you like to invite to *${name}*?` });
        
        web.chat.postEphemeral({
          user,
          channel,
          as_user: false,
          ...template
        });
        res.send();
        break;
      }
      case (action.name.match(/^invite_users/) || {}).input:
      case 'invite_users': {
        
        const meetingId = action.name.split('||')[1];
        
        const isValidMeeting = await isMeetingStillValid(payload, meetingId);
        if (!isValidMeeting) {
          res.send();
          break;
        }
        
        const { selected_options: [{ value }] } = action;
        const { userId, bot_id } = await Users.get(value);
        
        if (bot_id) {
          const template = Messages.getSendInvite({ meetingId, pretext: `<@${value}> \`cannot\` be added to this meeting 👎` });
          res.send({
            'response_type': 'ephemeral',
            ...template,
            'replace_original': true,
            'delete_original': false
          });
          break;
        }
        
        const meeting = await Meetings.get(meetingId);
        
        const isUserAlreadyAParticipant = await Meetings.hasParticipant(meetingId, value);
        if (isUserAlreadyAParticipant) {
          const name = _.isEqual(userId, value) ? 'You are' : `<@${value}> is`;
          const template = Messages.getSendInvite({ meetingId, pretext: `${name} \`already\` participating in this meeting 👍` });
          res.send({
            'response_type': 'ephemeral',
            ...template,
            'replace_original': true,
            'delete_original': false
          });
          break;
        }
        
        const hasUserAlreadyBeenInvited = await Meetings.hasInvite(meetingId, value);
        if (hasUserAlreadyBeenInvited) {
          const name = _.isEqual(userId, value) ? 'You have' : `<@${value}> has`;
          const template = Messages.getSendInvite({ meetingId, pretext: `${name} \`already\` been sent an invite for this meeting 👍` });
          res.send({
            'response_type': 'ephemeral',
            ...template,
            'replace_original': true,
            'delete_original': false
          });
          break;
        }
        
        await Meetings.addInvite(meetingId, value);
        
        const template = Messages.getSendInvite({ meetingId, pretext: `A meeting invite has been \`sent\` to <@${value}> 👍` });
        res.send({
          'response_type': 'ephemeral',
          ...template,
          'replace_original': true,
          'delete_original': false
        });
        web.chat.postMessage({
          channel: value,
          as_user: false,
          ...meeting.template
        }).catch(console.error);
        break;
      }
      case (action.name.match(/^invite_channels/) || {}).input:
      case 'invite_channels': {
        
        const meetingId = action.name.split('||')[1];
        
        const isValidMeeting = await isMeetingStillValid(payload, meetingId);
        if (!isValidMeeting) {
          res.send();
          break;
        }
        
        const { selected_options: [{ value }] } = action;
        const meeting = await Meetings.get(meetingId);
        const hasUserAlreadyBeenInvited = await Meetings.hasInvite(meetingId, value);
        
        if (hasUserAlreadyBeenInvited) {
          const template = Messages.getSendInvite({ meetingId, pretext: `<#${value}> has \`already\` been sent an invite for this meeting 👎` });
          res.send({
            'response_type': 'ephemeral',
            ...template,
            'replace_original': true,
            'delete_original': false
          });
          break;
        }
        
        await Meetings.addInvite(meetingId, value);
        
        const template = Messages.getSendInvite({ meetingId, pretext: `A meeting invite has been \`sent\` to <#${value}> 👍` });
        res.send({
          'response_type': 'ephemeral',
          ...template,
          'replace_original': true,
          'delete_original': false
        });
        web.chat.postMessage({
          channel: value,
          as_user: false,
          ...meeting.template
        }).catch(console.error);
        break;
      }
      default:
        res.send();
    }
}

module.exports = buttonsTest;