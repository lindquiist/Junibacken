// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// ^^ ELECTRON STANDARD KOMMENTARER

var $ = require('jquery');
var mysql = require('mysql');
var app = require('express');
var config = require('./options/config.json');
var remote = require('electron').remote


// Globala variabler
var user;
var pass;
var job_label;


// Skapar en databas-anslutning i en variabel
var cn = mysql.createConnection({
	host: config.server.host,
	database: config.server.db,
	user: config.server.user,
	password: config.server.pw
});

// Veriferar att anslutningen lyckas
cn.connect(function(err) {
	if (err) {
		console.log('Error connecting: ' + err.stack)
		return;
	}

	console.log('Connection established! Database ready to use.');
});

// Ändrar 'header' till 'Logga in' när detta dokument har laddats
$('#login-header').html('Logga in');

// Logga in knapp
$('#login-submit').click(function(req){

	// Sparar det som skrivits i input-elementen i två variablar
	user = $('#login-user').val();
	pw = $('#login-pw').val();

	// Skickar variablerna till login-functionen
	login(user, pw);
});

// Avsluta knapp efter in-loggning. 
$('#exit').click(function(req){

	// Låter 'window' vara = det aktuella fönstret så att det går att stänga
	let window = remote.getCurrentWindow();
	window.close();
});

// Telefonbok Knapp efter in-loggning
$('#telefonbok').click(function(req) {

	// När knappen har klickats, ladda body med 'body' från 'telefonbok.index' filen
	$('body').load('telefonbok.html');

	// Skapar en 'Timeout' så att body hinner ladda innan jag ändrar det andra elementen (.5 sekunder)
	var y = setTimeout(function(){
		$('title').html('Junibacken - Telefonbok');
		$('#tillbaka').css('display', 'block');
		$('#tillbaka').html('Tillbaka');
		$('#container-header').html('Telefonbok');
		$('#search').css('display', 'block');
		$('#search-button').css('display', 'block');
	}, 500);
});

// Sök-knapp i telefonboken
$('#search-button').click(function(req){

	// Sparar det användaren har mata in i en variabel. (request)
	// Samt återställer resultat-fältet.
	var request = $('#search').val();
	$('#result').html('');

	// Kollar om användern har sökt efter förnamn och efternamn.
	if (request.indexOf(' ') !== -1) {

		// Skapar en array utav 'request' där förnamn är [0] och efternamn [1].
		let x = request.split(' ');
		//console.log(x[0], x[1]);
		telefonbok_fl(x[0], x[1]);

	// Om användaren inte har sökt efter förnamn och efter namn. 
	} else {
		//console.log(request);
		telefonbok(request);
	}
});

// Tillbaka knapp efter in-loggning.
$('#tillbaka').click(function(req){

	// Loggar in återigen, för ökad säkerhet och mindrearbete
	login(user, pw);
	$('body').css('overflow-y', 'hidden');
});


//FUNCTIONS

function telefonbok_fl(firstname, lastname) { //fl = Firstname & Last

	//SQL-Query
	cn.query('SELECT * FROM users WHERE LOWER(firstname) = LOWER("' + firstname + '") AND LOWER(lastname) = LOWER("' + lastname + '");', function(err, result, fields) {
		//console.log(result);

		// En If-sats som kollar om sökningen gav resultat eller inte. 
		if (result.length <= 0) {
			$('#result').append('<p style="color: red;"> Sökningen: "' + firstname + ' ' + lastname + '" gav inget resultat.</p>');
		} else {
			for (var i = 0; i < result.length; i++) {
				$('#result').append('<p>' + result[i].firstname + ' ' + result[i].lastname + ' - Tel: ' + result[i].phone_number + '</p>');
			}
		}

		// Skapar en Scroll-function om sökningen gav fler än 15 resultat. 
		if (result.length >= 15) {
			$('body').css('overflow-y', 'scroll');
		} else {
			$('body').css('overflow-y', 'hidden');
		}
	});
}

