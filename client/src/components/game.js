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
      redirect: ''
    };

    this.flipCard = this.flipCard.bind(this);
    this.prevCardPush = this.prevCardPush.bind(this);
    this.prevCardPop = this.prevCardPop.bind(this);
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
      playerStats: {
        ...prevState.playerStats,
        [player]: {
          ...prevState.playerStats[player],
          [key]: value
        }
      }
    };
  }

  componentDidMount() {
    socket.emit('game_join_request', this.state.manager, this.state.timestamp);

    socket.on('game_join_status', (info) => {
      if (info) {
        delete info.playerCount;
        this.setState(info);
      }
      else {
        this.setState({ redirect: true });
      }

      socket.off('game_join_status');
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

    socket.on('player_name_update_success', (player, name) => {
      this.setState((prevState) => {
        return this.updatePlayer(prevState, player, 'name', name);
      });
    });

    socket.on('ready_toggle_status', (player) => {
      this.setState((prevState) => {
        return this.updateStats(prevState, player, 'ready', !prevState.playerStats[player].ready);
      });
    });

    socket.on('game_start', (imageSeed) => {
      this.setState((prevState) => {
        return {
          deck: new Array(prevState.pairs * 2).fill(-1),
          imageSeed: imageSeed,
          images: this.generateDeckImages(prevState.pairs, imageSeed),
          playing: true,
          turn: prevState.manager,
        };
      });

      socket.on('card_flip_status', (result) => {
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
    socket.off('game_join_status')
    socket.off('player_join');
    socket.off('player_leave');
    socket.off('player_name_update_success');
    socket.off('ready_toggle_status');
    socket.off('game_start');
    socket.emit('game_leave');
  }

  toggleReady() {
    socket.emit('ready_toggle_request');
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
      socket.emit('card_flip_request', deckIndex);
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
              {(this.state.playerStats[socket.id] != undefined && this.state.playerStats[socket.id].ready)
                ? 'Unready'
                : (this.isManager ? 'Start Game' : 'Ready')}
            </button>}
        </div>
        <div>
          <h2>
            <span>Players:</span>{' '}
            <Fraction numerator={this.state.players.length} denominator={this.state.playerLimit} />
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
                      : <li>{this.state.playerStats[player.id].ready ? 'Ready' : 'Not Ready'}</li>}
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
