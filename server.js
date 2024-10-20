const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let messages = [];
let shoppingList = [];
let calendarEvents = [];

io.on('connection', (socket) => {
  console.log('En bruker koblet til');

  // Send initial data
  socket.emit('initialData', {
    messages,
    shoppingList,
    calendarEvents,
  });

  // Motta og sende meldinger
  socket.on('newMessage', (msg) => {
    messages.push(msg);
    io.emit('updateMessages', messages);
  });

  // Oppdatere handleliste
  socket.on('updateShoppingList', (list) => {
    shoppingList = list;
    io.emit('updateShoppingList', shoppingList);
  });

  // Oppdatere kalender
  socket.on('updateCalendar', (events) => {
    calendarEvents = events;
    io.emit('updateCalendar', calendarEvents);
  });

  socket.on('disconnect', () => {
    console.log('En bruker koblet fra');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
