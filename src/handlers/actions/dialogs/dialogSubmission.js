const isEmail = require('isemail');
const queryStrings = require('query-string');
const uuidv4 = require("uuid/v4");

const web = require('../../../webClient');
const Meetings = require('../../../utils/meetings');
const API = require('../../../api');



const dialogSubmission = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    const payload = JSON.parse(body.payload);
    const { callback_id } = payload;
  
    console.log('TCL: dialogSubmission -> callback_id', callback_id);
    
    switch(callback_id) {
      case 'meeting': {
        const { channel: { id: channel }, message_ts: ts, user: { id: createBy }, submission: { email = '' }, submission } = payload;
        
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
          id: uuidv4(),
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
          description,
          createBy
        };
        
        API.meetings.create(meetingObject).then(() => {
          web.chat.postMessage({
            channel,
            text: Meetings.getNewMeetingText(meetingObject)
          });
        }).catch(err => {
          console.log('DB ERROR', err);
          web.chat.postMessage({
            channel,
            text: err
          });
        })

        web.chat.postMessage({
          channel,
          attachments: [{
            title: 'Meeting Request',
            callback_id: 'create_buttons',
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: [{
                name: 'decision',
                value: 'yes',
                style: 'primary',
                text: 'Interested',
                type: 'button'                      
            }, {
                name: 'decision',
                value: 'no',
                text: 'Decline',
                type: 'button',
                style: 'danger',
            }]
        }]
        })
       

        break;
      }
      default:
        
    }
  };

module.exports = dialogSubmission;