$(function() {
  let $window = $(window);
  let $usernameInput = $(".usernameInput"); // Input for username
  let $roomnameInput = $("#lobbyNameInput");
  let $roompasswordInput = $("#lobbyPasswordInput");
  let $loginPage = $(".login.page");
  let $gamePage = $(".game.page");
  let $lobbyPage = $(".lobby.page"); 
  let $createroomview = $(".create-room-view");
  let $lobbylistPage = $(".lobby-list.page");
  let $roomlistview = $(".roomlist-view");
  let $userlabel = $("#user-label");
  let $opponentLabel = $("#computer-label");
  let $currentInput = $usernameInput.focus();
  let useronline = $("#user-online span");
  let usersonline = $("#users-online");
  let $roomNameAndId = $("#room");
  const result_p = document.querySelector(".result > p");
  let $actionmessage = $('#action-message');
  const p1Score_span = $("#p1-score");
  const p2Score_span = $("#p2-score");
  let username;
  let userid;
  let id;
  let connected = false;
  const P1 = "0";
  const P2 = "1";
  let player;
  let game;
  let roomName;
  const rock_div = $("#r");
  const paper_div = $("#p");
  const scissors_div = $("#s");
  let socket = io();

  class Player {
    constructor(name, type, id) {
      this.name = name;
      this.id = id;
      this.type = type;
      this.currentTurn = false;
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
      const message = turn
        ? "Dein Zug"
        : "Warte bis dein Gegner seine Auswahl getroffen hat!";
      $actionmessage.html(message);
    }

    getPlayerName() {
      return this.name;
    }
    getPlayerId() {
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
      this.choices = [];
      this.p1choice;
      this.p2choice;
      this.player1;
      this.player2;
      this.player1Score = 0;
      this.player2Score = 0;
      this.moves = 0;
    }
    getRoomId() {
      return this.roomId;
    }
    getRoomName() {
      return this.roomName;
    }
    // Remove the menu from DOM, display the gameboard and greet the player.
    displayBoard(message) {
      $gamePage.show();

      this.createGameBoard();
    }

    updateBoard(type, choice) {
      if (type == P1) {
        this.p1choice = choice;
      }
      if (type == P2) {
        this.p2choice = choice;
      }

      this.moves++;
    }

    playTurn(choice) {
      // Emit an event to update other player that you've played your turn.
      if (player.getPlayerType() == P1) {
        //console.log("Spieler 1 : " + choice);
        this.p1choice = choice;
      }
      if (player.getPlayerType() == P2) {
        //console.log("Spieler 2 : " + choice);
        this.p2choice = choice;
      }

      socket.emit("playTurn", {
        choice: choice,
        room: this.getRoomId(),
        player: player.getPlayerType()
      });
    }

    createGameBoard() {
      function tileClickHandler(choice) {
        if (!player.getCurrentTurn() || !game) {
          //console.log('Its not your turn!');
          return;
        }

        //console.log(choice);

        document.getElementById(choice).classList.add("gray-glow");

        // Update board after your turn.
        game.playTurn(choice);

        player.setCurrentTurn(false);

        game.checkWinner();
      }

      paper_div.click(function() {
        tileClickHandler("p");
      });
      scissors_div.click(function() {
        tileClickHandler("s");
      });
      rock_div.click(function() {
        tileClickHandler("r");
      });
    }

    checkWinner() {
        console.log(game.p1choice);
        console.log(game.p2choice);
      if (game.p1choice != undefined && game.p2choice != undefined) {
        switch (game.p1choice + game.p2choice) {
          case "rs":
          case "pr":
          case "sp":
            //console.log("P1 win");
            win(game.p1choice, game.p2choice, game.player1);
            break;
          case "rp":
          case "ps":
          case "sr":
            //console.log("P2 win");
            win(game.p1choice, game.p2choice, game.player2);
            break;
          case "rr":
          case "pp":
          case "ss":
            //console.log("DRAW");
            win(game.p1choice, game.p2choice, "draw");
            break;
        }
      }
      function win(p1choice, p2choice, winner) {
          switch (winner) {
              case game.player1:
                  game.player1Score++;
                  break;
              case game.player2:
                  game.player2Score++;
                  break;
              default:
                  break;
          }
        socket.emit('gameEnded', {
            room: game.getRoomId(),
            p1choice: p1choice,
            p2choice: p2choice,
            winner: winner,
            p1score : game.player1Score,
            p2score : game.player2Score
          });
          
      }
    }
  }

  function convertToWord(letter) {
    if (letter == "r") return "Stein";
    if (letter == "p") return "Papier";
    return "Schere";
}

  const addParticipantsMessage = data => {
    useronline.html(data.numUsers);
    usersonline.html(data.numUsers);
  };
  const addRooms = data => {
    $("#rooms-online").html(data.numRooms);
  };
  socket.on("userconnected", data => {
    addParticipantsMessage(data);
    addRooms(data);

    for (let roomid in data.rooms) {
      $("#rooms").append(
        "<tr><td data-room=" +
          data.rooms[roomid].roomid +
          ' style="display: none">' +
          data.rooms[roomid].roomid +
          "</td><td>" +
          data.rooms[roomid].roomname +
          "</td><td>1/2</td><td>Nein</td><td>" +
          data.rooms[roomid].owner +
          "</td></tr>"
      );
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
      $loginPage.off("click");
      // Tell the server your username
      socket.emit("add user", username);
    } else {
      console.log("Inkorrekter Benutzername");
    }
  };

  // Prevents input from having injected markup
  const cleanInput = input => {
    return $("<div/>")
      .text(input)
      .html();
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
  socket.on("disconnect", () => {
    log("you have been disconnected");
  });
  // Log a message
  const log = (message, options) => {
    //console.log(message);
  };

  // Whenever the server emits 'login', log the login message
  socket.on("login", data => {
    connected = true;
    userid = data.id;
    id = data.sockid;
    username = data.username;
    addParticipantsMessage(data);
    player = new Player(data.username, P1, userid);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on("user joined", data => {
    log(data.username + " joined");
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", data => {
    //console.log(data);

    log(data.username + " left");
    addParticipantsMessage(data);
    addRooms(data);
    if (data.room != null) {
      $("#rooms tr").remove(":contains(" + data.room.roomid + ")");
    }
  });

  socket.on("playerJoinedRoom", data => {
    //console.log("Game joined");
    $lobbyPage.hide();
    updateWaitingScreen(data);
  });

  socket.on("newGameCreated", data => {
    const message = `Hello, ${
      data.name
    }. Please ask your friend to enter Game ID: 
        ${data.room}. Waiting for player 2...`;
    game = new Game(data.gameId, data.roomname);
    game.displayBoard(message);
    $createroomview.hide();
    //$gamePage.show();
    $userlabel.html(player.getPlayerName());
    $roomNameAndId.html(data.roomname + "/" + data.gameId);

    let usersInRoom = 0;
    usersInRoom++;
    //console.log(usersInRoom);
  });

  socket.on("update-lobbylist", data => {
    //console.log(data);

    $("#rooms").append(
      "<tr><td data-room=" +
        data.rooms.roomid +
        ' style="display: none">' +
        data.rooms.roomid +
        "</td><td>" +
        data.rooms.roomname +
        "</td><td>1/2</td><td>Nein</td><td>" +
        data.rooms.owner +
        "</td></tr>"
    );
    $("#rooms-online").html(data.numRooms);
  });

  socket.on("turnPlayed", data => {
    console.log(data);

    const opponentType = player.getPlayerType() === P1 ? P2 : P1;
    //console.log(opponentType);
    game.updateBoard(opponentType, data.choice);
    player.setCurrentTurn(true);
    //console.log(player);
  });

  socket.on('gameEnd', (data) => {
      console.log(data);
      const smallP1Word = game.player1.fontsize(3).sub();
      const smallP2Word = game.player2.fontsize(3).sub();
      if (data.winner == game.player1) {
        result_p.innerHTML = `${convertToWord(data.p1choice)}${smallP1Word} schlägt ${convertToWord(data.p2choice)}${smallP2Word}. ${game.player1} gewinnt!`;
        document.getElementById(data.p1choice).classList.remove('gray-glow');
        document.getElementById(data.p2choice).classList.remove('gray-glow');
        document.getElementById(data.p1choice).classList.add('green-glow');
        document.getElementById(data.p2choice).classList.add('red-glow');
        setTimeout(function () {
            document.getElementById(data.p1choice).classList.remove('green-glow');
            document.getElementById(data.p2choice).classList.remove('red-glow');
        }, 1000);
      }
      if (data.winner == game.player2) {
        result_p.innerHTML = `${convertToWord(data.p2choice)}${smallP2Word} schlägt ${convertToWord(data.p1choice)}${smallP1Word}. ${game.player2} gewinnt!`;
        document.getElementById(data.p1choice).classList.remove('gray-glow');
        document.getElementById(data.p2choice).classList.remove('gray-glow');
        document.getElementById(data.p2choice).classList.add('green-glow');
        document.getElementById(data.p1choice).classList.add('red-glow');
        setTimeout(function () {
            document.getElementById(data.p2choice).classList.remove('green-glow');
            document.getElementById(data.p1choice).classList.remove('red-glow');
        }, 1000);
      }
      if (data.winner == "draw") {
        result_p.innerHTML = `${convertToWord(data.p1choice)}${smallP1Word} gleich ${convertToWord(data.p2choice)}${smallP2Word}. Unentschieden.`;
        document.getElementById(data.p1choice).classList.remove('gray-glow');
        document.getElementById(data.p2choice).classList.remove('gray-glow');
      }
      p1Score_span.html(data.p1score);
      p2Score_span.html(data.p2score);
      game.p1choice = null;
      game.p2choice = null;
  });

  $("#btnCreateGame").click(function() {
    $roomlistview.hide();
    $createroomview.show();
    $roomnameInput.val(player.getPlayerName());
  });
  $("#btnJoinGame").click(function() {
    // socket.emit('hostCreateNewGame');
    $roomlistview.hide();
    $lobbylistPage.show();
  });
  $("#btnCreateRoom").click(function() {
    roomname = cleanInput($roomnameInput.val().trim());
    roompassword = cleanInput($roompasswordInput.val().trim());
    console.log(roompassword);
    if (roomname.length >= 1) {
      var data = {
        username: player.getPlayerName(),
        roomname: roomname,
        roompassword: roompassword,
        id: id,
        game
      };
      // console.log("btnCreateroom");
      // console.log(data);
      socket.emit("hostCreateNewGame", data);
    } else {
      console.log("Raumname zu kurz");
    }
  });
  $("#btnJoin").click(function() {
    const name = username;
    const roomID = $("#inputGameId").val();
    if (!name || !roomID) {
      alert("Please enter your name and game ID.");
      return;
    }
    var data = {
      username: name,
      roomid: roomID
    };

    socket.emit("playerJoinGame", { name, room: roomID });
    player = new Player(name, P2);
    $lobbylistPage.hide();
  });

  $("#userTable").on("click", "tbody tr", function(event) {
    $(this)
      .addClass("selected")
      .siblings()
      .removeClass("selected");
  });

  $("#userTable").on("dblclick", "tbody tr", function(event) {
    const name = username;
    const roomID = $(this)
      .children()
      .data("room");
    socket.emit("playerJoinGame", { name, room: roomID });
    player = new Player(name, P2);
    $roomlistview.hide();
  });
  function updateWaitingScreen(data) {
    //console.log("updateWaitingScreen");
    $("#resultLabel").html("Das Spiel kann beginnen!");
    //console.log(data);
  }
  socket.on("player1", data => {
    game.room = data.room;
    game.player1 = data.room.owner;
    game.player2 = data.room.opponent;
    $opponentLabel.html(data.name);
    updateWaitingScreen(data);
    player.setCurrentTurn(true);
  });

  /**
   * Joined the game, so player is P2(O).
   * This event is received when P2 successfully joins the game room.
   */
  socket.on("player2", data => {
    updateWaitingScreen(data);
    const message = `Hello, ${data.name}`;
    //console.log(message);
    // Create game for player 2
    game = new Game(data.room.roomid, data.room.roomname);
    game.player1 = data.room.owner;
    game.player2 = data.room.opponent;
    game.room = data.room;
    $userlabel.html(data.room.owner);
    $roomNameAndId.html(data.room.roomname + "/" + data.room.roomid);
    game.displayBoard(message);
    $opponentLabel.html(player.getPlayerName());
    player.setCurrentTurn(false);
  });

  socket.on("err", data => {
    console.log(data);
  });
});
