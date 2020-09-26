const Player = require('./player');

const SEED_CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function randomInteger(max, min = 0) {
  return Math.floor(Math.random() * (max - min) + min);
}

function swap(cards, i, j) {
  const temp = cards[i];
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
  constructor(manager, timestamp, title, pairs, playerLimit) {
    this.manager = manager;
    this.timestamp = timestamp;
    this.title = title;

    this.pairs = pairs;
    this.deck = [];
    this.imageSeed = '';

    this.playerLimit = playerLimit;
    this.players = [];
    this.playerStats = {};

    this.playing = false;
    this.turnIndex = -1;
    this.flipsLeft = 2;
    this.deckShown = [];
    this.prevDeckIndex = -1;
  }

  get id() {
    return this.manager + '/' + this.timestamp;
  }

  get playerCount() {
    return this.players.length;
  }

  get playerInfo() {
    return this.players.map((player) => { return player.info; });
  }

  get publicInfo() {
    return {
      id: this.id,
      title: this.title,
      pairs: this.pairs,
      playerLimit: this.playerLimit,
      playerCount: this.playerCount,
    };
  }

  get waiting() {
    const readies = Object.values(this.playerStats).reduce((accumulator, playerStats) => {
      return accumulator + (playerStats.ready ? 1 : 0);
    }, 0);

    return readies < this.playerCount - 1;
  }

  get turn() {
    return this.players[this.turnIndex];
  }

  playerIndex(player) {
    if (!(player instanceof Player)) {
      return -1;
    }

    return this.players.findIndex((candidate) => {
      return candidate.id === player.id;
    });
  }

  add(player, timestamp) {
    if (this.timestamp !== timestamp || (this.playerCount < 1 && this.manager !== player.id)
      || this.playerCount >= this.playerLimit || this.playerIndex(player) > -1 || this.playing) {
      return null;
    }

    this.players.push(player);
    this.playerStats[player.id] = {
      ready: false,
      pairs: []
    };
    player.join(this.id);
    player.emit('player_join', player.info, this.playerStats[player.id]);

    return {
      ...this.publicInfo,
      players: this.playerInfo,
      playerStats: this.playerStats
    };
  }

  delete(player) {
    const index = this.playerIndex(player);

    if (index > -1) {
      delete this.playerStats[player.id];
      this.players.splice(index, 1)[0];

      if (this.turnIndex > -1) {
        this.decrementTurnIndex();
        this.incrementTurnIndex();
        player.emit('player_leave', player.id, this.turn.id);
      }
      else {
        player.emit('player_leave', player.id);
      }
    }

    return this.playerCount;
  }

  toggleReady(player) {
    if (this.playerIndex(player) > -1) {
      this.playerStats[player.id].ready = !this.playerStats[player.id].ready;
    }
  }

  start() {
    if (this.waiting || this.playing) {
      return '';
    }

    for (let i = 0; i < this.pairs; ++i) {
      this.deck.push(i, i);
      this.deckShown.push(-1, -1);
      this.imageSeed += SEED_CHAR_SET[randomInteger(SEED_CHAR_SET.length)];
    }

    shuffle(this.deck);
    this.playing = true;
    this.turnIndex = 0;

    return this.imageSeed;
  }

  flip(player, deckIndex) {
    if (player === this.turn && deckIndex >= 0 && deckIndex < this.deck.length) {
      if (this.prevDeckIndex === deckIndex || this.deckShown[deckIndex] > -1) {
        return null;
      }

      let status = '';

      if (--this.flipsLeft < 1) {
        if (this.deck[this.prevDeckIndex] === this.deck[deckIndex]) {
          this.deckShown[this.prevDeckIndex] = this.deck[deckIndex];
          this.deckShown[deckIndex] = this.deck[deckIndex];
          this.playerStats[player.id].pairs.push(this.deck[deckIndex]);
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
    this.turnIndex = (this.turnIndex + 1) % this.playerCount;
  }

  decrementTurnIndex() {
    this.turnIndex = (this.turnIndex - 1 + this.playerCount) % this.playerCount;
  }

  toString() {
    return `${this.id} (${this.title})`;
  }
};
