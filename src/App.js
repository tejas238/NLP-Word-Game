import React from 'react';
import Countdown from 'react-countdown';
import Sen from './sentence-generation';
import './App.css'
import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

class Intro extends React.Component {

  constructor(props) {
    super(props)
    this.handlePlayClick = this.handlePlayClick.bind(this)
  }

  handlePlayClick() {
    this.props.onIntroChange()
  }

  render() {
    return (
    <div className='main'>
     <h1 className="title">NLP Word Game</h1>
     <Button variant="outline-primary" onClick={this.handlePlayClick}>
      Play
     </Button>
    </div>
    )
  }
}

const renderTooltip = (props) => (
  <Tooltip id="button-tooltip" {...props}>
    Guess faster to improve hints
  </Tooltip>
);

export default class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {step:1,key:1}

    this.handlePlayClick = this.handlePlayClick.bind(this)
    this.handleCompleted = this.handleCompleted.bind(this)
    this.handleAgainClick = this.handleAgainClick.bind(this)
  }

  handlePlayClick() {
    this.bg_reset()
    this.setState({step: 2})
  }

  handleCompleted() {
    this.setState({step: 3})
  }

  handleAgainClick() {
    this.setState(state => 
     {return {step: 2, key: ++state.key}})
  }

  random_bg_color() {
    var x = Math.floor(Math.random() * 256);
    var y = Math.floor(Math.random() * 100 + 156);
    var z = Math.floor(Math.random() * 100 + 156);
    var bgColor = "rgb(" + x + "," + y + "," + z + ")";

    document.body.style.background = bgColor;
  }

  bg_reset() {
    document.body.style.background = "rgb(256,256,256)"
  }

  render() {

    this.random_bg_color();
    let render;
    if (this.state.step == 1) {
      render = <Intro onIntroChange={this.handlePlayClick}/>
    } else {
      const clock = this.state.step == 2 ? <Countdown
        date={Date.now() + 60000}
        intervalDelay={0}
        precision={3}
        renderer={props => <div className='time'>{props.minutes}:{props.seconds}</div>}
        onComplete={this.handleCompleted}
        /> : null
      
      const timeUp = this.state.step == 3 ? <p>Time Up!</p> : null
      const sen = <Sen key={this.state.key} step={this.state.step} onGotCorrect={this.handleCompleted}/>
      const tryAgain = this.state.step == 3 ? 
      <OverlayTrigger
      placement="bottom"
      delay={{ show: 100, hide: 400 }}
      overlay={renderTooltip}
      >
      <Button variant="outline-secondary" onClick={this.handleAgainClick} onMouseOver> Try Again </Button></OverlayTrigger>: null

      render = <div className="sentenceDiv">{clock} {timeUp} {sen} <br/> {tryAgain}</div>
    }

    return render

  }
}

