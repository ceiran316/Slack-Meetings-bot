const queryStrings = require('query-string');

const web = require('../../../webClient');

const buttonsTest = (req, res) => {
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
        console.log('ACCEPTED', action.value);
        console.log('WEBCLIENT', web.users);
        web.users.profile.get({ user, include_labels: true }).then(res => console.log('PERSON', res)).catch(err => console.log('GET PROFILE ERROR', err));
        web.chat.postEphemeral({
          user,
          channel,
          response_type: 'in_channel',
          text: `You've successfully \`accepted\` this meeting. We have sent a calendar invite to .\nSee you then! 👍`
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