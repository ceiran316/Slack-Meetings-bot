const _ = require('underscore');
const queryStrings = require('query-string');

const { snoozeSelection, createButtons } = require('./interactive')

const interactiveMessage = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received interactiveMessage body', body);
    const payload = JSON.parse(body.payload);

    const { callback_id } = payload;

    switch(callback_id) {
        case 'create_buttons': {
            createButtons(req, res);
            break;
        }
        case 'update_buttons': {
            createButtons(req, res);
            break;
        }
        case 'delete_buttons': {
            createButtons(req, res);
            break;
        }
        case 'read_buttons': {
            createButtons(req, res);
            break;
        }
        default:
    }
}

module.exports = interactiveMessage;