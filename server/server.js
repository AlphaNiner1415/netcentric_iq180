const express = require('express');
const app = express();
const socketIO = require('socket.io');
const http = require('http')
const stringMath = require('string-math');
const server = http.createServer(app);
const path = require('path');
const publicPath = path.join(__dirname, '/../public/');
var io = socketIO(server); //Initialize new instance of socket.io by passing in the Http object
app.use(express.json());

app.use(express.static(publicPath));


function checkFunction(numCheck) {
   return numCheck >= 0 && (numCheck - Math.floor(numCheck)) === 0;
}

const numberGenerator = () => {
    var opTemplate = ['+', '*', '-', '/'];
    var numberArray = [];
    var opChoice = [];
    //Creating an array to store the operands.
    var opArray = [];
    var netEquation = new Array(9);

    //Computing function
    var computer = {
        '+': (x, y) => x + y,
        '*': (x, y) => x * y,
        '-': (x, y) => x - y,
        '/': (x, y) => x / y,
    };
    function count(arr, desiredNum){
        var counts = {};

        for (var i = 0; i < arr.length; i++) {
            var num = arr[i];
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        // console.log(counts);
        // console.log(desiredNum, ":",counts[desiredNum]);
        return counts[desiredNum];
    }
    //Generating the Numbers
    while (numberArray.length < 5) {
        var r = Math.round(Math.random() * 8 + 1);
        //If number is not already in the array, push the number.
        if (numberArray.indexOf(r)===-1) numberArray.push(r);
    }
    //Generating the numbers for the index of the operand
    while (opChoice.length < 4) {
        var r = Math.floor(Math.random() * 4);
        if (r === 4) r = 3;
        if (opChoice.indexOf(r) === -1) {
            opChoice.push(r);
            
        }
    }
    
    function checkFunction(numCheck) {
        return numCheck >= 0 && numCheck - Math.floor(numCheck) === 0;
    }
    var numIndex = 0;
    var opIndex = 0;
    //Insert numbers and operators into one array;
    for( i = 0; i < netEquation.length; i++){
        if(i%2 === 0){
            netEquation[i]=numberArray[numIndex];
            numIndex++;
        } else{
            netEquation[i]=opTemplate[opChoice[opIndex]];
            opIndex++;
        }
    };
    
    //Evaluate the entire equation.
    //Loop while the net answer is still negative and/or a decimal
    var indexToBeChanged = 1;
    
    
    while (!checkFunction(stringMath(netEquation.join("")))) {
        var randIndex = Math.floor(Math.random() * 4);
        netEquation[indexToBeChanged] = count(netEquation, opTemplate[randIndex]) <2 ?  opTemplate[randIndex]: opTemplate[(randIndex +1) %4];
        indexToBeChanged = (indexToBeChanged + 2) < 9 ? indexToBeChanged + 2: 1;
        console.log(netEquation.join(''), " line 95");
        
    };
    for(i = 1; i<netEquation.length; i+=2){
        opArray.push(netEquation[i]);
    }
    // console.log(netEquation.join(''), "\n");
    
    let answer = stringMath(netEquation.join(''));
    
    
    return [numberArray, opArray, answer];
}

var answer = 0;
let allIds = [];
var numUsers = 0;
//Io refers to the httpServer socket refers to the current client's socket

io.on('connection', (socket) => {
    var addedUser = false;
    let userId = allIds.push(socket);
    console.log('A user just connected!!');
    //Listening on connection for incoming sockets
    // io.clients((error, clients) => {
    //     if (error) throw error;
    //     console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
    // });

    //Client requests to add a new user.
    socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers,
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers,
        });
    });
    socket.on('gameStart', () => {
        socket.emit('Game is Starting');
        socket.emit(`Welcome ${socket.username}`);
        socket.score = 0;
        //timer.start()
    });
    //Generate the random number function
    socket.on('genNewNum', () => {
        console.log('genning new Num');
        let [numberArray, opArray, answer] = numberGenerator();
        this.answer = answer; //from the var answer
        console.log('answer at gen new num' + answer);
        var numberSet = {
            numbers: numberArray,
            operators: opArray,
        };
        socket.numberSet = numberSet;
        socket.emit(numberSet);
    });
    socket.on('sendAnswer', (guess) => {
        //Check if timer has timeout
        //If timeout, don't accept answer
        //Check if user is current player, if not don't accept answer
        console.log(this.answer);
        if (guess === this.answer) {
            socket.emit('answer is correct');
            socket.score += 1;
            //timer.stop()
        } else {
            socket.emit('answer is wrong!!!! Answer is ',this.answer);
        }
    });
    socket.on('reset', function() {
        socket.score = 0;
        //timer.reset()
    });
    socket.on('timeout', function() {
        //Cycle next user
        //Reset timer
        //Stop accepting input
        continue;
    })

    socket.on('disconnect', () => {
        //On disconnect socket
        if (addedUser) --numUsers;
        console.log('user disconnected');
        socket.broadcast.emit('A user disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
