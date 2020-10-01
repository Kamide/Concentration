import React from 'react';
import './styles/snippets.css'

export function Fraction(props) {
  return (
    <span className="fraction">
      <span className="numerator">{props.numerator}</span>
      <span className="slash">&frasl;</span>
      <span className="denominator">{props.denominator}</span>
    </span>
  );
}

export function Id(props) {
  return (
    <span className="id">ID: <code>{props.id}</code></span>
  );
}

export function Player(props) {
  const id = <Id id={props.id} />;
  let player = id;

  if (props.name) {
    player = (
      <span className="player">
        <span aria-hidden="true" className="indicator"></span>
        {props.name}
        <span className="visually-hidden"> (</span>
        <span className="fade-in tooltip">{id}</span>
        <span className="visually-hidden">)</span>
      </span>
    );
  }

  return <span>{player}</span>;
}
