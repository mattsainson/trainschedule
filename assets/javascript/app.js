
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
    doRefresh: function () {
        console.log('doRefresh');
    }
};

var clockIntId = setInterval(sched.doClock, 1000);
var refreshIntId = setInterval(sched.doRefresh, 10000);

$('#add-train').on('click', function () {

    event.preventDefault();

    //add form data 
    var name = $('#train-name').val();
    var destination = $('#train-dest').val();
    var firstTrain = $('#train-first').val();
    var frequency = Number($('#train-freq').val());
    var lastTrain = $('#train-last').val();

    console.log(name);
    database.ref().push({
        name: name,
        destination: destination,
        firstTrain: firstTrain,
        frequency: frequency,
        lastTrain: lastTrain
    });

    //clear form values
    $('#train-name').val('');
    $('#train-dest').val('');
    $('#train-first').val('');
    $('#train-freq').val('');
    $('#train-last').val('');

});

database.ref().on("child_added", function (snapshot) {


    //calculate next arrival and minutes away
    //get the start time as string into numbers
    var start = snapshot.val().firstTrain; //string 06:00
    var startTimeArr = start.split(':');
    var hrStart = Number(startTimeArr[0]); //6
    var minStart = Number(startTimeArr[1]);  //0
    console.log('hrs', hrStart, 'min', minStart);

    //set today and start of today
    var today = moment();
    var dayStart = moment();
    dayStart.startOf('day');
    console.log('dayStart', dayStart);

    //add the hours and minutes as numbers to dayStart to get moment for train start
    var startTrain = dayStart.add(hrStart, 'hours');
    startTrain = startTrain.add(minStart, 'minutes');
    console.log('startTrain', startTrain);

    //get the number of minutes between the first train and now
    var durTodayAndStart = moment.duration(today.diff(startTrain));
    console.log('durTodayAndStart', durTodayAndStart);
    var durInMin = Math.abs(Math.floor(durTodayAndStart.asMinutes()));
    console.log('durInMin', durInMin);

    //calc the minAway and then the next arrival using the minutes between first and now
    var frequency = snapshot.val().frequency;
    console.log('frequency', frequency);
    var minAway = frequency - (durInMin % frequency);
    console.log('minAway', minAway);
    var nextArrival = today.add(minAway, 'minutes');
    console.log('nextArrival', nextArrival);

    //create a moment out of the last-train string
    var last = snapshot.val().lastTrain; //string 22:00
    var lastTimeArr = last.split(':');
    var hrLast = Number(lastTimeArr[0]); //6
    var minLast = Number(lastTimeArr[1]);  //0
    console.log('last', last, 'hrLast', hrLast, 'minLast', minLast);
    var newDay = moment();
    newDay.startOf('day');
    var lastTrain = newDay.add(hrLast, 'hours');
    lastTrain = lastTrain.add(minLast, 'minutes');
    console.log(lastTrain);

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
    row.attr({ class: 'row sched-row' });

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
    collastTrain.attr({ class: 'col-lg-2 text-center' });
    collastTrain.text(snapshot.val().lastTrain);
    row.append(collastTrain);

    //append to row
    $('#sched-data').append(row);
    // $('#sched-data').append('<hr>');

});
