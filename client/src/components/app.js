import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Header from './header';
import Main from './main';
import Lobby from './lobby';
import Room from './room';
import Game from './game';
import './styles/app.css';
import './styles/keyframes.css';

export default class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Header />
        <Switch>
          <Route path='/' exact component={Main} />
          <Route path='/lobby' exact component={Lobby} />
          <Route path='/room' exact component={Room} />
          <Route path='/game/:manager/:timestamp' component={Game} />
        </Switch>
      </BrowserRouter>
    );
  }
}
