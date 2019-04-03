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
        //dialogSubmission: [submission],
        channel: { id: channel },
        message_ts: ts,
      trigger_id,
      callback_id
    } = payload;
  
    res.send();

    switch(action.name) {
      case "accept": {
        console.log('ACCEPTED', user, action.value);
        const { email } = await Users.getKeys(user, 'email');
        console.log('EMAIL', email);
        const sent = await Meetings.sendMeetingInvite(user, action.value);
        let text = '';
        if (sent) {
          text = `You've successfully \`accepted\` this meeting. We have sent a calendar invite to ${email} .\nSee you then! 👍`;
        } else {
          text = `Oops. There has been a problem. The meeting may have already been cancelled! 👎`;
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
        console.log('DECLINED', action.value);
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

    // res.send({
    //     channel,
    //     ts,
    //     text: 'Meeting being displayed...'/*,
    //     attachments: [{
    //         title: 'Feeback',
    //         text : `Thanks for the Feeback <@${userId}>\n${JSON.stringify(action)}`
    //     }]*/
    // });
//   console.log("action: ", action.value);
//     if (action.value === 'meetingId1'){
//               web.dialog.open({
//                 trigger_id,
//                 dialog: {
//                     callback_id: 'meeting',
//                     title: 'display Meeting',
//                     submit_label: 'Send',
//                     notify_on_cancel: false,
//                     state: 'Limo',
//                     // Max 5 elements
//                     elements: [{
//                         label: 'Meeting Name',
//                         name: 'name',
//                         placeholder: 'Choose meeting name',
//                         type: 'text',
//                         hint: 'eg. Project Briefing/Demo'
//                     }/*, {
//                         label: 'Invite',
//                         name: 'manager',
//                         type: 'select',
//                         data_source: 'users'
//                     }*/]
//                 }
                
//             });
//     }
}

module.exports = buttonsTest;