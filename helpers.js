// lookup magic...
const getUserByEmail = (email, database) => {
    for (const userId in database) {
      if (database[userId].email === email) {
        return database[userId];
      }
    }
    return undefined;
  };


// Creating unique Id
function generateRandomString() {
  let r = (Math.random() + 1).toString(36).substring(6);
  return r;
}

module.exports = { getUserByEmail, generateRandomString };