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

// Handle userProvidesVideoTypeSV
const userProvidesVideoTypeSV = (req) => {

    let videoType = req.body.queryResult.parameters.video_type;

    let outString = '';
    let link = 'https://vdofy.com/sponsored';
    let title = '';

    if (videoType === 'Gold') {
        outString += 'You have selected Gold.\nGreat choice.\nTo watch sample video please use the link.';
        link += '#gold';
        title += 'Gold video sample';
    } else if (videoType === 'Platinum') {
        outString += 'You have selected Platinum.\nGreat choice.\nTo watch sample video please use the link.';
        link += '#platinum';
        title += 'Platinum video sample';
    }

    return {
        fulfillmentMessages: [
            {
                platform: 'ACTIONS_ON_GOOGLE',
                simpleResponses: {
                    simpleResponses: [
                        {
                            textToSpeech: outString
                        }
                    ]
                }
            },
            {
                platform: 'ACTIONS_ON_GOOGLE',
                linkOutSuggestion: {
                    destinationName: title,
                    uri: link
                }
            }]
    }
};

// Handle userProvideVideoTypePV
const userProvideVideoTypePV = (req) => {

    let videoType = req.body.queryResult.parameters.video_type;

    console.log(videoType);

    let outString = `You have selected ${videoType}.\nGreat choice.\nTo watch sample video please use the link.`;
    let link = 'https://vdofy.com/';
    let title = '';

    if (videoType === 'Influencer') {
        link += 'influencer/';
        title += 'Influencer video sample';
    } else if (videoType === 'Image based') {
        link += 'amazonimagevideos/';
        title += 'Amazon image video sample';
    } else if (videoType === 'CustomMade') {
        link += 'customvideos/';
        title += 'Custom video sample';
    } else if (videoType === 'HighTouch') {
        link += 'hightouch/';
        title += 'High touch video sample';
    }

    return {
        fulfillmentMessages: [
            {
                platform: 'ACTIONS_ON_GOOGLE',
                simpleResponses: {
                    simpleResponses: [
                        {
                            textToSpeech: outString
                        }
                    ]
                }
            },
            {
                platform: 'ACTIONS_ON_GOOGLE',
                linkOutSuggestion: {
                    destinationName: title,
                    uri: link
                }
            }]
    }
};

// Handle userProvideVideoTypeOS
const userProvideVideoTypeOS = (req) => {

    let videoType = req.body.queryResult.parameters.video_type;

    let outString = `You have selected ${videoType}.\nGreat choice.\nTo watch sample video please use the link.`;
    let link = 'https://vdofy.com/';
    let title = '';

    if (videoType === 'ReviewVideo') {
        link += 'review/';
        title += 'Review video sample';
    } else if (videoType === '360DegreeVideo') {
        link += '360videos/';
        title += '360 video sample';
    }

    return {
        fulfillmentMessages: [
            {
                platform: 'ACTIONS_ON_GOOGLE',
                simpleResponses: {
                    simpleResponses: [
                        {
                            textToSpeech: outString
                        }
                    ]
                }
            },
            {
                platform: 'ACTIONS_ON_GOOGLE',
                linkOutSuggestion: {
                    destinationName: title,
                    uri: link
                }
            }]
    }
};

// Google Dialogflow Webhook
webApp.post('/webhook', async (req, res) => {

    let action = req.body.queryResult.action;

    let responseData = {};

    if (action === 'userProvidesVideoTypeSV') {
        responseData = userProvidesVideoTypeSV(req);
    } else if (action === 'userProvideVideoTypePV') {
        responseData = userProvideVideoTypePV(req);
    } else if (action === 'userProvideVideoTypeOS') {
        responseData = userProvideVideoTypeOS(req);
    } else {
        responseData = {
            fulfillmentMessages: [
                {
                    platform: ACTIONS_ON_GOOGLE,
                    simpleResponses: {
                        simpleResponses: [
                            {
                                textToSpeech: `Something is wrong with the chatbot.`
                            }
                        ]
                    }
                }]
        }
    }

    res.send(responseData);
});

const GD = require('../helper-functions/google-dialogflow');

const INTENTS = [
    'User Chooses SV Price',
    'User Provides Video Type - PV',
    'User Provides Video Type - OS',
    'User Provides Video Type - SV',
    'A Plus Catalog'
];

// Website widget route
webApp.get('/website', async (req, res) => {

    let text = req.query.text;
    let sessionId = req.query.mysession;

    console.log('A request came.');
    console.log(`Query text --> ${text}`);
    console.log(`Session id --> ${sessionId}`);

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
        intentData.message['imageFlag'] = 'no';


        if (INTENTS.includes(intentData.message.intentName)) {
            intentData.message['flag'] = 'yes';
        }

        try {
            let data = JSON.parse(intentData.message.text);
            intentData.message['imageFlag'] = 'yes';
            intentData.message['imageData'] = {
                url: data.url,
                caption: data.caption
            };
            intentData.message.text = data.text;
        } catch (error) {

        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        if (intentData.status == 200) {
            res.send(intentData.message);
        } else {
            res.send('Chatbot is having problem. Try again after sometime.');
        }

    } else {

        intentData.message['flag'] = 'no';
        intentData.message['imageFlag'] = 'no';

        if (INTENTS.includes(intentData.message.intentName)) {
            intentData.message['flag'] = 'yes';
        }

        try {
            let data = JSON.parse(intentData.message.text);
            intentData.message['imageFlag'] = 'yes';
            intentData.message['imageData'] = {
                url: data.url,
                caption: data.caption
            };
            intentData.message.text = data.text;
        } catch (error) {

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