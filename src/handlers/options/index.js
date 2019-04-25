const queryStrings = require('query-string');

const dialogSuggestion = require('./dialogSuggestion')

const options = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received OPTIONS CALLBACK', body);
    const payload = JSON.parse(body.payload);
    const { type } = payload;
    console.log('OPTIONS type', type);
    switch(type) {
        case 'dialog_suggestion': {
            return dialogSuggestion(req, res);
        }
        default:
    }
};

module.exports = options;