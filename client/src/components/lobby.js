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

    this.updatePlayerCount = this.updatePlayerCount.bind(this);
  }

  updatePlayerCount(gameId, value) {
    this.setState((prevState) => {
      let index = prevState.games.findIndex((candidate) => {
        return candidate.id === gameId;
      });

      return {
        games: [
          ...prevState.games.slice(0, index),
          {
            ...prevState.games[index],
            playerCount: prevState.games[index].playerCount + value
          },
          ...prevState.games.slice(index + 1)
        ]
      };
    });
  }

  componentDidMount() {
    socket.emit('join_lobby');

    socket.on('get_game_list', (games) => {
      this.setState({ games: games });
      socket.off('get_game_list');
    });

    socket.on('new_game_list_item', (game) => {
      this.setState((prevState) => {
        return {
          games: prevState.games.concat([game])
        };
      });
    });

    socket.on('delete_game_list_item', (gameId) => {
      this.setState((prevState) => {
        return {
          games: prevState.games.filter((candidate) => {
            return candidate.id !== gameId;
          })
        };
      });
    });

    socket.on('increment_game_list_item_player_count', (game) => {
      this.updatePlayerCount(game, 1);
    });

    socket.on('decrement_game_list_item_player_count', (game) => {
      this.updatePlayerCount(game, -1);
    });
  }

  componentWillUnmount() {
    socket.off('get_game_list');
    socket.off('new_game_list_item');
    socket.off('delete_game_list_item');
    socket.off('increment_game_list_item_player_count');
    socket.off('decrement_game_list_item_player_count');
    socket.emit('leave_lobby');
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
                <Fraction numerator={game.playerCount} denominator={game.playerLimit} />
              </p>
            </div>
          );
        }) || noGames}
      </main>
    );
  }
}
