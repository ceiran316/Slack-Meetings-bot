const _ = require('underscore');
const queryStrings = require('query-string');

const startsWith = (str1 = '', str2 = '') => String(str1).toLocaleLowerCase().startsWith(String(str2).toLocaleLowerCase())

const filterOptions = (data, value) => _.filter(data, ({ label }) => {
  return !value || startsWith(label, value);
})

const dialogSuggestions = (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  const payload = JSON.parse(body.payload);
  console.log('dialogSuggestions - Received OPTIONS PAYLOAD', payload);
  const { callback_id } = payload;

  switch(callback_id) {
    case 'meeting': {
      const { name, value = '' } = payload;
      if (_.isEqual(name, 'room')) {
        const option_groups = [{
          label: 'Available',
          options: filterOptions([{
              label: 'Demo Room',
              value: 'Demo Room'
            },{
            label: 'Board Room',
              value: 'Board Room'
            },{
            label: 'Training Room',
              value: 'Training Room'
            },{
            label: 'Seminar Room',
              value: 'Seminar Room'
            },{
            label: 'Conference Room',
              value: 'Conference Room'
          }], value)
        }];
        return res.send({ option_groups });
      }
      else if (_.isEqual(name, 'duration')) {
          const option_groups = [{
              label: 'Length of meeting',
              options: filterOptions ([{
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
          }], value)
        }];
        return res.send({ option_groups });
      }
      if (_.isEqual(name, 'year')) {
        const thisYear = (new Date()).getUTCFullYear();
        const nextYear = thisYear + 1;
        const option_groups = [{
          label: 'Year',
          options: filterOptions([{
            label: thisYear,
            value: thisYear
            },{
              label: nextYear,
              value: nextYear
            }], 
          value)
        }];

        return res.send({ option_groups });
      }
    }
    
    default: {
      res.send();
    }
  }
};

module.exports = dialogSuggestions;