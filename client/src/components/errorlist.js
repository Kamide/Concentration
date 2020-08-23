import React, { Component } from 'react';

export default class ErrorList extends Component {
  render() {
    if (this.props.errors.length > 0) {
      return (
        <ul className='error'>
          {this.props.errors.map((error, index) => {
            return <li key={index}>{error}</li>;
          })}
        </ul>
      );
    }

    return null;
  }
}
