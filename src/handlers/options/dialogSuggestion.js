const _ = require('underscore');
const queryStrings = require('query-string');

const startsWith = (str1, str2) => str1.toLocaleLowerCase().startsWith(str2.toLocaleLowerCase())

const filterOptions = (data, value) => _.filter(data, ({ options }) => {
  return !value || _.some(options, ({ label }) => startsWith(label, value));
})

const dialogSuggestions = (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  console.log('Received ACTIONS CALLBACK', body);
  const payload = JSON.parse(body.payload);
  const { callback_id } = payload;

  switch(callback_id) {
    case 'meeting': {
      const { name, value = '' } = payload;
      if (_.isEqual(name, 'room')) {
        const option_groups = filterOptions([{
              label: 'Available',
              options: [{
              label: 'Demo Room',
              value: 'Demo Room'
            },{
            label: 'Board Room',
              value: 'Board Room'
            },{
            label: 'Training Room',
              value: 'Rraining Room'
            },{
            label: 'Seminar Room',
              value: 'Seminar Room'
            },{
            label: 'Conference Room',
              value: 'Conference Room'
            }]
          }], value);
        return res.send({ option_groups });
      }
      else if (_.isEqual(name, 'duration')) {
        const option_groups = filterOptions([{
              label: 'Length of meeting',
              options: [{
              label: '15 mins',
              value: '15'
            },{
            label: '30 mins',
              value: '30'
            },{
            label: '45 mins',
              value: '45'
            },{
            label: '60 mins',
              value: '60'
            },{
            label: '90 mins',
              value: '90'
            },{
            label: '120 mins',
              value: '120'
            }]
          }], value);
        return res.send({ option_groups });
      }
    }
    default: {
      res.send();
    }
  }
};

module.exports = dialogSuggestions;