const express = require("express");
const db = require("../database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");

const DoctorController = express.Router()

DoctorController.use(express.json());
DoctorController.use(cookieParser());
DoctorController.use(cors({credentials: true, origin: 'http://localhost:3000'}));
DoctorController.use(express.static(path.join(__dirname, "../client/build")));
DoctorController.use(express.static(__dirname + "../client/public/"));
DoctorController.use(bodyParser.urlencoded({extended: true}));
DoctorController.use(bodyParser.json())
DoctorController.use(express.static('dist'));


DoctorController.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* This get method will be executed when rendering the DoctorPatientProfile page. The database will be querries to get the patients names, ID, status and whether they have been
flagged or not. The returned list is a list of all patients in the database. */
DoctorController.get("/DoctorPatientProfile", (req, res) => {
    //parameters:
    //returns: FName,LName, Status, Flagged, DoctorID, ChatRequested
    let state = "SELECT U.Fname, U.Lname, P.Status, P.Flagged, P.ID, P.DoctorID, P.ChatRequested, P.NewPatient FROM 390db.users U, 390db.patients P WHERE U.ID = P.ID;"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});
    
//Gets all relevant patient information to the doctor logged in
DoctorController.get("/doctorViewingTheirPatientData", (req, res) => {
    let did = 6;
    //parameters: ID
    //returns: ID, FName, LName, Email, Password, Validated, Phone, Birthday, Address, Role, Token
    let state = "SELECT Upatient.* FROM 390db.users Upatient, 390db.patients P, 390db.doctors D WHERE D.ID = 6 AND P.DoctorID = 6 AND P.ID = Upatient.ID;"
    db.query(state, [did], (err, result) => {
        //hardcoded to doctor ID 6
        if (err) {
            console.log("Error!");
            console.log(err);
        } else {
            res.send(result);
        }
    });

});

//Gets all doctor information to other doctors
DoctorController.get("/doctorViewingAllDoctors", (req, res) => {
    //parameters:
    //returns: ID, License, patientCount
    let state = "SELECT Udoctor.* FROM 390db.users Udoctor, 390db.doctors D WHERE D.ID =  Udoctor.ID;"
    db.query(state, (err, result) => {
        if (err) {
            console.log("Error!");
            console.log(err);
        } else {
            res.send(result);
        }
    });
});


//Gets all patient information with their assigned doctor to any doctor logged in
DoctorController.get("/doctorViewingDoctorPatients", (req, res) => {
    //parameters:
    //returns: FName,LName, ID, FName, LName, Email, Password, Validated, Phone, Birthday, Address, Role, Token
    let state = "SELECT Udoctor.Fname, Udoctor.Lname, Upatient.* FROM 390db.users Upatient, 390db.users Udoctor, 390db.patients P WHERE P.ID = Upatient.ID AND Udoctor.ID = P.DoctorID;"
    db.query(state, (err, result) => {
        if (err) {
            console.log("Error!");
            console.log(err);
            console.log("No error!");
        } else {
            res.send(result);
        }
    });
});

