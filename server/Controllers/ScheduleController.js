const express = require("express");
const db = require("../database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");

const ScheduleController = express.Router()

ScheduleController.use(express.json());
ScheduleController.use(cookieParser());
ScheduleController.use(cors({credentials: true, origin: 'http://localhost:3000'}));
ScheduleController.use(express.static(path.join(__dirname, "../client/build")));
ScheduleController.use(express.static(__dirname + "../client/public/"));
ScheduleController.use(bodyParser.urlencoded({extended: true}));
ScheduleController.use(bodyParser.json())
ScheduleController.use(express.static('dist'));


ScheduleController.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Finds the next day in the calenda
function getNextDayOfTheWeek(dayName, excludeToday = true, refDate = new Date()) {
    const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(dayName.slice(0, 3).toLowerCase());
    if (dayOfWeek < 0) return;
    refDate.setHours(0, 0, 0, 0);
    refDate.setDate(refDate.getDate() + +!!excludeToday +
        (dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7);
    return refDate;
}


//creates the array that is returned to Client
function arrayMaker(result) {
    const returnedAvails = [];
    for (let i = 0; i < Object.keys(result).length; i++) {
        if (result[i]["dayName"] != null) {
            returnedAvails.push("" + getNextDayOfTheWeek(result[i]["dayName"], true).toString().slice(0, 15) + " " + result[i]["StartTime"] + " - " + result[i]["EndTime"])
        }
    }
    console.log(returnedAvails);
    return returnedAvails;
}


//see open appointments
ScheduleController.get("/seeOpenAppointments", (req, res) => {

        let patientID = req.query["id"];
        console.log("Patient ID: " + patientID);

        //parameters:patientID
        //returns: StartTime, EndTime, dayName, DoctorID, (doctor's first name),(doctor's last name)
        state = "SELECT StartTime,EndTime,dh.dayName, dh.doctorID, u.FName, u.LName FROM 390db.doctorhours dh, 390db.users u WHERE dh.doctorid = (SELECT DoctorID from 390db.patients p where id = ?) and dh.DoctorID= u.id and dh.Availability = 1;"

        db.query(state, [patientID], (err, result) => {
            if (err) {
                console.log("Error: " + err);
            } else {
                console.log("Results open: " + result);
                res.send(arrayMaker(result));
            }
        });
    }
)


ScheduleController.post("/makeAppointments", (req, res) => {
        var appointment = req.body.appointmentTime;

        var appointmentArray = appointment.split(/(\s+)/);
        let dayName = appointmentArray[0]
        let start = appointmentArray[8]
        let end = appointmentArray[12]
        let aptDate = appointmentArray[2] + " " + appointmentArray[4] + " " + appointmentArray[6]
        let patID = req.body.patientID//JWT;

        //searches for existing appointments

        //parameters: ID of patient, start time and name of weekday
        //returns: ID,PatientID, DoctorID, Notes, startTime, endTime, aptDate, dayName, Priority 
        state = "SELECT * FROM 390db.appointments a where a.PatientID = ? and a.DoctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
        db.query(state, [patID, patID, start, dayName], (err, result) => {

                if (result.length == 1) {
                    //query then modify and update apt table and doctorhours
                    //first update used to remove availability
                    //parameters:
                    //returns:
                    updateState1 = "UPDATE 390db.doctorhours dh set dh.availability = 0 WHERE dh.StartTime = ? and dh.EndTime = ? and dh.availability = 1 and dh.dayName = ? and dh.doctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
                    db.query(updateState1, [start, end, dayName, patID], (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log("first update: ");
                                // console.log(result);

                            }
                        }
                    );

                    //second update to free doctor up
                    //parameters: patientID
                    //returns: 
                    updateState2 = "UPDATE 390db.doctorhours dh set dh.availability = 1 WHERE dh.StartTime = (select startTime from appointments apt2 where apt2.PatientID = ?) and dh.availability = 0  and dh.dayName = (select dayName from appointments apt2 where apt2.PatientID = ?) and dh.doctorID = (SELECT DoctorID from 390db.patients p where id = ?);"
                    db.query(updateState2, [patID, patID, patID], (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log("second update: ");
                                // console.log(result);
                            }
                        }
                    );

                    //update the appointment
                    //parameters: startTime, endTime, aptDate,dayName,patientID
                    //returns: 
                    updateState3 = "UPDATE 390db.appointments apt set apt.startTime = ?, apt.endTime = ?, apt.aptDate = ?, apt.dayName = ? WHERE apt.doctorID = (SELECT DoctorID from 390db.patients p where id = ?) and apt.PatientID = ?;"
                    db.query(updateState3, [start, end, aptDate, dayName, patID, patID], (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log("appointment update: ")
                                // console.log(result);
                                res.send(result);
                            }
                        }
                    );
                }
                if (result.length == 0) {
                    //add new appointment with no previous appointment
                    //parameters: startTime, endTime,dayName,patientID
                    //returns: 
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
                    //parameters: patientID,startTime, endTime, aptDate,dayName
                    //returns: 
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


ScheduleController.post("/doctorAvailbility", (req, res) => {
        let gridSlots = req.body["backendTimeSlots"];
        let dID = gridSlots[0]["doctorID"];
        //parameters: DoctorID
        //returns: 
        state = "Delete from 390db.doctorhours where DoctorID = ?"
        db.query(
            state,
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

            //parameters: dayName, DoctorID, StartTime, EndTime
            //returns:
            state2 = "INSERT INTO 390db.doctorhours (dayName,DoctorID,StartTime,EndTime,Availability) VALUES (?,?,?,?,1)"
            db.query(
                state2,
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


module.exports = ScheduleController;