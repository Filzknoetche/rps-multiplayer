$(function () {
    let FADE_TIME = 150; // ms
    let $window = $(window);
    let $usernameInput = $('.usernameInput'); // Input for username
    let $roomnameInput = $('#lobbyNameInput');
    let $roompasswordInput = $('#lobbyPasswordInput');
    let $loginPage = $('.login.page'); // The login page
    let $gamePage = $('.game.page'); // The login page
    let $lobbyPage = $('.lobby.page'); // The login page
    let $lobbycreatePage = $('.lobby-create.page');
    let $createroomview = $('.create-room-view');
    let $gamecreatedPage = $('.game-created.page'); // The login page
    let $lobbylistPage = $('.lobby-list.page'); // The login page
    let $roomlistview = $('.roomlist-view');
    let $userlabel = $('#user-label');
    let $opponentLabel = $('#computer-label');
    let $gameiddisplay = $('#gameid-display');
    let $currentInput = $usernameInput.focus();
    let useronline = $('#user-online span');
    let usersonline = $('#users-online');
    let $roomNameAndId = $('#room');
    let username;
    let userid;
    let id;
    let connected = false;
    const P1 = '0';
    const P2 = '1';
    let player;
    let game;
    let roomName;
    let socket = io();

    class Player {
        constructor(name, type, id) {
            this.name = name;
            this.id = id;
            this.type = type;
            this.currentTurn = true;
            this.playsArr = 0;
        }

        // Set the bit of the move played by the player
        // tileValue - Bitmask used to set the recently played move.
        updatePlaysArr(tileValue) {
            this.playsArr += tileValue;
        }

        getPlaysArr() {
            return this.playsArr;
        }

        // Set the currentTurn for player to turn and update UI to reflect the same.
        setCurrentTurn(turn) {
            this.currentTurn = turn;
            const message = turn ? 'Your turn' : 'Waiting for Opponent';
            $('#turn').text(message);
        }

        getPlayerName() {
            return this.name;
        }
        getPlayerId(){
            return this.id;
        }

        getPlayerType() {
            return this.type;
        }

        getCurrentTurn() {
            return this.currentTurn;
        }
    }

    // roomId Id of the room in which the game is running on the server.
    class Game {
        constructor(roomId, roomName) {
            this.roomId = roomId;
            this.roomName = roomName;
            this.board = [];
            this.moves = 0;
        }
        getRoomId() {
            return this.roomId;
        }
        getRoomName(){
            return this.roomName;
        }
        // Remove the menu from DOM, display the gameboard and greet the player.
        displayBoard(message) {
            $opponentLabel.html(player.getPlayerName());
            $gamePage.show();
            
            //this.createGameBoard();
        }

    }

    const addParticipantsMessage = (data) => {
        useronline.html(data.numUsers);
        usersonline.html(data.numUsers);
    }
    const addRooms = (data) => {
        $('#rooms-online').html(data.numRooms);
    }
    socket.on('userconnected', (data) => {
        addParticipantsMessage(data);
        addRooms(data);
        console.log(data);
        
        for (let roomid in data.rooms) {
            $('#rooms').append('<tr><td data-room='+data.rooms[roomid].roomid+'>'+data.rooms[roomid].roomname+'</td><td>1/2</td><td>Nein</td><td>'+data.rooms[roomid].owner+'</td></tr>');
        }
    });

    // Sets the client's username
    const setUsername = () => {
        username = cleanInput($usernameInput.val().trim());
        // If the username is valid
        if (username && username.length >= 1 && username.length < 15) {
            $loginPage.fadeOut();
            // $gamePage.show();
            $roomlistview.fadeIn();
            $loginPage.off('click');
            // Tell the server your username
            socket.emit('add user', username);
        } else {
            console.log("Inkorrekter Benutzername");

        }
    };

    // Prevents input from having injected markup
    const cleanInput = (input) => {
        return $('<div/>').text(input).html();
    };

    $window.keydown(event => {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            // console.log(event);
            // console.log(event.target.className);
            if (event.target.className === "usernameInput") {
                setUsername();
            }
            
            
        }
    });
    socket.on('disconnect', () => {
        log('you have been disconnected');
    });
    // Log a message
    const log = (message, options) => {
        //console.log(message);
    };

    // Whenever the server emits 'login', log the login message
    socket.on('login', (data) => {
        connected = true;
        userid = data.id;
        id = data.sockid;
        username = data.username;
        addParticipantsMessage(data);
        player = new Player(data.username, P1, userid);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', (data) => {
        log(data.username + ' joined');
        addParticipantsMessage(data);

    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', (data) => {
        console.log(data);
        
        log(data.username + ' left');
        addParticipantsMessage(data);
        addRooms(data);
        if (data.room != null) {
            $('#rooms tr').remove( ":contains("+ data.room.roomid +")");
        }
        
    });

    socket.on('playerJoinedRoom', (data) => {
        console.log("Game joined");
        $lobbyPage.hide();
        updateWaitingScreen(data);
    });

    socket.on('newGameCreated', (data) => {
        game = new Game(data.gameId, data.roomname);
        $createroomview.hide();
        $gamePage.show();
        $userlabel.html(player.getPlayerName());
        $roomNameAndId.html(data.roomname+"/"+data.gameId);
        
        let usersInRoom = 0;
        usersInRoom++;
        //console.log(usersInRoom);
    });

    socket.on('update-lobbylist', (data) => {
        console.log(data);
        
        $('#rooms').append('<tr><td data-room='+data.rooms.roomid+'>'+data.rooms.roomname+'</td><td>1/2</td><td>Nein</td><td>'+data.rooms.owner+'</td></tr>');
        $('#rooms-online').html(data.numRooms);
    });

    $('#btnCreateGame').click(function () {
        $roomlistview.hide();
        $createroomview.show();
    });
    $('#btnJoinGame').click(function () {
        // socket.emit('hostCreateNewGame');
        $roomlistview.hide();
        $lobbylistPage.show();
    });
    $('#btnCreateRoom').click(function () {
        roomname = cleanInput($roomnameInput.val().trim());
        game = new Game(id, roomname);
        if (roomname.length >= 1) {
            var data = {
                username: player.getPlayerName(),
                roomname: roomname,
                id: id,
                game
            }
            // console.log("btnCreateroom");
            // console.log(data);
            socket.emit('hostCreateNewGame', data);
        }else{
            console.log("Raumname zu kurz");
        }
        

    });
    $('#btnJoin').click(function () {
        const name = username;
        const roomID = $('#inputGameId').val();
        if (!name || !roomID) {
            alert('Please enter your name and game ID.');
            return;
        }
        var data = {
            username: name,
            roomid: roomID
        }
        
        socket.emit('playerJoinGame', { name, room: roomID });
        player = new Player(name, P2);
        $lobbylistPage.hide();
    });

    $('#userTable').on('click', 'tbody tr', function(event) {
        console.log( $( this ).text() );
        
        $(this).addClass('selected').siblings().removeClass('selected');
    });

    $('#userTable').on('dblclick', 'tbody tr', function(event) {
        const name = username;
        const roomID = $(this).children().data("room");
        socket.emit('playerJoinGame', { name, room: roomID });
        player = new Player(name, P2);
        $roomlistview.hide();
    });
    function updateWaitingScreen(data) {
        console.log("updateWaitingScreen");
        $('#resultLabel').html("Das Spiel kann beginnen");
        setInterval(function(){$('#resultLabel').html(""); }, 3000);
        console.log(data);
        
    }
    socket.on('player1', (data) => {
        const message = `Hello, ${player.getPlayerName()}`;
        console.log(message);
        console.log(data);
        $opponentLabel.html(data.name);
        updateWaitingScreen(data);
        //$('#userHello').html(message);
        //player.setCurrentTurn(true);
      });
    
      /**
         * Joined the game, so player is P2(O). 
         * This event is received when P2 successfully joins the game room. 
         */
      socket.on('player2', (data) => {
        console.log(data);
        updateWaitingScreen(data);
        const message = `Hello, ${data.name}`;
        console.log(message);
        // Create game for player 2
        game = new Game(data.room);
        console.log(game);
        $userlabel.html(data.room.owner);
        $roomNameAndId.html(data.room.roomname+"/"+data.room.roomid);
        game.displayBoard(message);
        
        //player.setCurrentTurn(false);
      });

      //TEST
      socket.on('big-announcement', (data) =>{
        console.log(data);
        
      });

      socket.on('err', (data)=>{
        console.log(data);
        
      });
});