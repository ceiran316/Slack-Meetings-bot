const _ = require('underscore');
const web = require('../webClient');

const usersStore = {};

const Users = {
  has: userId => !!usersStore[userId],
  getUser: async userId => {
    const user = usersStore[userId];
    if(!Users.has(userId)) {
      const { profile } = await web.users.profile.get({ user : userId});
      usersStore[userId] = { ...profile, userId, name: profile.real_name };
    }
    console.log('Users getUser', usersStore[userId]);
    // TEMP FIX - As my email address doesn't return for some reason.
    if (userId === 'UDW87UF6U') {
      usersStore[userId].email = 'holmes.william@gmail.com';
    }
    // ***
    return usersStore[userId];
  },
  getKeys: async (userId, ...keys) => {
    const user = await Users.getUser(userId);
    return _.pick(user, keys);
  }
}

module.exports = Users;