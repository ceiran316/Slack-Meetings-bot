const uuidv1 = require('uuid/v1');
const ics = require('ics');
const _ = require('underscore');
const moment = require('moment');

const Email = require('./email');
const Users = require('./users');

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const meetingsStore = {};
const store = require('../store')('meetings');

const Meetings = {
  getClosestStartTime: () => {
    const time = 1000 * 60 * 60;
    const date = new Date();
    const rounded = new Date(date.getTime() + time - (date.getTime() % time))
    return moment(rounded).add(1, 'hour').format('HH:mm');
  },
  createEvent: meeting => {
    const { id: uid, name: title = 'Meeting Invitationholmes', location, description = 'Meeting Invite', year, day, month, time: { hour, minutes }, duration, organizer } = meeting;
    console.log('createEvent', organizer);
    const { err, value } = ics.createEvent({
        uid,
        title,
        location,
        description,
        start: [year, month, day, hour-1, parseInt(minutes)],
        duration,
        organizer
    });
    if (err) {
      console.log('ERROR Meetings createEvent', err);
    }
    console.log('Meetings createEvent', value);
    return value;
  },
  
  createObject: async (userId, details, organizer) => {
    const {
      name,
      room: location,
      duration,
      description,
      day,
      month,
      start: [hourF = 0, hourL = 0, semi = ':', minuteF = 0, minuteL = 0],
      year = (new Date().getUTCFullYear()),
    } = details;
    
    const monthName = Meetings.getMonthName(month);

    const meeting = {
        id: uuidv1(),
        name,
        location,
        day: Meetings.getDay(day),
        ordinal: Meetings.getOrdinal(day),
        monthName,
        month: Meetings.getMonth(monthName),
        year: parseInt(year, 10),
        time: {
          hour: parseInt(`${hourF}${hourL}`, 10),
          minutes: `${minuteF}${minuteL}`,
        },
        organizer,
        host: userId,
        duration: { minutes: parseInt(duration, 10) },
        description,
        participants: [userId],
        invites: [userId],
        decline: []
    };
    
    const order = moment(`${meeting.year}-${meeting.month}-${meeting.day} ${meeting.time.hour}:${meeting.time.minutes}`).valueOf();

    const data =  {
      ...meeting,
      order,
      event: Meetings.createEvent(meeting),
      template: Meetings.createTemplate(userId, meeting)
    };

    await store.set(meeting.id, data);
    
    return data;
  },
  
  getMonth: month => (months.indexOf(month) + 1),
  
  getMonthName: val => {
    let monthAlpha;
    let monthNum;
      months.forEach(month => {
         if (/[0-9]/.test(val)) {
          monthAlpha = months[val - 1];
         } else if (month.toLowerCase().startsWith(val.toLowerCase())) {
          monthAlpha = month;
         }
     });
     return (monthAlpha || 'Invalid Month');
  },
  
  getDay: day => parseInt((day[0] == 0) ? day[1] : day, 10),
  
  getOrdinal: dayStr => {
    const day = parseInt(dayStr, 10);
    let ordInd;
    if (day > 3 && day < 21) {
        ordInd ='th';
        return ordInd;
    }
      switch (day % 10) {
          case 1:  {
            ordInd ='st'; 
            return ordInd;
          }
          case 2:  {
            ordInd ='nd'; 
            return ordInd;
          }
          case 3:  {
            ordInd ='rd'; 
            return ordInd;
          }
          default: {
            ordInd ='th'; 
            return ordInd;
          }
      }
  },
  
  createTemplate: (user, meeting) => {
    const {
      id: meetingId,
      name,
      location,
      day,
      ordinal,
      month,
      monthName,
      year,
      time: {
        hour,
        minutes,
      },
      duration: { minutes: durationMinutes },
      description
    } = meeting;
        
    console.log('createTemplate meeting', meeting);
        
    const startFriendlyTime = moment(`${year}-${month}-${day} ${hour}:${parseInt(minutes, 10)}`).format('dddd, MMMM Do YYYY, HH:mm');
    
    const fields = [{
      title: `📅 ${startFriendlyTime}`,
      short: false
    }, {
      title: `📍 ${location}`,
      short: false
    }, {
      title: `🕐 ${durationMinutes} minutes`,
      short: false
    }];
    
    if(!_.isEmpty(description)) {
      fields.push({
        title: `📝 ${description}`,
        short: false
      });
    }
    
    const template = {
      attachments: [{
        pretext: `<@${user}> has created a Meeting Event`,
        callback_id: 'meeting_accept_buttons',
        color: '#3AA3E3',
        attachment_type: 'default',
        title: name,
        fields,
        thumb_url: 'https://img.icons8.com/office/80/000000/overtime.png',
        footer_icon: `https://calendar.google.com/googlecalendar/images/favicon_v2014_${day}.ico`,
        footer: 'Add to Calendar',
        actions: [{
            name: 'accept_meeting',
            value: `${meetingId}`,
            style: 'primary',
            text: 'Accept',
            type: 'button'                      
        }, {
            name: 'decline_meeting',
            value: `${meetingId}`,
            text: 'Decline',
            type: 'button',
            style: 'danger',
        }, {
            name: 'invite_to_meeting',
            value: `${meetingId}`,
            text: 'Invite Others',
            type: 'button'
        }]
      }]
    };

    return template;
  },
  hasStarted: async (meetingId) => {
    const meeting = await Meetings.get(meetingId);
    const { day, month, year, time: { hour, minutes }, duration: { minutes: durationMinutes } } = meeting;
    return moment(`${year}-${month}-${day} ${hour}:${parseInt(minutes, 10)}`).isBefore(moment().add(1, 'hour'));
  },
  hasEnded: async (meetingId) => {
    const meeting = await Meetings.get(meetingId);
    const { day, month, year, time: { hour, minutes }, duration: { minutes: durationMinutes } } = meeting;
    return moment(`${year}-${month}-${day} ${hour}:${parseInt(minutes, 10)}`).add(durationMinutes, 'minutes').isBefore(moment().add(1, 'hour'));
  },
  hasParticipant: async (meetingId, userId) => {
    const meeting = await Meetings.get(meetingId);
    console.log('hasParticipant', meeting);
    return _.contains({ ...meeting }.participants, userId);
  },
  addParticipant: async (meetingId, userId) => {
    const meeting = await store.get(meetingId);
    meeting.participants = _.union(meeting.participants, [userId]);
    await Meetings.removeDecline(meetingId, userId);
    store.set(meetingId, meeting);
  },
  removeParticipant: async (meetingId, userId) => {
    console.log('removeParticipant', meetingId, userId);
    const meeting = await store.get(meetingId);
    meeting.participants = _.without(meeting.participants, userId);
    meeting.invites = _.without(meeting.invites, userId);
    await store.set(meetingId, meeting);
  },
  
  sendMeetingInvite: async (meetingId, userId) => {
    const meeting = await store.get(meetingId);
    const { real_name: displayName, email } = await Users.getUser(userId);
    console.log('sendMeetingInvite meeting', userId, email, meeting);

    if(email && meeting) {
      Email.send({
        to: [email], // list of receivers
        subject: `Meeting Invite: ${meeting.name}`, // Subject line
        html: `<b>${displayName}</b> has sent you a Meeting Invite</p> <i>(via Slack)</i>`,
        icalEvent: {
          filename: 'event.ics',
          method: 'request',
          content: meeting.event
        }
      }).then(res => {
        console.log('Successfully Sent Email');
      }).catch(err => {
        console.log('ERROR Email Send', err);
      });

      await Meetings.addParticipant(meetingId, userId);

      return true;
    }
    return false;
  },
  get: async meetingId => {
    console.log('get meetingId', meetingId);
    const meeting = await store.get(meetingId);
    console.log('get meeting', meeting);
    return meeting;
  },
  getAll: async user => {
    const allMeetings = await store.getAll();
    const userMeetings = allMeetings.filter(({ participants }) => _.contains(participants, user));
    console.log('userMeetings', userMeetings);
    const meetings = await Promise.all(userMeetings.filter(async ({ id }) => {
      const hasEnded = await Meetings.hasEnded(id);
      const hasStarted = await Meetings.hasStarted(id);
      console.log('hasEnded', hasEnded);
      console.log('hasStarted', hasStarted);
      if (hasEnded) {
        await Meetings.remove(id);
      }
      return !hasEnded;
    }));
    console.log('USER MEERTINGS', meetings);
    return meetings;
  },
  remove: async meetingId => {
    await store.remove(meetingId);
  },
  clear: async () => {
    await store.clear();
  },
  addDecline: async (meetingId, userId) => {
    const meeting = await store.get(meetingId);
    await store.set(meetingId, { ...meeting, decline: _.union(meeting.decline, [userId]) });
  },
  removeDecline: async (meetingId, userId) => {
    const meeting = await store.get(meetingId);
    meeting.decline = _.without(meeting.decline, userId);
    await store.set(meetingId, meeting);
  },
  hasInvite: async (meetingId, id) => {
    const meeting = await store.get(meetingId);
    console.log('meeting.invites', meeting.invites);
    return _.chain([meeting.invites]).flatten().includes(id).value();
  },
  addInvite: async (meetingId, id) => {
    const meeting = await store.get(meetingId);
    await store.set(meetingId, { ...meeting, invites: _.union(meeting.invites, [id]) });
  }
}

module.exports = Meetings;