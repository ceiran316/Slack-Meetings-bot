const queryStrings = require('query-string');
const moment = require('moment');

const web = require('../../webClient');

const { Meetings } = require('../../utils');

const Messages = require('../../messages');

const scheduleStore = require('../../store')('schedule');

const blockActions = async (req, res) => {
  const body = queryStrings.parse(req.body.toString());
  console.log('Received BLOCK ACTIONS', body);
  const payload = JSON.parse(body.payload);
  const { channel: { id: channel }, user: { id: user }, container: { message_ts: ts }, callback_id, actions: [action] } = payload;
  
  console.log(action.action_id, ts);

  switch(action.action_id) {
    case 'no_create_meeting': {
      res.send();
      console.log('remove meeting');
      // res.send({
      //   'response_type': 'ephemeral',
      //   'text': '',
      //   'replace_original': true,
      //   'delete_original': true
      // });
      web.chat.delete({ channel, ts });
      break;
    }
    // case 'yes_create_meeting': {
    //   console.log('OPEN MEETING DIALOG');
    //   const { value } = action;
    //   res.send();
    //   web.chat.delete({ channel, ts }).then(() => {
    //     web.chat.postEphemeral({
    //       channel,
    //       user,
    //       text: moment(value).format("dddd, MMMM Do YYYY")
    //     });
    //   });
    //   break;
    // }
    case 'create_meeting_with_date' : {
      console.log('NEW DATE', action);
      const { selected_date } = action;
      const createMessage = Messages.selectCalendarDate(selected_date);
      res.send();
      web.chat.update({
        ts,
        user,
        channel,
        ...createMessage
      }).catch(console.error);
      break;
    }
    case 'remove_scheduled_message': {
      const { channel, scheduled_message_id } = JSON.parse(action.value);
      res.send();
      await web.chat.deleteScheduledMessage({ channel, scheduled_message_id });
      await scheduleStore.remove(scheduled_message_id);
      break;
    }
    case 'meeting_menu_options': {
      const { selected_option: { value: meetingId, text: { text } } } = action;
      if (text == 'Leave') {
        await Meetings.removeParticipant(meetingId, user);
        // TODO Remove Reminders & Refactor these common function together
        web.chat.postEphemeral({
          user,
          channel,
          response_type: 'in_channel',
          text: `You've successfully \`Left\` this meeting. Goodbye. 👋`
        });
      }
      if (text == 'Delete') {
        web.chat.delete({
          channel,
          user,
          ts
        });
      }
      res.send();
      break;
    }
    default:
  }
};

module.exports = blockActions;