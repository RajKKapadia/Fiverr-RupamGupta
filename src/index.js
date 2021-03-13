// external packages
const express = require('express');
require('dotenv').config();

// Start the webapp
const webApp = express();

// Webapp settings
webApp.use(express.urlencoded({
    extended: true
}));
webApp.use(express.json());

// Server Port
const PORT = process.env.PORT;

// Home route
webApp.get('/', (req, res) => {
    res.send(`Hello World.!`);
});

// Google Dialogflow Webhook
webApp.post('/webhook', async (req, res) => {

    let action = req.body.queryResult.action;

    console.log(`This is the action -> ${action}`);

    let responseText = {};

    responseText['fulfullmentText'] = 'From the webhook.';

    res.send(responseText);
});

const GD = require('../helper-functions/google-dialogflow');

const INTENTS = [
    'User Chooses SV Price',
    'User Provides Video Type'
];

// Website widget route
webApp.get('/website', async (req, res) => {

    let text = req.query.text;
    let sessionId = req.query.mysession;

    let intentData = await GD.detectIntent(text, sessionId);

    intentData.message['flag'] = 'no';

    if (INTENTS.includes(intentData.message.intentName)) {
        intentData.message['flag'] = 'yes';
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (intentData.status == 200) {
        res.send(intentData.message);
    } else {
        res.send('Chatbot is having problem. Try again after sometime.');
    }
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});