const express = require("express");
const db = require("../database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");

const ManagerController = express.Router()

ManagerController.use(express.json());
ManagerController.use(cookieParser());
ManagerController.use(cors({credentials: true, origin: 'http://localhost:3000'}));
ManagerController.use(express.static(path.join(__dirname, "../client/build")));
ManagerController.use(express.static(__dirname + "../client/public/"));
ManagerController.use(bodyParser.urlencoded({extended: true}));
ManagerController.use(bodyParser.json())
ManagerController.use(express.static('dist'));


ManagerController.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* This get method be executed when rendering the DoctorViewingPatient and HealthOfficialViewingPatient pages. It will take the necessary patient data from the database
and display it in the UI. */
ManagerController.get("/doctorViewingPatientData", (req, res) => {
    let pid = req.query.id;
    //parameters: (ID of patient)
    //returns: (FName of patient, LName of patient, ID of patient, status of patient, whether a patient is new, first name of doctor, last name of doctor,
    //ID of doctor, patient of Email, phone of patient, birthday of patient, addresss of patient, request of symptoms from patient, chat permission for patient, flag for patient, chat request from patient)
    let state = "SELECT U.Fname, U.Lname, P.ID, P.Status, P.NewPatient, Udoctor.Fname AS DoctorFirst, Udoctor.Lname AS DoctorLast, Udoctor.ID AS DoctorID, U.Email, U.Phone, U.Birthday, U.Address, P.SymptomRequested, P.ChatPermission, P.Flagged, P.ChatRequested FROM 390db.patients P, 390db.users U, 390db.users Udoctor WHERE P.ID = ? AND P.ID = U.ID AND P.DoctorID = Udoctor.ID;"
    db.query(state, [pid], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

/* This get method be executed when rendering the DoctorPatientProfile page and when rendering the DoctorViewingPatient page (Health official pages as well).
 It returns a list of patients whose profiles have reviewed. This is used to create indicators in the UI when a patient profile has been reviewed such
 as a filled in eye icon for viewed patients. */
ManagerController.get("/Viewed", (req, res) => {

    //parameters:
    //returns: ID
    let state = "SELECT P.ID FROM 390db.patients P, 390db.healthinformation H, 390db.viewed V WHERE P.ID = V.PatientID GROUP BY P.ID HAVING MAX(V.Timestamp) >= MAX(H.Timestamp);"
    db.query(state, (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});


/* This post method is called when a docotr clicks the FLAG PATIENT button on a patient profile. It will update the Flagged attribute in the patient table of the DB */
ManagerController.post("/flagPatient", (req, res) => {
    let PatientID = req.body.PatientID;

    //parameters: (ID of patient)
    //returns:
    let state ="UPDATE 390db.patients SET Flagged=true where ID=?"
    db.query(state, [PatientID], (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send("Patient has been flagged!");
        }
    });

});

//Sets the Flagged attribute of the patient DB to 0
ManagerController.post("/unflagPatient", (req, res) => {
    let patientID = req.body.PatientID; //this PatientID is used in the query to specify which patient tuple to edit

    //parameters: (ID of patient)
    //returns:
    let state = "UPDATE 390db.patients SET Flagged=false where ID=?"
    db.query(state, [patientID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send("Patient has been unflagged!");
        }
    });

});


module.exports = ManagerController;