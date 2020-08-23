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
      <div>
        <button onClick={this.copy}>Copy to Clipboard</button>{' '}
        {this.state.timer > 0 && <span>Copied!</span>}
      </div>
    );
  }
}
