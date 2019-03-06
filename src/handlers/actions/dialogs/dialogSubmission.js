const isEmail = require('isemail');
const queryStrings = require('query-string');

const web = require('../../../webClient');

const dialogSubmission = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    const payload = JSON.parse(body.payload);
    const { callback_id } = payload;
  
    console.log('TCL: dialogSubmission -> callback_id', callback_id);
    
    switch(callback_id) {
      case 'meeting': {
        const { channel: { id: channel }, message_ts: ts, user: { id: user }, submission: { email = '' }, submission } = payload;
        /*if (!isEmail.validate(email)) {
          return res.send({
            errors: [{
              name: 'email',
              error: "Invalid Email Address"
            }]
            
          });
          break;
        }*/
        //web.chat.postEphemeral({ user, channel, text: JSON.stringify(submission) }).catch(console.error);
               
        console.log("meeting name: ", submission.name);
        console.log("location: ", submission.room);
        console.log("date: ", submission.day[0],submission.day[1], "/",submission.month[0],submission.month[1]);
        console.log("time: ", submission.start[0],submission.start[1],submission.start[2],submission.start[3],submission.start[4]);
        console.log("duration: ", submission.duration);
        console.log("details: ", submission.description);
        //console.log("manager: ", submission.manager);
        
        var mName = submission.name;
        var location = submission.room;
        var day =  submission.day;
        //var dayF =  submission.day[0];
        //var dayL =  submission.day[1];
        var month = submission.month;
        //var monthF = submission.month[0];
        //var monthL = submission.month[1];
        var hour = submission.start[0,1];
        var hourF = submission.start[0];
        var hourL = submission.start[1];
        var minute = submission.start[3,4];
        var minuteF = submission.start[3];
        var minuteL = submission.start[4];
        var duration = submission.duration;
        var details = submission.description;
        
        var monthAlpha;   
        
          if (month == '01' || month == 1 || month == 'JANUARY' || month == 'January' || month == 'january' || month == 'JAN' || month == 'Jan' || month == 'jan'){
            monthAlpha = "January";
          }
          else if (month == '02' || month == 2 || month == 'FEBUARY' || month == 'Febuary' || month == 'febuary' || month == 'FEB' || month == 'Feb' || month == 'feb'){
            monthAlpha = "Febuary";
          }
          else if (month == '03' || month == 3 || month == 'MARCH' || month == 'March' || month == 'march' || month == 'MAR' || month == 'Mar' || month == 'mar'){
            monthAlpha = "March";
          }
          else if (month == '04' || month == 4 || month == 'APRIL' || month == 'April' || month == 'april' || month == 'APR' || month == 'Apr' || month == 'apr'){
            monthAlpha = "April";
          }
          else if (month == '05' || month == 5 || month == 'MAY' || month == 'May' || month == 'may'){
            monthAlpha = "May";
          }
          else if (month == '06' || month == 6 || month == 'JUNE' || month == 'June' || month == 'june' || month == 'JUN' || month == 'Jun' || month == 'jun'){
            monthAlpha = "June";
          }
          else if (month == '07' || month == 7 || month == 'JULY' || month == 'July' || month == 'july' || month == 'JUL' || month == 'Jul' || month == 'jul'){
            monthAlpha = "July";
          }
          else if (month == '08' || month == 8 || month == 'AUGUST' || month == 'August' || month == 'august' || month == 'AUG' || month == 'Aug' || month == 'aug'){
            monthAlpha = "August";
          }
          else if (month == '09' || month == 9 || month == 'SEPTEMBER' || month == 'September' || month == 'september' || month == 'SEP' || month == 'Sep' || month == 'sep'){
            monthAlpha = "September";
          }
          else if (month == '10' || month == 10 || month == 'OCTOBER' || month == 'October' || month == 'october' || month == 'OCT' || month == 'Oct' || month == 'oct'){
            monthAlpha = "October";
          }
          else if (month == '11' || month == 11 || month == 'NOVEMBER' || month == 'November' || month == 'november' || month == 'NOV' || month == 'Nov' || month == 'nov'){
            monthAlpha = "November";
          }
          else if (month == '12' || month == 12 || month == 'DECEMBER' || month == 'December' || month == 'december' || month == 'DEC' || month == 'Dec' || month == 'dec'){
            monthAlpha = "December";
          }
          else{
            monthAlpha = "Invalid Month";
          }
        
        var ordInd;
        
        if (day[1] == 1 && day[0] == 0 || day[0] == 2 || day[0] == 3){
          ordInd = 'st';
        }
        else if (day[1] == 2 && day[0] == 0 || day[0] == 2){
          ordInd = 'nd';
        }
        else if (day[1] == 3 && day[0] == 0 || day[0] == 2){
          ordInd = 'rd';
        }
        else {
          ordInd = 'th';
        }
        
        if (day[0] == 0){
          day = day[1];
        }
        
        console.log("*********MEETING DETAILS***********");
        console.log("meeting name:\t", mName);
        console.log("meeting location:\t", location);
        console.log("meeting date:\t", day, "/", month);
        //console.log("meeting date:\t", dayF,dayL, "/", monthF,monthL);
        console.log("meeting date:\t", day,ordInd, monthAlpha);
        console.log("meeting start time:\t", hourF,hourL , ":" , minuteF,minuteL);
        console.log("meeting duration:\t", duration);
        console.log("meeting details:\t", details);
        
        console.log("day test", day);
        console.log("hourTest", hour);
        console.log("minTest", minute);
        
        res.send();
        
        web.chat.postMessage({
                channel,
                    text: '*Meeting Details*' +
                     '\nSubject:\t'+ mName +
                     '\nLocation:\t'+ location +
                     '\nDate:\t'+ day + ordInd +' ' + monthAlpha + " 2019" +
                     '\nTime:\t' + hourF + hourL + ":" + minuteF + minuteL + 
                     '\nDuration:\t' + duration + 'mins' +
                     '\nDetails:\t' + details
                
            });       
        res.send();
        break;
      }
      default:
        
    }
  };

  module.exports = dialogSubmission;