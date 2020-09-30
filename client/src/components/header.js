import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';
import Clipboard from './clipboard';
import { Id } from './snippets';

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 'Not Available',
      name: '',
      timer: 0
    };

    this.setPlayerName = this.setPlayerName.bind(this);
  }

  componentDidMount() {
    socket.on('connect', () => {
      let state = { id: socket.id };

      if (localStorage.getItem('name')) {
        socket.emit('update_player_name', localStorage.getItem('name'));
        state.name = localStorage.getItem('name');
      }

      this.setState(state);
    });
  }

  setPlayerName(event) {
    event.preventDefault();

    if (this.state.name !== event.target.playerName.value) {
      socket.emit('update_player_name', event.target.playerName.value);
      localStorage.setItem('name', event.target.playerName.value);
      clearTimeout(this.state.timer);

      this.setState({
        name: event.target.playerName.value,
        timer: setTimeout(() => {
          this.setState({ timer: 0 });
        }, 1500)
      });
    }
  }

  render() {
    return (
      <header className="flex-horizontal-4-1 primary">
        <div className="flex-fill flex-horizontal-1-1 children-padding-1-2">
          <div aria-hidden="true" className="parallelogram">🤔</div>
          <div>
            <h1 className="heading"><Link to='/'>Concentration</Link></h1>
            <nav>
              <ul className="flex-horizontal-1-1 children-padding-top-1-2 navbar">
                <li><Link to='/lobby'>Lobby</Link></li>
                <li><Link to='/room'>Create a Room</Link></li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="flex-horizontal-1-1 children-padding-1-2">
          <div aria-hidden="true" className="parallelogram">💳</div>
          <div>
            <h2 className="heading">My Info</h2>
            <div className="flex-horizontal-1-1 children-padding-top-1-2">
              <div>
                <Id id={this.state.id} />{' '}
                <Clipboard text={this.state.id} />
              </div>
              <form className="flex-horizontal" onSubmit={this.setPlayerName}>
                <div>
                  <label htmlFor="playerName">Name</label>{' '}
                  <input type="text" id="playerName" defaultValue={this.state.name} />{' '}
                </div>
                <div>
                  <input type="submit" value="Change" />{' '}
                  {this.state.timer > 0 && <span className="fade-in-out tooltip">Changed!</span>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </header>
    );
  }
}
