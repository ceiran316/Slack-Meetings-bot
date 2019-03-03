const isEmail = require('isemail');
const queryStrings = require('query-string');

const web = require('../../../webClient');

const dialogSubmission = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    const payload = JSON.parse(body.payload);
    const { callback_id } = payload;
  


    console.log('TCL: dialogSubmission -> callback_id', callback_id);

    

    switch(callback_id) {
      case 'meeting': {
        const { channel: { id: channel }, user: { id: user }, submission: { email = '' }, submission } = payload;
        /*if (!isEmail.validate(email)) {
          return res.send({
            errors: [{
              name: 'email',
              error: "Invalid Email Address"
            }]
            
          });
          break;
        }*/
        web.chat.postEphemeral({ user, channel, text: JSON.stringify(submission) }).catch(console.error);
        
        
        console.log("meeting name: ", submission.name);
        console.log("location: ", submission.room);
        console.log("date: ", submission.date[0],submission.date[1],submission.date[2],submission.date[3],submission.date[4]);
        console.log("time: ", submission.start[0],submission.start[1],submission.start[2],submission.start[3],submission.start[4]);
        console.log("duration: ", submission.duration);
        console.log("details: ", submission.description);
        console.log("manager: ", submission.manager);
        res.send();
        break;
      }
      default:
        
    }
  };

  module.exports = dialogSubmission;