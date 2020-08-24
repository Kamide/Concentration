import React, { Component } from 'react';
import { Redirect, BrowserRouter } from 'react-router-dom';
import socket from './socket';

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manager: this.props.match.params.manager,
      timestamp: this.props.match.params.timestamp,
      title: 'Not Available',
      limit: 0,
      pairs: 0,
      players: [],
      redirect: ''
    };
  }

  get id() {
    return this.state.manager + '/' + this.state.timestamp;
  }

  componentDidMount() {
    socket.emit('requestJoinGame', this.state.manager, this.state.timestamp);

    socket.on('joinGame', (info) => {
      if (info) {
        this.setState(info);
      }
      else {
        this.setState({ redirect: true });
      }

      socket.off('joinGame');
    });

    socket.on('playerJoined', (player) => {
      this.setState((prevState) => {
        return {
          players: prevState.players.concat([player])
        };
      });
    });

    socket.on('playerLeft', (player) => {
      if (player == this.state.manager) {
        this.setState({ redirect: true });
      }
      else {
        this.setState((prevState) => {
          return {
            players: prevState.players.filter((candidate) => {
              return candidate.id != player;
            })
          };
        });
      }
    });
  }

  componentWillUnmount() {
    socket.off('playerJoined');
    socket.off('playerLeft');
    socket.emit('leaveGame');
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to='/lobby' />;
    }

    return (
      <main>
        <header>
          <h1>{this.state.title}</h1>
          <p><span>ID=</span><code>{this.id}</code></p>
          <p><span>Player Limit:</span> <span>{this.state.limit}</span></p>
          <p><span>Distinct Card Pairs:</span> <span>{this.state.pairs}</span></p>
        </header>
        <div>
          <h2>Players</h2>
          <ul>
            {this.state.players.map((player) => {
              let id = <span><span>ID=</span><code>{player.id}</code></span>;

              return (
                <li key={player.id}>
                  {player.name || id}
                  {player.name && <ul><li>{id}</li></ul>}
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    );
  }
}
