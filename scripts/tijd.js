﻿var timer;
function popup(optie) {
    $('#optieVergeten').css("display", "none");
    $('#optieWerkend').css("display", "none");
    $('#popupKeuzeKlik').click();
    if (optie == 'stopVergeten') {
        $('#optieVergeten').fadeIn();
    } else {
        $('#optieWerkend').fadeIn();
    }
}

function loadData() {
    $('#containerStart, #containerStop, #containerKeuze').css('display', 'none');

    $.ajax({
        datatype: 'json',
        url: url + "/api/TijdLog/GetTijdLogsVanMedewerker/" + mdwID,
        data: null,
        success: function (data) {
            tijdLogs = data;
            $.each(tijdLogs, function (index, value) {
                value['tijdstempel'] = moment(value['tijdstempel']);
            })

            clearInterval(timer);
            bepaalSituatie();
        },
        error: function (e) {
            melding("De data is niet opgehaald.");
        }
    });
}

function bepaalSituatie() {
    //de eerste value in de array van tijdlogs zal het tijdstip van gisteren zijn indien vergeten of het tijdstip van vandaag als het niet vergeten is
    vandaag = moment();
    var tijdAanHetWerk = moment(0);
  
    if (tijdLogs.length == 0) {
        $('#start').fadeIn();
    } else {
        if (vandaag.diff(tijdLogs[0]['tijdstempel'], 'day') == 0 && tijdLogs[0]['type'] == 'START') {
            //dit zal enkel gebeuren als ik in de controller de tijdLog van de vorige dag heb toegevoegt.
            $('#containerKeuze').find("p").html("Uw laatste log dateert van <b>" + tijdLogs[0]["tijdstempel"].format("LLLL") + "</b>. <br> Bent u nog aan het werken of bent u vergeten uit te checken?");
            $('#containerKeuze').fadeIn();
            $('#optieVergeten').find("p").html("Uw laatste log dateert van <b>" + tijdLogs[0]["tijdstempel"].format("LLLL") + "</b>. <br> Tot hoe laat heeft u gewerkt op deze dag?");
            $('#optieWerkend').find("p").html("Gelieve te bevestigen dat u aan het werk bent sinds<br> <b>" + tijdLogs[0]["tijdstempel"].format("LLLL") + "</b>");
            console.log(tijdLogs[0]);
        } else if (vandaag.diff(tijdLogs[0]['tijdstempel'], 'day') >= 1 && tijdLogs[0]['type'] == 'START') {
            $('#containerVergeten').find("p").html("Uw laatste log dateert van <b>" + tijdLogs[0]["tijdstempel"].format("LLLL") + "</b>. <br> Tot hoe laat heeft u gewerkt op deze dag?");
            $('#containerVergeten').fadeIn();
        } else {
            //de laatste waarde in de array tijdLogs is de startdatum
            //de eerste waarde in de array tijdLogs is de voorgaande tijdLog
            if (tijdLogs[1] == null || tijdLogs[1]['type'] == 'STOP') {
                $('#containerStart').fadeIn();
            } else {
                $('#containerStop').fadeIn();

                for (var i = 0; i < tijdLogs.length; i = i + 2) {
                    tijdAanHetWerk.add(tijdLogs[i]['tijdstempel'].diff(tijdLogs[i + 1]['tijdstempel']));
                }

                $('#tijdAanHetWerk').text(moment(tijdAanHetWerk).format("H:mm:ss"));

                $("#progressbar").progressbar({
                    value: tijdAanHetWerk.valueOf(),
                    max: moment.duration(tijdLogs[0]['commentaar']).valueOf() - 3600000
                });

                $("#progressbarLabel").text(moment.utc(moment.duration(tijdLogs[0]['commentaar']).valueOf()).format("HH:mm:ss"));

                timer = setInterval(function () {
                    tijdAanHetWerk += 1000;
                    $('#tijdAanHetWerk').text(moment(tijdAanHetWerk).format("H:mm:ss"));

                    $("#progressbar").progressbar({
                        value: tijdAanHetWerk.valueOf(),
                        max: moment.duration(tijdLogs[0]['commentaar']).valueOf() - 3600000
                    });
                }, 1000);
            }
        }
    }
    $('#commentaar').fadeIn();
    getLocatie();
}

