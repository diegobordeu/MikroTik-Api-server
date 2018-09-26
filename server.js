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

// getInterfacesBPS().then(a => console.log(a)).catch(err => console.log(err));
//loginMacAddress('80:AD:16:E4:DA:DD').then(a => console.log(a, 'exito')).catch(err => console.log(err, 'fallo'));
loginMacAddressBinding('80:AD:16:E4:DA:DD').then(a => console.log(a, 'exito')).catch(err => console.log(err, 'fallo'));

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
      ch.write('/interface/print',['=.proplist=fp-rx-byte,fp-tx-byte,name']);
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

function loginMacAddressBinding(macAddress) {
  return new Promise((resolve, reject) =>{
    connect().then(conn => {
      const ch = conn.openChannel();
      ch.closeOnDone(true);
      ch.done.subscribe(data => {
        resolve(data);
      });
      ch.trap.subscribe(err =>{
        reject(err.data[0].value);
      });
      ch.write('/ip/hotspot/ip-binding/add',
      {
        'comment':'test',
        'disabled':'no',
        'type': 'bypassed',
        'mac-address': macAddress
      });
    }).catch(err => {
      reject(err);
    });
  });
}

function loginMacAddress(macAddress){
  return new Promise((resolve, reject) =>{
    connect().then(conn => {
      const ch = conn.openChannel();
      ch.closeOnDone(true);
      findHostIp(macAddress, conn).then(ip => {
        ch.done.subscribe(data => {
          resolve(data);
        });
        ch.trap.subscribe(err =>{
          reject(err.data[0].value);
        });
        ch.write('/ip/hotspot/active/login',
        {
          'user':'admin', //TODO: change password pass=NODE_ENV_PROD.loginPass
          'mac-address': macAddress,
          'ip': ip
        });
      }).catch(err => {
        reject(err);
      });
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

function findHostIp(macAddress, conn) {
  return new Promise((resolve, reject) => {
    const channel = conn.openChannel();
    channel.closeOnDone(true);
    channel.done.subscribe(data => {
      const ip = getIpFromData(data.data, macAddress);
      if(ip){
        resolve(ip);
      } else {
        reject('Failed: Mac address not found in hotspot hosts list');
      }
    });
    channel.trap.subscribe(err =>{
      reject(err.data[0].value);
    });
    channel.write('/ip/hotspot/host/print');
  });
}

function getIpFromData(data, macAddress) {
  data = parseDataToJson(data);
  for(let i = 0; i < data.length; i++ ) {
    if(data[i]['mac-address'] === macAddress) {
      return data[i].address;
    }
  }
  return false;
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
