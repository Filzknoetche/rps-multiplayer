$(function () {
    var FADE_TIME = 150; // ms
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    let $roomnameInput = $('.lobbyNameInput');
    var $loginPage = $('.login.page'); // The login page
    var $gamePage = $('.game.page'); // The login page
    var $lobbyPage = $('.lobby.page'); // The login page
    let $lobbycreatePage = $('.lobby-create.page');
    var $gamecreatedPage = $('.game-created.page'); // The login page
    var $lobbylistPage = $('.lobby-list.page'); // The login page
    var $userlabel = $('#user-label');
    var $gameiddisplay = $('#gameid-display');
    var $currentInput = $usernameInput.focus();
    var useronline = $('#user-online');
    var username;
    var userid;
    var id;
    var connected = false;
    const P1 = '0';
    const P2 = '1';
    let player;
    let game;
    var socket = io();

    class Player {
        constructor(name, type) {
          this.name = name;
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
    
        getPlayerType() {
          return this.type;
        }
    
        getCurrentTurn() {
          return this.currentTurn;
        }
      }

      // roomId Id of the room in which the game is running on the server.
  class Game {
    constructor(roomId) {
      this.roomId = roomId;
      this.board = [];
      this.moves = 0;
    }
    getRoomId() {
        return this.roomId;
    }

  }

    const addParticipantsMessage = (data) => {
        // console.log(data.numUsers);
        useronline.html(data.numUsers);
    }

// Sets the client's username
    const setUsername = () => {
        username = cleanInput($usernameInput.val().trim());
        // If the username is valid
        if (username) {
            $loginPage.fadeOut();
            // $gamePage.show();
            $lobbyPage.show();
            $loginPage.off('click');
            // Tell the server your username
            socket.emit('add user', username);
            $userlabel.html(username);
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
            setUsername();
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
        player = new Player(data.username, P1);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', (data) => {
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', (data) => {
        log(data.username + ' left');
        addParticipantsMessage(data);
    });

    socket.on('playerJoinedRoom', (data) => {
        console.log("Game joined");
        $lobbyPage.hide();
        updateWaitingScreen(data);
        usersInRoom++;
        console.log(usersInRoom);
    });

    socket.on('newGameCreated', (data) => {
        game = new Game(data.gameId);
        $lobbycreatePage.hide();
        $gamePage.show();
        $gameiddisplay.html(data.gameId);
        let usersInRoom = 0;
        usersInRoom++;
        console.log(usersInRoom);
    });

    socket.on('update-lobbylist', (data) => {
        console.log(data);
        //$('#lobby-list').append('<p/>').text('Raum ' + data.roomname + ' joined the game.');
        $(".lobby-list ul").append('<li>'+data.roomname+'</li>');
    });

    $('#btnCreateGame').click(function () {
        // console.log("lul");
        //socket.emit('hostCreateNewGame');
        $lobbyPage.hide();
        $lobbycreatePage.show();
    });
    $('#btnJoinGame').click(function () {
        // socket.emit('hostCreateNewGame');
        $lobbyPage.hide();
        $lobbylistPage.show();
    });
    $('#btnCreateRoom').click(function(){
        roomname = cleanInput($roomnameInput.val().trim());
        var data = {
            username: player.getPlayerName(),
            roomname: roomname,
            id: id
        }
        console.log(data);
        socket.emit('hostCreateNewGame', data);

    });
    $('#btnStart').click(function () {
        var data = {
            username: username,
            userid: userid,
            id: id,
            roomid: $('#inputGameId').val()
        }
        socket.emit('playerJoinGame', data);
        $lobbylistPage.hide();
    });

    function updateWaitingScreen(data) {
        console.log(data);
        $('#playersWaiting')
            .append('<p/>')
            .text('Player ' + data.username + ' joined the game.');
    }

});
