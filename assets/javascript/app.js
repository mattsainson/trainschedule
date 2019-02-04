
// Initialize Firebase
var config = {
    apiKey: "AIzaSyDMhaFK-HLiUBpyXa40xY57-rJtEDB3nVs",
    authDomain: "trainschedule-ffca7.firebaseapp.com",
    databaseURL: "https://trainschedule-ffca7.firebaseio.com",
    projectId: "trainschedule-ffca7",
    storageBucket: "",
    messagingSenderId: "1025329490946"
};
firebase.initializeApp(config);

//connect to database
var database = firebase.database();

var sched = {

    clock: 0,
    doClock: function () {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        m = sched.addZero(m);
        s = sched.addZero(s);
        $('#clock').text('Current Time: ' + h + ':' + m + ':' + s);
    },
    addZero: function (num) {
        if (num < 10) { num = '0' + num; }  // add zero in front of numbers < 10
        return num;
    },
    doRefresh: function (snapshot) {
        console.log('doRefresh');
        //calculate next arrival and minutes away
        //get the start time as string into numbers
        var start = snapshot.val().firstTrain; //string 06:00
        var startTimeArr = start.split(':');
        var hrStart = Number(startTimeArr[0]); //6
        var minStart = Number(startTimeArr[1]);  //0
        // console.log('hrs', hrStart, 'min', minStart);

        //set today and start of today
        var today = moment();
        var dayStart = moment();
        dayStart.startOf('day');
        // console.log('dayStart', dayStart);

        //add the hours and minutes as numbers to dayStart to get moment for train start
        var startTrain = dayStart.add(hrStart, 'hours');
        startTrain = startTrain.add(minStart, 'minutes');
        // console.log('startTrain', startTrain);

        //get the number of minutes between the first train and now
        var durTodayAndStart = moment.duration(today.diff(startTrain));
        // console.log('durTodayAndStart', durTodayAndStart);
        var durInMin = Math.abs(Math.floor(durTodayAndStart.asMinutes()));
        // console.log('durInMin', durInMin);

        //calc the minAway and then the next arrival using the minutes between first and now
        var frequency = snapshot.val().frequency;
        // console.log('frequency', frequency);
        var minAway = frequency - (durInMin % frequency);
        // console.log('minAway', minAway);
        var nextArrival = today.add(minAway, 'minutes');
        // console.log('nextArrival', nextArrival);

        //create a moment out of the last-train string
        var last = snapshot.val().lastTrain; //string 22:00
        var lastTimeArr = last.split(':');
        var hrLast = Number(lastTimeArr[0]); //6
        var minLast = Number(lastTimeArr[1]);  //0
        // console.log('last', last, 'hrLast', hrLast, 'minLast', minLast);
        var newDay = moment();
        newDay.startOf('day');
        var lastTrain = newDay.add(hrLast, 'hours');
        lastTrain = lastTrain.add(minLast, 'minutes');
        // console.log(lastTrain);

        //determine if the nextArrival is after the last train
        //if so, we'll just put not running, and - for minAway
        var doneTrain = false;
        var dispNext = '';
        var dispMinAway = '';
        if ((nextArrival.isBefore(lastTrain, 'minutes') || nextArrival.isSame(lastTrain, 'minutes')) && (nextArrival.isAfter(startTrain, 'minutes') || nextArrival.isSame(startTrain, 'minutes'))) {
            doneTrain = false;
            dispNext = nextArrival.format('HH:mm');
            dispMinAway = minAway;
        } else {
            doneTrain = true;
            dispNext = '--:--';
            dispMinAway = '--';
        }

        var row = $('<div>');
        var key = snapshot.key;
        console.log('key', key);
        row.attr({ class: 'row sched-row', id: key });

        var colname = $('<div>');
        colname.attr({ class: 'col-lg-2' });
        colname.text(snapshot.val().name);
        row.append(colname);

        //add another col
        var coldest = $('<div>');
        coldest.attr({ class: 'col-lg-2' });
        coldest.text(snapshot.val().destination);
        row.append(coldest);

        //add another col
        var colfirstTrain = $('<div>');
        colfirstTrain.attr({ class: 'col-lg-2 text-center' });
        colfirstTrain.text(snapshot.val().firstTrain);
        row.append(colfirstTrain);

        //add another col
        var colfreq = $('<div>');
        colfreq.attr({ class: 'col-lg-1 text-center' });
        colfreq.text(snapshot.val().frequency);
        row.append(colfreq);

        //add another col
        var colnextArrival = $('<div>');
        colnextArrival.attr({ class: 'col-lg-2 text-center' });
        colnextArrival.text(dispNext);
        row.append(colnextArrival);

        //add another col
        var colminAway = $('<div>');
        colminAway.attr({ class: 'col-lg-1 text-center' });
        colminAway.text(dispMinAway);
        row.append(colminAway);

        //add another col
        var collastTrain = $('<div>');
        collastTrain.attr({ class: 'col-lg-1 text-center' });
        collastTrain.text(snapshot.val().lastTrain);
        row.append(collastTrain);

        var remove = $('<div>');
        remove.attr({ class: 'col-lg-1 text-center remove', removekey: key });
        remove.text('X');
        row.append(remove);

        //append to row
        $('#sched-data').append(row);
        // $('#sched-data').append('<hr>');

        $('.remove').on('click', sched.remove);

        $('.sched-row').on('click', sched.select);


    },
    remove: function () {
        var key = $(this).attr('removekey');
        // localStorage.setItem('topics', JSON.stringify(topics));
        $('#' + key).remove();
        database.ref().child(key).remove();
        //.todo now remove from database
    },
    select: function () {
        var key = $(this).attr('id');
        $('#add-train').attr({ datakey: key }); //set the submit key
        var row = database.ref().child(key);
        row.once('value').then(function (snapshot) {
            // console.log('name: ',snapshot.val().name);
            $('#train-name').val(snapshot.val().name);
            $('#train-dest').val(snapshot.val().destination);
            $('#train-first').val(snapshot.val().firstTrain);
            $('#train-freq').val(snapshot.val().frequency);
            $('#train-last').val(snapshot.val().lastTrain);
        });
    }
};