function updateProgress() {

}

function post(type, vergeten) {
    var tijdstempelVroeger;
    var tijdstempel = moment;
    vandaag = moment();
    getLocatie();

    $('.commentaar').each(function () {
        commentaar += $(this).val();
    });

    if (vergeten == "stopVergetenKeuze") {
        opmerking = "De medewerker heeft vergeten uit te checken.";
        tijdstempelVroeger = moment(tijdLogs[0]['tijdstempel']);
        tijdstempel = moment(tijdLogs[0]['tijdstempel']);

        var tijd = $('#vergetenKeuze').val();
        console.log()
        if (parseInt(tijd.substring(0, 2)) >= 24 || parseInt(tijd.substring(2, 4)) > 60) {
            melding("Geen geldig tijdstip opgegeven");
            return;
        }

        tijdstempel = tijdstempel.hour(tijd.substring(0, 2));
        tijdstempel = tijdstempel.minute(tijd.substring(2, 4));
        tijdstempel = tijdstempel.second(0);

        if (tijdstempel < tijdstempelVroeger) {
            melding("De tijd moet later dan " + tijdstempelVroeger.hour() + "u" + tijdstempelVroeger.minute() + " zijn.");
            return;
        }
    }

    if (vergeten == "stopVergeten") {
        opmerking = "De medewerker heeft vergeten uit te checken.";
        tijdstempelVroeger = moment(tijdLogs[0]['tijdstempel']);
        tijdstempel = moment(tijdLogs[0]['tijdstempel']);

        var tijd = $('#vergeten').val();
        console.log()
        if (parseInt(tijd.substring(0, 2)) >= 24 || parseInt(tijd.substring(2, 4)) > 60) {
            melding("Geen geldig tijdstip opgegeven");
            return;
        }

        tijdstempel = tijdstempel.hour(tijd.substring(0, 2));
        tijdstempel = tijdstempel.minute(tijd.substring(2, 4));
        tijdstempel = tijdstempel.second(0);

        console.log("Na: " + tijdstempelVroeger.format() + " - " + tijdstempel.format());

        if (tijdstempel < tijdstempelVroeger) {
            melding("De tijd moet later dan " + tijdstempelVroeger.hour() + "u" + tijdstempelVroeger.minute() + " zijn.");
            return;
        }
    }

    if (vergeten == "stopWerkend") {
        opmerking = "De medewerker heeft doorgewerkt tot de volgende dag.";
        nacht = true;
    }

    var tijdlog = { tijdLogID: 0, mdwID: mdwID, tijdstempel: tijdstempel, latitudeLongitude: positie, commentaar: commentaar, opmerking: opmerking, type: type, nacht: nacht };

    $.ajax({
        url: url + '/api/TijdLog/PostTijdLog',
        type: 'POST',
        async: false,
        contentType: 'application/json',
        data: JSON.stringify(tijdlog),
        success: function (data) {
            loadData();
        },
        error: function (e) {
            melding("Error: " + e.message);
        },
        dataType: 'json',
        contentType: "application/json"
    });
}

function getLocatie() {
    if (navigator.geolocation) {
        var geoSuccessHandler = function (position) {
            positie = position.coords.latitude + ";" + position.coords.longitude
        };

        var geoErrorHandler = function (error) {
            positie = "";
            opmerking = "De medewerker heeft geweigert zijn geolocatie mee te geven.";
            melding("U heeft uw browser niet toegelaten om de locatie op te halen");
        };

        var positionOptions = {
            enableHighAccuracy: true,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(geoSuccessHandler, geoErrorHandler, positionOptions);
    } else {
        positie = "";
        opmerking = "De browser van deze medewerker ondersteund geolocatie niet.";
        melding("uw browser ondersteund locatievoorziening niet");
    }
}