import React                  from 'react';
import ReactDOM               from 'react-dom';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions    from './actions';
import Login           from './user/Login.jsx';
import LoggedIn        from './user/LoggedIn.jsx';
import ArtistSearch    from './artist/ArtistSearch.jsx';
import SearchContainer from './artist/SearchContainer.jsx'
import ArtistsList     from './artist/ArtistsList.jsx';
import VizContainer    from './viz/VizContainer.jsx';
import                      './global.scss';

class App extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      showArtistSearch: false,
      artistRes: null,
    };
    this.handleClick = this.handleClick.bind(this);
  }
  componentDidMount() {
    window.addEventListener('click', this.handleClick, false);
    
    this.props.actions.requestValidation();
  }
  componentWillUnmount() {
    window.removeEventListener('click', this.handleClick, false)
  }
  artistSearchResults(search) {

  }
  getRelatedArtists(id) {

  }
  d3dblclick(partialState, cb) {
    this.getRelatedArtists(partialState.clickedNode.id)
    return this.setState(partialState, cb);
  }
  handleClick(e) {
    // if (this.state.showArtistSearch) {
    //   const area = ReactDOM.findDOMNode(this.refs.area);
    //   if (!area.contains(e.target)) {
    //     this.setState({showArtistSearch: false});
    //   }
    // }
  }
  renderViz() {
    if (this.props.forceData) {
      return (
        <VizContainer 
          forceData={this.props.forceData} 
          d3dblclick={(partialState, cb) => this.d3dblclick(partialState, cb)} 
        /> 
      )
    } else {return null;}
  }
  render() {
    if (!this.props.userData) {
      return (
        <Login />
      )
    }
    return (
      <div>
        <div className="nav">
          <SearchContainer />
          <LoggedIn userData={this.props.userData} />
        </div>
        {this.renderViz()}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    forceData: state.forceData,
    access_token: state.auth.access_token,
    userData: state.auth.userData
  };
}
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(Actions, dispatch)
  };
}

export default App = connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
