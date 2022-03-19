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
    // console.log(result)
    const returnedAvails = [];
    for (let i = 0; i < Object.keys(result).length; i++) {
        if (result[i]["dayName"] != null) {
            //putting the appointment in the right format
            // console.log()
            // returnedAvails.push(`${result[i]["dayName"]} ${result[i]["StartTime"]} - ${result[i]["EndTime"]}`)
            returnedAvails.push("" + getNextDayOfTheWeek(result[i]["dayName"], true).toString().slice(0, 15) + " " + result[i]["StartTime"] + " - " + result[i]["EndTime"])
        }

    }
    console.log(returnedAvails);
    return returnedAvails;
}

