// Requiered Packages
const dialogflow = require('dialogflow');
require('dotenv').config();

// Your credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

// Your google dialogflow project-id
const projectId = CREDENTIALS.project_id;

// Configuration for the client
const config = {
    credentials: {
        private_key: CREDENTIALS['private_key'],
        client_email: CREDENTIALS['client_email']
    }
}

// Create a session client
const sessionClient = new dialogflow.SessionsClient(config);

// Create a context client
const contextsClient = new dialogflow.ContextsClient(config);

const detectIntent = async (queryText, sessionId) => {

    // Create a sessionPath for the senderId
    let sessionPath = sessionClient.sessionPath(projectId, sessionId);

    let request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: queryText,
                languageCode: 'en-US',
            }
        }
    };

    try {
        let responses = await sessionClient.detectIntent(request);

        let fulfillmentMessages = responses[0].queryResult.fulfillmentMessages;
        let intentName = responses[0].queryResult.intent.displayName;
        let outputContexts = responses[0].queryResult.outputContexts;

        let message = {};
        message['text'] = '';
        message['quickReply'] = [];
        message['intentName'] = intentName;
        message['outputContexts'] = outputContexts;
        message['linkOutSuggestion'] = [];

        fulfillmentMessages.forEach(m => {
            
            if (m.platform === 'ACTIONS_ON_GOOGLE' && m.message === 'simpleResponses') {
                message['text'] = m.simpleResponses.simpleResponses[0].textToSpeech;
            } else if (m.platform === 'ACTIONS_ON_GOOGLE' && m.message === 'suggestions') {
                let qrs = m.suggestions.suggestions;
                let qrList = [];
                qrs.forEach(qr => {
                    qrList.push(qr.title);
                });
                message['quickReply'] = qrList;
            } else if (m.platform === 'ACTIONS_ON_GOOGLE' && m.message === 'linkOutSuggestion') {
                let los = m.linkOutSuggestion;
                let values = {
                    title: los.destinationName,
                    link: los.uri
                }
                message['linkOutSuggestion'].push(values);
            }
        });

        if (message['text'] === '') {
            message['text'] = responses[0].queryResult.fulfillmentText;
        }

        return {
            status: 200,
            message: message
        };

    } catch (error) {
        console.log(`Error at detectIntent --> ${error}`);
        return {
            status: 401
        };
    }
};

const setContext = async (session, contextName, lifespanCount) => {

    let formattedParent = contextsClient.sessionPath(projectId, session);

    let context = {
        name: `${formattedParent}/contexts/${contextName}`,
        lifespanCount: lifespanCount
    };

    let request = {
        parent: formattedParent,
        context: context,
    };

    try {
        await contextsClient.createContext(request);
        return 1;
    } catch (error) {
        console.log(`Error at setContext --> ${error}`);
        return 0;
    }
};

module.exports = {
    detectIntent,
    setContext
}