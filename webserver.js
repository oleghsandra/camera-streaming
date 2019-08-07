var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(15, 'out'); //use GPIO 15 as output (pin 10)
var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

var MOTOR1a = new Gpio(2, 'out');
var MOTOR1b = new Gpio(3, 'out');

var MOTOR2a = new Gpio(4, 'out');
var MOTOR2b = new Gpio(14, 'out');

http.listen(8080); //listen to port 8080

function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    } 
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
  var lightvalue = 0; 		//static variable for current status
  var movedirection = "stop";


  pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //send button status to client
  });
  socket.on('light', function(data) { //get light switch status from client
    lightvalue = data;
    console.log(lightvalue);
    //if (lightvalue != LED.readSync()) { //only change LED if status has changed
      LED.writeSync(lightvalue); //turn LED on or off
    //}
  });


  socket.on('move', function(data) { //get light switch status from client
    movedirection = data;
    console.log(movedirection);
    //if (lightvalue != LED.readSync()) { //only change LED if status has changed

    //}

	switch(movedirection) {
	    case "forward":
		console.log("1");
	      	MOTOR1a.writeSync(1);
      		MOTOR1b.writeSync(0);
	      	MOTOR2a.writeSync(0);
      		MOTOR2b.writeSync(1);
	        break;
	    case "backward":
	        console.log("2");
	      	MOTOR1a.writeSync(0);
      		MOTOR1b.writeSync(1);
	      	MOTOR2a.writeSync(1);
      		MOTOR2b.writeSync(0);
	        break;
	    case "left":
		console.log("3");
	      	MOTOR1a.writeSync(1);
      		MOTOR1b.writeSync(0);
	      	MOTOR2a.writeSync(1);
      		MOTOR2b.writeSync(0);
	        break;
	    case "right":
	        console.log("4");
	      	MOTOR1a.writeSync(0);
      		MOTOR1b.writeSync(1);
	      	MOTOR2a.writeSync(0);
      		MOTOR2b.writeSync(1);
	        break;
	    default:
		console.log("0");
    		MOTOR1a.writeSync(0);
    		MOTOR1b.writeSync(0);
	      	MOTOR2a.writeSync(0);
      		MOTOR2b.writeSync(0);
	}

  });


});

process.on('SIGINT', function () { //on ctrl+c
console.log("0 RESET");

  // Turn GPIO off
  // Unexport GPIO to free resources
  LED.writeSync(0); 
  LED.unexport(); 

  MOTOR1a.writeSync(0);
  MOTOR1b.writeSync(0);
  MOTOR2a.writeSync(0);
  MOTOR2b.writeSync(0);
  MOTOR1a.unexport();
  MOTOR1b.unexport();
  MOTOR2a.unexport();
  MOTOR2b.unexport();

  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});