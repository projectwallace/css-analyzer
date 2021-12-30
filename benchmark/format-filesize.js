"use strict";

const BYTE_UNITS = ["B", "kB", "MB"];

export default (number) => {
  if (number < 1) {
    return String(number) + " " + BYTE_UNITS[0];
  }

  const exponent = Math.min(
    Math.floor(Math.log10(number) / 3),
    BYTE_UNITS.length - 1
  );
  number = Number((number / Math.pow(1000, exponent)).toPrecision(3));

  const unit = BYTE_UNITS[exponent];

  return String(number) + " " + unit;
};
