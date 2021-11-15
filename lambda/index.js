/*
======================================================
Copyright Città di Torino - 2021
SPDX-License-Identifier: EUPL-1.2-or-later
======================================================
*/

/*
!!! ATTENZIONE !!! 
I TESTI PRESENTI IN QUESTO FILE VENGONO LETTI ALL'UTENTE
E' NECESSARIO, QUINDI, PERSONALIZZARLI IN BASE AL PROPRIO UTILIZZO
*/

'use strict';
const Alexa = require('ask-sdk-core');
const utilities = require('utilities');
const certificatoService = require('certificato.js');
const { config } = require('config.js');
const APP_NAME = "CertificaTO";
const EMAIL_PERMISSION = "alexa::profile:email:read";
var profileEmail;



var speechText = {};

var checosafare = [
    " C'è qualcosa che posso fare per te",
    " Che cosa posso fare per te?",
    " Come ti posso aiutare?",
    " Dimmi come ti posso aiutare!",
    " Come posso aiutarti?",
    " Posso fare qualcosa per te?"
];

// LAUNCH
speechText.launch = {
    welcome: {
        speak: "Ciao ##NOME## ##COGNOME##! Se sei nata o nato a NOME ENTE, tramite questo servizio sperimentale dicendo \"mandami il certificato\" o \"dammi il certificato\", ti invierò il tuo certificato di nascita all'indirizzo email ##MAIL##. Che cosa posso fare per te?",
        reprompt: "Puoi dire \"aiuto\" se non sai che cosa chiedermi.",
    },
    welcomeBack: {
        speak: "Bentornato!",
        reprompt: "Bentornato!"
    }
};

// HELLO INTENT
speechText.hello = {
    speak: "Ciao! Puoi dire \"dammi una mano\" se non sai che cosa chiedermi.",
    reprompt: "Puoi dire \"dammi una mano\" se non sai che cosa chiedermi."
};

// HELP INTENT
speechText.help = {
    speak: "Dicendo \"mandami il certificato\" o \"dammi il certificato\", ti invierò via email il pdf del tuo certificato anagrafico di nascita.",
    reprompt: "Dicendo \"mandami il certificato\" o \"dammi il certificato\", ti invierò via email il pdf del tuo certificato anagrafico di nascita."
}

// MESSAGGIO DI CONCLUSIONE POST ESITO CERTIFICATO
const endCertOutput = 'Grazie per aver utilizzato questo servizio sperimentale';
var endOKCertOutput = 'Guarda la tua email ##EMAIL## e troverai il certificato richiesto.\n'+endCertOutput;
const endKOCertOutput = 'Mi spiace, non riesco a ritrovare il tuo certificato.\n'+endCertOutput;

// AUTORIZZAZIONI
speechText.auth = {
    noEmail: "Ciao! Per poter utilizzare questo servizio, devi consentire a questa Skill di accedere all'indirizzo e-mail associato al tuo account Amazon.",
    noAccountLinking: "Ciao! Per poter utilizzare questo servizio, devi eseguire il collegamento account. Puoi farlo dalla sezione 'impostazioni' della skill della tua app Alexa."
}

// ERRORI
speechText.error = {
    datiUtente: 'Si è verificato un problema durante il recupero dei tuoi dati utente. Riprova tra qualche minuto.'
}

const PERMISSIONS = ['alexa::profile:email:read'];



