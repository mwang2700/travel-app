const yargs = require('yargs');
const axios = require('axios');

const geocode = require('./geocode/geocode');
const weather = require('./weather/weather');

let location;
let destination;
let duration;

const argv = yargs
  .options({
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

let firstencodedAddress = encodeURIComponent(argv.starting);
let secondencodedAddress = encodeURIComponent(argv.ending);

let firstgeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${firstencodedAddress}&key=AIzaSyCLCY5KoI5cSrCEFhovHkm6LPi3hm0UgUk`
let secondgeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${secondencodedAddress}&key=AIzaSyCLCY5KoI5cSrCEFhovHkm6LPi3hm0UgUk`

let distancematrix = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${firstencodedAddress}&destinations=${secondencodedAddress}&key=AIzaSyAMvnzVsnosw3LbKilZCEwJlLUG5Fbyfuo`

axios.get(distancematrix).then((response) => {
  if (response.data.destination_addresses[0] === ""){
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
  let distancestring = response.data.rows[0].elements[0].distance.text;
  let durationstring = response.data.rows[0].elements[0].duration.text;
  console.log(`Total distance for the trip is ${distancestring}, and the total estimated duration will be ${durationstring}`);
}).catch((e) => {
  console.log(e.message);
});

let geocodeCoordinates = (response) => {
  if(response.data.status === 'ZERO_RESULTS') {
    throw new Error('Unable to find the stating address');
  }
  let latitude = response.data.results[0].geometry.location.lat;
  let longitude = response.data.results[0].geometry.location.lng;
  let weatherUrl = `https://api.darksky.net/forecast/e3521c883641e2da77cb7aeed8f193ec/${latitude},${longitude}`;
  return weatherUrl;
};

let timeinSeconds = (timeString) => {
  let time = 0;
  let timeArray = timeString.split(" ");
  if(timeArray[1] === 'mins'){
    return Number(timeArray[0]) * 60;
  }
  time += Number(timeArray[0]) * 3600;
  time += Number(timeArray[2]) * 60;
  return time;
};

axios.get(firstgeocodeUrl).then((response) => {
  location = response.data.results[0].formatted_address;
  return axios.get(geocodeCoordinates(response));
}).then((response) => {
  let temperature = response.data.currently.temperature;
  let apparentTemperature = response.data.currently.apparentTemperature;
  console.log(`At ${location}:`);
  console.log(`It's currently ${temperature} degrees Fahrenheit. It feels like ${apparentTemperature}.`);
}).catch((e) => {
  if (e.code === 'ENOTFOUND'){
    console.log('Unable to connect to API servers to find starting address weather');
  }
  else {
    console.log(e.message);
  }
});

geocode.geocodeAddress(argv.ending, (errorMessage, results) => {
  if (errorMessage) {
    console.log(errorMessage);
  }
  else {
    weather.getWeather(results.latitude, results.longitude, results.address, firstencodedAddress, secondencodedAddress, (errorMessage, weatherResults) => {
        if (errorMessage) {
          console.log(errorMessage);
        }
    });
  }
});
