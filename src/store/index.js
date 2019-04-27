const storage = require('node-persist');
const _ = require('underscore');

class Store {
  constructor(key) {
    this.storage = storage.create({
      dir: `./storage/${key}`,
      stringify: JSON.stringify,
      parse: JSON.parse,
      encoding: 'utf8',
      logging: true
    });
    this.storage.init();
  }

  async has(key) {
    const has = await this.get(key);
    return !!has;
  }

  async get(key) {
    const item = await this.storage.getItem(key);
    return item;
  }

  async set(key, val) {
    console.log('store set', key, val);
    return await this.storage.setItem(key, val);
  }

  async update(key, val) {
    const values = await this.get(key);
    let newValue;

    if (_.isArray(val)) {
      newValue = _.chain([values, val]).compact().flatten().value()
    } else {
      newValue = { ...values, ...val };
    }
    return this.set(key, newValue);
  }

  async remove(key) {
    return await this.storage.removeItem(key);
  }

  async getAll() {
    const values = await this.storage.values();
    return values;
  }

  async clear() {
    return await this.storage.clear();
  }

  async valuesWithKeyMatch(key) {
    const values = await this.storage.valuesWithKeyMatch(key);
    return values;
  }
}

const stores = {};

module.exports = key => {
  if (!stores[key]) {
    stores[key] = new Store(key);
  }
  return stores[key];
}
