/*
======================================================
Copyright Città di Torino - 2021
SPDX-License-Identifier: EUPL-1.2-or-later
======================================================
*/

'use strict';

const http = require('http'); 
const https = require('https'); 
/**
    A detailed list simulation strings to use in sandboxMode can be found here:
    https://pay.amazon.com/us/developer/documentation/lpwa/201956480#201956480
**/

function randomIntNum(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low)
}

function randomSpeak(arrayTxt){
    return arrayTxt[randomIntNum(0, arrayTxt.length-1)]
}

function getRemoteData(url) {
	return new Promise((resolve, reject) => {
		var client = require('http'); 
		if (url.startsWith('https'))
		    client = require('https');
		const request = client.get(url, (response) => 
		{
			if (response.statusCode < 200 || response.statusCode >= 300)
			{
				reject(new Error('Failed with statusCode '+response.statusCode));
			}
			const body = [];
			response.on('data', (chunck) => {body.push(chunck)});
			response.on('end', () => {resolve(body.join(''))});
		});
		request.on('error', (err) => reject(err));
	})
}

function getRemoteDataAsync(url) {
	return new Promise((resolve, reject) => {
		var client = require('http'); 
		if (url.startsWith('https'))
		    client = require('https');
		const req = client.get(url, (response) => 
		{
			if (response.statusCode < 200 || response.statusCode >= 300)
			{
				reject(new Error('Failed with statusCode '+response.statusCode));
			}
			const body = [];
			response.on('data', (chunck) => {body.push(chunck)});
			response.on('end', () => {resolve(body.join(''))});
		});

        // vado in timeout dopo 7 secondi
        req.on('socket', function (socket) {
            socket.setTimeout(7000);  
            socket.on('timeout', function() {
                req.abort();
            });
        });
        
        req.on('error', function(err) {
            if (err.code === "ECONNRESET") {
                console.log("La skill è andata in timeout");
                var data = {
                    codice_esito: 201,
                    messaggio: 'Timeout'
                };
			    resolve(JSON.stringify(data));
            }
            reject(new Error('Failed with statusCode '+err));
        });
	})
}

module.exports = {
    'getRemoteData': getRemoteData,
    'getRemoteDataAsync': getRemoteDataAsync,
    'randomSpeak': randomSpeak
};