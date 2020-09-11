import React from 'react';
import './sentence-generation.css'
import * as math from 'mathjs'
import ClipLoader from "react-spinners/ClipLoader";
import Badge from 'react-bootstrap/Badge'
import AutosizeInput from 'react-input-autosize';

export default class Sen extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      sentence: null,
      guessedWord: null,
      prevScore: 0,
      correctIndex: null,
      signalPhr: null,
      hintWords: <div>Guess a word to start producing hints</div>,
      loading: false,
      guesses:0,
      inputValue: ''
    }
    this.guessHandle = this.guessHandle.bind(this)
    this.handleInput = this.handleInput.bind(this)
  }

  componentDidMount() {
    this.initRandom()
  }

  initRandom() {
    fetch('http://localhost:9999/api/w2v/randsent')
    .then(response => response.json())
    .then(sent => {
      sent = sent.split(' ')
      this.setState({
        sentence: sent, 
        correctIndex: Math.floor(Math.random()*sent.length)
      })
      console.log(sent[this.state.correctIndex])
    })
  }

  signalPhrase(incorrect, guessedWord) {
    if (incorrect) {
      fetch(`http://localhost:9999/api/w2v/similarity/${guessedWord}/${this.state.sentence[this.state.correctIndex]}`)
      .then(response => response.json())
      .then(score => {
        this.setState(state => {
          return {
          signalPhr: parseFloat(score) > state.prevScore ? 
          <div> You are getting closer </div> : <div> You are going further away </div>,
          prevScore: parseFloat(score),
          guessedWord,
          guesses: ++state.guesses,
          inputValue: ''
          }})
        })
    } else if (incorrect == false) {
      this.setState({
        guessedWord,
        signalPhr: null,
        loading:false
      })
    }
  }

  handleInput(event) {
    this.setState({inputValue:event.target.value})
  }

  sentenceDisplay() {
    const elements = []
    if (!this.state.sentence) {
      return
    }
    if (this.props.step == 2) {
      for (let [i, word] of this.state.sentence.entries()) {
        if ( i == this.state.correctIndex ) {
          elements.push(<AutosizeInput inputClassName="input" className="inputDiv" style={{ fontSize: 35 }}          value={this.state.inputValue} 
            onChange= {this.handleInput} onKeyDown={this.guessHandle} autoFocus/>)
        } else {
          elements.push(<span className="sentWord">{word}</span>)
        }
        elements.push(<span className="sentWord"> </span>)
      }
    } else if (this.props.step == 3) {
      for (let [i, word] of this.state.sentence.entries()) {
        if ( i == this.state.correctIndex ) {
          elements.push(<span className="correctWord">{word}</span>)
        } else {
          elements.push(<span className="sentWord">{word}</span>)
        }
        elements.push(<span className="sentWord"> </span>)
      }
    }
    return <div>{elements}</div>
  }

  guessHandle(e) {
    if (e.key !== 'Enter') {
      return
    }
    this.setState({
      loading:true
    })
    
    if (e.target.value.toString() == this.state.sentence[this.state.correctIndex]) {
      this.signalPhrase(false, e.target.value.toString())
      this.props.onGotCorrect()
    } else {
      this.signalPhrase(true, e.target.value.toString())
      this.signalHints(e.target.value.toString())
    }
  }

  signalHints(guessedWord) {
    if (!this.state.sentence) {
      return
    }
    return fetch(`http://localhost:9999/api/w2v/vectors/${this.state.sentence[this.state.correctIndex]}`)
    .then(response => response.json())
    .then(corrVec => {
      fetch(`http://localhost:9999/api/w2v/vectors/${guessedWord}`)
      .then(response => response.json())
      .then(guessVec => {
        if (!corrVec[0].vector || !guessVec[0].vector) {
          return
        }
        corrVec = math.matrix(corrVec[0].vector)
        guessVec = math.multiply(math.matrix(guessVec[0].vector),-1)
        let vector = math.multiply(math.add(corrVec,guessVec),(this.state.guesses+5)/20)
        guessVec = math.multiply(guessVec,-1)
        vector = math.add(guessVec,vector).toArray()

        //let sum = math.divide(math.add(corrVec, guessVec),2).toArray()
        
        fetch(`http://localhost:9999/api/w2v/neighborsvector`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({vector})
        })
        .then(response => response.json())
        .then(hintWords => {
          hintWords = hintWords.filter(value => {
            return !(value.word.toLowerCase().includes(guessedWord.toLowerCase()) ||
              guessedWord.toLowerCase().includes(value.word.toLowerCase()) ||
              value.word.toLowerCase().includes(this.state.sentence[this.state.correctIndex].toLowerCase()) ||
              this.state.sentence[this.state.correctIndex].toLowerCase().includes(value.word.toLowerCase())
              )
          })
          console.log(hintWords)
          this.setState({
            hintWords: hintWords.slice(0,10),
            loading:false
          })
        })
      })
    })
  }

  renderHints() {
    if (this.state.loading ==true) {
      return <div><ClipLoader
      size={50}
      loading={this.state.loading}
    /></div>
    }

    if (!this.state.hintWords.length) {
      return this.state.hintWords
    }

    const elements = []
    for (let word of this.state.hintWords) {
      elements.push(<span className='hintWords'><Badge variant="secondary">{word.word}</Badge>{' '}</span>)
    }
    return <div>{elements}</div>
  }

  render() {

    return <div> {this.state.signalPhr}{this.sentenceDisplay()}{this.renderHints()}</div>
  }
}