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
          attachments: [{
            title: `<@${user}> has created a Meeting Event`,
            callback_id: 'meeting_accept_buttons',
            color: '#3AA3E3',
            attachment_type: 'default',
            text: Meetings.getNewMeetingText(meetingObject),
            //thumb_url: 'https://img.icons8.com/office/80/000000/overtime.png',
            thumb_url: `https://calendar.google.com/googlecalendar/images/favicon_v2014_${day}.ico`,
            actions: [{
                name: 'accept',
                value: 'the_meeting_id',
                style: 'primary',
                text: 'Accept',
                type: 'button'                      
            }, {
                name: 'decline',
                value: 'the_meeting_id',
                text: 'Decline',
                type: 'button',
                style: 'danger',
            }]
        }]
        });

        break;
      }
      default:
        
    }
  };

module.exports = dialogSubmission;