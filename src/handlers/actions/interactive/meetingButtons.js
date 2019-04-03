const queryStrings = require('query-string');
const { Meetings, Users } = require('../../../utils');
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
        if (Meetings.hasParticipant(meetingId, user)) {
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
          text = `You've successfully \`accepted\` this meeting. We have sent a calendar invite to :email: ${email} .\nSee you then! 👍`;
        } else {
          text = `Oops. There has been a problem. We couldn't find your email address or the meeting may have already been cancelled! 👎`;
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
        const meetingId = action.value;
        console.log('DECLINED', meetingId);

        if (!Meetings.hasParticipant(meetingId, user)) {
          web.chat.postEphemeral({
            user,
            channel,
            response_type: 'in_channel',
            text: `You weren't participating in this meeting anyway. 👍`
          });
          break;
        }
        
        Meetings.removeParticipant(meetingId, user);
        
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