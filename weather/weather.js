const request = require('request');

let getWeather = (lat, long, firstencodedAddress, secondencodedAddress, formatAddress, callback) => { //API calls to darksky using request.
  request({
    url: `https://api.darksky.net/forecast/e3521c883641e2da77cb7aeed8f193ec/${lat},${long}`,
    json: true
  }, (error, response, body) => { //handles the response
    if(!error && response.statusCode === 200){  // if no error occurs; if response code is vaild.
      let hourTempArray= body.hourly.data;
      getDuration(firstencodedAddress, firstencodedAddress, secondencodedAddress, hourTempArray, (errorMessage, durationResults) => { //calls to getDuration, which will print data barring errors.
          if (errorMessage) {
            console.log(errorMessage);
          }
      });
      callback(undefined, {});
    }
    else {
      callback('Unable to fetch weather.');
    }
  });
};

let getDuration = (formatAddress, firstencodedAddress, secondencodedAddress, hour, callback) => {
  request({ //Uses google's api again, this time to be able to know the duration of the trip within the weather calls.
    url: `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${firstencodedAddress}&destinations=${secondencodedAddress}&key=AIzaSyAMvnzVsnosw3LbKilZCEwJlLUG5Fbyfuo`,
    json: true
  }, (error, response, body) => {
    if (body.rows[0] === undefined){
      callback('Unable to compute trip time. Check if the destination entered is correct.');
    }
    else {
        if(body.rows[0].elements[0].duration === undefined) {
          callback('Unable to compute trip time. Check if the starting address entered is correct. ');
        }
        else {
          duration = body.rows[0].elements[0].duration.text;
          let timeArray = duration.split(" ");
          let hoursAway;
          if(timeArray[1] === 'hours'){       //Separates the duration into hours. If it's over 48, due to limited data from darksky, the weather will only be taken 48 hours from the current time.
            hoursAway = Number(timeArray[0]);
          }
          else if(timeArray[1] === 'days'){
            if(Number(timeArray[1] === 1)){
              hoursAway = (Number(timeArray[0]) * 24) + (Number(timeArray[2]));
              conosle.log(hoursAway);
            }
            else{
              hoursAway = 48;
              console.log('Note: Temperature estimation for destination is for 48 hours away due to limited data');
            }
          }
          else {
          hoursAway = 1;      //If the trip is less than an hour, defaults to the next hour's weather.
          }
          console.log(`At ${formatAddress}:`);
          console.log(`It is estimated that it will be ${hour[hoursAway].temperature} degrees Fahrenheit and the humidity will be ${hour[hoursAway].humidity * 100}% upon arrival`)
          callback(undefined, {});
        }
    }
  });
};

module.exports.getWeather = getWeather;
module.exports.getDuration = getDuration;
