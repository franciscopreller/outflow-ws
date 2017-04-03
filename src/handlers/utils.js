function publish(context, queueName, payload) {
  const pub = context.socket('PUB');
  pub.connect(queueName, () => {
    pub.write(JSON.stringify(payload), 'utf8');
    pub.close();
  });
}

function redisGet(redis, key) {
  return redis.get(key).then((result) => JSON.parse(result));
}

function getUserIdFromSocketId(redis, socketId) {
  return redisGet(redis, `socket.${socketId}.userId`);
}

function setUserIdFromSocketId(redis, userId, socketId) {
  return redis.set(`socket.${socketId}.userId`, JSON.stringify(userId));
}

function deleteUserIdFromSocketId(redis, socketId) {
  return redis.del(`socket.${socketId}.userId`);
}

function removeQueuesForUser(redis, context, userId) {
  const key = `queues.${userId}`;
  return redisGet(redis, key).then((queues) => {
    if (Array.isArray(queues)) {
      queues.forEach((queueName) => {
        publish(context, queueName, '#close');
      });
    }
    return redis.del(key);
  });
}

exports.publish = publish;
exports.redisGet = redisGet;
exports.getUserIdFromSocketId = getUserIdFromSocketId;
exports.setUserIdFromSocketId = setUserIdFromSocketId;
exports.deleteUserIdFromSocketId = deleteUserIdFromSocketId;
exports.removeQueuesForUser = removeQueuesForUser;
