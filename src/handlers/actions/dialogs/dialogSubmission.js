const isEmail = require('isemail');
const queryStrings = require('query-string');

const web = require('../../../webClient');

const Meetings = require('../../../utils/meetings');

const nodemailer = require('nodemailer');
const ics = require('ics');
const { createReadStream, writeFileSync } = require('fs');

const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

let res;

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
        
        const sendEmail = () => {
          var transporter = nodemailer.createTransport({
             service: 'gmail',
             auth: {
                    user: EMAIL_ADDRESS,
                    pass: EMAIL_PASSWORD
                }
            });

          ics.createEvent({
            title: meetingObject.name,
            description: meetingObject.description,
            start: [meetingObject.year, 4, meetingObject.day, meetingObject.time.hour-1, meetingObject.time.minutes],
            duration: { minutes: meetingObject.duration }
            // title: name,
            // description: description,
            // text: 'Location: ' + room,
            // start: [year, month, day, hourF + hourL, minuteF + minuteL],
            // duration: { minutes: duration }
          }, (error, value) => {
            if (error) {
              console.log(error)
            }
            res = value;
          //writeFileSync(`${__dirname}/event.ics`, value)
        })

          const mailOptions = {
            from: EMAIL_ADDRESS, // sender address
            to: ['ceiran316@gmail.com','ceiran316@live.com'], //'ceiran316@gmail.com', // list of receivers
            //bcc: ['ceiran316@gmail.com', 'antonevyou@gmail.com'],
            subject: 'Meeting', // Subject line
            html: '<p>slack-meetings-bot</p>',
            icalEvent: {
              filename: 'event.ics',
              method: 'request',
              content: res
            }
          };
          transporter.sendMail(mailOptions, function (err, info) {
             if(err)
               console.log('SEND MAILERROR', err)
             else
               console.log('SENT MAIL', info);
          });
        }

        sendEmail();
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