const queryStrings = require('query-string');
const { Meetings, Users, Reminders } = require('../../../utils');

const web = require('../../../webClient');

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
  
    res.send();

    switch(action.name) {
      case "accept": {
        const meetingId = action.value;
        console.log('ACCEPTED', user, meetingId);
        const hasParticipant = await Meetings.hasParticipant(meetingId, user)
        if (hasParticipant) {
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            text: `You're already a participant in this meeting. 👍`
          });
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
            text: `You've successfully \`accepted\` this meeting. We have sent a calendar invite to :email: ${email} .\nSee you then! 👍`
          });
          return
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
        break;
      }
      case "decline": {
        const meetingId = JSON.parse(action.value);
        console.log('DECLINED', meetingId);
        
        const hasParticipant = await Meetings.hasParticipant(meetingId, user);
        
        console.log('decline hasParticipant', hasParticipant);

        if (!hasParticipant) {
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            text: `You weren't participating in this meeting anyway. 👍`
          });
          break;
        }
        
        await Meetings.removeParticipant(meetingId, user);
        // await Reminders.remove({ user, channel });
        
        web.chat.postEphemeral({
          user,
          channel,
          response_type: 'in_channel',
          text: `You've successfully \`declined\` this meeting. Thanks. 👍`
        });
        break;
      }
      default:
    }
}

module.exports = buttonsTest;