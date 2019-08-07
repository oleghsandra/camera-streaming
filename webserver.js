process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    console.log(err.stack);
  });
  
  const express = require('express');
  const raspividStream = require('raspivid-stream');
  
  const app = express();
  const wss = require('express-ws')(app);
  
  const Blinkt = require('node-blinkt');
  const leds = new Blinkt();
  leds.setup();
  

  leds.setAllPixels(255, 255, 255, 1);
  leds.sendUpdate();
  setTimeout(updateLeds, 1000);
  
  app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
  
  app.ws('/video-stream', (ws, req) => {
      console.log('Client connected');
      updateLeds();
  
      ws.send();
  
      var videoStream = raspividStream({ rotation: 0 });
  
      videoStream.on('data', (data) => {
          ws.send(data, { binary: true }, (error) => { if (error) console.error(error); });
      });
  
      ws.on('close', () => {
          console.log('Client left');
          updateLeds();
          videoStream.removeAllListeners('data');
      });
  });
  
  function updateLeds() {
      const clientCount = wss.getWss().clients.size;
      console.log('Updating leds to show', clientCount, 'clients');
  
      leds.clearAll();
  
      for (let i = 0; i < clientCount; i++) {
          let colors = [0, 0, 0];
          colors[Math.floor(i / 8)] = 255;
  
          leds.setPixel(i % 8, ...colors, 1);
      }
  
      leds.sendUpdate();
  }
  
  app.use(function (err, req, res, next) {
    console.error(err);
    next(err);
  })
  
  app.listen(8182, () => console.log('Server started on 8182'));