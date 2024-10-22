const queue = {};
const history = {};
const expired = [];
const log = [];

function logAction(action, item, collection) {
  log.push(`${action} ${item} to/from ${collection}`);
}

const queueProxy = new Proxy(queue, {
  set(target, property, value) {
    logAction("Added", value, "queue");
    target[property] = value;
    return true;
  },
  deleteProperty(target, property) {
    logAction("Removed", target[property], "queue");
    delete target[property];
    return true;
  },
});

const historyProxy = new Proxy(history, {
  set(target, property, value) {
    logAction("Added", value, "history");
    target[property] = value;
    return true;
  },
  deleteProperty(target, property) {
    logAction("Removed", target[property], "history");
    delete target[property];
    return true;
  },
});

const expiredProxy = new Proxy(expired, {
  set(target, property, value) {
    logAction("Added", value, "expired");
    target[property] = value;
    return true;
  },
  deleteProperty(target, property) {
    logAction("Removed", target[property], "expired");
    target.splice(property, 1);
    return true;
  },
});

module.exports = {
  queue: queueProxy,
  history: historyProxy,
  expired: expiredProxy,
  log,
};
