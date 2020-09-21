const e = require('express');
const Player = require('./player');

const CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function randomInteger(max, min = 0) {
  return Math.floor(Math.random() * (max - min) + min);
}

function swap(cards, i, j) {
  let temp = cards[i];
  cards[i] = cards[j];
  cards[j] = temp;
}

function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; --i) {
    let j = randomInteger(i);
    swap(cards, i, j);
  }
}

module.exports = class Game {
  constructor(manager, timestamp, title, pairs, limit) {
    this.manager = manager;
    this.timestamp = timestamp;
    this.title = title;

    this.pairs = pairs;
    this.deck = [];
    this.seed = '';

    this.limit = limit;
    this.players = [];
    this.stats = {};

    this.playing = false;
    this.deckShown = [];
    this.turnIndex = -1;
    this.flipsLeft = 2;
    this.prevDeckIndex = -1;
  }

  get id() {
    return this.manager + '/' + this.timestamp;
  }

  get count() {
    return this.players.length;
  }

  get playerInfo() {
    return this.players.map((player) => { return player.info; });
  }

  get publicInfo() {
    return {
      id: this.id, title: this.title,
      pairs: this.pairs,
      limit: this.limit, count: this.count,
    };
  }

  get turn() {
    return this.players[this.turnIndex];
  }

  playerIndex(player) {
    if (!(player instanceof Player)) {
      return -1;
    }

    return this.players.findIndex((candidate) => {
      return candidate.id == player.id;
    });
  }

  add(player, timestamp) {
    if (this.timestamp != timestamp || (this.count < 1 && this.manager != player.id)
      || this.count >= this.limit || this.playerIndex(player) > -1 || this.playing) {
      return null;
    }

    this.players.push(player);
    this.stats[player.id] = {
      ready: false,
      hands: []
    };
    player.join(this.id);
    player.emit('playerJoined', player.info, this.stats[player.id]);

    return {
      ...this.publicInfo,
      players: this.playerInfo,
      stats: this.stats
    };
  }

  delete(player) {
    let index = this.playerIndex(player);

    if (index > -1) {
      delete this.stats[player.id];
      this.players.splice(index, 1)[0];
      this.decrementTurnIndex();
      this.incrementTurnIndex();
      player.emit('playerLeft', player.id, this.turn.id);
    }

    return this.count;
  }

  toggleReady(player) {
    if (this.playerIndex(player) > -1) {
      this.stats[player.id].ready = !this.stats[player.id].ready;
    }
  }

  waiting() {
    let readies = Object.values(this.stats).reduce((accumulator, stats) => {
      return accumulator + (stats.ready ? 1 : 0);
    }, 0);

    return readies < this.count - 1;
  }

  start() {
    if (this.waiting() || this.playing) {
      return '';
    }

    for (let i = 0; i < this.pairs; ++i) {
      this.deck.push(i, i);
      this.deckShown.push(-1, -1);
      this.seed += CHAR_SET[randomInteger(CHAR_SET.length)];
    }

    shuffle(this.deck);
    this.playing = true;
    this.turnIndex = 0;

    return this.seed;
  }

  flip(player, deckIndex) {
    if (player == this.turn && deckIndex >= 0 && deckIndex < this.deck.length) {
      if (this.prevDeckIndex == deckIndex || this.deckShown[deckIndex] > -1) {
        return null;
      }

      let status = '';

      if (--this.flipsLeft < 1) {
        if (this.deck[this.prevDeckIndex] == this.deck[deckIndex]) {
          this.deckShown[this.prevDeckIndex] = this.deck[deckIndex];
          this.deckShown[deckIndex] = this.deck[deckIndex];
          status = 'commit';
        }
        else {
          status = 'flush';
        }

        this.incrementTurnIndex();
        this.flipsLeft = 2;
        this.prevDeckIndex = -1;
      }
      else {
        this.prevDeckIndex = deckIndex;
      }

      return {
        deckIndex: deckIndex,
        card: this.deck[deckIndex],
        turn: this.turn.id,
        status: status
      };
    }

    return null;
  }

  incrementTurnIndex() {
    this.turnIndex = (this.turnIndex + 1) % this.count;
  }

  decrementTurnIndex() {
    this.turnIndex = (this.turnIndex - 1 + this.count) % this.count;
  }

  toString() {
    return `${this.id} (${this.title})`;
  }
};
