const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Meetings = {
  getMonth: val => {
    let monthAlpha;
      months.forEach(month => {
         if (/[0-9]/.test(val)) {
          monthAlpha = months[val - 1];
         } else if (month.toLowerCase().startsWith(val.toLowerCase())) {
          monthAlpha = month;
         }
     });
     return (monthAlpha || 'Invalid Month');
  },
  getDay: day => (day[0] == 0) ? day[1] : day,
  getOrdinal: day => {
    let ordInd;
    if (day > 3 && day < 21) {
        ordInd ='th';
        return ordInd;
    }
      switch (day % 10) {
          case 1:  {
            ordInd ='st'; 
            return ordInd;
          }
          case 2:  {
            ordInd ='nd'; 
            return ordInd;
          }
          case 3:  {
            ordInd ='rd'; 
            return ordInd;
          }
          default: {
            ordInd ='th'; 
            return ordInd;
          }
      }
  },
  getNewMeetingText: meeting => {
    const {
      name,
      location,
      day,
      ordinal,
      month,
      year,
      time: {
        hour,
        minutes,
      },
      duration,
      description
    } = meeting;

    let template = `*${name}*\n:round_pushpin:\t${location}\n:spiral_calendar_pad:\t${day}${ordinal} ${month} ${year}\n:clock3:\t${hour}:${minutes}\n:hourglass_flowing_sand:\t${duration}`;
    if (description) {
      template += `\n:memo:\t${description}`
    }
    return template;
  }
}

module.exports = Meetings;