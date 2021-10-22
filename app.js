require('dotenv/config');
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const dgram = require('dgram');

const server = dgram.createSocket('udp4');

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const queueURL = 'https://sqs.us-east-2.amazonaws.com/350359568306/udpListenerSQS.fifo';


server.on('error', (err) => {
  console.log(`server error: \n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got message: ${msg.toString()} from ${rinfo.address}:${rinfo.port}`);
  server.send(msg, rinfo.port, rinfo.address, (err, bytes) => {
    if(err) throw err;
    console.log('UDP response sent to: ' + rinfo.address + ':' + rinfo.port);
  });

  const params = {
    MessageBody: msg.toString(),
    MessageDeduplicationId: 'test',
    MessageGroupId: 'Group1',
    QueueUrl: queueURL
  };
  
  sqs.sendMessage(params, function(err, data) {
    if(err) {
      console.log('Error', err);
    } else {
      console.log('Success', data.MessageId);
    }
  });
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening on ${address.address}:${address.port}`);
});

server.bind(PORT, HOST);