const queryStrings = require('query-string');

const dialogSuggestion = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    const payload = JSON.parse(body.payload);
    const { callback_id } = payload;

    console.log('dialogSuggestion -> callback_id', callback_id);

    res.send();

    switch(callback_id) {
        // case 'meeting': {
        //   const { name } = payload;
        //   console.log('NAME', name);
        //   if (location === 'Demo Room') {
        //     return res.send({
        //       errors: [{
        //         name: 'room',
        //         error: "Room not available"
        //       }]

        //     });
        //     break;
        //   }
        
        // res.send();
        // }
      default:
    }
  };

  module.exports = dialogSuggestion;