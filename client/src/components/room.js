import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { inputRequired, positiveIntegerRange } from './validators';
import ErrorList from './errorlist';
import socket from './socket';

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fields: {
        title: {
          args: {
            type: 'text',
            id: 'gameTitle',
            defaultValue: 'Concentrate!',
            required: true
          },
          label: 'Title',
          filters: [(value) => { return value.trim(); }],
          validators: [inputRequired],
          errors: []
        },
        limit: {
          args: {
            type: 'number',
            id: 'gameLimit',
            defaultValue: 4,
            required: true,
            min: 1,
            max: 4
          },
          label: 'Player Limit',
          filters: [],
          validators: [positiveIntegerRange],
          errors: []
        },
        pairs: {
          args: {
            type: 'number',
            id: 'gamePairs',
            defaultValue: 52,
            required: true,
            min: 1,
            max: 52
          },
          label: 'Distinct Card Pairs',
          filters: [],
          validators: [positiveIntegerRange],
          errors: []
        }
      },
      redirect: ''
    };

    this.newRoom = this.newRoom.bind(this);
  }

  newRoom(event) {
    event.preventDefault();
    let formHasErrors = false;
    let values = {};

    Object.entries(this.state.fields).forEach(([key, field]) => {
      let errors = [];
      let value = event.target[field.args.id].value;

      field.filters.forEach((filter) => {
        value = filter(value);
      });

      values[key] = value;

      field.validators.forEach((validator) => {
        validator(value, errors, field);
      });

      formHasErrors = formHasErrors || errors.length > 0;

      this.setState((prevState) => {
        return {
          ...prevState,
          fields: {
            ...prevState.fields,
            [key]: {
              ...prevState.fields[key],
              args: {
                ...prevState.fields[key].args
              },
              errors: errors
            }
          }
        };
      });
    });

    if (formHasErrors) {
      return;
    }

    socket.emit('newGame', values);
    socket.on('newGameRedirect', (timestamp) => {
      this.setState({ redirect: socket.id + '/' + timestamp });
      socket.off('newGameRedirect');
    });
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to={'/game/' + this.state.redirect} />;
    }

    return (
      <main>
        <h1>Create a Room</h1>
        <form onSubmit={this.newRoom}>
          {Object.entries(this.state.fields).map(([key, field]) => {
            return (
              <div key={key}>
                <label htmlFor={field.args.id}>{field.label}</label>{' '}
                <input {...field.args} />
                <ErrorList errors={field.errors} />
              </div>
            );
          })}
          <div>
            <input type="submit" value="Create" />
          </div>
        </form>
      </main>
    );
  }
}
