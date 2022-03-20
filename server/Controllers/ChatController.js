const express = require("express");
const db = require("../database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");

const ChatController = express.Router()

ChatController.use(express.json());
ChatController.use(cookieParser());
ChatController.use(cors({credentials: true, origin: 'http://localhost:3000'}));
ChatController.use(express.static(path.join(__dirname, "../client/build")));
ChatController.use(express.static(__dirname + "../client/public/"));
ChatController.use(bodyParser.urlencoded({extended: true}));
ChatController.use(bodyParser.json())
ChatController.use(express.static('dist'));


ChatController.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Sets ChatRequested attribute in the patient table to 1
ChatController.post("/RequestChat", (req, res) => {
    let patientID = req.body.patientid; //this PatientID is used in the query to specify which patient tuple to edit
    //parameters: ID
    //returns:
    state = "UPDATE 390db.patients SET ChatRequested=1 WHERE ID=?"
    db.query(state,
        [patientID],
        (err, results) => {
            if (err) {
                console.log(err);
            } else {
                res.send("Chat Requested!");
            }
        }
    );
});

//Sets the ChatPermission attribute in the patient table to 1 and ChatRequested attribute to 0
ChatController.post("/acceptChat", (req, res) => {
    let patientID = req.body.PatientID; //this PatientID is used in the query to specify which patient tuple to edit
    //parameters: ID
    //returns:
    state = "UPDATE 390db.patients SET ChatRequested=false WHERE ID=?"
    db.query(state, [patientID],
        (err, results) => {
            if (err) {
                console.log(err);
            }
        }
    );
    state2 = "UPDATE 390db.patients SET ChatPermission=true WHERE ID=?"
    //parameters: ID
    //returns:
    db.query(state2, [patientID],
        (err, results) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Chat accepted");
                res.send("Chat Accepted!");
            }
        }
    );
});

module.exports = ChatController;