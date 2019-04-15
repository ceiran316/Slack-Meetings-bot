const isEmail = require('isemail');
const queryStrings = require('query-string');
const { uuidv1 } = require('uuid/v1');

const web = require('../../../webClient');

const { Email, Meetings, Users } = require('../../../utils');

const nodemailer = require('nodemailer');
const ics = require('ics');

const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

let res;

const dialogSubmission = async (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    const payload = JSON.parse(body.payload);
    const { callback_id } = payload;

    console.log('TCL: dialogSubmission -> callback_id', callback_id);
    
    switch(callback_id) {
      case 'meeting': {
        const { channel: { id: channel }, message_ts: ts, user: { id: userId }, submission } = payload;
        
        res.send(); 
        
        const organizer = await Users.getKeys(userId, 'name', 'email');
        
        console.log('Meeting organizer', organizer);

        const meetingObject = await Meetings.createObject(userId, submission, organizer);

        const { id: meetingId, day, template } = meetingObject;
        
        web.chat.postMessage({
          channel,
          attachments: [{
            title: `<@${userId}> has created a Meeting Event`,
            callback_id: 'meeting_accept_buttons',
            color: '#3AA3E3',
            attachment_type: 'default',
            text: template,
            thumb_url: 'https://img.icons8.com/office/80/000000/overtime.png',
            footer_icon: `https://calendar.google.com/googlecalendar/images/favicon_v2014_${day}.ico`,
            footer: 'Add to Calendar',
            // thumb_url: `https://calendar.google.com/googlecalendar/images/favicon_v2014_${meetingObject.day}.ico`,
            actions: [{
                name: 'accept',
                value: `${meetingId}`,
                style: 'primary',
                text: 'Accept',
                type: 'button'                      
            }, {
                name: 'decline',
                value: `${meetingId}`,
                text: 'Decline',
                type: 'button',
                style: 'danger',
            }]
          }]
        });
        
        Meetings.sendMeetingInvite(meetingId, userId);
        
        break;
      }
      default:
        
    }
  };

module.exports = dialogSubmission;