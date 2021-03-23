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

    let responseText = {};
    responseText['fulfillmentText'] = 'From the webhook.';
    res.send(responseText);

});

const GD = require('../helper-functions/google-dialogflow');

const INTENTS = [
    'User Chooses SV Price',
    'User Provides Video Type - PV',
    'User Provides Video Type - OS'
];

// Website widget route
webApp.get('/website', async (req, res) => {

    let text = req.query.text;
    let sessionId = req.query.mysession;

    let intentData = await GD.detectIntent(text, sessionId);

    // Handle previous menu
    if (intentData.message.intentName === 'Previous Menu') {

        let outputContexts = intentData.message.outputContexts;

        let flag = -1;

        /*
            -1 --> don't do anything
            0 --> Sponsored video
            1 --> product video
            2 --> other service
        */

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/await-sv-aaq')) {
                flag = 0;
            } else if (session.includes('/contexts/await-pv-aaq')) {
                flag = 1;
            } else if (session.includes('/contexts/await-os-aaq')) {
                flag = 2;
            }
        });

        if (flag == 0) {
            intentData = await GD.detectIntent('sponsored video', sessionId);
        } else if (flag == 1) {
            intentData = await GD.detectIntent('product video', sessionId);
        } else if (flag == 2) {
            intentData = await GD.detectIntent('other service', sessionId);
        }

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

    } else {

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
    }
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});