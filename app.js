const yargs = require('yargs');
const axios = require('axios');

const geocode = require('./geocode/geocode');
const weather = require('./weather/weather');

let location;
let destination;
let duration;

const argv = yargs
  .options({  //requires/gives info to user about the inputs required to execute the app.
    s: {
      demand: true,
      alias: 'starting',
      describe: 'Starting address of the trip',
      string: true
    },
    e: {
      demand: true,
      alias: 'ending',
      describe: 'Ending destination of the trip',
      string: true
    }
  })
  .help()
  .alias('help',  'h')
  .argv;

let firstencodedAddress = encodeURIComponent(argv.starting);  //encodes the URLs
let secondencodedAddress = encodeURIComponent(argv.ending);

let firstgeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${firstencodedAddress}&key=AIzaSyCLCY5KoI5cSrCEFhovHkm6LPi3hm0UgUk`  //Uses google's APIs to get geocode addresses.
let secondgeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${secondencodedAddress}&key=AIzaSyCLCY5KoI5cSrCEFhovHkm6LPi3hm0UgUk`

let distancematrix = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${firstencodedAddress}&destinations=${secondencodedAddress}&key=AIzaSyAMvnzVsnosw3LbKilZCEwJlLUG5Fbyfuo` //Uses google's APIs to get trip duration/time

//Using axios with distancematrix, which was an API call to Google's directions api.
axios.get(distancematrix).then((response) => {
  if (response.data.destination_addresses[0] === ""){ //error handling from API itself
    if(response.data.origin_addresses[0] === ""){
      throw new Error('Unable to find both starting and ending addresses');
    }
    throw new Error('Unable to find destination address');
  }
  else if(response.data.origin_addresses[0] === ""){
    throw new Error('Unable to find starting address');
  }
  else if(response.data.status === 'INVALID_REQUEST'){
    throw new Error('Unable to process starting and/or destination addresse(s). This probably means one or more of the fields were left empty.');
  }
  let distancestring = response.data.rows[0].elements[0].distance.text; // Isolates the distance/duration from the response returned.
  let durationstring = response.data.rows[0].elements[0].duration.text;
  console.log(`Total distance for the trip is ${distancestring}, and the total estimated duration will be ${durationstring}`);
}).catch((e) => { //error handling for use of axios.
  console.log(e.message);
});

let geocodeCoordinates = (response) => {  //Takes in geocode and uses the latitude/longitude to call to darksky.
  if(response.data.status === 'ZERO_RESULTS') {
    throw new Error('Unable to find the stating address');
  }
  let latitude = response.data.results[0].geometry.location.lat;
  let longitude = response.data.results[0].geometry.location.lng;
  let weatherUrl = `https://api.darksky.net/forecast/e3521c883641e2da77cb7aeed8f193ec/${latitude},${longitude}`;
  return weatherUrl;
};

// let timeinSeconds = (timeString) => {    // Previously used method, now unneeded
//   let time = 0;
//   let timeArray = timeString.split(" ");
//   if(timeArray[1] === 'mins'){
//     return Number(timeArray[0]) * 60;
//   }
//   time += Number(timeArray[0]) * 3600;
//   time += Number(timeArray[2]) * 60;
//   return time;
// };

//Calling API with axios
axios.get(firstgeocodeUrl).then((response) => {
  location = response.data.results[0].formatted_address;
  return axios.get(geocodeCoordinates(response));
}).then((response) => { //response that includes the data gathered from the api (current temp, humidity, feels like temp, etc etc)
  let temperature = response.data.currently.temperature;  // temperature from the response
  let humidity = response.data.currently.humidity;
  console.log(`At ${location}:`);
  console.log(`It's currently ${temperature} degrees Fahrenheit. The humidity is ${humidity * 100}%.`);
}).catch((e) => { // error handling
  if (e.code === 'ENOTFOUND'){
    console.log('Unable to connect to API servers to find starting address weather');
  }
  else {
    console.log(e.message);
  }
});

//Calling the API without axios
geocode.geocodeAddress(argv.ending, (errorMessage, results) => {
  if (errorMessage) {   //handles errors if geocode is invalid
    console.log(errorMessage);
  }
  else {
    weather.getWeather(results.latitude, results.longitude, results.address, firstencodedAddress, secondencodedAddress, (errorMessage, weatherResults) => { //uses getWeather inside weather.js which callsback
        if (errorMessage) { //error handling. Messages are already printed inside the getWeather funciton, so no need to print anything here.
          console.log(errorMessage);
        }
    });
  }
});
