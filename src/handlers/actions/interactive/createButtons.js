const queryStrings = require('query-string');
const moment = require('moment');
const _ = require('underscore');
const web = require('../../../webClient');
const { Meetings } = require('../../../utils');

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const locations = ['Demo Room', 'Board Room', 'Training Room', 'Seminar Room', 'Conference Room'];
const durations = [15, 30, 45, 60, 90, 120];

const getMonths = () => {
  return months.map((month, index) => ({ label: month, value: (index + 1) }));
}

const getStartTimes = () => {
  const quarterHours = ['00', '15', '30', '45'];
  const times = [];
  for (var i = 0; i < 24; i++) {
    for (var j = 0; j < 4; j++) {
      const label = `${i}:${quarterHours[j]}`;
      const value = `${String(i).padStart(2, '0')}:${quarterHours[j]}`;
      times.push({ label, value });
    }
  }
  return times;
}

const getDays = () => {
  return _.times(31, day => ({ label: (day + 1), value: (day + 1) }));
}

const getYears = () => {
  const thisYear = (new Date()).getUTCFullYear();
  const nextYear = thisYear + 1;
  return [{
    label: thisYear,
    value: thisYear
  }, {
    label: nextYear,
    value: nextYear
  }];
}

const getLocations = () => {
  return locations.map(location => ({ label: location, value: location }))
}

const getDurations = () => {
  return durations.map(duration => ({ label: `${duration} mins`, value: duration }))
}

const buttonsTest = (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  console.log('Received buttonsTest body', body);
  const payload = JSON.parse(body.payload);

  const {
    user: { id: userId },
    actions: [action],
    channel: { id: channel },
    message_ts: ts,
    trigger_id
  } = payload;
  res.send({
    'response_type': 'ephemeral',
    'text': '',
    'replace_original': true,
    'delete_original': true
  });

  switch (action.value) {
    case 'yes_create_meeting': {
      web.dialog.open({
        trigger_id,
        dialog: {
          callback_id: 'create_meeting',
          title: 'Create Meeting',
          submit_label: 'Send',
          notify_on_cancel: true,
          state: JSON.stringify({}),
          elements: [{
            label: 'Meeting Name',
            name: 'name',
            placeholder: 'Choose meeting name',
            type: 'text',
            hint: 'eg. Project Briefing/Demo'
          }, {
            label: 'Location',
            name: 'room',
            placeholder: 'Choose location',
            type: 'select',
            options: getLocations()
          }, {
            label: 'Day',
            name: 'day',
            value: moment().format('D'),
            type: 'select',
            options: getDays()
          }, {
            label: 'Month',
            name: 'month',
            value: moment().format('M'),
            type: 'select',
            options: getMonths()
          }, {
            label: 'Year',
            name: 'year',
            value: (new Date()).getUTCFullYear(),
            type: 'select',
            options: getYears()
          }, {
            label: 'Start Time',
            name: 'start',
            value: Meetings.getClosestStartTime(),
            type: 'select',
            options: getStartTimes()
          }, {
            label: 'Meeting Duration',
            name: 'duration',
            value: '60',
            type: 'select',
            options: getDurations()
          }, {
            label: 'Details',
            name: 'description',
            optional: true,
            type: 'textarea',
            hint: 'Meeting notes, Pizza/cake after'
          }]
        }
      });
      break;
    }
    case 'no': {
      break;
    }
    default:
  }
}

module.exports = buttonsTest;