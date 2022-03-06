const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser')
const db = require('./database')
const mysql = require("mysql2");
const cors = require('cors');
const { request } = require('http');

var cookieParser = require('cookie-parser')
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

app.use(express.static(path.join(__dirname, "../client/build")));
app.use(express.static(__dirname + "../client/public/"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use(express.static('dist'));

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
require('dotenv').config()

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//below is a test server function
app.get('/api', (req, res) => {
   res.json({"users":["userOne", "userTwo", "userThree"]})

})

// example of using DB query
//
app.get('/users', (req, res) => {

    let state = `SELECT * FROM 390db.users;`;

    db.query(state, function(err, result) {
        console.log(result);
        res.send(result);
    })
})


// app.get('/*', function(req,res){
//     res.sendFile(path.join(__dirname, '../client/public', 'index.html'));
// })

/* This get method will be executed when rendering the DoctorPatientProfile page. The database will be querries to get the patients names, ID, status and whether they have been
flagged or not. The returned list is a list of all patients in the database. */
app.get("/DoctorPatientProfile", (req, res) => {
    db.query("SELECT U.Fname, U.Lname, P.Status, P.Flagged, P.ID, P.DoctorID FROM 390db.users U, 390db.patients P WHERE U.ID = P.ID;", (err, result) => {
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
app.get("/Viewed", (req, res) => {

    // ERIC CHANGE: REMOVED WHERE P.ID = H.PATIENTID BECAUSE OTHERWISE MARK AS REVIEWED NEVER WORKS UNLESS WE CREATE A HEALTH INFORMATION FOR THE PATIENT 

    db.query("SELECT P.ID FROM 390db.patients P, 390db.healthinformation H, 390db.viewed V WHERE P.ID = V.PatientID GROUP BY P.ID HAVING MAX(V.Timestamp) >= MAX(H.Timestamp);", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            res.send(result);
        }
    });
});

/* This get method be executed when rendering the DoctorViewingPatient and HealthOfficialViewingPatient pages. It will take the necessary patient data from the database
and display it in the UI. */
app.get("/doctorViewingPatientData", (req, res) => {
    let pid = req.query.id;
    db.query("SELECT U.Fname, U.Lname, P.ID, P.Status, Udoctor.Fname AS DoctorFirst, Udoctor.Lname AS DoctorLast, U.Email, U.Phone, U.Birthday, U.Address, P.SymptomRequested FROM 390db.patients P, 390db.users U, 390db.users Udoctor WHERE P.ID = ? AND P.ID = U.ID AND P.DoctorID = Udoctor.ID;", [pid], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

/* This get method will return all the previously filled in HealthInformation for a specific patient and dispay it in the UI. */
app.get("/doctorViewingPreviousSymptoms", (req, res) => {
    let pid = req.query.id;
    db.query("SELECT * FROM HealthInformation HI WHERE PatientID=?", [pid], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

      
//below is a test server function
app.get('/api', (req, res) => {
    res.json({ "users": ["userOne", "userTwo", "userThree"] })

});

//This post is called when a user tries to submit a symptom form.
//The patient's id is passed along with the symptom information
//so that we can associate it with the right patient.
app.post("/createSymptomForm", (req, res) => {

    let patientid = 1;
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
    db.query(
        "INSERT INTO 390db.healthinformation (PatientID, Timestamp, Weight, Temperature, Breathing, Chest_Pain, Fatigue, Fever, Cough, Smell, Taste, Other) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        [patientid, timestamp, weight, temperature, breathing, chest_pain, fatigue, fever, cough, smell, taste, other],
        (err, results) => {
            if (err) {
                console.log(err);
            } else {
                res.send("Form Submitted!");
            }
        }
    );
});

//This post method is called when the user submits a 
//form to change their current health status. The patient's
//id is passed to this method. 
app.post("/createPatientCovidStatus", (req, res) => {
    let patientStatus = req.body.status;
    let patientid = 1;

    //This query updates the patients table. It sets the status
    //to the value that was submitted for the user that filled in the 
    //form.
    db.query("UPDATE 390db.patients SET Status=? WHERE ID=?",
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

//This is the post method that is called when the user
//submits their edited information. It takes in all the
//information that was sent in the form along with the
//patient's id.
app.post("/editedPatientData", (req, res) => {
    let patientid = 1;
    let fname = req.body.fname;
    let lname = req.body.lname;
    let email = req.body.email;
    let phone = req.body.phone;
    let healthinsurance = req.body.healthinsurance;

    //This query finds the patient that wants to edit their information
    //and then updates the values of certain fields.
    db.query(
        "UPDATE 390db.users SET FName=?, LName=?, Email=?, Phone=? WHERE ID=?",
        [fname, lname, email, phone, patientid],
        (err, results) => {
            if (err) {
                console.log(err);
            } 
        }
    );

    db.query(
        "UPDATE 390db.patients SET HealthInsurance=? WHERE ID=?",
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

//This is the code that will be executed when the user opens the 
//patient profile page. The user's id will be sent to this function
//by the get.
app.get('/patientProfileData', (req, res) => {
    //will need to use the patient ID in the query below

    //The query below returns all the information that the user will see on their
    //profile by using the patient's id to filter through the different patient-doctor
    //combinations.
    db.query("SELECT U2.FName, U2.LName, P.HealthInsurance, P.ID, U2.Birthday, U2.Phone, U2.Email, U.FName AS DFName, U.LName AS DLName FROM patients P, doctors D, users U, users U2 WHERE P.id=1 AND D.id=P.doctorID AND U.ID=D.ID AND U2.id=P.id", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});


/* This post method is called when a docotr clicks the MARK AS REVIEWED button on a patient profile. It will update the 'viewed table' in the database. */
app.post("/markViewed", (req, res) => {
    let PatientID = req.body.PatientID;
    let DoctorID = req.body.DoctorID;
    let datetime = req.body.datetime;

    db.query("INSERT INTO 390db.viewed VALUES (?,?,?)", [PatientID, DoctorID, datetime], (err, result) =>{
        if (err) {
            console.log(err);
        } else {
            res.send("Patient profile has been reviewed!");
        }
    });
});

/* This post method is called when a doctor clicks the REQUEST SYMPTOM FORM button on a patient profile. It will update the SymptomRequested attribute in the patient 
table of the DB. */
app.post("/requestForm", (req, res) => {
    let PatientID = req.body.PatientID;

db.query("UPDATE 390db.patients SET SymptomRequested=true where ID=?", [PatientID], (err, result) =>{
    if (err) {
        console.log(err);
    } else {
        res.send("Patient symptom form requested!");
    }
});

});

/* This post method is called when a docotr clicks the FLAG PATIENT button on a patient profile. It will update the Flagged attribute in the patient table of the DB */
app.post("/flagPatient", (req, res) => {
    let PatientID = req.body.PatientID;

db.query("UPDATE 390db.patients SET Flagged=true where ID=?", [PatientID], (err, result) =>{
    if (err) {
        console.log(err);
    } else {
        res.send("Patient has been flagged!");
    }
});

});

//This is the code that will be executed when the patient first 
//goes to the edit profile page so that they can see what it is
//exactly that they need to change. The patient's id is used 
//to retrieve the data.
app.get('/editPatientProfileData', (req, res) => {
    //will need to use the patients id

    //This query will return the patients information that we deem ok to change.
    //It filters the database and looks for the patient with the id that we passed.
    db.query("SELECT U.FName, U.LName, U.Birthday, P.HealthInsurance, U.Phone, U.Email FROM patients P, users U, doctors D WHERE P.id=1 AND D.id=P.doctorID AND P.id=U.id", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
})

// app.get('/*', function(req,res){
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });


// start of sign up and login
app.get('/checkAuth', function (req, res) {
    console.log(req.cookies);
    const token = req.cookies.token;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
        if (err) {
            res.status(403).send();
        } else {
            res.json(data);
        }
    })
})

app.get('/user', function (req, res){
    const {token} = req.cookies;
    let state = `SELECT U.Email, U.Password FROM users U WHERE U.Token = "${token}";`;

    db.query(state, function (err, user) {
        console.log(user);
        res.send(user);
    }.catch(() => res.sendStatus(406)))

})

//getting the email and passowrd from the form
app.post("/Login", async (req, res) => {
    try {
        //fields were provided by the front end form
        let email = req.body.email;
        let password = req.body.password;

        //query statement
        let state = `SELECT U.Email, U.Password FROM users U WHERE U.Email = "${email}";`;

        //console.log(state) // used to verify the query

        db.query(state, async (err, result) => {
                if (err) {
                    console.log('err: '+err)
                } //indicator for errors when executing a query
                else {
                    // console.log(password +'\n'+result[0].Password)
                    if (await bcrypt.compare(password, result[0].Password) && email === result[0].Email) { //await needs "async" in the 'parent'
                        if (jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, (error, token)=> {
                            if (error) {
                                console.log('Wrong Password');
                                console.log(error)
                                res.status(403).send();
                            } else {                             
                                let update = `UPDATE users SET Token = "${token}" WHERE email = "${email}"`
                                db.query(update, async (err2, result2) => {
                                    if (err2){
                                        console.log("err2: "+err2)
                                    } else {
                                        console.log(token);
                                        res.cookie('token', token).send();
                                        // res.sendStatus(200)
                                    }})
                            }
                            }
                        )
                        )
                        console.log("")
                    } 
                    // res.send(result);
                }
            }
        )
    } catch {
        res.status(500).send()
    }
})

//getting the email and passowrd from the form
app.post("/Signup", async (req, res) => {

    try {
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let email = req.body.email;
        let password = req.body.password;
        let userRole = req.body.userRole
        let phoneNumber = req.body.phoneNumber
        const uid = Math.floor(Math.random() * 100000)
        const salt = await bcrypt.genSalt(10)//hashes with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt)

        let Validated = 0
        let state = `INSERT INTO 390db.users (ID, FName, LName, Email, Password, Validated, Phone, Role) VALUES (?,?,?,?,?,?,?,?);`;//figure out how to pass variables i created in

        //console.log(state) //used to verify proper SQL format

        if (userRole === 'Patient') {//all other user types should to be approved
            Validated = 1;
        }
        // console.log(userRole)

        db.query(state, [uid, firstName, lastName, email, hashedPassword, Validated, phoneNumber, userRole], function (err, result) {//ID might be removed since it should be auto indent
            if (err) {
                console.log(err)
            }
        })

        if (userRole == 'Patient') {

            state = `SELECT p.DoctorID FROM 390db.patients p Group By p.DoctorID order by Count(p.ID) asc Limit 1;`;
            db.query(state, function (err, result) {//finds the doctor with the least amount of patients
                if (err) {
                    console.log(err)
                } else {
                    let docID = result[0].DoctorID
                    // console.log("DoctorID:\t\t"+docID)

                    // console.log("userID:\t\t"+ uid)
                    let patientState = `INSERT INTO 390db.patients (ID, DoctorID, Flagged) VALUES (?,?,?);`;
                    db.query(patientState, [uid, docID, 0], function (err, result) {//inserts a new patient with an auto assigned doctor
                        if (err) {
                            console.log("\ninserting into patient \n" + err)
                        }
                    })
                }
            })

        }
// final send
        res.sendStatus(200);
    } catch {
        res.status(500).send()

    }
})
// end of sign up and login

app.get("/adminViewingValidatedDoctorData",(req,res) => {

    db.query("SELECT Udoctor.Fname, Udoctor.Lname, Udoctor.Phone, Udoctor.Validated FROM 390db.users Udoctor, 390db.doctors D WHERE Udoctor.ID = D.ID AND Udoctor.Validated = 1;",(err, result) => {
        if(err){
            console.log(err);
        } else {
            res.send(result);
            console.log(result);
        }
    });
});
app.get("/adminViewingUnvalidatedDoctorData",(req,res) => {

    db.query("SELECT Udoctor.Fname, Udoctor.Lname, Udoctor.Phone, Udoctor.Validated, Udoctor.ID FROM 390db.users Udoctor, 390db.doctors D WHERE Udoctor.ID = D.ID AND Udoctor.Validated = 0;",(err, result) => {
            console.log(err);
        if(err){
            console.log(result);
        } else {
            res.send(result);
        }
});
    });
app.get("/adminViewingPatientData",(req,res) => {
    db.query("SELECT Upatient.Fname, Upatient.Lname, Upatient.Phone, Udoctor.Fname AS docFname, Udoctor.Lname AS docLname FROM 390db.users Upatient, 390db.patients P, 390db.users Udoctor WHERE Upatient.ID = P.ID AND P.DoctorID = Udoctor.ID;",(err, result) => {
            console.log(err);
        if(err){
        } else {
        }
            res.send(result);
    });
});
app.get("/doctorViewingTheirPatientData", (req,res) =>{
    let did = 6;
    db.query("SELECT Upatient.* FROM 390db.users Upatient, 390db.patients P, 390db.doctors D WHERE D.ID = 6 AND P.DoctorID = 6 AND P.ID = Upatient.ID;", [did], (err, result) => {
    //hardcoded to doctor ID 6
        if(err){
            console.log("Error!");
            console.log(err);
        } else {
            console.log("No error!");
            res.send(result);
        }
});
    });
app.get("/doctorViewingAllDoctors", (req,res) =>{
    db.query("SELECT Udoctor.* FROM 390db.users Udoctor, 390db.doctors D WHERE D.ID =  Udoctor.ID;", (err, result) => {
        if(err){
            console.log("Error!");
            console.log(err);
        } else {
            res.send(result);
            console.log("No error!");
        }
    });
});
app.get("/doctorViewingDoctorPatients", (req,res) =>{
    db.query("SELECT Udoctor.Fname, Udoctor.Lname, Upatient.* FROM 390db.users Upatient, 390db.users Udoctor, 390db.patients P WHERE P.ID = Upatient.ID AND Udoctor.ID = P.DoctorID;", (err, result) => {
        if(err){
            console.log("Error!");
            console.log(err);
            console.log("No error!");
        } else {
            res.send(result);
        }
    });
});
app.get("/doctorViewingAllPatientData", (req,res) =>{
    db.query("SELECT Upatient.* FROM 390db.users Upatient, 390db.patients P WHERE P.ID = Upatient.ID;", (err, result) => {
        if(err){
        } else {
            console.log("Error!");
            console.log(err);
            console.log("No error!");
            res.send(result);
        }
    });
});
app.post("/validateDoctor", (req,res) =>{
   let DoctorID = req.body.DoctorID;


   db.query("UPDATE 390db.users SET Validated = 1 WHERE ID = ?", [DoctorID], (err, result) =>{
       if(err){
           console.log(err);
       } else{
           res.send("Doctor validated!");
       }
   })
});

app.get('/*', function(req,res){
    res.sendFile(path.join(__dirname, '../client/public', 'index.html'));
})


module.exports = app;