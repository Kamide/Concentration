import React, { Fragment } from 'react';

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

export function Player(props) {
  const id = <Id id={props.id} />;

  return (
    <span>
      {props.name
        && <Fragment><span>{props.name}</span> ({id})</Fragment>
        || id}
    </span>
  );
}
