import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 'N/A'
    };
  }

  componentDidMount() {
    socket.on('connect', () => {
      this.setState({
        id: socket.id
      });
    });
  }

  render() {
    return (
      <header>
        <div>
          <h1><Link to='/'>Concentration</Link></h1>
          <nav>
            <ul>
              <li><Link to='/game'>Game</Link></li>
            </ul>
          </nav>
        </div>
        <div>
          <h2>Player</h2>
          <p>ID=<code>{this.state.id}</code></p>
        </div>
      </header>
    );
  }
}
