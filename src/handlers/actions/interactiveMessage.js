const _ = require('underscore');
const queryStrings = require('query-string');
const { createButtons, updateButtons, deleteButtons, readButtons, meetingButtons, setReminders } = require('./interactive')

const interactiveMessage = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received interactiveMessage body', body);
    const payload = JSON.parse(body.payload);

    const { callback_id } = payload;

    switch (callback_id) {
        case 'create_buttons': {
            createButtons(req, res);
            break;
        }
        case 'update_buttons': {
            updateButtons(req, res);
            break;
        }
        case 'delete_buttons': {
            deleteButtons(req, res);
            break;
        }
        case 'read_buttons': {
            readButtons(req, res);
            break;
        }
        case 'list_meetings':
        case (callback_id.match(/^invite_others/) || {}).input:
        case 'meeting_accept_buttons': {
            meetingButtons(req, res);
            break;
        }
        case 'add_reminder_action':
        case 'set_reminder_button': {
            setReminders(req, res);
            break;
        }
        default:
    }
}

module.exports = interactiveMessage;