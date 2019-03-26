const queryStrings = require('query-string');

const web = require('../../../webClient');

const buttonsTest = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received buttonsTest body', body);
    const payload = JSON.parse(body.payload);

    const {
        user: { id: userId },
        actions: [action],
        channel: { id: channel },
        message_ts: ts,
      trigger_id
    } = payload;
  
    // remove the original message
    res.send({
      'response_type': 'ephemeral',
      'text': '',
      'replace_original': true,
      'delete_original': true
    });
  
  switch(action.value) {
    case 'yes': {
      web.dialog.open({
        trigger_id,
        dialog: {
            callback_id: 'meeting',
            title: 'Create Meeting',
            submit_label: 'Send',
            notify_on_cancel: true,
            state: JSON.stringify({}),
            elements: [{
                label: 'Meeting Name',
                name: 'name',
                placeholder: 'Choose meeting name',
                type: 'text',
                hint: 'eg. Project Briefing/Demo'
            }, {
                label: 'Location',
                name: 'room',
                placeholder: 'Choose location',
                type: 'select',
                data_source: 'external',
            }, {
                label: 'Day',
                name: 'day',
                placeholder: 'DD',
                type: 'text',
                hint: 'eg. 01 or 21'
            },{
                label: 'Month',
                name: 'month',
                placeholder: 'MM',
                type: 'text',
                hint: 'eg. Jan/January/01'
            }, {
                label: 'Year',
                name: 'year',
                placeholder: 'Choose year',
                type: 'select',
                data_source: 'external'
            },{
                label: 'Start Time',
                name: 'start',
                placeholder: 'hh:mm',
                type: 'text',
                hint: 'eg. 09:00 / 13:00 (24hr)'
            },{
                label: 'Meeting Duration',
                name: 'duration',
                placeholder: 'Choose meeting duration',
                type: 'select',
                data_source: 'external'
            },{
                label: 'Details',
                name: 'description',
                optional: true,
                type: 'textarea',
                hint: 'Meeting notes, Pizza/cake after'
            }]
          } 
      });
      break;
    }
    case 'no': {
      break;
    }
    default:
  }
}

module.exports = buttonsTest;