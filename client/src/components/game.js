import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import socket from './socket';
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
      limit: 0,
      players: [],
      myTurnNumber: -1,
      stats: {},
      deck: [],
      seed: '',
      images: [],
      playing: false,
      turn: '',
      prevCard: {},
      flush: false,
      redirect: ''
    };

    this.prevCardPush = this.prevCardPush.bind(this);
    this.prevCardPop = this.prevCardPop.bind(this);
    this.flipCard = this.flipCard.bind(this);
  }

  get id() {
    return this.state.manager + '/' + this.state.timestamp;
  }

  get isManager() {
    return this.state.manager == socket.id;
  }

  get isMyTurn() {
    return this.state.turn == socket.id;
  }

  playerIndex(state, playerId) {
    return state.players.findIndex((candidate) => {
      return candidate.id == playerId;
    });
  }

  playerName(playerId) {
    let index = this.playerIndex(this.state, playerId);
    return index > -1 ? this.state.players[index].name : playerId;
  }

  updatePlayer(prevState, playerId, key, value) {
    let index = this.playerIndex(prevState, playerId)

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

  updateStats(prevState, player, key, value) {
    return {
      stats: {
        ...prevState.stats,
        [player]: {
          ...prevState.stats[player],
          [key]: value
        }
      }
    };
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

  pushToDeck() {
    this.setState((prevState) => {
      let deck = prevState.deck;

      for (const [index, card] of Object.entries(prevState.prevCard)) {
        deck[index] = card;
      }

      return {
        deck: deck,
        prevCard: {}
      };
    });
  }

  componentDidMount() {
    socket.emit('requestJoinGame', this.state.manager, this.state.timestamp);

    socket.on('joinGame', (info) => {
      if (info) {
        info.myTurnNumber = info.count - 1;
        delete info.count;
        this.setState(info);
      }
      else {
        this.setState({ redirect: true });
      }

      socket.off('joinGame');
    });

    socket.on('playerJoined', (player, stats) => {
      this.setState((prevState) => {
        return {
          players: prevState.players.concat([player]),
          stats: {
            ...prevState.stats,
            [player.id]: stats
          }
        };
      });
    });

    socket.on('playerLeft', (playerId, turn) => {
      if (playerId == this.state.manager) {
        this.setState({ redirect: true });
      }
      else {
        this.setState((prevState) => {
          let state = {
            players: prevState.players.filter((candidate) => {
              return candidate.id != playerId;
            }),
          };

          if (turn) {
            state.turn = turn;
          }

          return state;
        });
      }
    });

    socket.on('playerNameChanged', (player, name) => {
      this.setState((prevState) => {
        return this.updatePlayer(prevState, player, 'name', name);
      });
    });

    socket.on('readyToggled', (player) => {
      this.setState((prevState) => {
        return this.updateStats(prevState, player, 'ready', !prevState.stats[player].ready);
      });
    });

    socket.on('gameStart', (seed) => {
      this.setState((prevState) => {
        return {
          deck: new Array(prevState.pairs * 2).fill(-1),
          seed: seed,
          images: this.generateDeckImages(prevState.pairs, seed),
          playing: true,
          turn: prevState.manager,
        };
      });

      socket.on('flipCardResult', (result) => {
        if (result) {
          this.prevCardPop();
          this.prevCardPush(result.deckIndex, result.card);
          this.setState({ turn: result.turn });

          switch (result.status) {
            case 'commit':
              this.pushToDeck();
              break;
            case 'flush':
              this.setState({ flush: true });
          }
        }
      });
    });
  }

  componentWillUnmount() {
    socket.off('joinGame')
    socket.off('playerJoined');
    socket.off('playerLeft');
    socket.off('playerNameChanged');
    socket.off('readyToggled');
    socket.off('gameStart');
    socket.emit('leaveGame');
  }

  toggleReady() {
    socket.emit('toggleReady');
  }

  generateDeckImages(pairs, seed) {
    let images = [];

    for (let i = 0, j = 0; i < pairs; j = ++i % seed.length) {
      images.push(seed.substring(j) + seed.substring(0, j));
    }

    return images;
  }

  flipCard(deckIndex) {
    if (this.isMyTurn && this.state.deck[deckIndex] < 0) {
      socket.emit('flipCard', deckIndex);
    }
  }

  renderCard(card, deckIndex) {
    let imgSrc = '';

    if (deckIndex in this.state.prevCard) {
      card = this.state.prevCard[deckIndex];
    }

    if (card > -1) {
      imgSrc = this.state.images[card];
    }

    return (
      <button key={deckIndex} onClick={() => this.flipCard(deckIndex)} className="card">
        <figure>
          {imgSrc && <img src={'https://picsum.photos/seed/' + imgSrc + '/128/128'} />}
          <figcaption>Card {card > -1 ? card : 'Unknown'}</figcaption>
        </figure>
      </button>
    );
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to='/lobby' />;
    }

    return (
      <main>
        <div>
          <div>
            <h1>Waiting Room</h1>
            <h2>{this.state.title}</h2>
          </div>
          <p><Id id={this.id} /> <Clipboard text={this.id} /></p>
          <p><span>Distinct Card Pairs:</span> <span>{this.state.pairs}</span></p>
          {!this.state.playing &&
            <button onClick={this.toggleReady}>
              {(this.state.stats[socket.id] != undefined && this.state.stats[socket.id].ready)
                ? 'Unready'
                : (this.isManager ? 'Start Game' : 'Ready')}
            </button>}
        </div>
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
                  <Player name={player.name} id={player.id} />
                  <ul>
                    {this.state.playing || this.state.manager == player.id
                      ? <li>Room Manager</li>
                      : <li>{this.state.stats[player.id].ready ? 'Ready' : 'Not Ready'}</li>}
                  </ul>
                </li>
              );
            })}
          </ul>
          {this.state.playing
            ? this.isMyTurn
                ? <p><strong>It is your turn to make a move...</strong></p>
                : <p><em><Player name={this.playerName(this.state.turn)} id={this.state.turn} /> is making a move...</em></p>
            : null}
        </div>
        {this.state.playing &&
          <div className="table-top">
            {this.state.deck.map((card, deckIndex) => this.renderCard(card, deckIndex))}
          </div>
        }
      </main>
    );
  }
}
