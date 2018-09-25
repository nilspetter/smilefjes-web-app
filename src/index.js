import React from 'react';
import ReactDOM from 'react-dom';
import Popup from 'react-popup';
import './index.css';

class Page extends React.Component {
  render() {
    return (
      <div className="Page">
       <Popup />
       <InfoBoxs />
        <div className="Page-content">
          <InputFieldAndResults />
        </div>
      </div>
    );
  }
}

/**
 * Looks up in mattilsynets smilefjes-API to find the rating of the restaurant.
 * It will also make a OrganisasjonsBeskrivelse based on the orgnr retrieved from the API-call
 */
class Smilesjes extends React.Component {
  constructor() {
    super();
    this.state = {pending:false, smilefjes:"mangler", orgnr:null, navn:null, Addr:null, input:null};
  }
  async componentDidMount() {
    this.fetchSmilefjes();
  }
  async componentDidUpdate() {
    if(this.state.input != this.props.navn){
      this.fetchSmilefjes();
    }
  }
  fetchSmilefjes(){ /* MAKES the API-call */
    this.setState({pending: true, input : this.props.navn, smilefjes:null});
    const urlWithSpace = `http://hotell.difi.no/api/json/mattilsynet/smilefjes/tilsyn?query=` + this.props.navn ;
    const url = urlWithSpace.replace(/ /g , "+"); //replaces blank space with +
    fetch(url)
      .then(response => response.json())
      .then(data => this.setState({ // the last element is the most recent thus: data.entries.length-1
        smilefjes: data.entries[data.entries.length-1].total_karakter,
        orgnr: data.entries[data.entries.length-1].orgnummer,
        navn: data.entries[data.entries.length-1].navn,
        addr: data.entries[data.entries.length-1].adrlinje1,
        pending: false,
      }))
      .catch(e => this.setState({pending: false,}));
  }
  render() {
    const { pending, smilefjes, orgnr, navn, addr, input} = this.state;
    if(pending) {
      return (
        <div className="smilefjes">
          <h1>LASTER INN SMILEFJES...</h1>
        </div>);
    } else if(!smilefjes) {
      return (
        <div className="smilefjes">
          <h1>Mangler Smilefjes</h1>
        </div>);
    } else {
      return (
        <div className="smilefjes">
          <h1>{navn}</h1>
          <h2>{addr}</h2>
          <OrganisasjonsBeskrivelse orgnr={orgnr}/>
          <SmilefjesIcon rating={smilefjes}/>
        </div>
      );
    }
  }
}

/**
 * makes a emoji based on a ratingvalue
 */
class SmilefjesIcon extends React.Component {
  render() {
    if (this.props.rating == "0") {
      return (<img src="Smiling_Face_Emoji.png"alt="Stort Smilefjes"></img>);
    } else if(this.props.rating == "1") {
      return (<img src="Slightly_Smiling_Face_Emoji.png" alt="Smilefjes"></img>);
    } else if (this.props.rating == "2") {
      return <img src="Neutral_Face_Emoji.png" alt="Nøytralt Smilefjes"></img>;
    } else if (this.props.rating == "3") {
      return <img src="Very_sad_emoji_icon_png.png" alt="Surt Smilefjes"></img>;
    } else{
      return <p>ugyldig rating</p>;
    }
  }
}

/**
 * Looks up in brreg-API to find a description
 */
class OrganisasjonsBeskrivelse extends React.Component {
  state = {pending:false, beskrivelse:null, orgnr:null,};
  async componentDidMount() {
    this.fetchBeskrivelse();
  }
  async componentDidUpdate(){
    if(this.state.orgnr != this.props.orgnr) {
      this.fetchBeskrivelse();
    }
  }
  fetchBeskrivelse(){
    this.setState({pending: true, orgnr:this.props.orgnr});
    const url = `https://data.brreg.no/enhetsregisteret/api/underenheter/` + this.props.orgnr ;
    console.log(url)
    fetch(url)
      .then(response => response.json())
      .then(data => this.setState({ beskrivelse: data.naeringskode1.beskrivelse, pending: false}))
      .catch(e => this.setState({pending: false,}));
  }
  render() {
    const { pending, beskrivelse, orgnr } = this.state;
    if(!beskrivelse) {
      return (<h3>Kunne ikke finne beskrivelse av Orgnr: {orgnr} i brønnøysundregisteret</h3>);
    } else if(pending) {
      return (<h3>LASTER INN BESKRIVELSE...</h3>);
    } else return (
      <h3>{beskrivelse}</h3>
    );
  }
}

/**
 * Makes a inputfield, and on submit it takes the input and makes a smilefjes
 */
class InputFieldAndResults extends React.Component {
  constructor(props) {
    super( props );
    this.state = {value: '', name:''};
    this.handleChange = this.handleChange.bind( this );
    this.handleSubmit = this.handleSubmit.bind( this );
  }
  handleChange(event) {
    this.setState({value: event.target.value});
  }
  handleSubmit(event) {
    this.setState({name : this.state.value});
    this.setState({value : ''});
    event.preventDefault();
  }
  render() {
    if(this.state.name!=""){
      var input = this.state.name;
      return (
        <div>
          <InputField handleSubmit={this.handleSubmit} handleChange={this.handleChange} value={this.state.value} />
          <Smilesjes navn={this.state.name}/>
        </div>
      );
    }
    return (
      <div>
        <InputField handleSubmit={this.handleSubmit} handleChange={this.handleChange} value={this.state.value} />
      </div>
    );
  }
}

/**
 * Makes a searchfield and a submit-button
 */
class InputField extends React.Component {
  render() {
    return (
      <form onSubmit={this.props.handleSubmit}>
        <label>
          <input type="text" value={this.props.value} placeholder="Søk etter spisested..." onChange={this.props.handleChange} />
        </label>
        <input type="submit" value="Søk" />
      </form>
    );
  }
}

/**
 * Makes a information button.
 * if the button is clicked, it opens a infobox
 */
class InfoBoxs extends React.Component {
  handleSubmit(event) {
    var title = 'Om web-appen';
    var infomessage = 'Søk etter et navn og/eller adresse på spisested og finn ut hvilket smilefjes mattilsynet har rangert de med. ';
    infomessage+= 'Virksomhetsbeskrivelsen er hentet fra brønnøysundregisteret, basert på orgnummeret registert i smilefjesordningen. ';
    infomessage+= 'Eksempelbruk: \'Jafs tøyen\', \'Dinner Tandoori\', \'Narvesen Kirkenes\' og \'starbucks bogstadveien\' ';
    Popup.alert( infomessage, title );
    event.preventDefault();
  }
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input type="submit" value="i" className="info"/>
      </form>
    );
  }
}

ReactDOM.render(
  <Page />,
  document.getElementById('root')
);
