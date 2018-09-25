// var http = require('http');
//
// http.createServer(function (req, res) {
//
//     res.writeHead(200, { 'Content-Type': 'text/html' });
//     res.end('Hello, world!');
//
// }).listen(process.env.PORT || 8080);
//
var MikroNode = require('mikronode');
var Device =new MikroNode('172.16.1.1',8728);


const query = {
  interface: ('/interface/print',['=.proplist=fp-rx-byte,fp-tx-byte,name']),
  fail: ('/interface/print',['=.name=master'])
}

function connect() {
  return new Promise((resolve, reject) => {
    Device.connect().then(([login])=>login('admin','herma123').then(conn => {
      return resolve(conn); //results
    }).catch((err)=>{
      console.log("Error during processing:",err);
      reject(err);
    }));
  });
}

getInterfacesBPS().then(a => console.log(a)).catch(err => console.log(err));
// getUsersInfo().then(a => console.log(a)).catch(err => console.log(err));

function getInterfacesBPS() {  // get bytes pear second
  return new Promise((resolve, reject) =>{
    connect().then(conn => {
      const ch = conn.openChannel('listen');
      ch.closeOnDone(true);
      ch.done.subscribe(data => {
         resolve(parseDataToJson(data.data));
      });
      ch.trap.subscribe(err =>{
        reject(err.data[0].value);
      });
      ch.write('/interface/print');
    }).catch(err => {
      reject(err);
    });
  });
}

function getUsersInfo() {  // get bytes in and out, seccion time, seccion time left
  return new Promise((resolve, reject) =>{
    connect().then(conn => {
      const ch = conn.openChannel('listen');
      ch.closeOnDone(true);
      ch.done.subscribe(data => {
      //  console.log(data.data);
        resolve(parseDataToJson(data.data));
      });
      ch.trap.subscribe(err =>{
        reject(err.data[0].value);
      });
      ch.write('/ip/hotspot/active/print', ['=.proplist=mac-address,uptime,session-time-left,bytes-in,bytes-out,login-by']);
    }).catch(err => {
      reject(err);
    });
  });
}

function parseDataToJson(data) { // [{},{}.....{}]
    let response = [];
    data.forEach(element => {
      let subResponse = {}
      element.forEach(subElement => {
        subResponse[subElement.field] = subElement.value;
      });
      response.push(subResponse);
    });
    return response;
}


// connect().then(function(conn) {
//   var c1=conn.openChannel();
//   var c2=conn.openChannel();
//   c1.closeOnDone(true);
//   c2.closeOnDone(true);
//
//   //
//   console.log('Getting Interfaces');
//     // c1.write('/ip/hotspot/active/print',['=.proplist=mac-address,uptime,session-time-left,bytes-in,bytes-out']);
//     c1.write('/interface/print',['=.proplist=fp-rx-byte,fp-tx-byte,name'])
//
//    // cWifiSignalAndData.write('/interface/wireless/registration-table/print');
//  '/interface/set',{'disabled':'yes','.id':'ether1'} // set query
//   // console.log('Getting routes');
//   // c2.write('/ip/route/print');
//
//
//   c1.data.subscribe(e => {
//     if (e.data) {
//       let response = {};
//       e.data.forEach(element => {
//         response[element.field] = element.value;
//       });
//       console.log(response);
//     }
//   });
//
//
//   }).catch();

//     conn.close();
