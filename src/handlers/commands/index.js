const queryStrings = require('query-string');
const _ = require('underscore');

const web = require('../../webClient');


const ics = require('ics');
const { createReadStream, writeFileSync } = require('fs');

const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

let res;

const sendEmail = () => {
  var transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
            user: EMAIL_ADDRESS,
            pass: EMAIL_PASSWORD
        }
    });
  
  ics.createEvent({
  title: 'Slack Meeting Invite 11',
  description: 'We have to work this weekend',
  start: [2019, 1, 15, 6, 30],
  duration: { minutes: 50 }
}, (error, value) => {
  if (error) {
    console.log(error)
  }
    
    res = value;
 
  // writeFileSync(`${__dirname}/event.ics`, value)
})
  
  const mailOptions = {
    from: EMAIL_ADDRESS, // sender address
    to: [EMAIL_ADDRESS], //'ceiran316@gmail.com', // list of receivers
    bcc: ['ceiran316@gmail.com', 'holmes.william@gmail.com'],
    subject: 'Slack Meeting Invite', // Subject line
    html: '<p>HELLO WORLD</p>',
    icalEvent: {
      filename: 'event.ics',
        method: 'request',
        content: res
    }
  };
  transporter.sendMail(mailOptions, function (err, info) {
     if(err)
       console.log('SEND MAILERROR', err)
     else
       console.log('SENT MAIL', info);
  });
}

const commands = (req, res) => {
    const body = queryStrings.parse(req.body.toString());
    console.log('slashCommands -> body', body);
    const { command, user_id: user, channel_id: channel, text, trigger_id } = body;
  
    if(command === '/hello') {
        console.log('HELLO');
    }
  
    console.log('TCL: commands -> text', text);
    switch(text) {
        case 'users': {
            console.log('GET USERS');
            web.users.list().then(res => {
                const { members } = res;
                const people = _.reject(members, user => user.is_bot);
                console.log('USERS', people);
            }).catch(e => console.log('ERROR', e));
            res.send();
            break;
        }
        case 'private': {
            web.chat.postEphemeral({
                user,
                channel,
                text: 'This message is only for you'
            });
            res.send();
            break;
        }
        case 'new': {
            console.log('NEW', user, channel);
            // sendEmail();
              web.chat.postEphemeral({
                  user,
                  channel,
                  attachments: [{
                      title: 'Would you like to create a new meeting?',
                      callback_id: 'create_buttons',
                      color: '#3AA3E3',
                      attachment_type: 'default',
                      actions: [{
                          name: 'decision',
                          value: 'yes',
                          style: 'primary',
                          text: 'Yes',
                          type: 'button'                      
                      }, {
                          name: 'decision',
                          value: 'no',
                          text: 'No',
                          type: 'button',
                          style: 'danger',
                      }]
                  }]
              }).catch(console.error);
              res.send();
              break;
          }
        case 'update': {
            web.chat.postMessage({
                channel,
                attachments: [{
                    title: 'Update a meeting?',
                    callback_id: 'update_buttons',
                    color: '#3AA3E3',
                    attachment_type: 'default',
                    actions: [{
                        name: 'decision',
                        value: 'yes',
                        style: 'primary',
                        text: 'Yes',
                        type: 'button'/*,
                        confirm: {
                            title: 'Update meeting?',
                            ok_text: 'Yes, im sure',
                            dismiss_text: 'Cancel'
                        */     
                    }, {
                        name: 'decision',
                        value: 'no',
                        text: 'No',
                        type: 'button',
                        style: 'danger',
                    }]
                }]
            }).catch(console.error);
            res.send();
            break;
        }
        case 'delete': {
            web.chat.postMessage({
                channel,
                attachments: [{
                    title: 'Delete a meeting?',
                    callback_id: 'delete_buttons',
                    color: '#3AA3E3',
                    attachment_type: 'default',
                    actions: [{
                        name: 'decision',
                        value: 'yes',
                        style: 'primary',
                        text: 'Yes',
                        type: 'button'/*,
                        confirm: {
                            title: 'Delete meeting?',
                            ok_text: 'Yes, im sure',
                            dismiss_text: 'Cancel'
                        }*/
                      
                    }, {
                        name: 'decision',
                        value: 'no',
                        text: 'No',
                        type: 'button',
                        style: 'danger',
                    }]
                }]
            }).catch(console.error);
            res.send();
            break;
        }
        case 'display': {
            web.chat.postMessage({
                channel,
                attachments: [{
                    title: 'Display a meeting?',
                    callback_id: 'read_buttons',
                    color: '#3AA3E3',
                    attachment_type: 'default',
                    actions: [{
                        name: 'decision',
                        value: 'yes',
                        style: 'primary',
                        text: 'Yes',
                        type: 'button'/*,
                        confirm: {
                            title: 'Delete meeting?',
                            ok_text: 'Yes, im sure',
                            dismiss_text: 'Cancel'
                        }*/
                      
                    }, {
                        name: 'decision',
                        value: 'no',
                        text: 'No',
                        type: 'button',
                        style: 'danger',
                    }]
                }]
            }).catch(console.error);
            res.send();
            break;
        }
        case 'menu': {
            res.send({
                text: 'There are many users in this team',
                response_type: 'in_channel',
                attachments: [{
                    text: 'Explore the Team Members',
                    callback_id: 'pick_sf_neighborhood',
                    actions: [{
                        name: 'neighborhood',
                        text: 'Choose a Member',
                        type: 'select',
                        data_source: 'users'
                    }],
                }]
            })
            break;
        }
        default: {
            res.send(`You can use the slash command followed by *new*, *update*, *delete*, *display*`)
        }
    }
}

module.exports = commands;