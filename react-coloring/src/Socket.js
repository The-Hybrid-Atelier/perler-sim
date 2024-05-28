let _ = require('underscore');

function makeSocket(name, recordingEvent, setRecordings, setScreen){
  //const wsURL = "ws://0.0.0.0:3040";
  const wsURL = "ws://162.243.120.86:3040";

  console.log("Connecting to ", wsURL)
  const socket = new WebSocket(wsURL);
  socket.name = name;
  socket.IDCOUNT = 100;
  socket.onmessage = function(result){
    const obj = JSON.parse(result.data)

    console.log(obj)
    if(obj && obj.event === recordingEvent){
      console.log("NEW RECORDING", obj)
      // obj.data.name = "R"+socket.IDCOUNT
      // obj.data.id = socket.IDCOUNT;
      // socket.IDCOUNT++;
      setRecordings(recordings => [...recordings, obj])
      setScreen("pulse")
    }
  }
  socket.onopen = function(event){
    this.greet();
    this.subscribe("haws-server", recordingEvent)
  }
  socket.onclose = function(event){
    console.log(event)
  }
  socket.onerror = function(event){
    console.error(event)
  }
  socket.greet = function(){
    socket.jsend({name: socket.name, event: 'greeting'})
  }
  socket.subscribe = function(sender, service){
    console.log("SUBSCRIBING", {subscribe: sender, service: service})
    this.jsend({subscribe: sender, service: service})
  }
    
  socket.unsubscribe = function(sender, service){
    this.jsend({unsubscribe: sender, service: service})
  }

  socket.jsend = function(msg){
    if(socket.readyState == 1){
      this.send(JSON.stringify(msg));
      console.log(">>", msg);
    }
    else{
      console.log("SIM >>", msg);
    }
  }
  socket.pulse = function(){
    socket.jsend({"api":{"command":"VISCOSENSE", "params": {"material": "test"}}})
  }
  socket.start_recording = function(){
    socket.jsend({"api":{"command":"RECORD_START"}})
  }
  socket.end_recording = function(name, color, abbv, pulses){
    let msg = {"api":
      {command:"RECORD_END",
        params:{
            material: name,
            pulses: pulses,
            name: name,
            color: color,
            abbv: abbv
          }
      }
    }
    socket.jsend(msg);
  }
  socket.timeouts = []
  socket.sense = function(name, color, abbv, pulses){
    const DELAY = 3000;
    setScreen("sensing")
    console.log("SENSING", name, "x", pulses);
    let scope = socket
    socket.start_recording()
    _.each(_.range(pulses), function(el){
      scope.timeouts.push(setTimeout(scope.pulse, 1000+(el*DELAY)));
    })
    scope.timeouts.push(setTimeout(()=>scope.end_recording(name, color, abbv, pulses), pulses * DELAY + 1000)); 
  }
  socket.emergency_stop = function(){
    _.each(socket.timeouts, function(el){ 
      console.log(" Process", el, "terminated");
      clearTimeout(el);
    });
    socket.timeouts = [];
    setScreen("sense")
  }
  socket.clear_out = function(){
    socket.jsend({api:
      {command:"BLOW"}
    });
  }
  return socket
}

export {makeSocket};
