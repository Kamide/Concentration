import React from 'react';

export function Fraction(props) {
  return (
    <span>
      <span>{props.numerator}</span>
      <span>/</span>
      <span>{props.denominator}</span>
    </span>
  );
}

export function Id(props) {
  return (
    <span>
      <span>ID=</span>
      <code>{props.id}</code>
    </span>
  );
}
