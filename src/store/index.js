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
    const values = await this.get(key);
    console.log('store set values', values);
    let newValue;
    if (_.isArray(values)) {
      newValue = _.chain([values, val]).compact().flatten().value()
    } else {
      newValue = val;
    }
    return await this.storage.setItem(key, newValue);
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
