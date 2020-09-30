import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Main extends Component {
  render() {
    return (
      <main>
        <header className="secondary">
          <h1 className="parallelogram">Concentration</h1>
        </header>
        <p>
          <strong>Concentration</strong>, also known as <strong>Memory</strong>, is a card game.
          The objective is to find and match all card pairs.
          You can play by yourself or team up with friends!
        </p>
        <p>
          You can find a game room in the <Link to='/lobby'>lobby</Link> or you can create your own game room <Link to='/room'>here</Link>.
        </p>
      </main>
    );
  }
}
