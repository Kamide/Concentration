import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import socket from './socket';
import ErrorList from './errorlist';
import { inputRequired, positiveIntegerRange } from './validators';

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
        },
        playerLimit: {
          args: {
            type: 'number',
            id: 'gamePlayerLimit',
            defaultValue: 4,
            required: true,
            min: 1,
            max: 4
          },
          label: 'Player Limit',
          filters: [],
          validators: [positiveIntegerRange],
          errors: []
        }
      },
      redirect: ''
    };

    this.newRoom = this.newRoom.bind(this);
  }

  validate(valueFn) {
    let formHasErrors = false;
    let values = {};

    Object.entries(this.state.fields).forEach(([key, field]) => {
      let errors = [];
      let value = valueFn({key, field});

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

    return { formHasErrors: formHasErrors, values: values };
  }

  newRoom(event) {
    event.preventDefault();
    const {formHasErrors, values} = this.validate(({field}) => event.target[field.args.id].value);

    if (formHasErrors) {
      return;
    }

    socket.emit('new_game', values);
    socket.on('new_game_status', (timestamp) => {
      if (timestamp !== null) {
        this.setState({ redirect: socket.id + '/' + timestamp });
      }
      else {
        this.validate(({key}) => values[key]);
      }

      socket.off('new_game_status');
    });
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to={'/game/' + this.state.redirect} />;
    }

    return (
      <main>
        <header className="secondary">
          <h1 className="parallelogram">Create a Room</h1>
        </header>
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
