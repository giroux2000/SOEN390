const express = require("express");
const db = require("../database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");
require('dotenv').config();

const UserController = express.Router()

UserController.use(express.json());
UserController.use(cookieParser());
UserController.use(cors({credentials: true, origin: 'http://localhost:3000'}));
UserController.use(express.static(path.join(__dirname, "../client/build")));
UserController.use(express.static(__dirname + "../client/public/"));
UserController.use(bodyParser.urlencoded({extended: true}));
UserController.use(bodyParser.json())
UserController.use(express.static('dist'));


UserController.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// start of sign up and login. creating correct cookies if logged in
UserController.get('/checkAuth', function (req, res) {
    if (!req.cookies) {
        res.status(403).send();
    } else {
        const token = req.cookies.token;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) {
                res.status(403).send();
            } else {
                res.send({email: data, role: req.cookies.role, id: req.cookies.id});
            }
        })
    }
})


//getting the email and passowrd from the form
UserController.post("/Login", async (req, res) => {
    try {
        //fields were provided by the front end form
        if (!req.body.email || !req.body.password) {
            throw err;
        }
        let email = req.body.email;
        let password = req.body.password;
        console.log(password)
        //query statement
        let state = `SELECT U.Email, U.Password, U.Role, U.ID, U.Validated FROM users U WHERE U.Email = "${email}";`;

        //console.log(state) // used to verify the query
        //parameters: Email
        //returns: 
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
                                        //parameters: Token, Email
                                        //returns: 
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
                            ) ;
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

//getting the email and passowrd from the form
UserController.post("/Signup", async (req, res) => {
    let existing = false;
    let uid;
    //parameters: Email
    //returns: ID, FName, LName, Email, Password, Validated, Phone, Birthday, Address, Role, Token
    let state = "SELECT * FROM 390db.users U WHERE U.email = ?"
    db.query(state, [req.body.email], async (err, result) => {

        if (result.length !== 0) {
            existing = true;
        }
    });
    // select last auto increment
    //parameters: 
    //returns: ID
    let state2 = `SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = "390db" AND TABLE_NAME = "users"`
    db.query(state2, [], async (err, result) => {

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
            //parameters:FName, LName, Email, Password, Validated, Phone, Role
            //returns: 
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
                //parameters:
                //returns:  ID, (number of patients)
                db.query(state, function (err, result) {//finds the doctor with the least amount of patients
                    if (err) {
                        console.log(err)
                    } else {
                        let docID = result[0]["id"]

                        let patientState = `INSERT INTO 390db.patients (ID, DoctorID, Flagged) VALUES (?,?,?); `;
                        //parameters: ID, (DoctorID)
                        //returns:
                        db.query(patientState, [uid, docID, 0], function (err, result) {//inserts a new patient with an auto assigned doctor
                            if (err) {
                                console.log("\ninserting into patient \n" + err)
                            }
                        })
                    }
                })
                //parameters:
                //returns:  ID, (number of patients)
                db.query(state, function (err, result) {//finds the doctor with the least amount of patients
                    if (err) {
                        console.log(err)
                    } else {
                        let docID = result[0]["id"]
                        let countP = result[0]["patientCount"] + 1

                        let patientState = `Update doctors set patientCount = ? where id = ?;`;
                        //parameters: (number of patients), DoctorID
                        //returns: 
                        db.query(patientState, [countP, docID], function (err, result) {//inserts a new patient with an auto assigned doctor
                            if (err) {
                                console.log("\nupdating patient count of a doctor\t" + err)
                            }
                        })
                    }
                })

            } else if (userRole == 'Doctor') {
                let doctorState = `INSERT INTO 390db.doctors (ID, License,patientCount) VALUES (last_insert_id(),?,0);`;
                //parameters: License
                //returns:
                db.query(doctorState, [req.body.medicalLicense], function (err, result) {//inserts a new patient with an auto assigned doctor
                    if (err) {
                        console.log("\ninserting into doctors \n" + err)
                    }
                })


            } else if (userRole == 'Immigration Officer' || 'Health Official') {

                let doctorState = `INSERT INTO 390db.otherusers (ID, Type) VALUES (last_insert_id(),?);`;
                //parameters: Role
                //returns:
                db.query(doctorState, [userRole], function (err, result) {//inserts a new patient with an auto assigned doctor
                    if (err) {
                        console.log("\ninserting into officials \n" + err)
                    }
                })

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


// clearing cookies on logout
UserController.post('/Logout', ((req, res) => {
    res.clearCookie('token');
    res.clearCookie('role');
    res.clearCookie('id');
    res.status(200).send();
}));

module.exports = UserController;