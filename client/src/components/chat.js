import React, { Component } from 'react';
import socket from './socket'
import { Player } from './snippets';

export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      previousMessageSent: ''
    };

    this.sendMessage = this.sendMessage.bind(this);
  }

  componentDidMount() {
    socket.on('receive_message', (message) => {
      this.setState((prevState) => {
        return {
          messages: [message].concat(prevState.messages),
          previousMessageSent: message.from !== socket.id ? '' : prevState.previousMessageSent
        };
      });
    });
  }

  componentWillUnmount() {
    socket.off('receive_message');
  }

  sendMessage(event) {
    event.preventDefault();
    const message = event.target.chatMessage.value.trim();

    if (message && message !== this.state.previousMessageSent) {
      socket.emit('send_message', message);
      this.setState({ previousMessageSent: message });
      event.target.chatMessage.value = '';
    }
  }

  render() {
    const noMessages = <p><em>No messages yet. Start the conversation!</em></p>

    return (
      <div>
        <h2>Messages</h2>
        <form onSubmit={this.sendMessage}>
          <input type="text" id="chatMessage" />
          <input type="submit" value="Send" />
        </form>
        <div>
          {this.state.messages.length > 0
            ? this.state.messages.map((message, index) => {
                return (
                  <p key={index}><Player name={this.props.names[message.from]} id={message.from} />: {message.text}</p>
                );
              })
            : noMessages}
        </div>
      </div>
    );
  }
}
