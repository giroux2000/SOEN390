const db = require('./database')
const mysql = require("mysql2");


function makeQuery(stateQuery, paramArray, debugComment = '') {
    //returnType 0 is a send, returnType 1 is a 
    // console.log("State Query: "+stateQuery+" array: ");
    // console.log(...paramArray);

    db.query(stateQuery, ...paramArray, (error, dbResult) => {
        if (error) {
            console.log("Statement: " + stateQuery + '\n\n' + error)
        }
        else {
            console.log(debugComment);
            // console.log(typeof dbResult)
            return dbResult;
        }
    })

};


module.exports = {makeQuery};