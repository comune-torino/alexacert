/*
======================================================
Copyright Città di Torino - 2021
SPDX-License-Identifier: EUPL-1.2-or-later
======================================================
*/

const utilities = require('utilities');
const { config } = require('config.js');

/*
==================
SERVIZIO CHE RESTITUISCE INFORMAZIONI SULL'UTENTE 
==================

* input: uuid Alexa (user access token restituito da Alexa nel requestEnvelope, dopo aver fatto account linking)
* output: json con le informazioni dell'utente (NOME, COGNOME, CODICE FISCALE)

Es. di risposta del WS:
- OK: {"codice":"OK","nome":"UTENTE","cognome":"DEMO","cod_fiscale":"AAAAAA00A11A000A"}
- ERRORE: {"codice":"KO", "messaggio":"NO CF"}
*/
async function infoUtente(uuid) {
    var speechText = ''; 
    var url = config.urlWSinfoUtente+'&uuid='+uuid;
    console.log("('----------  chiamata a WS ACCESSO: "+url);
    var result = {};
    await utilities.getRemoteData(url)
    .then(data => {
        result = JSON.parse(data);
        result.codice = "OK"
    }).catch(err => {
        console.log("errore nella chiamata a WS ACCESSO: "+err);
        result.codice = "KO"
    });
    return result;
}

/*
==================
SERVIZIO CHE GENERA IL CERTIFICATO E LO INVIA ALLA MAIL 
==================

* input: codice fiscale e mail alla quale inviare il certificato
* output: json con le informazioni del processo

Es. di risposta del WS:
- OK: {"codice":"200", "messaggio":"certificato inviato via mail"}
- ERRORE: {"codice":"400", "messaggio":"certificato non inviato"}
*/
async function generaCertificatoAsync(cf,email) {
    const responseValues = {};
    
    var speechText = '';
    email = encodeURIComponent(email)
    var url = config.urlWSgeneraCertificato+'&cf='+cf+'&email='+email;
    console.log("('----------  chiamo: "+url);
    await utilities.getRemoteDataAsync(url)
    .then(data => {
        console.log(data);
        const jsonData = JSON.parse(data);
        speechText += jsonData.messaggio;
        responseValues.messaggio = jsonData.messaggio;
        responseValues.codice = jsonData.codice_esito;
        
    }).catch(err => {
        console.log("callback inside:"+err.message);
        speechText += 'errore';
    });
    
    return responseValues;
}
    
module.exports = {
    'infoUtente': infoUtente,
    'generaCertificatoAsync' : generaCertificatoAsync
};