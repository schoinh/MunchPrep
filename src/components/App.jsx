import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Switch, Route, withRouter } from "react-router-dom";
import Error404 from "./Error404";
import Splash from "./Splash";
import UserPage from "./UserPage";
import * as actions from "./../actions";

class App extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props;
    const { watchFirebaseItems } = actions;
    dispatch(watchFirebaseItems());
  }

  render() {
    return (
      <div>
        <Switch>
          <Route exact path='/' component={Splash} />
          <Route path='/user-page' component={UserPage} />
          <Route component={Error404} />
        </Switch>
      </div>
    );
  }
}

App.propTypes = {
  masterShoppingList: PropTypes.object
};

const mapStateToProps = state => {
  return {
    masterShoppingList: state.masterShoppingList
  };
};

export default withRouter(connect(mapStateToProps)(App));
