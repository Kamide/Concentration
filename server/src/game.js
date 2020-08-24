const CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function randomInteger(max, min = 0) {
  return Math.floor(Math.random() * (max - min) + min);
}

function swap(cards, i, j) {
  let temp = cards[i];
  cards[i] = cards[j];
  cards[j] = cards[i];
}

function shuffle(cards) {
  for (let i = this.pairCount - 1; i > 0; --i) {
    let j = randomInteger(i);
    swap(cards, i, j);
  }
}

module.exports = class Game {
  constructor(manager, timestamp, title, limit, pairs) {
    this.manager = manager;
    this.timestamp = timestamp;
    this.title = title;

    this.limit = limit;
    this.players = [];
    this.hands = {};

    this.pairs = pairs;
    this.deck = [];
    this.seed = '';

    this.playing = false;
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

  playerIndex(player) {
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
    this.hands[player.id] = [];
    player.join(this.id);
    player.emit('playerJoined', player.info);

    return {
      title: this.title, limit: this.limit, pairs: this.pairs,
      players: this.playerInfo
    };
  }

  delete(player) {
    let index = this.playerIndex(player);

    if (index > -1) {
      delete this.hands[player.id];
      this.players.splice(index, 1)[0];
      player.emit('playerLeft', player.id);
    }

    return this.count;
  }

  start() {
    for (let i = 1; i <= this.pairCount; ++i) {
      this.deck.push(i, i);
      this.seed += CHAR_SET[randomInteger(CHAR_SET.length)];
    }

    shuffle(this.deck);
  }

  toString() {
    return `${this.id} (${this.title})`;
  }
};
