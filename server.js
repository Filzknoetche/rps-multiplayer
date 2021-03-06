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
let numRooms = 0;
let id = 1;
let users = {};
let rooms = {};
let roompasswords = {};

io.on('connection', (socket) => {
    let addedUser = false;
    socket.emit('userconnected', {numUsers: numUsers, rooms: rooms, numRooms: numRooms});
    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        //console.log(username);
        
        if (addedUser) return;
        userid = id;
        id++;
        users[socket.id] = {id:userid, sockid:socket.id, username:username, inGame: false};
        // we store the username in the socket session for this client
        socket.username = username;
        socket.userid = userid;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            username: username,
            id:userid,
            sockid:socket.id,
            numUsers: numUsers,
            user: users
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
            let userroom;
            --numUsers;
            if (users[socket.id].inGame) {                
                for (let roomid in rooms) {
                    if (rooms[roomid].id == socket.id) {
                        userroom = rooms[roomid];
                        delete rooms[roomid];
                        --numRooms;
                        
                    }else if(rooms[roomid].opponent == socket.username){
                        console.log("lul");
                        delete rooms[roomid].opponent;
                        console.log(rooms);
                        socket.broadcast.to(roomid).emit('opponentLeft', {});
                        
                        //TODO
                        //Sende an Host nachricht das Spieler verlassen hat und setzte so den Raum zurück
                        //Aktuallisiere lobby liste

                        //opponent vom raum zurücksetzten
                        //An host schicken das benutzer weg ist
                        
                    }
                }
            }
            delete users[socket.id];
            
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers,
                numRooms: numRooms,
                room: userroom
            });
        }
    });

    socket.on('hostCreateNewGame', hostCreateNewGame);
    socket.on('playerJoinGame', playerJoinGame);
    socket.on('playerWantToJoin', playerWantsToJoin);
    socket.on('enterPw', enterPw);

    function hostCreateNewGame(data) {
        // Create a unique Socket.IO Room
        let thisGameId = ( Math.random() * 100000 ) | 0;
        rooms[thisGameId] = {id: data.id, roomid: thisGameId, roomname: data.roomname, owner: data.username, password: (data.roompassword == "" ? false : true)};
        roompasswords[thisGameId] = {id: data.id, roomid: thisGameId, password: data.roompassword};
        ++numRooms;
        let user = users[socket.id];
        user.inGame = true;
        // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
        socket.emit('newGameCreated', {gameId: thisGameId, mySocketId: data.id, roomname: data.roomname});
        io.emit('update-lobbylist', {rooms: rooms[thisGameId], numRooms: numRooms});
        // Join the Room and wait for the players
        socket.join(thisGameId.toString());
    };

    function playerJoinGame(data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            let user = users[socket.id];
            user.inGame = true;
            let test1 = rooms[data.room];
            Object.assign(test1, {opponent: data.name});
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('player1', {name: data.name, room: test1});
            socket.emit('player2', { name: data.name, id: data.room, room: test1});
            io.emit('update-lobbylist', {rooms: rooms[data.room]});
        } else {
            socket.emit('err', { message: 'Sorry, der Raum ist voll!' });
        }
    }
    function playerWantsToJoin(data) {        
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            let test1 = rooms[data.room];
            if (!test1.password) {
                socket.emit("noPW", test1);
            }else{
                socket.emit("pw", test1);
            }
        }
    }
    function enterPw(data) {
        if (data.pw == roompasswords[data.room].password) {
            socket.emit("pwcorrect", rooms[data.room]);
        }else{
            socket.emit("pwincorrect", rooms[data.room]);
        }
    }

    socket.on('playTurn', (data) => {
        socket.broadcast.to(data.room).emit('turnPlayed', {
            choice: data.choice,
            room: data.room,
            player: data.player
        });
    });
    socket.on('gameEnded', (data) => {
        io.in(data.room).emit('gameEnd', data);
    });
});
