const queryStrings = require('query-string');
const { uuidv1 } = require('uuid/v1');
const moment = require('moment');
const _ = require('underscore');
const web = require('../../../webClient');
const { Reminders, Email, Meetings, Users } = require('../../../utils');
const nodemailer = require('nodemailer');
const ics = require('ics');

const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

let res;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const isValidMonth = (day, month, year) => {
  return moment(`${year}-${month}-${day}`).isSameOrAfter(moment().add(1, 'hour').format('YYYY-MM-DD'))
}

const isValidDay = (days, month, year) => {
  const num = new Date(year, month, 0).getDate();
  return (days > 0 && days <= num);
}

const isValidTime = (start, day, month, year) => {
  return moment(`${year}-${month}-${day} ${start}`).isAfter(moment().add(1, 'hour').format('YYYY-MM-DD HH:mm'));
}

const isValidSubmission = submission => {
  const { month, day, year, start } = submission;
  const errors = [];
  if (!isValidMonth(day, month, year)) {
    errors.push({
      name: 'month',
      error: `Day and Month seem to be in the past 👈`
    });
  }
  if (!isValidDay(day, month, year)) {
    errors.push({
      name: 'day',
      error: `${months[month - 1]} doesn't have ${day} days 👎`
    });
  }
  if (!isValidTime(start, day, month, year)) {
    errors.push({
      name: 'start',
      error: `Start Time, Day and Month seem to be in the past 👈`
    });
  }
  return errors;
}

const dialogSubmission = async (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  const payload = JSON.parse(body.payload);
  const { state, submission, channel: { id: channel }, user: { id: user }, message_ts: ts, callback_id, actions: [action] = [] } = payload;

  console.log('TCL: dialogSubmission -> callback_id', callback_id);

  switch (callback_id) {
    case 'create_meeting': {
      const errors = isValidSubmission(submission);
      if (!_.isEmpty(errors)) {
        res.send({ errors });
        break;
      }
      res.send();

      const organizer = await Users.getKeys(user, 'name', 'email');
      const meetingObject = await Meetings.createObject(user, submission, organizer);
      const { id: meetingId, template, name } = meetingObject;

      await web.chat.postMessage({ channel, ...template });
      await Meetings.addInvite(meetingId, channel);
      await Meetings.sendMeetingInvite(meetingId, user);

      web.chat.postEphemeral({
        user,
        channel,
        response_type: 'in_channel',
        attachments: [{
          text: `⏰ Would you like to \`set\` a reminder for *${name}*?`,
          callback_id: 'set_reminder_button',
          color: '#3AA3E3',
          attachment_type: 'default',
          actions: [{
            name: 'set_meeting_reminder',
            value: meetingId,
            style: 'primary',
            text: 'Set Reminder',
            type: 'button'
          }, {
            name: 'view_all_meetings',
            value: user,
            text: 'View All Meetings',
            type: 'button'
          }]
        }]
      })
      break;
    }
    case 'set_meeting_reminder': {
      const { reminder_label, reminder_time } = submission;
      const meeting = await Meetings.get(state);
      const { id: meetingId, day, month, year, time: { hour, minutes } } = meeting;
      const response = await Reminders.add({ user, channel, meetingId: state, reminderName: reminder_label, reminderTime: reminder_time });
      web.chat.postEphemeral(response).catch(console.error);
      res.send();
      break;
    }
    case 'edit_meeting_reminder': {
      const { scheduled_message_id, user, channel, meetingId } = JSON.parse(state);
      const { reminder_label: reminderName, reminder_time: reminderTime } = submission;
      const response = await Reminders.update({ scheduled_message_id, user, channel, reminderName, reminderTime, meetingId });
      web.chat.postEphemeral(response).catch(console.error);
      res.send();
      break;
    }
    default:
      res.send();
  }
};

module.exports = dialogSubmission;