var socket = io();

// Elementer
var messagesDiv = document.getElementById('messages');
var calendarDiv = document.getElementById('upcoming-events');
var shoppingListUl = document.getElementById('shoppingList');
var mealPlanDiv = document.getElementById('mealSuggestions');

// Motta initial data fra serveren
socket.on('initialData', function(data) {
    updateMessages(data.messages);
    updateShoppingList(data.shoppingList);
    updateCalendar(data.calendarEvents);
});

// Motta oppdaterte meldinger fra serveren
socket.on('updateMessages', function(messages) {
    updateMessages(messages);
});

// Motta oppdatert handleliste fra serveren
socket.on('updateShoppingList', function(shoppingList) {
    updateShoppingList(shoppingList);
});

// Motta oppdatert kalender fra serveren
socket.on('updateCalendar', function(calendarEvents) {
    updateCalendar(calendarEvents);
});

// Funksjoner for å oppdatere innholdet på siden
function updateMessages(messages) {
    messagesDiv.innerHTML = '';
    messages.forEach(function(msg) {
        var messageElem = document.createElement('div');
        messageElem.className = 'item';
        messageElem.textContent = msg.text;
        messagesDiv.appendChild(messageElem);
    });
}

function updateShoppingList(shoppingList) {
    shoppingListUl.innerHTML = '';
    shoppingList.forEach(function(item) {
        var itemElem = document.createElement('li');
        itemElem.textContent = item.text;
        shoppingListUl.appendChild(itemElem);
    });
}
// Funksjon for å hente og vise rullende RSS-feed
async function loadRSSFeed() {
    try {
        const response = await fetch('/rss'); // Hent RSS fra serveren
        const items = await response.json(); // Parse JSON-objektet med RSS-nyheter

        const marqueeContent = document.querySelector('.marquee-content');
        marqueeContent.innerHTML = ''; // Tømmer eksisterende innhold

        // Legg til nyheter i rullende tekst
        items.forEach(item => {
            const newsLink = document.createElement('a');
            newsLink.href = item.link;
            newsLink.textContent = item.title;
            newsLink.target = '_blank'; // Åpne lenker i en ny fane
            marqueeContent.appendChild(newsLink);
        });
    } catch (error) {
        console.error('Feil ved henting av RSS-feed:', error);
    }
}

// Kall funksjonen når siden lastes
window.addEventListener('DOMContentLoaded', loadRSSFeed);

// Oppdater RSS-feed automatisk hver 15. minutt
setInterval(loadRSSFeed, 15 * 60 * 1000); // Oppdaterer hver 15. minutt


// Funksjon for å formatere tekst som en dato (for sortering)
function parseDateFromText(eventText) {
    const datePattern = /\b(\d{4})-(\d{2})-(\d{2})\b/; // Mønster for å finne datoer i formatet YYYY-MM-DD
    const match = eventText.match(datePattern);
    if (match) {
        return new Date(match[1], match[2] - 1, match[3]); // Konverter til Date-objekt
    }
    return null; // Returner null hvis ingen dato blir funnet
}

// Oppdatere kalenderhendelser og sortere etter dato
function updateCalendar(events) {
    calendarDiv.innerHTML = '';

    // Sortere hendelser etter dato (stigende rekkefølge)
    const sortedEvents = events.sort((a, b) => {
        const dateA = parseDateFromText(a.text);
        const dateB = parseDateFromText(b.text);
        return dateA - dateB; // Sorter etter dato
    });

    sortedEvents.forEach(function(event) {
        var eventElem = document.createElement('div');
        eventElem.className = 'event';
        eventElem.innerHTML = `
            <h3>${event.text}</h3>
        `;
        calendarDiv.appendChild(eventElem);
    });
}

// Oppdatere middagsplanen (AI-forslag)
function updateMealPlan(suggestions) {
    const suggestionDiv = document.getElementById('mealSuggestions');
    suggestionDiv.innerHTML = suggestions; // Viser middagsforslaget
}

// Fetch AI meal suggestions and display them
async function fetchMealSuggestions() {
    try {
        const response = await fetch('/ai-menu');
        const data = await response.json();
        updateMealPlan(data.suggestions);
    } catch (error) {
        console.error('Error fetching meal suggestions:', error);
    }
}

// Funksjon for å hente og vise rullende RSS-feed
async function loadRSSFeed() {
    try {
        const response = await fetch('/rss'); // Hent RSS fra serveren
        const items = await response.json(); // Parse JSON-objektet med RSS-nyheter

        const marqueeContent = document.querySelector('.marquee-content');
        marqueeContent.innerHTML = ''; // Tømmer eksisterende innhold

        // Legg til nyheter i rullende tekst
        items.forEach(item => {
            const newsLink = document.createElement('a');
            newsLink.href = item.link;
            newsLink.textContent = item.title;
            newsLink.target = '_blank'; // Åpne lenker i en ny fane
            marqueeContent.appendChild(newsLink);
        });
    } catch (error) {
        console.error('Feil ved henting av RSS-feed:', error);
    }
}

// Kall funksjonen når siden lastes
window.addEventListener('DOMContentLoaded', loadRSSFeed);

// Oppdater RSS-feed automatisk hver 15. minutt
setInterval(loadRSSFeed, 15 * 60 * 1000); // Oppdaterer hver 15. minutt




// Fetch meal suggestions on page load
fetchMealSuggestions();
