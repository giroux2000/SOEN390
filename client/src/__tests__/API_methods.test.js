const app = require('../../../server/app.js');
const request = require('supertest');
const { changeUser } = require('../../../server/database.js');

//Here we try to get a specific patients information so that it can be displayed in the UI.
//If the get is successful, a 200 status code will be returned to make the test pass. 
describe('testing /doctorViewingPatientData', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).get('/doctorViewingPatientData', { params: {id: 1}});
    expect(res.statusCode).toEqual(200);
  })
});

//Here we try to get a specific patients previous symptom form information so that it can be displayed in the UI.
//If the get is successful, a 200 status code will be returned to make the test pass. 
describe('testing /doctorViewingPreviousSymptoms', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).get('/doctorViewingPreviousSymptoms', { params: {id: 1}});
    expect(res.statusCode).toEqual(200);
  })
});

//Here we send data to make sure that we can post to create a new row in the Viewed table of the database.
//If it does, the test will succeed and a status code of 200 will be returned to make sure the test pass.
describe('testing /markViewed', () => {
  it('returns a status code of 200 indicating that the post worked', async () => {
    let res = await request(app).post('/markViewed').send({ PatientID: 1, DoctorID: 6, datetime: '2022-04-03 00:00:00'});
    expect(res.statusCode).toEqual(200);
  })
});

//Here we send data to make sure that we can post to update the SymptomRequested attribute in the patient table of the database.
//If it does, the test will succeed and a status code of 200 will be returned to make sure the test pass.
describe('testing /requestForm', () => {
  it('returns a status code of 200 indicating that the post worked', async () => {
    let res = await request(app).post('/requestForm').send({ PatientID: 1});
    expect(res.statusCode).toEqual(200);
  })
});

//Here we send data to make sure that we can post to create a new row in the Viewed table of the database.
//If it does, the test will succeed and a status code of 200 will be returned to make sure the test pass.
describe('testing /flagPatient', () => {
  it('returns a status code of 200 indicating that the post worked', async () => {
    let res = await request(app).post('/flagPatient').send({ PatientID: 1});
    expect(res.statusCode).toEqual(200);
  })
});

//Here we try to get a list of viewed patients so that it can be displayed in the UI.
//If the get is successful, a 200 status code will be returned to make the test pass. 
describe('testing /Viewed', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).get('/Viewed');
    expect(res.statusCode).toEqual(200);
  })
});

//Here we try to get the name and status from all patients in the DB so that it can be displayed in the UI.
//If the get is successful, a 200 status code will be returned to make the test pass. 
describe('testing /DoctorPatientProfile', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).get('/DoctorPatientProfile');
    expect(res.statusCode).toEqual(200);
  })
});

//Here we send data to make sure that we can post to create a Symtpom form.
//If it does so, the test will succeed and a status code of 200 will be returned
//to make the test pass. This will fail after it passes, to make it pass again, 
//change the timestamp value by 1.
// describe('testing /createSymptomForm', () => {
//     it('returns a status code of 200 indicating that the post worked', async () => {
//         let res = await request(app).post('/createSymptomForm').send({ timestamp: Math.floor(Math.random() * 9999999999999), weight: 25, temperature: 66, breathing: 1, chest: 2, fatigue: 1, fever: 1, cough: 5, smell: 4, taste: 2, symptoms: 'sore' })
//         expect(res.statusCode).toEqual(200);
//     })
// });

//Here we send data to make sure that we can post to alter the patient's status.
//If it does so, the test will succeed and a status code of 200 will be returned
//to make the test pass.
describe('testing /createPatientCovidStatus', () => {
    it('returns a status code of 200 indicating that the post worked', async () => {
        let res = await request(app).post('/createPatientCovidStatus').send({ status: 2 });
        expect(res.statusCode).toEqual(200);
    })
});

//Here we send data to make sure that we can post to edit patient data.
//If it does so, the test will succeed and a status code of 200 will be returned
//to make the test pass.
describe('testing /editedPatientData', () => {
    it('returns a status code of 200 indicating that the post worked', async () => {
        let res = await request(app).post('/editedPatientData').send({ fname: 'Maxime', lname: 'Giroux', email: 'giroux2000@gmail.com', phone: '514 514 5145', healthinsurance: 'test'});
        expect(res.statusCode).toEqual(200);
    })
});

//Here we just try to get the patient profile data.
//If the get is successful, a 200 status code will be returned
//to make the test pass.
describe('testing /patientProfileData', () => {
    it('returns a status code of 200 indicating that the post worked', async () => {
        let res = await request(app).get('/patientProfileData');
        expect(res.statusCode).toEqual(200);
    })
});

//Here we just try to get the patient profile data so that it can be edited.
//If the get is successful, a 200 status code will be returned
//to make the test pass.
describe('testing /editPatientProfileData', () => {
    it('returns a status code of 200 indicating that the post worked', async () => {
        let res = await request(app).get('/editPatientProfileData');
        expect(res.statusCode).toEqual(200);
    })
});

//Here we just try to login with a known email and password
//If the get is successful, a 200 status code will be returned
//to make the test pass.
//Currently this test does not work


// describe('testing /Login', () => {
//   it('returns a status code of 200 indicating that the post worked', async () => {
//       let res = await request(app).post('/Login').send({email:'e.han@hotmail.com',password: '@Root1234'});
//       expect(res.status).toEqual(200);
//   })
// });