function telefonbok(search) {
	cn.query('SELECT * FROM users WHERE LOWER(firstname) = LOWER("' + search + '") OR LOWER(lastname) = LOWER("' + search + '");', function(err, result, fields) {
		//console.log(result);
		if (result.length <= 0) {
			$('#result').append('<p style="color: red;"> Sökningen: "' + search + '" gav inget resultat.</p>');
		} else {
			for (var i = 0; i < result.length; i++) {
				$('#result').append('<p>' + result[i].firstname + ' ' + result[i].lastname + ' - Tel: ' + result[i].phone_number + '</p>');
			}
		}

		if (result.length >= 15) {
			$('body').css('overflow-y', 'scroll');
		} else {
			$('body').css('overflow-y', 'hidden');
		}
	});
}

function login(username, password){

	// Lägger till 'steam:' innan hexid. T.ex. 'steam:12345678912'
	username = 'steam:' + username;

	// SQL-Query
	// Identifier = 'steam:12345678912'
	cn.query('SELECT * FROM users WHERE identifier = "' + username + '" && lastdigits = "' + password + '";', function(err, result, fields){
		//console.log(result)

		if (result.length) {
			$('body').load('submit.html');

			// Date of birth i databasen = '19900305'
			var dateofbirth_r = result[0].dateofbirth.replace('-', '');
			// Ändrar date of birth till = '1990-03-05'
			var dob = dateofbirth_r.replace('-', '');

			// Sparar jobb samt hur pass högt uppsatt man är i en variabel. (job)
			var job = [result[0].job, result[0].job_grade];

			// Tar inventoryt på personen, detta är sparat i Json format i databasen.
			var json_loadout = result[0].loadout;
			// Läser av JSON-texten.
			var loadout = JSON.parse(json_loadout);

			var final_loadout = '';

			// Samma som json_loudout. 
			var json_status = result[0].status;
			var status = JSON.parse(json_status);

			// Sparar hunger och törst status i två variblar
			var hunger_status = status[1].percent;
			var thirst_status = status[2].percent;

			// Kollar hur många föremål det finns i inventoryt samt skriver ut det. 
			if (!(loadout.length <= 0)) {
				for (var i = 0; i < loadout.length; i++) {
					final_loadout = final_loadout + loadout[i].label + ', ';
				}
			} else {
				final_loadout = 'Tomt';
			}

			//console.log(final_loadout);

			//SQL-Query för jobb namnen. Jobb namnen finns inte i samma table som allt annat. 
			cn.query('SELECT * FROM job_grades WHERE job_name = "' + job[0] + '" && grade = ' + job[1] + ';', function(err, result, fields){
				job_label = result[0].label;
			});

			// Skapar en 'Timeout' som låter dokumentet laddas innan andra ändringar sker.
			var x = setTimeout(function(){
				$('#container-header').html(result[0].firstname + ' ' + result[0].lastname + ' - ' + job_label);
				$('#container-id').html('Personnummer: ' + dob + "-" + result[0].lastdigits);
				$('#container-bank').html('Bankkonto: ' + result[0].bank + ' kr');
				$('#container-number').html('Telefonnummer: ' + result[0].phone_number);
				$('#container-inventory').html('Loadout: ' + final_loadout);
				$('#hunger-bar').css('display', 'block');
				$('#thirst-bar').css('display', 'block');
				$('#hunger-progress').css('width', hunger_status + '%');
				$('#thirst-progress').css('width', thirst_status + '%');
				$('#telefonbok').html('Telefonbok');
				$('#exit').html('Avsluta');
				$('#telefonbok').css('display', 'block');
				$('#exit').css('display', 'block');
				$('title').html('Junibacken - ' + result[0].firstname + ' ' + result[0].lastname);
				clearTimeout(x);
			}, 1000)
		} else {

			// Om HEX ID eller lösenord inte stämmer överens.
			$('#error').html('Steam ID or Password was incorrect.');
		}
	});
}
