const uuidv1 = require('uuid/v1');
const ics = require('ics');
const _ = require('underscore');

const Email = require('./email');
const Users = require('./users');

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const meetingsStore = {};
const store = require('../store')('meetings');

const Meetings = {
  createEvent: meeting => {
    const { id: uid, name: title, location, description, year, day, month, time: { hour, minutes }, duration, organizer } = meeting;
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
    };
    
    const data =  {
      ...meeting,
      event: Meetings.createEvent(meeting),
      template: Meetings.createTemplate(meeting)
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
  
  createTemplate: meeting => {
    const {
      name,
      location,
      day,
      ordinal,
      monthName,
      year,
      time: {
        hour,
        minutes,
      },
      duration: { minutes: durationMinutes },
      description
    } = meeting;

    let template = `*${name}*\n:round_pushpin:\t${location}\n:spiral_calendar_pad:\t${day}${ordinal} ${monthName} ${year}\n:clock3:\t${hour}:${minutes}\n:hourglass_flowing_sand:\t${durationMinutes}`;
    if (description) {
      template += `\n:memo:\t${description}`
    }
    console.log('createTemplate', template);
    return template;
  },
  hasParticipant: async (meetingId, userId) => {
    const meeting = await Meetings.get(meetingId);
    console.log('hasParticipant', meeting);
    return _.contains({ ...meeting }.participants, userId);
  },
  addParticipant: async (meetingId, userId) => {
    const meeting = await store.get(meetingId);
    meeting.participants = _.union(meeting.participants, [userId]);
    store.set(meetingId, meeting);
  },
  removeParticipant: async (meetingId, userId) => {
    console.log('removeParticipant', meetingId, userId);
    const meeting = await store.get(meetingId);
    meeting.participants = _.without(meeting.participants, userId);
    console.log('removeParticipant meeting', meeting);
    await store.set(meetingId, meeting);
  },
  
  sendMeetingInvite: async (meetingId, userId) => {
      //TODO: This should only be done on the accept button, only here for testing/ as we dont save the meeting Id to DB yet.
    const meeting = await store.get(meetingId);
    const { email } = await Users.getKeys(userId, 'email');
    console.log('sendMeetingInvite meeting', userId, email, meeting);

    if(email && meeting) {
      Email.send({
        to: [email, 'ceiran316@gmail.com'], //'ceiran316@gmail.com','ceiran316@live.com'// list of receivers
        subject: `Meeting Invite: ${meeting.name}`, // Subject line
        html: `<p>${meeting.description}</p>`,
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
    const meeting = await store.get(meetingId);
    return meeting;
  },
  getAll: async user => {
    const allMeetings = await store.getAll();
    console.log('getAll allMeetings', user, allMeetings);
    const userMeetings = allMeetings.filter(({ participants }) => _.contains(participants, user));
    console.log('getAll Users meetings', userMeetings);
    return userMeetings;
  },
  remove: async meetingId => {
    await store.remove(meetingId);
  },
  clear: async () => {
    await store.clear();
  }
}

module.exports = Meetings;