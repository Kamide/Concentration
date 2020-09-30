import React, { Component } from 'react';

export default class Clipboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timer: 0
    };

    this.copy = this.copy.bind(this);
  }

  copy() {
    navigator.clipboard.writeText(this.props.text);
    clearTimeout(this.state.timer);

    this.setState({
      timer: setTimeout(() => {
        this.setState({ timer: 0 });
      }, 1500)
    });
  }

  render() {
    return (
      <span>
        <button aria-label="Copy to Clipboard" onClick={this.copy}>📋</button>{' '}
        {this.state.timer > 0 && <span className="fade-in-out tooltip">Copied!</span>}
      </span>
    );
  }
}
