const isEmail = require('isemail');
const queryStrings = require('query-string');

const web = require('../../../webClient');

const Meetings = require('../../../utils/meetings');

const dialogSubmission = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    const payload = JSON.parse(body.payload);
    const { callback_id } = payload;
  
    console.log('TCL: dialogSubmission -> callback_id', callback_id);
    
    switch(callback_id) {
      case 'meeting': {
        const { channel: { id: channel }, message_ts: ts, user: { id: user }, submission: { email = '' }, submission } = payload;
        
        /*if (!isEmail.validate(email)) {
          return res.send({
            errors: [{
              name: 'email',
              error: "Invalid Email Address"
            }]
            
          });
          break;
        }*/
        
        const {
          name,
          room: location,
          duration,
          description,
          day,
          month,
          start: [hourF, hourL, semi, minuteF, minuteL],
          year = (new Date().getUTCFullYear())
        } = submission;
        
        res.send();
        
        const meetingObject = {
          name,
          location,
          day: Meetings.getDay(day),
          ordinal: Meetings.getOrdinal(day),
          month: Meetings.getMonth(month),
          year,
          time: {
            hour: `${hourF}${hourL}`,
            minutes: `${minuteF}${minuteL}`,
          },
          duration,
          description
        };
        
        web.chat.postMessage({
          channel,
          text: Meetings.getNewMeetingText(meetingObject)
        });

        break;
      }
      default:
        
    }
  };

module.exports = dialogSubmission;