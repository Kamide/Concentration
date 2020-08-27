import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import socket from './socket';
import Clipboard from './clipboard';
import { Fraction, Id } from './snippets';

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manager: this.props.match.params.manager,
      timestamp: this.props.match.params.timestamp,
      title: 'Not Available',
      pairs: 0,
      limit: 0,
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
        delete info.count;
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
        <h1>Waiting Room</h1>
        <div>
          <h2>{this.state.title}</h2>
          <p><Id id={this.id} /> <Clipboard text={this.id} /></p>
        </div>
        <p><span>Distinct Card Pairs:</span> <span>{this.state.pairs}</span></p>
        <div>
          <h2>
            <span>Players:</span>{' '}
            <Fraction numerator={this.state.players.length} denominator={this.state.limit} />
          </h2>
          <ul>
            {this.state.players.map((player) => {
              let id = <Id id={player.id} />;

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
