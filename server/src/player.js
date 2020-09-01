module.exports = class Player {
  constructor(socket) {
    this.socket = socket;
    this.name = '';
    this.game = '';
  }

  get id() {
    return this.socket.id;
  }

  get info() {
    return { id: this.id, name: this.name };
  }

  get manager() {
    return this.game.substring(0, this.game.lastIndexOf('/'));
  }

  get isAManager() {
    return this.manager == this.id;
  }

  join(game) {
    this.socket.join(game);
    this.game = game;
  }

  leave() {
    if (this.game) {
      this.socket.leave(this.game);
      this.game = '';
    }
  }

  emit(event, args) {
    if (this.game) {
      this.socket.to(this.game).emit(event, args);
    }
  }

  toString() {
    if (this.name) {
      return `${this.id} (${this.name})`;
    }

    return this.id;
  }
}
