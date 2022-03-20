const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser')
const cors = require('cors');
require('dotenv').config();

var cookieParser = require('cookie-parser');

const UserController = require("./Controllers/UserController");
const NotificationController = require("./Controllers/NotificationController");
const DoctorController = require("./Controllers/DoctorController");
const AdminController = require("./Controllers/AdminController");
const ChatController = require("./Controllers/ChatController");
const ManagerController = require("./Controllers/ManagerController");
const ScheduleController = require("./Controllers/ScheduleController");
const PatientController = require("./Controllers/PatientController")

app.use(UserController);
app.use(NotificationController);
app.use(ChatController);
app.use(ManagerController);
app.use(ScheduleController);
app.use(AdminController);
app.use(PatientController);
app.use(DoctorController);

app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.static(path.join(__dirname, "../client/build")));
app.use(express.static(__dirname + "../client/public/"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())
app.use(express.static('dist'));


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//FUNCTION TO BE IMPLEMENTED SPRINT FOUR
app.post("/sendEmail", (req, res) => {
    //sendEmail();
});


//LEAVE THIS HERE
// app.get('/*', function(req,res){
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// app.get('/*', function (req, res) {
//     res.sendFile(path.join(__dirname, '../client/public', 'index.html'));
// });


module.exports = app;