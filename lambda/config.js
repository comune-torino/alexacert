/*
======================================================
Copyright Città di Torino - 2021
SPDX-License-Identifier: EUPL-1.2-or-later
======================================================
*/

const config = {
    /*
    ==================================
    VARIABILI OBBLIGATORIE
    ==================================
    */
    
    //*************************************
    // URL
    
    // SERVIZIO CHE RESTITUISCE INFORMAZIONI SULL'UTENTE
    urlWSinfoUtente: '##URL_SERVIZIO_INFO_UTENTE##',
    
   // SERVIZIO CHE GENERA IL CERTIFICATO E LO INVIA ALLA MAIL
    urlWSgeneraCertificato: '##URL_SERVIZIO_GENERAZIONE_CERTIFICATO_E_INVIO_MAIL##',
    //*************************************
    
    /*
    ==================================
    VARIABILI FACOLTATIVE
    ==================================
    */
    
    // lista di utenze per le quali viene associato il nome-cognome "UTENTE DEMO" (può essere usato per testing)
    // CFdemoList : ["AAAAAA00A11A000A","BBBAAA00A11A000A"],

};
module.exports = { config };