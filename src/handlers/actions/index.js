const queryStrings = require('query-string');

const { dialogSubmission, dialogSuggestion } = require('./dialogs');
const interactiveMessage = require('./interactiveMessage');
const messageAction = require('./messageAction');
const blockActions = require('./blockActions');

const web = require('../../webClient');

const actions = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('Received ACTIONS CALLBACK', body);
    const payload = JSON.parse(body.payload);
    const { type, state } = payload;

    console.log('TCL: actions -> type', type);

    switch(type) {
        case 'interactive_message': {
            return interactiveMessage(req, res);
        }
        case 'message_action' : {
            return messageAction(req, res);
        }
        case 'dialog_suggestion': {
            return dialogSuggestion(req, res);
        }
        case 'dialog_submission': {
            return dialogSubmission(req, res);
        }
        case 'block_actions': {
          return blockActions(req, res);
        }
        default: {
            res.send();
        }
    }
  };

  module.exports = actions;