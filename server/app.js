const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser')
const db = require('./database')
const mysql = require("mysql2");
const cors = require('cors');
const { request } = require('http');
const mail = require('nodemailer');
const queryDB = require('./databaseMethods.js')

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

let sendEmail = (fName, lName, email) => {
    const transporter = mail.createTransport({
        service: "gmail",
        auth: {
            user: "noreply.COVID19site@gmail.com",
            pass: "COVID19#2022"
        }
    });

    const mailOptions = {
        from: "COVID 19 WEBSITE",
        to: email,
        subject: "Your Account Has Been Invalidated",
        text: "Dear " + fName + " " + lName + ",\n\n" + "We regret to inform you that your account has been invalidated.\n\nRegards,\n\nCOVID 19 Website"
    }

    transporter.sendMail(mailOptions);
}



//below is a test server function
app.get('/api', (req, res) => {
    res.json({ "users": ["userOne", "userTwo", "userThree"] })

})

// example of using DB query
//
app.get('/users', (req, res) => {

    let state = `SELECT * FROM 390db.users;`;

    db.query(state, function (err, result) {
        res.send(result);
    })
})


// app.get('/*', function(req,res){
//     res.sendFile(path.join(__dirname, '../client/public', 'index.html'));
// })

/* This get method will be executed when rendering the DoctorPatientProfile page. The database will be querries to get the patients names, ID, status and whether they have been
flagged or not. The returned list is a list of all patients in the database. */
app.get("/DoctorPatientProfile", (req, res) => {
    db.query("SELECT U.Fname, U.Lname, P.Status, P.Flagged, P.ID, P.DoctorID, P.ChatRequested, P.NewPatient FROM 390db.users U, 390db.patients P WHERE U.ID = P.ID;", (err, result) => {
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
            res.send(result);
        }
    });
});

