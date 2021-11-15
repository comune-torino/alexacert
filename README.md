# Prodotto
Alexacert

# Descrizione del prodotto
Questo prodotto rappresenta il proof of concept per una applicazione vocale, su Alexa, che consente, in modo semplice, di richiedere un certificato e di riceverlo nella propria  casella di posta elettronica.
In questo prototipo, il certificato utilizzato è quello di nascita, che ha il vantaggio di essere esente bollo, utilizzando una chiamata all’Anagrafe di Torino.
L’utente che utilizza l’assistente vocale viene identificato, una tantum, attraverso il collegamento tra l’utente Amazon e l’identità digitale (es: SPID). Questa operazione di identificazione è svolta una sola volta ed è valida sino a revoca esplicita.
Quando l’utente attiva l’applicazione con  ‘Alexa, parla con certificati Torino’, l’utente viene riconosciuto, viene ricordata la casella di email che verrà utilizzata per il recapito (quella definita nel profilo di Amazon), e gli viene richiesto di confermare la richiesta di certificato. Al suo assenso il sistema provvede a richiedere all’Anagrafe/ANPR il certificato (in pdf) e ad inviarlo alla casella registrata.


# Prerequisiti di sistema
Dipendenza da Alexa-skill-kit-sdk-for-nodejs ovvero da
"ask-sdk-core": "^2.6.0",
"ask-sdk-model": "^1.18.0",
"aws-sdk": "^2.326.0"

# Installazione

## FASE 1: IMPORT DELLA SKILL
1. Andare sulla [console sviluppatori di Alexa](https://developer.amazon.com/alexa/console/ask) (se non si dispone di un account Amazon è necessario crearlo)
2. Cliccare sul pulsante ["Crea una skill"](https://developer.amazon.com/alexa/console/ask/create-new-skill) per creare una nuova skill
3. Nella pagina di creazione della skill
	a. Nel campo "skill name" indicare il nome della skill. Questo sarà il nome che verrà visualizzato nello store Alexa e la frase di invocazione per l'apertura della skill (questa può essere cambiata). 
	b. Tra i modelli da selezionare selezionare il modello "Custom" (quello preselezionato)
	c. Tra i metodi di hosting della skill selezionare "Alexa-hosted (Node.js)" (quello preselezionato)
	d. Selezionare la hosting region più vicina al target dei tuoi utenti
	e. Cliccare sul pulsante "Create skill"
4. Nella pagina di selezione del template, cliccare su "Import skill", inserire la url del progetto [GitHub](https://github.com/comune-torino/alexacert) e concludere il processo cliccando su "Import"
5. Dopo alcuni minuti, necessari per l'import, la skill è pronta per l'uso con l'intent di richiesta di generazione del certificato, le sue utterance e i codici già predisposti.

Un percorso alternativo invece dell'importazione della skill da [GitHub](https://github.com/comune-torino/alexacert) può essere il seguente:
4. Nella pagina di selezione del template, selezionare il template base (quello preselezionato) e cliccare su "Continue with template"
5. Dopo alcuni minuti, viene creata una skill con degli intent, utterance e codice base.
6. Nel tab "Build" sotto la voce laterale "Interaction Model" cliccare su "JSON editor".
7. Nel campo di testo predisposto, rimuovere il codice esistente e sostituirlo con il codice del file json del Interaction Model. Cliccare sul pulsante "Build Model". La skill ora avrà l'intent di generazione del certificato e le sue utterance.
8. Nel tab "Code", nella cartella "Lambda" modificare o inserire i file come copia di quelli presenti nella cartella "lambda" del progetto.  Cliccare sul pulsante "Deploy". La skilla avrà ora i codici necessari per far funzionare la skill (Un'altra opzione può essere l'utilizzo dell'importazione dei codici utilizzando la funzionalità "Import code" sempre nel tab "Code")

N.B.) La skill ha un intent "invioCertificato" con certe utterance precompilate. Cliccando su "Intents"->invioCertificato (tab "Build") è possibile rimuovere, modificare e aggiungere le utterance associate a questo intent. 
Dopo le modifiche è necessario rifare il build della skill.

## FASE 2: AGGANCIO SERVIZI
La skill per funzionare deve avere due servizi:
1. **SERVIZIO CHE RESTITUISCE INFORMAZIONI SULL'UTENTE** 
2. **SERVIZIO CHE GENERA IL CERTIFICATO E LO INVIA ALLA MAIL**

> Le url di aggancio dei due servizi devono essere inserite nel file config.js al posto dei placeholder *##URL_SERVIZIO_INFO_UTENTE##* e *##URL_SERVIZIO_GENERAZIONE_CERTIFICATO_E_INVIO_MAIL##*.

1) **SERVIZIO CHE RESTITUISCE INFORMAZIONI SULL'UTENTE**
passa in GET l'access token di Alexa e ottiene un JSON con alcune informazioni dell'utente recuperate a seguito dell'account linking

* input: uuid Alexa (user access token restituito da Alexa nel requestEnvelope, dopo aver fatto account linking)
* output: json con le informazioni dell'utente (NOME, COGNOME, CODICE FISCALE)

Es. di risposta del WS:
```
- OK: {"codice":"OK","nome":"UTENTE","cognome":"DEMO","cod_fiscale":"AAAAAA00A11A000A"}
- ERRORE: {"codice":"KO", "messaggio":"NO CF"}
```

2) **SERVIZIO CHE GENERA IL CERTIFICATO E LO INVIA ALLA MAIL**
passa in GET il codice fiscale dell'utente e la mail alla quale deve essere inviato il certificato

* input: codice fiscale e mail alla quale inviare il certificato
* output: json con le informazioni del processo

Es. di risposta del WS:
```
- OK: {"codice":"200", "messaggio":"certificato inviato via mail"}
- ERRORE: {"codice":"400", "messaggio":"certificato non inviato"}
```

## FASE 3: PERSONALIZZAZIONE TESTI PARLATI
I testi presenti nel codice index.js devono essere modificati e personalizzati in base al proprio utilizzo

# Versioning
Per il versionamento del software si usa la tecnica Semantic Versioning (http://semver.org).
L'attuale versione del software è la 0.5

# Copyrights
© Copyright Città di Torino - 2021
	
# License
SPDX-License-Identifier: EUPL-1.2-or-later
Vedere il file LICENSE per i dettagli.

