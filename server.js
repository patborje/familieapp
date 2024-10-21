require('dotenv').config({ path: __dirname + '/.env' });
console.log('Nåværende arbeidskatalog:', process.cwd());
console.log('MONGODB_URI:', process.env.MONGODB_URI); // For å sjekke at variabelen er lastet

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const RSSParser = require('rss-parser');
const rssParser = new RSSParser();

// Koble til MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Koblet til MongoDB!'))
  .catch((error) => console.error('MongoDB tilkoblingsfeil:', error));

// Definer skjemaer
const messageSchema = new mongoose.Schema({
  id: String,
  text: String,
});

const shoppingItemSchema = new mongoose.Schema({
  id: String,
  text: String,
});

const calendarEventSchema = new mongoose.Schema({
  id: String,
  text: String,
});

// Opprett modeller
const Message = mongoose.model('Message', messageSchema);
const ShoppingItem = mongoose.model('ShoppingItem', shoppingItemSchema);
const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

// Middleware for å parse JSON (hvis nødvendig i fremtiden)
app.use(express.json());

// Serverer statiske filer fra 'public'-mappen
app.use(express.static(path.join(__dirname, 'public')));

// Håndter RSS-feed-rute (hvis du har denne funksjonaliteten)
app.get('/rss', async (req, res) => {
  try {
    const feed = await rssParser.parseURL('https://www.nrk.no/nyheter/siste.rss');
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link,
    }));
    res.json(items);
  } catch (error) {
    console.error('Feil ved henting av RSS-feed:', error);
    res.status(500).send('Kunne ikke hente RSS-feed');
  }
});

io.on('connection', async (socket) => {
  console.log('En bruker koblet til');

  // Hent data fra databasen
  const messages = await Message.find();
  const shoppingList = await ShoppingItem.find();
  const calendarEvents = await CalendarEvent.find();

  // Send data til klienten
  socket.emit('initialData', {
    messages,
    shoppingList,
    calendarEvents,
  });

  // Håndtere nye meldinger
  socket.on('newMessage', async (msg) => {
    const message = new Message({
      id: uuidv4(),
      text: msg,
    });
    await message.save();

    const messages = await Message.find();
    io.emit('updateMessages', messages);
  });

  // Håndtere redigering av meldinger
  socket.on('editMessage', async ({ id, newText }) => {
    await Message.updateOne({ id }, { text: newText });
    const messages = await Message.find();
    io.emit('updateMessages', messages);
  });

  // Håndtere sletting av meldinger
  socket.on('deleteMessage', async (id) => {
    await Message.deleteOne({ id });
    const messages = await Message.find();
    io.emit('updateMessages', messages);
  });

  // Håndtere nye handlelisteelementer
  socket.on('addShoppingItem', async (item) => {
    const shoppingItem = new ShoppingItem({
      id: uuidv4(),
      text: item,
    });
    await shoppingItem.save();

    const shoppingList = await ShoppingItem.find();
    io.emit('updateShoppingList', shoppingList);
  });

  // Håndtere redigering av handlelisteelementer
  socket.on('editShoppingItem', async ({ id, newText }) => {
    await ShoppingItem.updateOne({ id }, { text: newText });
    const shoppingList = await ShoppingItem.find();
    io.emit('updateShoppingList', shoppingList);
  });

  // Håndtere sletting av handlelisteelementer
  socket.on('deleteShoppingItem', async (id) => {
    await ShoppingItem.deleteOne({ id });
    const shoppingList = await ShoppingItem.find();
    io.emit('updateShoppingList', shoppingList);
  });

  // Håndtere nye kalenderhendelser
  socket.on('addCalendarEvent', async (event) => {
    const calendarEvent = new CalendarEvent({
      id: uuidv4(),
      text: event,
    });
    await calendarEvent.save();

    const calendarEvents = await CalendarEvent.find();
    io.emit('updateCalendar', calendarEvents);
  });

  // Håndtere redigering av kalenderhendelser
  socket.on('editCalendarEvent', async ({ id, newText }) => {
    await CalendarEvent.updateOne({ id }, { text: newText });
    const calendarEvents = await CalendarEvent.find();
    io.emit('updateCalendar', calendarEvents);
  });

  // Håndtere sletting av kalenderhendelser
  socket.on('deleteCalendarEvent', async (id) => {
    await CalendarEvent.deleteOne({ id });
    const calendarEvents = await CalendarEvent.find();
    io.emit('updateCalendar', calendarEvents);
  });

  socket.on('disconnect', () => {
    console.log('En bruker koblet fra');
  });
});

// Start serveren
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
