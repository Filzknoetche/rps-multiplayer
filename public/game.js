$(function () {
    var FADE_TIME = 150; // ms
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $loginPage = $('.login.page'); // The login page
    var $gamePage = $('.game.page'); // The login page
    var $lobbyPage = $('.lobby.page'); // The login page
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
    var socket = io();



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
        // console.log(message);
    };

// Whenever the server emits 'login', log the login message
    socket.on('login', (data) => {
        connected = true;
        userid = data.id;
        id = data.sockid;
        addParticipantsMessage(data);
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
        $lobbyPage.hide();
        $gamecreatedPage.show();
        $gameiddisplay.html(data.gameId);
        let usersInRoom = 0;
        usersInRoom++;
        console.log(usersInRoom);
    });


    $('#btnCreateGame').click(function () {
        // console.log("lul");
        socket.emit('hostCreateNewGame');
    });
    $('#btnJoinGame').click(function () {
        // socket.emit('hostCreateNewGame');
        $lobbyPage.hide();
        $lobbylistPage.show();
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
