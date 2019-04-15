
const _ = require('underscore');
const moment = require('moment');

const web = require('../webClient');

const store = require('../store')('reminders');

const Reminders= {
  add: async (data, post_at) => {
    await web.chat.scheduleMessage(data).then(({ channel, scheduled_message_id, message }) => {
      console.log('Reminders add', data);
      const { user } = data;
      store.set(user, { ...data, scheduled_message_id, message });
    }).catch(console.error);
  },
  get: async ({ user, scheduled_message_id, channel }) => {
    //TODO: Flatten Array
    const allSchedules = await store.get(user);
    console.log('schedules get', allSchedules);
    return _.where(allSchedules, { scheduled_message_id, channel });
    // return _.chain(allSchedules)
    //   .filter(({ ts }) => {
    //     if(moment().diff(moment(ts))) {
    //       Reminders.remove({ user, scheduled_message_id, channel });
    //       return false;
    //     }
    //     return true;
    //   })
    //   _.where({ scheduled_message_id, channel })
    //   .value();
  },
  getAll: async ({ user, channel }) => {
    //TODO: Flatten Array
    const allSchedules = await store.get(user);
    console.log('schedules get', allSchedules);
    return _.where(allSchedules, { channel });
  },
  remove: async ({ user, channel, scheduled_message_id }) => {
    console.log('remove', user, channel, scheduled_message_id);
    await web.chat.deleteScheduledMessage({ user, channel, scheduled_message_id }).catch(console.error);
    store.remove(user);
  },
  clear: async ({ user, channel }) => {
    console.log('clear', user, channel);
    const reminders = await Reminders.getAll({ user, channel });
    console.log('clear reminders', reminders);
    reminders.forEach(Reminders.remove);
  }
}

module.exports = Reminders;