//Gets all patient information to doctors
DoctorController.get("/doctorViewingAllPatientData", (req, res) => {
    //parameters:
    //returns: FName,LName, ID, FName, LName, Email, Password, Validated, Phone, Birthday, Address, Role, Token
    let state = "SELECT Upatient.* FROM 390db.users Upatient, 390db.patients P WHERE P.ID = Upatient.ID;"
    db.query(state, (err, result) => {
        if (err) {
            console.log("Error!");
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

/* This get method will return all the previously filled in HealthInformation for a specific patient and dispay it in the UI. */
DoctorController.get("/doctorViewingPreviousSymptoms", (req, res) => {
    let pid = req.query.id;
     //parameters: PatientID
    //returns: PatientID, Timestamp, InfoTimestamp, Weight, Temperature, Breathing, Chest_Pain, Fatigue, Fever, Cough, Smell, Taste, Other
    let state = "SELECT * FROM healthinformation HI WHERE PatientID=?"
    db.query(state, [pid], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});


/* This post method is called when a docotr clicks the MARK AS REVIEWED button on a patient profile. It will update the 'viewed table' in the database. */
DoctorController.post("/markViewed", (req, res) => {
    let PatientID = req.body.PatientID;
    let PatientDocID = req.body.PatientDocID;
    let DoctorID = req.body.DoctorID;
    let datetime = req.body.datetime;
    //parameters:PatientID,DoctorID,Timestamp
    //returns:
    let state = "INSERT INTO 390db.viewed VALUES (?,?,?)"
    db.query(state, [PatientID, DoctorID, datetime], (err, result) => {
        if (err) {
            console.log(err);
        }
    });

    if (PatientDocID === DoctorID) {
        //parameters:PatientID
        //returns:
        let state2 = "UPDATE 390db.patients SET NewPatient=0 WHERE ID=?"
        db.query(state2, [PatientID], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Updated new patient");
            }
        });
    }
    res.send("Success!");
});


/* This post method is called when a doctor clicks the REQUEST SYMPTOM FORM button on a patient profile. It will update the SymptomRequested attribute in the patient
table of the DB. */
DoctorController.post("/requestForm", (req, res) => {
    let PatientID = req.body.PatientID;
    //parameters: PatientID
    //returns:
    let state = "UPDATE 390db.patients SET SymptomRequested=true where ID=?"
    db.query(state, [PatientID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send("Patient symptom form requested!");
        }
    });

});


//Gets the number of patients in each status category
DoctorController.post("/statusCountAllPatients", (req, res) => {
    //parameters: 
    //returns: (healthyCount, isolatingCount,infectedCount)
    let state = "  SELECT healthyCount, isolatingCount, infectedCount " +
    "FROM (  SELECT count(*) as healthyCount " +
    "FROM 390db.patients P " +
    "WHERE P.Status = 'Healthy') as healthyCount, " +
    "(  SELECT count(*) as isolatingCount " +
    "FROM 390db.patients P " +
    "WHERE P.Status = 'Isolated') as isolatingCount, " +
    "(  SELECT count(*) as infectedCount " +
    "FROM 390db.patients P " +
    "WHERE P.Status = 'Infected') as infectedCount;"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the total number of patients
DoctorController.post("/countAllPatients", (req, res) => {
    //parameters:
    //returns: (count of rows)
    let state = "SELECT count(*) as allPatientCount FROM 390db.patients P"
    db.query(state, (err, result) => {
        if (err) {

            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the total number of flagged patients
DoctorController.post("/countAllFlaggedPatients", (req, res) => {
    //parameters:
    //returns: (count of rows)
    let state = "SELECT count(*) as allFlaggedPatientCount FROM 390db.patients P WHERE P.Flagged = 1"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the total number of registered doctors
DoctorController.post("/countAllValidatedDoctors", (req, res) => {
    //parameters:
    //returns: (count of rows)
    let state = "SELECT count(*) as allRegisteredDoctorsCount FROM 390db.users U WHERE U.Validated = 1 AND U.Role = 'Doctor'"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});


//Gets top 5 doctors with most to least patients
DoctorController.post("/doctorsWithMostPatients", (req, res) => {
    //parameters:
    //returns: (FName of doctors, LName of doctors, email of doctors, address of doctors, number of patients assigned)
    let state = "(SELECT DISTINCT U.Fname, U.LName, U.Email, U.Phone, U.Address, count(*) as countPatients " +
    "FROM 390db.doctors D, 390db.patients P, 390db.users U " +
    "WHERE D.ID = P.DoctorID AND D.ID = U.ID " +
    "GROUP BY D.ID " +
    "ORDER BY countPatients DESC " + //Ordered by most to least
    "LIMIT 5) " +
    "UNION " +
    "SELECT DISTINCT U.Fname, U.LName, U.Email, U.Phone, U.Address, 0 AS countPatients " +
    "FROM 390db.doctors D, 390db.patients P, 390db.users U " +
    "WHERE D.ID NOT IN (SELECT DISTINCT P1.DoctorID " +
    "FROM 390db.patients P1) AND D.ID = U.ID " +
    "ORDER BY countPatients DESC " +
    "LIMIT 5;"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});


//Gets top 5 doctors with least to most patients
DoctorController.post("/doctorsWithLeastPatients", (req, res) => {
    //parameters:
    //returns: (FName of doctors, LName of doctors, email of doctors, address of doctors, number of patients assigned)
    let state = "(SELECT DISTINCT U.Fname, U.LName, U.Email, U.Phone, U.Address, count(*) as countPatients " +
    "FROM 390db.doctors D, 390db.patients P, 390db.users U " +
    "WHERE D.ID = P.DoctorID AND D.ID = U.ID " +
    "GROUP BY D.ID " +
    "ORDER BY countPatients ASC " + //Ordered by least to most
    "LIMIT 5) " +
    "UNION " +
    "SELECT DISTINCT U.Fname, U.LName, U.Email, U.Phone, U.Address, 0 AS countPatients " +
    "FROM 390db.doctors D, 390db.patients P, 390db.users U " +
    "WHERE D.ID NOT IN (SELECT DISTINCT P1.DoctorID " +
    "FROM 390db.patients P1) AND D.ID = U.ID " +
    "ORDER BY countPatients ASC " +
    "LIMIT 5;"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the list of patients that are flagged but whose file has not been viewed
DoctorController.post("/patientsFlaggedNotViewed", (req, res) => {
    //parameters:
    //returns: (FName of patient, LName of patient, phone of patient, email of patient)
    let state = "SELECT DISTINCT Upatient.Fname, Upatient.Lname, Upatient.Phone, Upatient.Email " +
    "FROM 390db.users Upatient, 390db.patients P, 390db.inforequest IR, 390db.healthinformation HI, 390db.viewed V " +
    "WHERE Upatient.ID = P.ID AND IR.PatientID = P.ID AND P.Flagged=1 AND HI.PatientID = P.ID AND IR.Timestamp < HI.InfoTimestamp AND ((P.ID IN " +
    "(SELECT P1.ID " +
    "FROM 390db.patients P1, 390db. healthinformation H1, 390db.viewed V1 " +
    "WHERE P1.ID = H1.PatientID AND P1.Flagged = 1 AND V1.PatientID = H1.PatientID AND H1.Timestamp > V1.Timestamp)) " +
    "OR (P.ID NOT IN (SELECT V1.PatientID FROM 390db.viewed V1)));"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the list of patients that are flagged and have been viewed from latest to most recent
DoctorController.post("/patientsFlaggedLeastViewed", (req, res) => {
    //parameters:
    //returns: (FName of patient, LName of patient, phone of patient, email of patient, ID of patient) ,timestamp
    let state = "SELECT DISTINCT Upatient.Fname, Upatient.Lname, Upatient.Phone, Upatient.Email, V.Timestamp as verifiedTime, P.ID " +
    "FROM 390db.patients P, 390db.users Upatient, 390db.viewed V " +
    "WHERE Upatient.ID = P.ID AND P.Flagged = 1 AND P.ID = V.PatientID AND V.Timestamp = (SELECT MAX(V1.Timestamp) FROM 390db.viewed V1 WHERE V1.PatientID = P.ID) " +
    "ORDER BY V.Timestamp ASC;"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the list of patients that have been flagged and have not submitted their symptom form upion receiving a request from their doctor
DoctorController.post("/patientsFlaggedNoSymptomFormResponse", (req, res) => {
    //parameters:
    //returns: (FName of patient, LName of patient, phone of patient, email of patient,time of request, ID of patient)
    let state = "SELECT DISTINCT Upatient.Fname, Upatient.Lname, Upatient.Phone, Upatient.Email, IR.Timestamp as requestTime, P.ID " +
    "FROM 390db.patients P, 390db.users Upatient, 390db.inforequest IR, 390db.healthinformation IH " +
    "WHERE P.Flagged = 1 AND P.ID = Upatient.ID AND IR.PatientID = P.ID  AND ((IR.PatientID = IH.PatientID AND IR.Timestamp > IH.InfoTimestamp) " +
    "OR (P.ID NOT IN (SELECT HI1.PatientID " +
    "FROM 390db.healthinformation HI1))) " +
    "ORDER BY requestTime ASC;"
    db.query(state, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});


module.exports = DoctorController;