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
        text: 'Meeting being created...',
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
                        label: 'Day',
                        name: 'day',
                        placeholder: 'DD',
                        type: 'text',
                        hint: '01 or 23'
                    },{
                        label: 'Month',
                        name: 'month',
                        placeholder: 'MM',
                        type: 'text',
                        hint: '01 or JAN'
                    }, {
                        label: 'Start Time',
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
    }
}

module.exports = buttonsTest;