/* This get method be executed when rendering the DoctorViewingPatient and HealthOfficialViewingPatient pages. It will take the necessary patient data from the database
and display it in the UI. */
app.get("/doctorViewingPatientData", (req, res) => {
    let pid = req.query.id;
    db.query("SELECT U.Fname, U.Lname, P.ID, P.Status, P.NewPatient, Udoctor.Fname AS DoctorFirst, Udoctor.Lname AS DoctorLast, Udoctor.ID AS DoctorID, U.Email, U.Phone, U.Birthday, U.Address, P.SymptomRequested, P.ChatPermission, P.Flagged, P.ChatRequested FROM 390db.patients P, 390db.users U, 390db.users Udoctor WHERE P.ID = ? AND P.ID = U.ID AND P.DoctorID = Udoctor.ID;", [pid], (err, result) => {
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
    db.query("SELECT * FROM healthinformation HI WHERE PatientID=?", [pid], (err, result) => {
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
    let patientid = req.body.patientid;

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
    let patientid = req.body.patientid;
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



    //The query below returns all the information that the user will see on their
    //profile by using the patient's id to filter through the different patient-doctor

    //combinations.

    db.query("SELECT U2.FName, U2.LName, P.HealthInsurance, P.ID, U2.Birthday, U2.Phone, U2.Email, U.FName AS DFName, U.LName AS DLName, P.ChatRequested, P.ChatPermission FROM patients P, doctors D, users U, users U2 WHERE P.ID=? AND D.id=P.doctorID AND U.ID=D.ID AND U2.id=P.id", [req.cookies.id], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            res.send(result);
        }
    });
});


/* This post method is called when a docotr clicks the MARK AS REVIEWED button on a patient profile. It will update the 'viewed table' in the database. */
app.post("/markViewed", (req, res) => {
    let PatientID = req.body.PatientID;
    let PatientDocID = req.body.PatientDocID;
    let DoctorID = req.body.DoctorID;
    let datetime = req.body.datetime;

    db.query("INSERT INTO 390db.viewed VALUES (?,?,?)", [PatientID, DoctorID, datetime], (err, result) => {
        if (err) {
            console.log(err);
        }
    });

    if (PatientDocID === DoctorID) {

        db.query("UPDATE 390db.patients SET NewPatient=0 WHERE ID=?", [PatientID], (err, result) => {
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
app.post("/requestForm", (req, res) => {
    let PatientID = req.body.PatientID;

    db.query("UPDATE 390db.patients SET SymptomRequested=true where ID=?", [PatientID], (err, result) => {
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


    db.query("UPDATE 390db.patients SET Flagged=true where ID=?", [PatientID], (err, result) => {

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

    //This query will return the patients information that we deem ok to change.
    //It filters the database and looks for the patient with the id that we passed.
    db.query("SELECT U.FName, U.LName, U.Birthday, P.HealthInsurance, U.Phone, U.Email FROM patients P, users U, doctors D WHERE P.id=? AND D.id=P.doctorID AND P.id=U.id", [req.cookies.id], (err, result) => {
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


// start of sign up and login. creating correct cookies if logged in
app.get('/checkAuth', function (req, res) {
    const token = req.cookies.token;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
        if (err) {
            res.status(403).send();
        } else {
            res.send({ email: data, role: req.cookies.role, id: req.cookies.id });
        }
    })
})



//getting the email and passowrd from the form
app.post("/Login", async (req, res) => {
    try {
        //fields were provided by the front end form
        if (!req.body.email || !req.body.password) {
            throw err;
        }
        let email = req.body.email;
        let password = req.body.password;

        //query statement
        let state = `SELECT U.Email, U.Password, U.Role, U.ID, U.Validated FROM users U WHERE U.Email = "${email}";`;

        //console.log(state) // used to verify the query

        db.query(state, async (err, result) => {
            try {
                if (err) {
                    console.log('err: ' + err)
                } //indicator for errors when executing a query
                else {
                    if (!result[0]) {
                        throw err;
                    } else if (await bcrypt.compare(password, result[0].Password) && email === result[0].Email) {

                        //await needs "async" in the 'parent'
                        if (jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, (error, token) => {
                            if (error) {
                                console.log('Wrong Password');
                                console.log(error)
                                res.status(403).send();
                            } else if (result[0].Validated == 0) {
                                res.status(405).send();
                            } else {
                                let update = `UPDATE users SET Token = "${token}" WHERE email = "${email}"`
                                db.query(update, async (err2, result2) => {
                                    if (err2) {
                                        console.log("err2: " + err2)
                                    } else {
                                        res.cookie('token', token);
                                        res.cookie('role', result[0].Role);
                                        res.cookie('id', result[0].ID)
                                        res.sendStatus(200);
                                    }
                                })
                            }
                        }
                        )
                        );
                    } else {
                        throw err
                    }
                }
            } catch (err) {
                res.status(500).send();
            }
        }
        )
    } catch (err) {
        res.status(500).send()
    }
})

// clearing cookies on logout
app.post('/Logout', ((req, res) => {
    res.clearCookie('token');
    res.clearCookie('role');
    res.clearCookie('id');
    res.status(200).send();
}));

//getting the email and passowrd from the form
app.post("/Signup", async (req, res) => {
    let existing = false;
    let uid;
    db.query("SELECT * FROM 390db.users U WHERE U.email = ?", [req.body.email], async (err, result) => {

        if (result.length !== 0) {
            existing = true;
        }
    });
    // select last auto increment
    db.query(`SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = "390db" AND TABLE_NAME = "users"`, [], async (err, result) => {

        uid = result.AUTO_INCREMENT;
    });
    try {
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let email = req.body.email;
        let password = req.body.password;
        let userRole = req.body.userRole
        let phoneNumber = req.body.phoneNumber

        let uid;
        const salt = await bcrypt.genSalt(10)//hashes with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt)

        let Validated = 0
        let state = `INSERT INTO 390db.users (FName, LName, Email, Password, Validated, Phone, Role) VALUES (?,?,?,?,?,?,?);`;//figure out how to pass variables i created in


        //console.log(state) //used to verify proper SQL format

        if (userRole === 'Patient') {//all other user types should to be approved
            Validated = 1;
        }

        if (existing === false) {
            db.query(state, [firstName, lastName, email, hashedPassword, Validated, phoneNumber, userRole], function (err, result) {//ID might be removed since it should be auto indent
                if (err) {
                    console.log(err)
                    res.sendStatus(500);
                }
                uid = result.insertId;

            })
            // inserting in correct table after users table insert
            if (userRole == 'Patient') {



                state = `select id, patientCount from 390db.doctors order by patientCount asc limit 1;`;
                db.query(state, function (err, result) {//finds the doctor with the least amount of patients
                    if (err) {
                        console.log(err)
                    } else {
                        let docID = result[0]["id"]

                        let patientState = `INSERT INTO 390db.patients (ID, DoctorID, Flagged) VALUES (?,?,?); `;
                        db.query(patientState, [uid, docID, 0], function (err, result) {//inserts a new patient with an auto assigned doctor
                            if (err) {
                                console.log("\ninserting into patient \n" + err)
                            }
                        })
                    }
                })

                db.query(state, function (err, result) {//finds the doctor with the least amount of patients
                    if (err) {
                        console.log(err)
                    } else {
                        let docID = result[0]["id"]
                        let countP = result[0]["patientCount"] + 1

                        let patientState = `Update doctors set patientCount = ? where id = ?;`;
                        db.query(patientState, [countP, docID], function (err, result) {//inserts a new patient with an auto assigned doctor
                            if (err) {
                                console.log("\nupdating patient count of a doctor\t" + err)
                            }
                        })
                    }
                })

            } else if (userRole == 'Doctor') {
                db.promise().query(`SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = "390db" AND TABLE_NAME = "users"`, [], async (err, result) => {
                    uid = result.AUTO_INCREMENT;
                }).then(() => {
                    let doctorState = `INSERT INTO 390db.doctors (ID, License,patientCount) VALUES (?,?,0);`;
                    db.query(doctorState, [uid, req.body.medicalLicense], function (err, result) {//inserts a new patient with an auto assigned doctor
                        if (err) {
                            console.log("\ninserting into doctors \n" + err)
                        }
                    })
                });


            } else if (userRole == 'Immigration Officer' || 'Health Official') {
                db.promise().query(`SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = "390db" AND TABLE_NAME = "users"`, [], async (err, result) => {
                    uid = result.AUTO_INCREMENT;
                }).then(() => {
                    let doctorState = `INSERT INTO 390db.otherusers (ID, Type) VALUES (?,?);`;
                    db.query(doctorState, [uid, userRole], function (err, result) {//inserts a new patient with an auto assigned doctor
                        if (err) {
                            console.log("\ninserting into officials \n" + err)
                        }
                    })
                });

            }
            res.sendStatus(200);
        }
        // final send
        else
            res.status(500).send()
    } catch {
        res.status(500).send()

    }
})
// end of sign up and login

// Gets validated doctor first name, last name, phone number to the admin
app.get("/adminViewingValidatedDoctorData", (req, res) => {

    db.query("SELECT Udoctor.Fname, Udoctor.Lname, Udoctor.Phone, Udoctor.Validated, Udoctor.ID, D.License FROM 390db.users Udoctor, 390db.doctors D WHERE Udoctor.ID = D.ID AND Udoctor.Validated = 1;", (err, result) => {
        if (err) {

            console.log(err);
        } else {
            res.send(result);
        }
    });
});

// Gets unvalidated doctor first name, last name, phone number to the admin
app.get("/adminViewingUnvalidatedDoctorData", (req, res) => {
      db.query("SELECT Udoctor.Fname, Udoctor.Lname, Udoctor.Phone, Udoctor.Validated, Udoctor.ID, D.License FROM 390db.users Udoctor, 390db.doctors D WHERE Udoctor.ID = D.ID AND Udoctor.Validated = 0;", (err, result) => {

          if (err) {

              console.log(err);
          } else {
              console.log(result);
              res.send(result);
          }
        });
    }
    );


// Gets patient first name, last name, phone number to the admin
app.get("/adminViewingPatientData", (req, res) => {
    db.query("SELECT Upatient.Fname, Upatient.Lname, Upatient.Phone, Udoctor.Fname AS docFname, Udoctor.Lname AS docLname FROM 390db.users Upatient, 390db.patients P, 390db.users Udoctor WHERE Upatient.ID = P.ID AND P.DoctorID = Udoctor.ID;", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

//Gets all relevant patient information to the doctor logged in
app.get("/doctorViewingTheirPatientData", (req, res) => {
    let did = 6;
    db.query("SELECT Upatient.* FROM 390db.users Upatient, 390db.patients P, 390db.doctors D WHERE D.ID = 6 AND P.DoctorID = 6 AND P.ID = Upatient.ID;", [did], (err, result) => {
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
app.get("/doctorViewingAllDoctors", (req, res) => {
    db.query("SELECT Udoctor.* FROM 390db.users Udoctor, 390db.doctors D WHERE D.ID =  Udoctor.ID;", (err, result) => {
        if (err) {
            console.log("Error!");
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

//Gets all patient information with their assigned doctor to any doctor logged in
app.get("/doctorViewingDoctorPatients", (req, res) => {
    db.query("SELECT Udoctor.Fname, Udoctor.Lname, Upatient.* FROM 390db.users Upatient, 390db.users Udoctor, 390db.patients P WHERE P.ID = Upatient.ID AND Udoctor.ID = P.DoctorID;", (err, result) => {
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
app.get("/doctorViewingAllPatientData", (req, res) => {
    db.query("SELECT Upatient.* FROM 390db.users Upatient, 390db.patients P WHERE P.ID = Upatient.ID;", (err, result) => {
        if (err) {
            console.log("Error!");
            console.log(err);
        } else {
            res.send(result);
        }
    });
});


//see open appointments
app.get("/seeOpenAppointments", (req, res) => {
    //getting ID from client
    let patientID = req.query["id"];
    console.log("Patient ID: " + patientID);
    let state = "SELECT StartTime,EndTime,dh.dayName, dh.doctorID, u.FName, u.LName FROM 390db.doctorhours dh, 390db.users u WHERE dh.doctorid = (SELECT DoctorID from 390db.patients p where id = ?) and dh.DoctorID= u.id and dh.Availability = 1;"
    
    result = queryDB.makeQuery(state,[patientID], debugComment='');
    console.log('Results returned from method: '+result);

    // res.send(arrayMaker(result));
}
);


app.post("/makeAppointments", (req, res) => {
    var appointment = req.body.appointmentTime;
    // console.log(appointment)

    var appointmentArray = appointment.split(/(\s+)/);
    let dayName = appointmentArray[0]
    let start = appointmentArray[8]
    let end = appointmentArray[12]
    let aptDate = appointmentArray[2] + " " + appointmentArray[4] + " " + appointmentArray[6]
    let patID = req.body.patientID//JWT; 

    // for( var i =0; i<appointmentArray.length;i++){
    //     console.log(i+" : "+appointmentArray[i])
    // }
    // console.log(dayName+"\t"+start+"\t"+ end+"\t"+patID+"\t"+aptDate)
    //two manipulations one to update the doctorhours and another to insert the appointment.

    //searches for existing appointments
    state = "SELECT * FROM 390db.appointments a where a.PatientID = ? and a.DoctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
    db.query(state, [patID, patID, start, dayName], (err, result) => {

        if (result.length == 1) {
            //query then modify and update apt table and doctorhours

            //first update used to remove availability 
            updateState1 = "UPDATE 390db.doctorhours dh set dh.availability = 0 WHERE dh.StartTime = ? and dh.EndTime = ? and dh.availability = 1 and dh.dayName = ? and dh.doctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
            db.query(updateState1, [start, end, dayName, patID], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("first update: ");
                    console.log(result);

                }
            }
            );

            //second update to free doctor up 
            updateState2 = "UPDATE 390db.doctorhours dh set dh.availability = 1 WHERE dh.StartTime = (select startTime from appointments apt2 where apt2.PatientID = ?) and dh.availability = 0  and dh.dayName = (select dayName from appointments apt2 where apt2.PatientID = ?) and dh.doctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
            db.query(updateState2, [patID, patID, patID], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("second update: ");
                    console.log(result);
                }
            }
            );

            //update the appointment
            updateState3 = "UPDATE 390db.appointments apt set apt.startTime = ?, apt.endTime = ?, apt.aptDate = ?, apt.dayName = ? WHERE apt.doctorID = (SELECT DoctorID from 390db.patients p where id = ?) and apt.PatientID = ?;"
            db.query(updateState3, [start, end, aptDate, dayName, patID, patID], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("appointment update: ")
                    console.log(result);
                    res.send(result);
                }
            }

            );
        }
        if (result.length == 0) {
            //add new appointment with no previous appointment
            state = "UPDATE 390db.doctorhours dh set dh.availability = 0 WHERE dh.StartTime = ? and dh.EndTime = ? and dh.availability = 1 and dh.dayName = ? and dh.doctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
            db.query(state, [start, end, dayName, patID], (err, result) => {
                if (err) {
                    console.log("Error: " + err);
                } else {
                    console.log(result);
                }
            }
            );
            state2 = "INSERT INTO 390db.appointments (PatientID,DoctorID,startTime,endTime,aptDate,dayName,Priority) VALUES(?,(SELECT DoctorID from 390db.patients p where id = ?),?,?,?,?,5);"

            db.query(state2, [patID, patID, start, end, aptDate, dayName], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(state2);
                    res.send(result);
                }
            }

            );
        }

        if (err) {
            console.log("Error: " + err);
        } else {
            console.log(result);
        }
    }
    );




}
)

// app.get('/*', function (req, res) {



//Gets the number of patients in each status category
app.post("/statusCountAllPatients", (req,res) =>{
    db.query("  SELECT healthyCount, isolatedCount, infectedCount " + 
               "FROM (  SELECT count(*) as healthyCount " + 
                "FROM 390db.patients P " +
                "WHERE P.Status = 'Healthy') as healthyCount, " + 
                "(  SELECT count(*) as isolatedCount " + 
                "FROM 390db.patients P " +
                "WHERE P.Status = 'Isolated') as isolatedCount, " +
                "(  SELECT count(*) as infectedCount " + 
                "FROM 390db.patients P " +
                "WHERE P.Status = 'Infected') as infectedCount;", (err, result) =>{
        if(err){
           console.log(err);
        } else{
            res.send(result);
        }
    })
 });

//Post to validate doctor in database
app.post("/validateDoctor", (req, res) => {
    let DoctorID = req.body.DoctorID;
    db.query("UPDATE 390db.users SET Validated = 1 WHERE ID = ?", [DoctorID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send("Doctor validated!");
        }
    })
});


app.post("/invalidateDoctor", (req, res) => {
    //Delete from the database
    let DoctorID = req.body.DoctorID;
    console.log(DoctorID);
    var fName;
    var lName;
    var email;
    db.query("SELECT Udoctor.Fname, Udoctor.Lname, Udoctor.Email FROM 390db.users Udoctor, 390db.doctors D WHERE Udoctor.ID = D.ID AND D.ID = ?", [DoctorID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            fName = result[0].Fname;
            lName = result[0].Lname;
            email = result[0].Email;
            console.log(email);
        }
    });

    db.query("DELETE FROM 390db.doctors WHERE ID = ?", [DoctorID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted from Doctors table"); //This will eventually send an email to the invalidated doctor
        }
    })

    db.query("DELETE FROM 390db.users WHERE ID = ?", [DoctorID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted from Users Table");
            sendEmail(fName, lName, email); //This sends an email to the invalidated doctor
        }
    })
 });



app.post("/doctorAvailbility", (req, res) => {
    let gridSlots = req.body["backendTimeSlots"];
    let dID = gridSlots[0]["doctorID"];

    db.query(
        "Delete from 390db.doctorhours where DoctorID = ?",
        [dID], (err, results) => {
            if (err) {
                console.log(err);
            } else {
                console.log(results)
                console.log("Deleted Availbilities");
            }
        }
    );
    for (i = 0; i < gridSlots.length; i++) {
        let gridSlots = req.body["backendTimeSlots"];
        let dayName = gridSlots[i]["day"];
        let dID = gridSlots[i]["doctorID"];
        let startTime = gridSlots[i]["startTime"];
        let endTime = gridSlots[i]["endTime"];
        console.log(dayName + dID + startTime + endTime)

        db.query(
            "INSERT INTO 390db.doctorhours (dayName,DoctorID,StartTime,EndTime,Availability) VALUES (?,?,?,?,1)",
            [dayName, dID, startTime, endTime],
            (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Insertions')
                    console.log(results)

                }
            }
        );

    }
    res.send("Form Submitted!");

}

)

//Gets the number of patients in each status category
app.post("/statusCountAllPatients", (req, res) => {
    db.query("  SELECT healthyCount, isolatingCount, infectedCount " +
        "FROM (  SELECT count(*) as healthyCount " +
        "FROM 390db.patients P " +
        "WHERE P.Status = 'Healthy') as healthyCount, " +
        "(  SELECT count(*) as isolatingCount " +
        "FROM 390db.patients P " +
        "WHERE P.Status = 'Isolated') as isolatingCount, " +
        "(  SELECT count(*) as infectedCount " +
        "FROM 390db.patients P " +
        "WHERE P.Status = 'Infected') as infectedCount;", (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
});
//Gets the total number of patients
app.post("/countAllPatients", (req, res) => {
    db.query("SELECT count(*) as allPatientCount FROM 390db.patients P", (err, result) => {
        if (err) {

            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets the total number of flagged patients
app.post("/countAllFlaggedPatients", (req, res) => {
    db.query("SELECT count(*) as allFlaggedPatientCount FROM 390db.patients P WHERE P.Flagged = 1", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});


app.post("/sendEmail", (req, res) => {
    //sendEmail();
});

//Gets the total number of registered doctors
app.post("/countAllValidatedDoctors", (req, res) => {
    db.query("SELECT count(*) as allRegisteredDoctorsCount FROM 390db.users U WHERE U.Validated = 1 AND U.Role = 'Doctor'", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

//Gets top 5 doctors with most to least patients
app.post("/doctorsWithMostPatients", (req, res) => {
    db.query("(SELECT DISTINCT U.Fname, U.LName, U.Email, U.Phone, U.Address, count(*) as countPatients " +
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
        "LIMIT 5;", (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
});


//Gets top 5 doctors with least to most patients
app.post("/doctorsWithLeastPatients", (req, res) => {
    db.query("(SELECT DISTINCT U.Fname, U.LName, U.Email, U.Phone, U.Address, count(*) as countPatients " +
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
        "LIMIT 5;", (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
});

//Gets the list of patients that are flagged but whose file has not been viewed
app.post("/patientsFlaggedNotViewed", (req, res) => {
    db.query("SELECT DISTINCT Upatient.Fname, Upatient.Lname, Upatient.Phone, Upatient.Email " + 
    "FROM 390db.users Upatient, 390db.patients P, 390db.inforequest IR, 390db.healthinformation HI, 390db.viewed V " +
    "WHERE Upatient.ID = P.ID AND IR.PatientID = P.ID AND P.Flagged=1 AND HI.PatientID = P.ID AND IR.Timestamp < HI.InfoTimestamp AND ((P.ID IN " +
    "(SELECT P1.ID " + 
    "FROM 390db.patients P1, 390db.healthinformation H1, 390db.viewed V1 " + 
    "WHERE P1.ID = H1.PatientID AND P1.Flagged = 1 AND V1.PatientID = H1.PatientID AND H1.Timestamp > V1.Timestamp)) " + 
    "OR (P.ID NOT IN (SELECT V1.PatientID FROM 390db.viewed V1)));", (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
});

//Gets the list of patients that are flagged and have been viewed from latest to most recent
app.post("/patientsFlaggedLeastViewed", (req, res) => {
    db.query("SELECT DISTINCT Upatient.Fname, Upatient.Lname, Upatient.Phone, Upatient.Email, V.Timestamp as verifiedTime, P.ID " +
    "FROM 390db.patients P, 390db.users Upatient, 390db.viewed V " +
    "WHERE Upatient.ID = P.ID AND P.Flagged = 1 AND P.ID = V.PatientID AND V.Timestamp = (SELECT MAX(V1.Timestamp) FROM 390db.viewed V1 WHERE V1.PatientID = P.ID) " + 
    "ORDER BY V.Timestamp ASC;", (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
});

//Gets the list of patients that have been flagged and have not submitted their symptom form upion receiving a request from their doctor
app.post("/patientsFlaggedNoSymptomFormResponse", (req, res) => {
    db.query("SELECT DISTINCT Upatient.Fname, Upatient.Lname, Upatient.Phone, Upatient.Email, IR.Timestamp as requestTime, P.ID " + 
    "FROM 390db.patients P, 390db.users Upatient, 390db.inforequest IR, 390db.healthinformation IH " + 
    "WHERE P.Flagged = 1 AND P.ID = Upatient.ID AND IR.PatientID = P.ID  AND ((IR.PatientID = IH.PatientID AND IR.Timestamp > IH.InfoTimestamp) " +
    "OR (P.ID NOT IN (SELECT HI1.PatientID " + 
                     "FROM 390db.healthinformation HI1))) " + 
    "ORDER BY requestTime ASC;", (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
});

//Gets patient name, and appointment time

 app.get("/retrieveAllNotifications", (req,res) =>{ 
    let doctorID = req.query["id"];
    db.query("SELECT Upatient.Fname, Upatient.Lname, A.aptDate, A.startTime, A.endTime " +
    "FROM 390db.appointments A, 390db.users Upatient, 390db.doctors D, 390db.patients P " +
    "Where A.PatientID = Upatient.ID AND A.doctorID = ? AND P.id=Upatient.id AND P.doctorID = D.id;", [doctorID], (err, result) =>{
        if(err){
            console.log(err);
        } else{
            res.send(result);
        }
    })
 });

 //Gets the total number of appointments
 app.post("/getAllNotificationCount", (req,res) =>{ 
    let doctorID = req.query["id"];
    db.query("SELECT count(*) as notificationCount FROM 390db.appointments A WHERE A.DoctorID = ?", [doctorID],(err, result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
    })
});


app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '../client/public', 'index.html'));
});

//Sets ChatRequested attribute in the patient table to 1
app.post("/RequestChat", (req, res) => {
    let patientID = req.body.patientid; //this PatientID is used in the query to specify which patient tuple to edit

    db.query("UPDATE 390db.patients SET ChatRequested=1 WHERE ID=?",
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
app.post("/acceptChat", (req, res) => {
    let patientID = req.body.PatientID; //this PatientID is used in the query to specify which patient tuple to edit

    db.query("UPDATE 390db.patients SET ChatRequested=false WHERE ID=?",
        [patientID],
        (err, results) => {
            if (err) {
                console.log(err);
            }
        }
    );
    db.query("UPDATE 390db.patients SET ChatPermission=true WHERE ID=?",
        [patientID],
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

//Sets the Flagged attribute of the patient DB to 0
app.post("/unflagPatient", (req, res) => {
    let patientID = req.body.PatientID; //this PatientID is used in the query to specify which patient tuple to edit

    db.query("UPDATE 390db.patients SET Flagged=false where ID=?", [patientID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send("Patient has been unflagged!");
        }
    });

});


module.exports = app;