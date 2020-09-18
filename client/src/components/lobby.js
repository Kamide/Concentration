import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';
import { Fraction, Id } from './snippets';

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.state = {
      games: []
    }

    this.updateCount = this.updateCount.bind(this);
  }

  updateCount(game, value) {
    this.setState((prevState) => {
      let index = prevState.games.findIndex((candidate) => {
        return candidate.id == game;
      });

      return {
        games: [
          ...prevState.games.slice(0, index),
          {
            ...prevState.games[index],
            count: prevState.games[index].count + value
          },
          ...prevState.games.slice(index + 1)
        ]
      };
    });
  }

  componentDidMount() {
    socket.emit('joinLobby');

    socket.on('gameList', (games) => {
      this.setState({ games: games });
      socket.off('gameList');
    });

    socket.on('lobbyNewGame', (game) => {
      this.setState((prevState) => {
        return {
          games: prevState.games.concat([game])
        };
      });
    });

    socket.on('lobbyDeleteGame', (game) => {
      this.setState((prevState) => {
        return {
          games: prevState.games.filter((candidate) => {
            return candidate.id != game;
          })
        };
      });
    });

    socket.on('lobbyPlayerJoinedGame', (game) => {
      this.updateCount(game, 1);
    });

    socket.on('lobbyPlayerLeftGame', (game) => {
      this.updateCount(game, -1);
    });
  }

  componentWillUnmount() {
    socket.off('gameList');
    socket.off('lobbyNewGame');
    socket.off('lobbyDeleteGame');
    socket.off('lobbyPlayerJoinedGame');
    socket.off('lobbyPlayerLeftGame');
    socket.emit('leaveLobby');
  }

  render() {
    const noGames = (
      <div>
        <p><em>No game rooms found.</em></p>
        <p>Create your own game room <Link to='/room'>here</Link>.</p>
      </div>
    );

    return (
      <main>
        <h1>Lobby</h1>
        {this.state.games.length > 0 && this.state.games.map((game) => {
          return (
            <div key={game.id}>
              <div>
                <h2><Link to={'/game/' + game.id}>{game.title}</Link></h2>
                <p><Id id={game.id} /></p>
              </div>
              <p><span>Distinct Card Pairs:</span> <span>{game.pairs}</span></p>
              <p>
                <span>Players:</span>{' '}
                <Fraction numerator={game.count} denominator={game.limit} />
              </p>
            </div>
          );
        }) || noGames}
      </main>
    );
  }
}
