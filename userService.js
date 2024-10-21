const onlineUsers = new Set();

const markUserOnline = (userId) => {
    onlineUsers.add(userId);
};

const markUserOffline = (userId) => {
    onlineUsers.delete(userId);
};

const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
};

export { markUserOnline, markUserOffline, isUserOnline };
