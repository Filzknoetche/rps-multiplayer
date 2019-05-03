// Setup basic express server
let express = require('express');
let app = express();
let path = require('path');
let server = require('http').createServer(app);
let io = require('socket.io')(server);
let port = process.env.PORT || 3003;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

let userid;
let numUsers = 0;
let id = 1;
let users = {};

io.on('connection', (socket) => {
    let addedUser = false;
    socket.emit('userconnected', numUsers);
    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        //console.log(username);
        
        if (addedUser) return;
        userid = id;
        id++;
        users[socket.id] = {id:userid, sockid:socket.id, username:username};
        // we store the username in the socket session for this client
        socket.username = username;
        socket.userid = userid;
        ++numUsers;
        addedUser = true;
        //process.stdout.write("" + numUsers +" users\r");
        socket.emit('login', {
            username: username,
            id:userid,
            sockid:socket.id,
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            userid: socket.userid,
            numUsers: numUsers,
        });
        io.emit('update-players', users);
    });
    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;
            //process.stdout.write("" + numUsers +" users\r");
            delete users[socket.id];
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });

    socket.on('hostCreateNewGame', hostCreateNewGame);
    socket.on('playerJoinGame', playerJoinGame);

    function hostCreateNewGame(data) {
        // Create a unique Socket.IO Room

        // console.log("\nCreateNewGame");
        let thisGameId = ( Math.random() * 100000 ) | 0;

        // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
        socket.emit('newGameCreated', {gameId: thisGameId, mySocketId: data.id, roomname: data.roomname});
        // console.log(thisGameId);
        io.emit('update-lobbylist', {gameId: thisGameId, mySocketId: data.id, roomname: data.roomname});
        // Join the Room and wait for the players
        socket.join(thisGameId.toString());
    };

    function playerJoinGame(data) {
        let sock = this;
        // console.log('Player ' + data.username + " mit der id " + data.userid + " socketid " + data.id + " Will den Raum " + data.roomid + " beitreten");
        socket.join(data.roomid);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.roomid).emit('playerJoinedRoom', data);
    }
});
