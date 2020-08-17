import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Header from './header';
import Main from './main';
import Game from './game';


export default class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Header />
        <main>
          <Switch>
            <Route path='/' exact component={Main} />
            <Route path='/game' component={Game} />
          </Switch>
        </main>
      </BrowserRouter>
    );
  }
}
