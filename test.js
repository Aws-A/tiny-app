function generateRandomString() {
  let r = (Math.random() + 1).toString(36).substring(6);
console.log("random", r);
}

console.log(generateRandomString());