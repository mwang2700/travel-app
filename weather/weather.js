const request = require('request');

let getWeather = (lat, long, firstencodedAddress, secondencodedAddress, formatAddress, callback) => {
  request({
    url: `https://api.darksky.net/forecast/e3521c883641e2da77cb7aeed8f193ec/${lat},${long}`,
    json: true
  }, (error, response, body) => {
    if(!error && response.statusCode === 200){
      let hourTempArray= body.hourly.data;
      getDuration(firstencodedAddress, firstencodedAddress, secondencodedAddress, hourTempArray, (errorMessage, durationResults) => {
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
  request({
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
//        console.log(body.rows[0].elements[0].duration.text);
          let timeArray = duration.split(" ");
          let hoursAway;
          if(timeArray[1] === 'hours'){
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
          hoursAway = 1;
          }
          console.log(`At ${formatAddress}:`);
          console.log(`It is estimated that it will be ${hour[hoursAway].temperature} degrees Fahrenheit and feel like ${hour[hoursAway].apparentTemperature} upon arrival`)
          callback(undefined, {});
        }
    }
  });
};

module.exports.getWeather = getWeather;
module.exports.getDuration = getDuration;
