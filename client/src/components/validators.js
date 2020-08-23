export function inputRequired(value, errors, field) {
  if (!value) {
    errors.push(field.label + ' cannot be empty.');
  }
}

export function positiveIntegerRange(value, errors, field) {
  if (!/^[0-9]+$/.test(value)) {
    errors.push(field.label + ' must be an positive integer.');
  }
  else if (value < field.args.min || value > field.args.max) {
    errors.push(`${field.label} must be between ${field.args.min} and ${field.args.max} inclusive.`);
  }
}