// =============================================
// RICHIESTA DI AVVIO
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
        
        // ====================================================================
        // CONTROLLI AUTORIZZAZIONE EMAIL - ACCOUNT LINKING
        
        // verifico autorizzazione utilizzo email
        const upsServiceClient = handlerInput.serviceClientFactory.getUpsServiceClient();
        try{
            profileEmail = await upsServiceClient.getProfileEmail();
        }
        catch(err){
            // l'utente non ha ancora dato l'autorizzazione all'utilizzo della mail
            return responseBuilder
                .speak(speechText.auth.noEmail)
                .withAskForPermissionsConsentCard(PERMISSIONS)
                .withShouldEndSession(true)
                .getResponse();
        }
        
        // verifico account linking
        const accessToken = requestEnvelope.context.System.user.accessToken;
        if (accessToken === undefined) {
            return responseBuilder
                .speak(speechText.auth.noAccountLinking)
                .withLinkAccountCard()
                .withShouldEndSession(true)
                .getResponse();
        }
        // ====================================================================
        
        // messaggio di attesa
        await callDirectiveService(handlerInput,"avvio");
        
        var utente = await certificatoService.infoUtente(accessToken);
        var speakOutput;
        if(utente.codice === "OK"){
            // salvataggio in sessione dei parametri recuperati dal WS
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            sessionAttributes.nome = utente.nome;
            sessionAttributes.cognome = utente.cognome;
            sessionAttributes.email = profileEmail;
            sessionAttributes.cf = utente.cod_fiscale;
            if (typeof config.CFdemoList !== 'undefined' && config.CFdemoList.length > 0) {
                if(config.CFdemoList.indexOf(utente.cod_fiscale) > -1){
                    sessionAttributes.nome = "UTENTE";
                    sessionAttributes.cognome = "DEMO";
                }
            }
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            
            speakOutput = speechText.launch.welcome.speak;
            speakOutput = speakOutput.replace('##NOME##', sessionAttributes.nome);
            speakOutput = speakOutput.replace('##COGNOME##', sessionAttributes.cognome);
            speakOutput = speakOutput.replace('##MAIL##', sessionAttributes.email);
        }
        else{
            speakOutput = "Si è verificato un problema durante il recupero dei dati utente. Riprovare tra qualche minuto."
        }
        return responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .withSimpleCard(APP_NAME, speakOutput)
            .getResponse();
    }
};

// INVIO CERTIFICATO 
const invioCertificatoHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'invioCertificato';
    },
    async handle(handlerInput) {
        const { requestEnvelope, responseBuilder } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if(sessionAttributes.email){
            profileEmail = sessionAttributes.email
            // messaggio di attesa
            await callDirectiveService(handlerInput,"email");
            
            const respCert = await certificatoService.generaCertificatoAsync(sessionAttributes.cf, profileEmail);
            const responseBuilder = handlerInput.responseBuilder;
            if(respCert.codice === 200 || respCert.codice === 201){
                speechText = endOKCertOutput
                speechText = speechText.replace('##EMAIL##', profileEmail);
                console.log("["+respCert.codice+"-"+respCert.messaggio+"]");
                console.log('invioCertificato (step2step) a '+profileEmail);
                return responseBuilder
                    .speak(speechText)
                    .withSimpleCard(APP_NAME, speechText)
                    .withShouldEndSession(true)
                    .getResponse();
            }
            else{
                // non ho trovato il certificato termino la sessione della skill
                return responseBuilder
                  .speak(endKOCertOutput)
                  .withSimpleCard(APP_NAME, endKOCertOutput)
                  .withShouldEndSession(true)
                  .getResponse();
            }
        }
        else{
            // accesso diretto all'intent. l'utente non è passato dalla 'LaunchRequest'
            
            // ====================================================================
            // CONTROLLI AUTORIZZAZIONE EMAIL - ACCOUNT LINKING
            
            // verifico autorizzazione utilizzo email
            const upsServiceClient = handlerInput.serviceClientFactory.getUpsServiceClient();
            try{
                profileEmail = await upsServiceClient.getProfileEmail();
            }
            catch(err){
                // l'utente non ha ancora dato l'autorizzazione all'utilizzo della mail
                return responseBuilder
                    .speak(speechText.auth.noEmail)
                    .withAskForPermissionsConsentCard(PERMISSIONS)
                    .withShouldEndSession(true)
                    .getResponse();
            }
            
            // verifico account linking
            const accessToken = requestEnvelope.context.System.user.accessToken;
            if (accessToken === undefined) {
                return responseBuilder
                    .speak(speechText.auth.noAccountLinking)
                    .withLinkAccountCard()
                    .withShouldEndSession(true)
                    .getResponse();
            }
            // ====================================================================
        
            // messaggio di attesa
            await callDirectiveService(handlerInput,"email");
            
            var utente = await certificatoService.infoUtente(accessToken);
            var speakOutput;
            if(utente.codice === "OK"){
                // eseguo chiamata a WS di certificato per la generazione del certificato ed invio alla mail indicata
                const respCert = await certificatoService.generaCertificatoAsync(utente.cod_fiscale, profileEmail);
                const responseBuilder = handlerInput.responseBuilder;
                if(respCert.codice === 200 || respCert.codice === 201){
                    speechText = endOKCertOutput
                    speechText = speechText.replace('##EMAIL##', profileEmail);
                    console.log("["+respCert.codice+"-"+respCert.messaggio+"]");
                    console.log('invioCertificato (diretto) a '+profileEmail);
                    return responseBuilder
                        .speak(speechText)
                        .withSimpleCard(APP_NAME, speechText)
                        .withShouldEndSession(true)
                        .getResponse();
                }
                else{
                    // non ho trovato il certificato termino la sessione della skill
                    return responseBuilder
                        .speak(endKOCertOutput)
                        .withSimpleCard(APP_NAME, endKOCertOutput)
                        .withShouldEndSession(true)
                        .getResponse();
                }
            }
            else{
                speakOutput = "Si è verificato un problema durante il recupero dei dati utente. Riprovare tra qualche minuto."
                return responseBuilder
                    .speak(speakOutput)
                    .withSimpleCard(APP_NAME, speakOutput)
                    .withShouldEndSession(true)
                    .getResponse();
            }
            
        }
    }
}

