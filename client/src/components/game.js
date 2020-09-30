import React, { Component, Fragment } from 'react';
import { Redirect } from 'react-router-dom';
import socket from './socket';
import Chat from './chat'
import Clipboard from './clipboard';
import { Fraction, Id, Player } from './snippets';
import './styles/game.css'

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manager: this.props.match.params.manager,
      timestamp: this.props.match.params.timestamp,
      title: 'Not Available',
      pairs: 0,
      deck: [],
      imageSeed: '',
      images: [],
      playerLimit: 0,
      players: [],
      playerStats: {},
      playing: false,
      turn: '',
      prevCard: {},
      flush: false,
      won: false,
      messages: [],
      redirect: ''
    };

    this.flipCard = this.flipCard.bind(this);
  }

  get id() {
    return this.state.manager + '/' + this.state.timestamp;
  }

  get isManager() {
    return this.state.manager === socket.id;
  }

  get isMyTurn() {
    return this.state.turn === socket.id;
  }

  get playerNames() {
    return this.state.players.reduce((names, player) => {
      names[player.id] = player.name;
      return names;
    }, {});
  }

  get defaultPlayerStats() {
    return {
      ready: false,
      pairs: []
    };
  }

  playerIndex(state, playerId) {
    return state.players.findIndex((candidate) => {
      return candidate.id === playerId;
    });
  }

  playerName(playerId) {
    const index = this.playerIndex(this.state, playerId);
    return index > -1 ? this.state.players[index].name : playerId;
  }

  updatePlayer(prevState, playerId, key, value) {
    const index = this.playerIndex(prevState, playerId)

    return {
      players: [
        ...prevState.players.slice(0, index),
        {
          ...prevState.players[index],
          [key]: value
        },
        ...prevState.players.slice(index + 1)
      ]
    };
  }

  updateStats(prevState, playerId, key, value) {
    return {
      playerStats: {
        ...prevState.playerStats,
        [playerId]: {
          ...prevState.playerStats[playerId],
          [key]: value
        }
      }
    };
  }

  componentDidMount() {
    socket.emit('join_game', this.state.manager, this.state.timestamp);

    socket.on('join_game_status', (info) => {
      if (info) {
        delete info.playerCount;
        this.setState(info);
      }
      else {
        this.setState({ redirect: true });
      }

      socket.off('join_game_status');
    });

    socket.on('player_join', (player, playerStats) => {
      this.setState((prevState) => {
        return {
          players: prevState.players.concat([player]),
          playerStats: {
            ...prevState.playerStats,
            [player.id]: playerStats
          }
        };
      });
    });

    socket.on('player_leave', (playerId, turn) => {
      if (playerId === this.state.manager) {
        this.setState({ redirect: true });
      }
      else {
        this.setState((prevState) => {
          let state = {
            players: prevState.players.filter((candidate) => {
              return candidate.id !== playerId;
            }),
          };

          if (turn) {
            state.turn = turn;
          }

          return state;
        });
      }
    });

    socket.on('update_player_name_success', (player, name) => {
      this.setState((prevState) => {
        return this.updatePlayer(prevState, player, 'name', name);
      });
    });

    socket.on('toggle_ready_status', (player) => {
      this.setState((prevState) => {
        return this.updateStats(prevState, player, 'ready', !prevState.playerStats[player].ready);
      });
    });

    socket.on('start_game', (imageSeed) => {
      this.setState((prevState) => {
        return {
          deck: new Array(prevState.pairs * 2).fill(-1),
          imageSeed: imageSeed,
          images: this.generateDeckImages(prevState.pairs, imageSeed),
          playing: true,
          turn: prevState.manager,
        };
      });

      socket.on('flip_card_status', (result) => {
        if (result) {
          this.prevCardPop();
          this.prevCardPush(result.deckIndex, result.card);

          switch (result.status) {
            case 'commit':
              this.commitHandToDeck();
              break;
            case 'flush':
              this.setState({ flush: true });
          }

          this.setState({ turn: result.turn, won: result.won });
        }
      });

      socket.on('reset_game_success', () => {
        this.setState((prevState) => {
          return {
            deck: [],
            imageSeed: '',
            images: [],
            playerStats: Object.keys(prevState.playerStats).reduce((playerStats, playerId) => {
              playerStats[playerId] = this.defaultPlayerStats;
              return playerStats;
            }, {}),
            playing: false,
            turn: '',
            prevCard: {},
            flush: false,
            won: false
          };
        });

        socket.off('flip_card_status');
      });
    });
  }

  componentWillUnmount() {
    socket.off('join_game_status')
    socket.off('player_join');
    socket.off('player_leave');
    socket.off('update_player_name_success');
    socket.off('toggle_ready_status');
    socket.off('start_game');
    socket.off('flip_card_status');
    socket.off('reset_game_success');
    socket.emit('leave_game');
  }

  renderReadyButton() {
    if (this.state.won && this.isManager) {
      return <button onClick={this.reset}>Reset Game</button>;
    }
    else if (!this.state.playing) {
      const label = (this.state.playerStats[socket.id] !== undefined && this.state.playerStats[socket.id].ready)
        ? 'Unready'
        : (this.isManager ? 'Start Game' : 'Ready');

      return <button onClick={this.toggleReady}>{label}</button>;
    }
    else {
      return null;
    }
  }

  toggleReady() {
    socket.emit('toggle_ready');
  }

  generateDeckImages(pairs, imageSeed) {
    let images = [];

    for (let i = 0, j = 0; i < pairs; j = ++i % imageSeed.length) {
      images.push(imageSeed.substring(j) + imageSeed.substring(0, j));
    }

    return images;
  }

  flipCard(deckIndex) {
    if (this.isMyTurn && this.state.deck[deckIndex] < 0) {
      socket.emit('flip_card', deckIndex);
    }
  }

  prevCardPush(deckIndex, card) {
    this.setState((prevState) => {
      return {
        prevCard: {
          ...prevState.prevCard,
          [deckIndex]: card
        }
      };
    });
  }

  prevCardPop() {
    if (this.state.flush) {
      this.setState({ prevCard: {}, flush: false });
    }
  }

  commitHandToDeck() {
    this.setState((prevState) => {
      let deck = prevState.deck;
      let hand = -1;

      for (const [index, card] of Object.entries(prevState.prevCard)) {
        deck[index] = card;
        hand = card;
      }

      return {
        deck: deck,
        ...this.updateStats(prevState, prevState.turn, 'pairs', prevState.playerStats[prevState.turn].pairs.concat(hand)),
        prevCard: {}
      };
    });
  }

  renderAlertBanner() {
    let emphasis = (text) => {
      return (
        this.state.won || this.isMyTurn
          ? <strong>{text}</strong>
          : <em>{text}</em>
      );
    };

    let text = (
      this.state.won
        ? 'You win!'
        : this.isMyTurn
          ? 'It is your turn to make a move...'
          : <Fragment><Player name={this.playerName(this.state.turn)} id={this.state.turn} /> is making a move...</Fragment>
    );

    return <p className="alert-banner section">{emphasis(text)}</p>;
  }

  renderCardImage(card, width, height) {
    if (card < 0) {
      return null;
    }

    return <img src={'https://picsum.photos/seed/' + this.state.images[card] + '/128/128'} alt={'Card ' + card} width={width} height={height} />;
  }

  renderCard(card, deckIndex) {
    if (deckIndex in this.state.prevCard) {
      card = this.state.prevCard[deckIndex];
    }

    return (
      <button key={deckIndex} onClick={() => this.flipCard(deckIndex)} className="card">
        {card > -1
          ? this.renderCardImage(card, 128, 128)
          : <span aria-label="Unknown Card" role="img">❓</span>}
      </button>
    );
  }

  reset() {
    socket.emit('reset_game');
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to='/lobby' />;
    }

    return (
      <main id="game">
        <div id="game-header" className="flex-horizontal-4-1">
          <header className="flex-horizontal-4-1 secondary">
            <h1 className="parallelogram">Game Room</h1>
            <div id="game-info" className="parallelogram">
              <h2>{this.state.title}</h2>
              <p><Id id={this.id} /> <Clipboard text={this.id} /></p>
              <p><span>Distinct Card Pairs:</span> <span>{this.state.pairs}</span></p>
              {this.renderReadyButton()}
            </div>
          </header>
        </div>
        <div id="game-sidebar">
          <div className="sticky">
            <div className="section">
              <h2>
                <span>Players:</span>{' '}
                <Fraction numerator={this.state.players.length} denominator={this.state.playerLimit} />
              </h2>
              <ul>
                {this.state.players.map((player) => {
                  const id = <Id id={player.id} />;

                  return (
                    <li className="player-info section" key={player.id}>
                      <Player name={player.name} id={player.id} />
                      <ul className="player-stats">
                        {this.state.manager === player.id
                          ? <li className="manager">Room Manager</li>
                          : !this.state.playing && <li className={this.state.playerStats[player.id].ready ? 'ready' : 'not-ready'}>{this.state.playerStats[player.id].ready ? 'Ready' : 'Not Ready'}</li>}
                        {this.state.playing &&
                          <li className="flex-horizontal-1-4">
                            <span>Pairs</span>
                            <ul className="flex-fill flex-horizontal pairs">
                              {this.state.playerStats[player.id].pairs.length > 0
                                ? this.state.playerStats[player.id].pairs.map((pair) => {
                                    return <li key={pair}>{this.renderCardImage(pair, 32, 32)}</li>;
                                  })
                                : <span className="inline-block padding-1-2">None</span>}
                            </ul>
                          </li>}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Chat names={this.playerNames} />
          </div>
        </div>
        {this.state.playing &&
          <div id="game-main">
            {this.renderAlertBanner()}
            <div className="table-top">
              {this.state.deck.map((card, deckIndex) => this.renderCard(card, deckIndex))}
            </div>
          </div>}
      </main>
    );
  }
}
