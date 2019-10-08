import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

function Snacks(props) {
  var SnacksStyles = {
    width: "20em",
    marginBottom: "1em",
    marginLeft: "auto",
    marginRight: "auto",
    borderColor: "#5ce1e6"
  };

  var headerStyles = {
    backgroundColor: "#5ce1e6"
  };

  return (
    <div style={SnacksStyles} className="card">
      <div className="card-header" style={headerStyles}>
        Snacks
      </div>
      <div className="card-body">
        {props.snacks}
      </div>
    </div>
  );
}

Snacks.propTypes = {
  snacks: PropTypes.string,
  dispatch: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    snacks: state.snacks
  }
}

export default connect(mapStateToProps)(Snacks);