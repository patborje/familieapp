// Polyfill for Array.prototype.find
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) throw new TypeError('"this" er null eller ikke definert');
    var o = Object(this);
    var len = o.length >>> 0;
    if (typeof predicate !== 'function') throw new TypeError('predicate må være en funksjon');
    var thisArg = arguments[1];
    var k = 0;
    while (k < len) {
      var kValue = o[k];
      if (predicate.call(thisArg, kValue, k, o)) return kValue;
      k++;
    }
    return undefined;
  };
}

var socket = io();

// Elementer
var messagesDiv = document.getElementById('messages');
var messageInput = document.getElementById('messageInput');
var sendMessageBtn = document.getElementById('sendMessage');

var calendarDiv = document.getElementById('calendar');
var eventInput = document.getElementById('eventInput');
var addEventBtn = document.getElementById('addEvent');

var shoppingListUl = document.getElementById('shoppingList');
var itemInput = document.getElementById('itemInput');
var addItemBtn = document.getElementById('addItem');

var aiMenuDiv = document.getElementById('aiMenu');
var getAiMenuBtn = document.getElementById('getAiMenu');

var messages = [];
var shoppingList = [];
var calendarEvents = [];

// Motta initial data
socket.on('initialData', function(data) {
  messages = data.messages;
  shoppingList = data.shoppingList;
  calendarEvents = data.calendarEvents;
  updateMessages();
  updateShoppingList();
  updateCalendar();
});

// Add event listener to fetch AI suggestions when the button is clicked
document.getElementById('fetchAIButton').addEventListener('click', async () => {
  try {
    const response = await fetch('/ai-menu'); // Call the AI menu endpoint
    const data = await response.json(); // Parse the response
    displayMealSuggestions(data.suggestions); // Call a function to display the meal suggestions
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
  }
});

// Function to display the meal suggestions in the UI
function displayMealSuggestions(suggestions) {
  const suggestionDiv = document.getElementById('mealSuggestions');
  suggestionDiv.innerHTML = ''; // Clear existing content
  
  const meals = suggestions.split('\n\n'); // Split by double new lines
   
  // Legg til en overskrift
  const header = document.createElement('h2');
  header.textContent = 'Forslag til ukens meny:';
  header.style.fontFamily = 'Arial, sans-serif';
  header.style.color = '#333';
  suggestionDiv.appendChild(header);

  meals.forEach(meal => {
    const mealDiv = document.createElement('div');
    mealDiv.innerHTML = meal.replace(/\n/g, '<br>'); // Replace new lines with <br> for HTML
    suggestionDiv.appendChild(mealDiv);
  });
}

// Oppdatere meldinger
function updateMessages() {
  messagesDiv.innerHTML = '';
  messages.forEach(function(msg) {
    var messageElem = document.createElement('div');
    messageElem.className = 'item';

    var messageText = document.createElement('p');
    messageText.textContent = msg.text;

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'item-buttons';

    var editButton = document.createElement('button');
    editButton.textContent = 'Rediger';
    editButton.onclick = function() {
      editMessage(msg.id);
    };

    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Slett';
    deleteButton.onclick = function() {
      deleteMessage(msg.id);
    };

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);

    messageElem.appendChild(messageText);
    messageElem.appendChild(buttonContainer);

    messagesDiv.appendChild(messageElem);
  });
}

socket.on('updateMessages', function(msgs) {
  messages = msgs;
  updateMessages();
});

sendMessageBtn.addEventListener('click', function() {
  var msg = messageInput.value.trim();
  if (msg) {
    socket.emit('newMessage', msg);
    messageInput.value = '';
  }
});

// Redigere melding
function editMessage(id) {
  var message = messages.find(function(m) { return m.id === id; });
  var newText = prompt('Rediger meldingen:', message.text);
  if (newText !== null) {
    socket.emit('editMessage', { id: id, newText: newText });
  }
}

// Slette melding
function deleteMessage(id) {
  if (confirm('Er du sikker på at du vil slette denne meldingen?')) {
    socket.emit('deleteMessage', id);
  }
}

// Oppdatere handleliste
function updateShoppingList() {
  shoppingListUl.innerHTML = '';
  shoppingList.forEach(function(item) {
    var itemElem = document.createElement('li');
    itemElem.className = 'item';

    var itemText = document.createElement('span');
    itemText.textContent = item.text;

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'item-buttons';

    var editButton = document.createElement('button');
    editButton.textContent = 'Rediger';
    editButton.onclick = function() {
      editShoppingItem(item.id);
    };

    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Slett';
    deleteButton.onclick = function() {
      deleteShoppingItem(item.id);
    };

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);

    itemElem.appendChild(itemText);
    itemElem.appendChild(buttonContainer);

    shoppingListUl.appendChild(itemElem);
  });
}

socket.on('updateShoppingList', function(list) {
  shoppingList = list;
  updateShoppingList();
});

addItemBtn.addEventListener('click', function() {
  var item = itemInput.value.trim();
  if (item) {
    socket.emit('addShoppingItem', item);
    itemInput.value = '';
  }
});

// Redigere handlelisteelement
function editShoppingItem(id) {
  var item = shoppingList.find(function(i) { return i.id === id; });
  var newText = prompt('Rediger vare:', item.text);
  if (newText !== null) {
    socket.emit('editShoppingItem', { id: id, newText: newText });
  }
}

// Slette handlelisteelement
function deleteShoppingItem(id) {
  if (confirm('Er du sikker på at du vil slette denne varen?')) {
    socket.emit('deleteShoppingItem', id);
  }
}

// Oppdatere kalender
function updateCalendar() {
  calendarDiv.innerHTML = '';
  calendarEvents.forEach(function(event) {
    var eventElem = document.createElement('div');
    eventElem.className = 'item';

    var eventText = document.createElement('p');
    eventText.textContent = event.text;

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'item-buttons';

    var editButton = document.createElement('button');
    editButton.textContent = 'Rediger';
    editButton.onclick = function() {
      editCalendarEvent(event.id);
    };

    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Slett';
    deleteButton.onclick = function() {
      deleteCalendarEvent(event.id);
    };

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);

    eventElem.appendChild(eventText);
    eventElem.appendChild(buttonContainer);

    calendarDiv.appendChild(eventElem);
  });
}

socket.on('updateCalendar', function(events) {
  calendarEvents = events;
  updateCalendar();
});

addEventBtn.addEventListener('click', function() {
  var event = eventInput.value.trim();
  if (event) {
    socket.emit('addCalendarEvent', event);
    eventInput.value = '';
  }
});

// Redigere kalenderhendelse
function editCalendarEvent(id) {
  var event = calendarEvents.find(function(e) { return e.id === id; });
  var newText = prompt('Rediger hendelse:', event.text);
  if (newText !== null) {
    socket.emit('editCalendarEvent', { id: id, newText: newText });
  }
}

// Slette kalenderhendelse
function deleteCalendarEvent(id) {
  if (confirm('Er du sikker på at du vil slette denne hendelsen?')) {
    socket.emit('deleteCalendarEvent', id);
  }
}

// Automatisk oppdatering hvert 10. sekund
setInterval(function() {
  socket.emit('requestUpdate');
}, 10000);

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;
  document.getElementById('clock').textContent = timeString;
}

// Oppdater klokken hvert sekund
setInterval(updateClock, 1000);

// Start klokken med en gang siden lastes inn
window.onload = updateClock;
