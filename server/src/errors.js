module.exports = {
  emptyString,
  outOfRange
};

function emptyString(value) {
  return value.trim() === '';
}

function outOfRange(value, min, max) {
  return value < min && value > max;
}