// RISPOSTA AL SALUTO
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
    },
    async handle(handlerInput) {
        let speechOutput = speechText.hello.speak + utilities.randomSpeak(checosafare)
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(APP_NAME, speechOutput)
            .reprompt(speechText.hello.reprompt + utilities.randomSpeak(checosafare))
            .getResponse();
    }
}

// AIUTO
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speechOutput = speechText.help.speak + utilities.randomSpeak(checosafare)
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(APP_NAME, speechOutput)
            .reprompt(speechText.help.reprompt + utilities.randomSpeak(checosafare))
            .getResponse();
    }
};

// INTERRUZIONE SKILL
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      ( request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent' || 
        (handlerInput.requestEnvelope.request.type === 'IntentRequest'));
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    const speechOutput =  'A ri-sentirci, grazie per avere utilizzato questa skill. Ti ricordo che sullo store Alexa puoi trovare altre skill di Città di NOME ENTE.';

    return responseBuilder
      .speak(speechOutput)
      .withSimpleCard(APP_NAME, speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

// ERRORE
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Si è verificato un errore: ${error.stack}`);
        const speakOutput = "Scusa, ho avuto un problema mentre eseguivo la tua richiesta. Ritorna tra poco.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

function callDirectiveService(handlerInput, type) {
  // Call Alexa Directive Service.
  const requestEnvelope = handlerInput.requestEnvelope;
  const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

  const requestId = requestEnvelope.request.requestId;
  const endpoint = requestEnvelope.context.System.apiEndpoint;
  const token = requestEnvelope.context.System.apiAccessToken;

    let text = '';
    if(type==="avvio"){
        text = "Attendi un attimo che recupero i tuoi dati."
    }
    else{
        text = "Aspetta qualche istante che preparo il pdf del tuo certificato."
    }

  // build the progressive response directive
  const directive = {
    header: {
      requestId,
    },
    directive:{ 
        type:"VoicePlayer.Speak",
        speech: text
    },
  };
  // send directive
  return directiveServiceClient.enqueue(directive, endpoint, token);
}


// ====================================================================================================
// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        invioCertificatoHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
