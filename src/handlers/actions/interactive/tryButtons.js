const queryStrings = require('query-string');

const web = require('../../../webClient');

const buttonsTest = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received buttonsTest body', body);
    const payload = JSON.parse(body.payload);

    const {
        user: { id: userId },
        actions: [action],
        //dialogSubmission: [submission],
        channel: { id: channel },
        message_ts: ts,
      trigger_id
    } = payload;

    res.send({
        channel,
        ts,
        text: 'Try out these buttons',
        attachments: [{
            title: 'Feeback',
            text : `Thanks for the Feeback <@${userId}>\n${JSON.stringify(action)}`
        }]
    });
  console.log("action: ", action.value);
    if (action.value === 'yes'){
              web.dialog.open({
                trigger_id,
                dialog: {
                    callback_id: 'meeting',
                    title: 'Create Meeting',
                    submit_label: 'Send',
                    notify_on_cancel: false,
                    state: 'Limo',
                    // Max 5 elements
                    elements: [{
                        label: 'Meeting Name',
                        name: 'name',
                        type: 'text',
                        hint: 'Project Briefing/Demo'
                    }, {
                        label: 'Location',
                        name: 'room',
                        type: 'select',
                        data_source: 'external',
                        hint: 'Choose meeting location'
                    }, {
                        label: 'Date',
                        name: 'date',
                        placeholder: 'DD/MM',
                        type: 'text',
                        hint: '31/01'
                    }, {
                        label: 'Strat Time',
                        name: 'start',
                        placeholder: 'hh:mm',
                        type: 'text',
                        hint: '09:00 / 13:00 (24hr)'
                    },{
                        label: 'Meeting Duration',
                        name: 'duration',
                        placeholder: 'Choose meeting duration',
                        type: 'select',
                        data_source: 'external'
                    },{
                        label: 'Details',
                        name: 'description',
                        type: 'textarea',
                        hint: 'Meeting notes, Pizza/cake after'
                    }/*, {
                        label: 'Invite',
                        name: 'manager',
                        type: 'select',
                        data_source: 'users'
                    }*/]
                }
                
            });
      attachments: [{
            title: 'Meeting Feeback',
            //text : `Thanks for the Feeback <@${userId}>\n${JSON.stringify(submission)}`
        }]
      //console.log("meeting name: ", submission.name);
      //console.log("location: ", submission.location);
      //console.log("date: ", submission.date[0]);
      //console.log("time: ", submission.date[1]);
      //console.log("details: ", submission.description);
      //console.log("manager: ", submission.manager);
    }
}

module.exports = buttonsTest;