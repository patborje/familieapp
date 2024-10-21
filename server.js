require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const RSSParser = require('rss-parser');
const rssParser = new RSSParser();
const Groq = require('groq-sdk');

// Groq API client initialization
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Koblet til MongoDB!'))
  .catch((error) => console.error('MongoDB tilkoblingsfeil:', error));

// Define schemas and models
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

const Message = mongoose.model('Message', messageSchema);
const ShoppingItem = mongoose.model('ShoppingItem', shoppingItemSchema);
const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

// Middleware for parsing JSON
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle RSS feed route
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

// Function to call Groq API for meal suggestions
async function getGroqChatCompletion(meals) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Du er en hjelpsom assistent som foreslår spennende og varierte ukemenyer for en familie på 3 (to voksne og én ett år gammel gutt). Du tar hensyn til smakspreferanser og ernæringsbehov for både voksne og barn, og sørger for at alle ingredienser er lett tilgjengelige i norske dagligvarebutikker. Etter hvert måltidsforslag, inkluderer en detaljert handleliste med ingredienser. Du er en ekspert på norsk, så du skriver alt på norsk',
        },
        {
          role: 'user',
          content: `Here are the meals we had this week: ${meals.map(meal => meal.text).join(', ')}. Can you suggest a new meal plan for the next week, suitable for a family with a one-year-old? Skriv på Norsk.`,
        },
      ],
      model: 'mixtral-8x7b-32768', // Example model from Groq
    });

    return response.choices[0]?.message?.content || 'No suggestions available';
  } catch (error) {
    console.error('Error while requesting Groq API:', error);
    throw new Error('Could not fetch AI menu suggestions.');
  }
}

// Route to get AI-generated menu suggestions on Fridays
app.get('/ai-menu', async (req, res) => {
  try {
    // Fetch meal data from MongoDB
    const meals = await Message.find(); // Assuming messages are being used to store meals
    const suggestions = await getGroqChatCompletion(meals);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).send('Could not fetch AI menu suggestions');
  }
});

io.on('connection', async (socket) => {
  console.log('En bruker koblet til');

  const messages = await Message.find();
  const shoppingList = await ShoppingItem.find();
  const calendarEvents = await CalendarEvent.find();

  socket.emit('initialData', {
    messages,
    shoppingList,
    calendarEvents,
  });

  // Handle new message
  socket.on('newMessage', async (msg) => {
    const message = new Message({
      id: uuidv4(),
      text: msg,
    });
    await message.save();

    const messages = await Message.find();
    io.emit('updateMessages', messages);
  });

  // Handle message editing
  socket.on('editMessage', async ({ id, newText }) => {
    await Message.updateOne({ id }, { text: newText });
    const messages = await Message.find();
    io.emit('updateMessages', messages);
  });

  // Handle message deletion
  socket.on('deleteMessage', async (id) => {
    await Message.deleteOne({ id });
    const messages = await Message.find();
    io.emit('updateMessages', messages);
  });

  // Handle new shopping list item
  socket.on('addShoppingItem', async (itemText) => {
    const item = new ShoppingItem({
      id: uuidv4(),
      text: itemText,
    });
    await item.save();

    const shoppingList = await ShoppingItem.find();
    io.emit('updateShoppingList', shoppingList);
  });

  // Handle shopping list item editing
  socket.on('editShoppingItem', async ({ id, newText }) => {
    await ShoppingItem.updateOne({ id }, { text: newText });
    const shoppingList = await ShoppingItem.find();
    io.emit('updateShoppingList', shoppingList);
  });

  // Handle shopping list item deletion
  socket.on('deleteShoppingItem', async (id) => {
    await ShoppingItem.deleteOne({ id });
    const shoppingList = await ShoppingItem.find();
    io.emit('updateShoppingList', shoppingList);
  });

  // Handle new calendar event
  socket.on('addCalendarEvent', async (eventText) => {
    const event = new CalendarEvent({
      id: uuidv4(),
      text: eventText,
    });
    await event.save();

    const calendarEvents = await CalendarEvent.find();
    io.emit('updateCalendar', calendarEvents);
  });

  // Handle calendar event editing
  socket.on('editCalendarEvent', async ({ id, newText }) => {
    await CalendarEvent.updateOne({ id }, { text: newText });
    const calendarEvents = await CalendarEvent.find();
    io.emit('updateCalendar', calendarEvents);
  });

  // Handle calendar event deletion
  socket.on('deleteCalendarEvent', async (id) => {
    await CalendarEvent.deleteOne({ id });
    const calendarEvents = await CalendarEvent.find();
    io.emit('updateCalendar', calendarEvents);
  });

  socket.on('disconnect', () => {
    console.log('En bruker koblet fra');
  });
});


// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
