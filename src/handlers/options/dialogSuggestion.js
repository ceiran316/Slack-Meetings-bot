const _ = require('underscore');
const queryStrings = require('query-string');
const moment = require('moment');
const { Meetings } = require('../../utils');

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const startsWith = (str1 = '', str2 = '') => String(str1).toLocaleLowerCase().startsWith(String(str2).toLocaleLowerCase())

const filterOptions = (data, value) => _.filter(data, ({ label }) => {
  return !value || startsWith(label, value);
})

const isValidStartTime = () => {
  const quarterHours = ['00', '15', '30', '45'];
  const times = [];
  for (var i = 0; i < 24; i++) {
    for (var j = 0; j < 4; j++) {
      const value = `${i}:${quarterHours[j]}`;
      times.push({ label: value, value });
    }
  }
  return times;
}

const isValidDay = () => {
  return _.times(31, day => ({ label: (day + 1), value: (day + 1) }));
}

const isValidMonth = (val = '') => {
  return _.some(months, month => {
    return (month.toLowerCase().startsWith(String(val).toLowerCase()))
  });
}

const dialogSuggestions = (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  const payload = JSON.parse(body.payload);
  console.log('dialogSuggestions - Received OPTIONS PAYLOAD', payload);
  const { name, value = '', callback_id } = payload;

  switch (callback_id) {
    case 'create_meeting': {
      console.log('dialogSuggestions create_meeting');
    }
    case 'set_meeting_reminder': {
      console.log('dialogSuggestions set_meeting_reminder');
    }
    default: {
      res.send();
    }
  }
};

module.exports = dialogSuggestions;