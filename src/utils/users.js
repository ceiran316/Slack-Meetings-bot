const _ = require('underscore');
const web = require('../webClient');

const usersStore = {};
const store = require('../store')('users');

const Users = {
  has: async userId => {
    let user = await store.get(userId);
    return _.isEmpty(user);
  },
  getUser: async userId => {
    let user = await store.get(userId);
    console.log('getUser user', user);
    if(!user) {
      const { profile } = await web.users.profile.get({ user : userId});
      user = { ...profile, userId, name: profile.real_name };
      // TEMP FIX - As williams email address doesn't return for some reason.
      if (userId === 'UDW87UF6U') {
        user.email = 'holmes.william@gmail.com';
      }
      // ********************************************************************
      await store.set(userId, user);
    }
    return user;
  },
  getKeys: async (userId, ...keys) => {
    return _.pick(await Users.getUser(userId), keys);
  },
  getAll: async () => {
    const allUsers = await store.getAll();
    return allUsers;
  },
  clear: async () => {
    await store.clear();
  }
}

module.exports = Users;