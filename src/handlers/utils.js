function requestUserCleanup(context, userId) {
  const pub = context.socket('PUSH');
  pub.connect('auth.cleanup', () => {
    pub.write(JSON.stringify({ userId }), 'utf8');
    pub.close();
  });
}

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

exports.publish = publish;
exports.redisGet = redisGet;
exports.requestUserCleanup = requestUserCleanup;
exports.getUserIdFromSocketId = getUserIdFromSocketId;
exports.setUserIdFromSocketId = setUserIdFromSocketId;
exports.deleteUserIdFromSocketId = deleteUserIdFromSocketId;
