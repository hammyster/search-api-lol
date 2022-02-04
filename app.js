const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const request = require("request");
const fs = require('fs');
let apikey = "API-KEY";

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
    res.render("index");
});

app.post("/summoner", function (req, res) {
    var q = req.body.q;
    res.redirect("/summoner/" + q);
});

app.get("/summoner/:summonername", function (req, res) {
    var summonerName = encodeURIComponent(req.params.summonername);

    getLastVersion(function (latestVersion) {
        getSummonerID(summonerName, function (responseSummoner) {
            var summ = JSON.parse(responseSummoner)
            if (summ !== 404) {
                getEntriesSummoner(summ.id, function (responseEntries) {
                    var league = JSON.parse(responseEntries)
                    if (league !== 404) {
                        for (var i = 0; i < league.length; i++) {
                            if (league[i].queueType == "RANKED_SOLO_5x5") {
                                league = league[i];
                            }
                        }
                        getChampionsMastery(summ.id, function (responseChampions) {
                            var champion = JSON.parse(responseChampions);
                            if (champion !== 404) {
    
                                console.log(champion[0])
    
                                if (champion[0] !== undefined) {
                                    var champs = champion[0]
                                    var date = new Date(champs.lastPlayTime)
    
                                    getDataChampion(champs.championId, function (championsJson) {
                                        var c = [championsJson.name, champs.championLevel, champs.championPoints, date, championsJson.image.full]
    
                                        res.render("summoner", {
                                            version: latestVersion,
                                            summ: summ,
                                            league: league,
                                            champion: c
                                        });
                                    })
                                } else {
                                    var c = [0]
    
                                    res.render("summoner", {
                                        version: latestVersion,
                                        summ: summ,
                                        league: league,
                                        champion: c
                                    });
                                }
                            } else {
                                res.render("404");
                            }
                        })
    
                    } else {
                        res.render("404");
                    }
                })
            } else {
                res.render("404");
            }
        })
    })
});

function getSummonerID(summonerName, callback) {
    request("https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + summonerName + "?api_key=" + apikey, function (error, response, body) {
        if (response.statusCode === 200) {
            callback(body)
        } else {
            callback("404")
        }
    })
}

function getEntriesSummoner(summonerID, callback) {
    request("https://br1.api.riotgames.com/lol/league/v4/entries/by-summoner/" + summonerID + "?api_key=" + apikey, function (error, response, body) {
        if (response.statusCode === 200) {
            callback(body)
        } else {
            callback("404")
        }
    })
}

function getChampionsMastery(summonerID, callback) {
    request("https://br1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/" + summonerID + "?api_key=" + apikey, function (error, response, body) {
        if (response.statusCode === 200) {
            callback(body)
        } else {
            callback("404")
        }
    })
}

function getDataChampion(id, callback) {
    getLastVersion(function (latestVersion) {
        request("https://ddragon.leagueoflegends.com/cdn/" + latestVersion + "/data/pt_BR/champion.json", function (error, response, body) {
            if (response.statusCode === 200) {
                let list = JSON.parse(body);
                let championList = list.data;
                for (var i in championList) {
                    if (championList[i].key == id) {
                        callback(championList[i])
                    }
                }
            }
        })
    })
}

function getLastVersion(callback){
    request("https://ddragon.leagueoflegends.com/api/versions.json", function (error, response, body) {
        if (response.statusCode === 200){
            let version = JSON.parse(body)
            callback(version[0])
        }
    })
}

app.get("*", function (req, res) {
    res.render("404");
});


app.listen(3000, function () {
    console.log("Server started!");
});
