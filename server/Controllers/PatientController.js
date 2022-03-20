const express = require("express");
const db = require("../database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");

const PatientController = express.Router()

PatientController.use(express.json());
PatientController.use(cookieParser());
PatientController.use(cors({credentials: true, origin: 'http://localhost:3000'}));
PatientController.use(express.static(path.join(__dirname, "../client/build")));
PatientController.use(express.static(__dirname + "../client/public/"));
PatientController.use(bodyParser.urlencoded({extended: true}));
PatientController.use(bodyParser.json())
PatientController.use(express.static('dist'));


PatientController.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//This is the code that will be executed when the patient first
//goes to the edit profile page so that they can see what it is
//exactly that they need to change. The patient's id is used
//to retrieve the data.
PatientController.get('/editPatientProfileData', (req, res) => {

    //This query will return the patients information that we deem ok to change.
    //It filters the database and looks for the patient with the id that we passed.
    //parameters: ID
    //returns: FName,LName,Birthday, HealthInsurance, Phone, Email
    let state = "SELECT U.FName, U.LName, U.Birthday, P.HealthInsurance, U.Phone, U.Email FROM patients P, users U, doctors D WHERE P.id=? AND D.id=P.doctorID AND P.id=U.id"
    db.query(state, [req.cookies.id], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
})

//This is the code that will be executed when the user opens the
//patient profile page. The user's id will be sent to this function
//by the get.
PatientController.get('/patientProfileData', (req, res) => {


    //The query below returns all the information that the user will see on their
    //profile by using the patient's id to filter through the different patient-doctor

    //combinations.
    //parameters: ID
    //returns: (FName of patient, LName of patient, healthInsurance of patient,  ID of patient, first name of doctor, last name of doctor, patient of Email, phone of patient, birthday of patient, chat permission for patient, chat request from patient)
    let state = "SELECT U2.FName, U2.LName, P.HealthInsurance, P.ID, U2.Birthday, U2.Phone, U2.Email, U.FName AS DFName, U.LName AS DLName, P.ChatRequested, P.ChatPermission FROM patients P, doctors D, users U, users U2 WHERE P.ID=? AND D.id=P.doctorID AND U.ID=D.ID AND U2.id=P.id"
    db.query(state, [req.cookies.id], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            res.send(result);
        }
    });
});

//This is the post method that is called when the user
//submits their edited information. It takes in all the
//information that was sent in the form along with the
//patient's id.
PatientController.post("/editedPatientData", (req, res) => {
    let patientid = req.body.patientid;
    let fname = req.body.fname;
    let lname = req.body.lname;
    let email = req.body.email;
    let phone = req.body.phone;
    let healthinsurance = req.body.healthinsurance;

    //This query finds the patient that wants to edit their information
    //and then updates the values of certain fields.
    //parameters: ID, FName, LName, Email,Phone
    //returns:
    let state = "UPDATE 390db.users SET FName=?, LName=?, Email=?, Phone=? WHERE ID=?"
    db.query(
        state,
        [fname, lname, email, phone, patientid],
        (err, results) => {
            if (err) {
                console.log(err);
            }
        }
    );
    //parameters: ID, HealthInsurance
    //returns:
    let state2 = "UPDATE 390db.patients SET HealthInsurance=? WHERE ID=?"
    db.query(
        state2,
        [healthinsurance, patientid],
        (err, results) => {
            if (err) {
                console.log(err);
            } else {
                res.send("Edited!");
            }
        }
    );


});


//This post method is called when the user submits a
//form to change their current health status. The patient's
//id is passed to this method.
PatientController.post("/createPatientCovidStatus", (req, res) => {
    let patientStatus = req.body.status;
    let patientid = req.body.patientid;

    //This query updates the patients table. It sets the status
    //to the value that was submitted for the user that filled in the
    //form.
    //parameters: ID, HealthInsurance
    //returns:
    let state ="UPDATE 390db.patients SET Status=? WHERE ID=?"
    db.query(state,
        [patientStatus, patientid],
        (err, results) => {
            if (err) {
                console.log(err);
            } else {
                res.send("Status Change!");
            }
        }
    );
});

//This post is called when a user tries to submit a symptom form.
//The patient's id is passed along with the symptom information
//so that we can associate it with the right patient.
PatientController.post("/createSymptomForm", (req, res) => {

    let patientid = req.body.patientid;
    let timestamp = req.body.timestamp;
    let weight = req.body.weight;
    let temperature = req.body.temperature;
    let breathing = req.body.breathing;
    let chest_pain = req.body.chest;
    let fatigue = req.body.fatigue;
    let fever = req.body.fever;
    let cough = req.body.cough;
    let smell = req.body.smell;
    let taste = req.body.taste;
    let other = req.body.symptoms;

    //This query will be inserting the values that were passed by the user into
    //our Health Information table which holds the information of all the symptom
    //forms. Every symptom form will be related to the patient that submitted it.
    //parameters: PatientID, Timestamp, Weight, Temperature, Breathing, Chest_Pain, Fatigue, Fever, Cough, Smell, Taste, Other
    //returns: 

    let state = "INSERT INTO 390db.healthinformation (PatientID, Timestamp, Weight, Temperature, Breathing, Chest_Pain, Fatigue, Fever, Cough, Smell, Taste, Other) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
    db.query(state, [patientid, timestamp, weight, temperature, breathing, chest_pain, fatigue, fever, cough, smell, taste, other],
        (err, results) => {
            if (err) {
                console.log(err);
            } else {
                res.send("Form Submitted!");
            }
        }
    );
});


module.exports = PatientController;