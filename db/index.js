const Cloudant = require('cloudant');
const constants = require('../src/constants');

const { env: { CLOUDANT_URL, CLOUDANT_DB, VCAP_SERVICES } } = process;

let cloudant = null;
let cloudantDB = null;

const db = {
    DOC: null,
    getCloudant: () => {
        if (!cloudant) {
            cloudant = Cloudant({ vcapServices: JSON.parse(VCAP_SERVICES), plugins: 'promises' });
        }
        return cloudant;
    },
    getDB: () => {
        if (!cloudantDB) {
            cloudantDB = db.getCloudant().db.use(CLOUDANT_DB);
        }
        return cloudantDB;
    },
    getDOC: () => {
        return new Promise((resolve, reject) => {
            if (db.DOC) {
                resolve(db.DOC);
            } else {
                db.getDB().get(constants.db.DOC, (err, data) => {
                    if (err) {
                        reject(err, data);
                    } else {
                        db.DOC = data;
                        resolve(db.DOC);
                    }
                });
            }
        })
    },
    insert: (onInsert, onRevert) => {
        db.getDOC().then(doc => {
            doc = onInsert(doc);
            db.getDB().insert(doc, (err, data) => {
                if (data && data.rev) {
                    doc._rev = data.rev;
                }
                if (err) {
                    doc = onRevert(doc);
                    console.log('DB INSERT ERROR', err);
                } else {
                    console.log('DB INSERT OK');
                }
            });
        });
    },
    updateDOC: (key, data) => {
        return db.getDOC(key).then(doc => {
            let newDoc = Object.assign({}, doc, data);
            return db.getDB().insert(newDoc, (err, data) => {
                if (data && data.rev) {
                    newDoc._rev = data.rev;
                }
                if (err) {
                    newDoc = doc;
                    console.log('DB INSERT ERROR', err);
                } else {
                    console.log('DB INSERT OK');
                }
                return db.docs.setDoc(key, newDoc);
            });
        });
    }
}

module.exports = db;