var clockIntId = setInterval(sched.doClock, 1000);
// var refreshIntId = setInterval(sched.doRefresh, 60000);

$('#add-train').on('click', function () {

    event.preventDefault();

    //add form data 
    var name = $('#train-name').val();
    var destination = $('#train-dest').val();
    var firstTrain = $('#train-first').val();
    var frequency = Number($('#train-freq').val());
    var lastTrain = $('#train-last').val();

    var datakey = $('#add-train').attr('datakey');

    //add if it's new;  datakey = blank
    if (datakey === '') {
        database.ref().push({
            name: name,
            destination: destination,
            firstTrain: firstTrain,
            frequency: frequency,
            lastTrain: lastTrain
        });
    } else { //update if existing row; datakey = key
        var postData = {
            name: name,
            destination: destination,
            firstTrain: firstTrain,
            frequency: frequency,
            lastTrain: lastTrain
        };
        var updates = {};
        updates[datakey] = postData;
        return firebase.database().ref().update(updates);
    }

    //clear form values
    $('#train-name').val('');
    $('#train-dest').val('');
    $('#train-first').val('');
    $('#train-freq').val('');
    $('#train-last').val('');
    $('#add-train').val(''); //clear the submit key
});

database.ref().on('child_added', function (snapshot) {
    sched.doRefresh(snapshot);
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});

// database.ref().on('value', function (snapshot) {
//     sched.doRefresh(snapshot);
// }, function (errorObject) {
//     console.log("Errors handled: " + errorObject.code);
// });

//sort the schedule by firstTrain time
// dataRef.ref().orderByChild('firstTrain').limitToLast(1).on('child_added', function(snapshot) {
//     $('#name-').text(snapshot.val().name);
//     $('#destination-').text(snapshot.val().destination);
//     $('#firstTrain-').text(snapshot.val().firstTrain);
//     $('#frequency-').text(snapshot.val().frequency);
//     $('#lastTrain-').text(snapshot.val().lastTrain);
// });