//Here we just try to get the patient profile data so that it can be edited.
//If the get is successful, a 200 status code will be returned
//to make the test pass.
// describe('testing /Signup', () => {
//   it('returns a status code of 200 indicating that the post worked', async () => {
//       let res = await request(app).post('/Signup').send({firstName: 'Matt', lastName:'Pop', email:'e.han@hotmail.com',password: '@Root1234', userRole:'Doctor',phoneNumber:'5146683216'});
//       expect(res.status).toEqual(200);
//   })
// });


// describe('testing /seeOpenAppointments', () => {
//   it('returns an array when looking for appointment slots', async () => {
//     let res = await request(app).get('/seeOpenAppointments');
//     expect(res.body).anything();
//   })
// });

// //Here we update the Flagged attribute in the patient table of the DB to 0
// //If the post is successful, a 200 status code will be returned to make the test pass.
// describe('testing /unflagPatient', () => {
//   it('returns a status code of 200 indicating that the get worked', async () => {
//     let res = await request(app).post('/unflagPatient').send({PatientID: 1});
//     expect(res.statusCode).toEqual(200);
//   })
// });

// //Here we update the ChatPermission attribute in the patient table of the DB to 1 and the ChatRequested attribute to 0
// //If the post is succesfull, a 200 status code will be returned to make the test pass.
// describe('testing /acceptChat', () => {
//   it('returns a status code of 200 indicating that the get worked', async () => {
//     let res = await request(app).post('/acceptChat').send({PatientID: 1});
//     expect(res.statusCode).toEqual(200);
//   })
// });

// //Here we update the ChatRequested attribute in the patient table of the DB to 1
// //If the post is succesfull, a 200 status code will be returned to make the test pass.
// describe('testing /RequestChat', () => {
//   it('returns a status code of 200 indicating that the get worked', async () => {
//     let res = await request(app).post('/RequestChat');
//     expect(res.statusCode).toEqual(200);
//   })
// });

//This test verifies we are able to retrieve the status of all patients and their count
describe('testing /statusCountAllPatients', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/statusCountAllPatients');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies total patient count command
describe('testing /countAllPatients', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/countAllPatients');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies total flagged patient count command
describe('testing /countAllFlaggedPatients', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/countAllFlaggedPatients');
    expect(res.statusCode).toEqual(200);
  })
});

//Verfies total validated doctors command
describe('testing /countAllValidatedDoctors', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/countAllValidatedDoctors');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies doctors with most patients command
describe('testing /doctorsWithMostPatients', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/doctorsWithMostPatients');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies doctors with least patients commands
describe('testing /doctorsWithLeastPatients', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/doctorsWithLeastPatients');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies patients flagged but not viewed by doctor command
describe('testing /patientsFlaggedNotViewed', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/patientsFlaggedNotViewed');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies patients flagged that have been viewed in decreasing order command
describe('testing /patientsFlaggedLeastViewed', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/patientsFlaggedLeastViewed');
    expect(res.statusCode).toEqual(200);
  })
});

//Here we try to get basic contact information for all validated doctors.
//If the get is successful, a 200 status code will be returned to make the test pass. 
describe('testing /adminViewingValidatedDoctorData', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/adminViewingValidatedDoctorData');
      expect(res.statusCode).toEqual(200);
    })
  });

//Here we try to get basic contact information for all unvalidated doctors.
//If the get is successful, a 200 status code will be returned to make the test pass. 
  describe('testing /adminViewingUnvalidatedDoctorData', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/adminViewingUnvalidatedDoctorData');
      expect(res.statusCode).toEqual(200);
    })
  });

//Here we try to get basic contact information for all patients.
//If the get is successful, a 200 status code will be returned to make the test pass. 
  describe('testing /adminViewingPatientData', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/adminViewingPatientData');
      expect(res.statusCode).toEqual(200);
    })
  });

//Here we try to get information for all patients.
//If the get is successful, a 200 status code will be returned to make the test pass. 
  describe('testing /doctorViewingTheirPatientData', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/doctorViewingTheirPatientData');
      expect(res.statusCode).toEqual(200);
    })
  });

//Here we try to get information for all doctors.
//If the get is successful, a 200 status code will be returned to make the test pass. 
  describe('testing /doctorViewingAllDoctors', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/doctorViewingAllDoctors');
      expect(res.statusCode).toEqual(200);
    })
  });

//Here we try to get information for all patients organized by doctor.
//If the get is successful, a 200 status code will be returned to make the test pass. 
  describe('testing /doctorViewingDoctorPatients', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/doctorViewingDoctorPatients');
      expect(res.statusCode).toEqual(200);
    })
  });

//Here we try to get information for all patients.
//If the get is successful, a 200 status code will be returned to make the test pass. 
  describe('testing /doctorViewingAllPatientData', () => {
    it('returns a status code of 200 indicating that the get worked', async () => {
      let res = await request(app).get('/doctorViewingAllPatientData');
      expect(res.statusCode).toEqual(200);
    })
  });

  //Here we try to validate a doctor
//If the get is successful, a 200 status code will be returned to make the test pass. 
describe('testing /validateDoctor', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/validateDoctor').send({DoctorID: 6});
    expect(res.statusCode).toEqual(200);
  })
});


//Verifies patients flagged that have no filled out symptom form command
describe('testing /patientsFlaggedNoSymptomFormResponse', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/patientsFlaggedNoSymptomFormResponse');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies retrieve all notifications command
describe('testing /retrieveAllNotifications', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).get('/retrieveAllNotifications');
    expect(res.statusCode).toEqual(200);
  })
});

//Verifies get the total number of notifications command
describe('testing /getAllNotificationCount', () => {
  it('returns a status code of 200 indicating that the get worked', async () => {
    let res = await request(app).post('/getAllNotificationCount');
    expect(res.statusCode).toEqual(200);
  })
});

