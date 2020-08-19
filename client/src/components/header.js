import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 'Not Available',
      name: '',
      copyToClipboardMessageTimer: null,
      setNameMessageTimer: null
    };

    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.setName = this.setName.bind(this);
  }

  componentDidMount() {
    socket.on('connect', () => {
      let state = { id: socket.id };

      if (localStorage.getItem('name')) {
        socket.emit('setName', localStorage.getItem('name'));
        state['name'] = localStorage.getItem('name');
      }

      this.setState(state);
    });
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.state.id);
    clearTimeout(this.state.copyToClipboardMessageTimer);

    this.setState({
      copyToClipboardMessageTimer: setTimeout(() => {
        this.setState({ copyToClipboardMessageTimer: null });
      }, 1500)
    });
  }

  setName(event) {
    event.preventDefault();

    if (this.state.name != event.target.name.value) {
      socket.emit('setName', event.target.name.value);
      localStorage.setItem('name', event.target.name.value);
      clearTimeout(this.state.setNameMessageTimer);

      this.setState({
        name: event.target.name.value,
        setNameMessageTimer: setTimeout(() => {
          this.setState({ setNameMessageTimer: null });
        }, 1500)
      });
    }
  }

  render() {
    return (
      <header>
        <div>
          <h1><Link to='/'>Concentration</Link></h1>
          <nav>
            <ul>
              <li><Link to='/game'>Game</Link></li>
            </ul>
          </nav>
        </div>
        <div>
          <h2>Player Information</h2>
          <p>
            <span>ID=<code>{this.state.id}</code></span>
            <button onClick={this.copyToClipboard}>Copy to Clipboard</button>
            {this.state.copyToClipboardMessageTimer != null
              && <span>Copied!</span>}
          </p>
          <form onSubmit={this.setName}>
            <label>
              <span>Name</span>
              <input type="text" id="name" defaultValue={this.state.name} />
            </label>
            <input type="submit" value="Change" />
            {this.state.setNameMessageTimer != null
              && <span>Changed!</span>}
          </form>
        </div>
      </header>
    );
  }
}
