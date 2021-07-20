var board,
  game,
  statusEl = $("#status"),
  tagFen = false,
  fenEl = $("#fen"),
  pgnEl = $("#pgn"),
  specialCase = false;
initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

var onDragStart = function (source, piece, position, orientation) {
  //���� ������ �� ��������
  if (
    (game.game_over() === true && !specialCase) ||
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
};

var onDrop = function (source, target) {
  var move = game.move({
    from: source,
    to: target,
    promotion: "q",
  });
  if (move === null) return "snapback";
  if (move.promotion) {
    //��������� �����������
    mente();
    if (game.turn() === "w") pbh();
    else pwh();
  }
  updateStatus();
};

var onSnapEnd = function () {
  board.position(game.fen());
  updateStatus();
};

var onMouseoutSquare = function (square, piece) {
  //����� ������ � ������
  removeGreySquares();
};

var removeGreySquares = function () {
  //������ ���
  $("#board .square-55d63").css("background", "");
};

var onMouseoverSquare = function (square, piece) {
  //����� ������ �� ����
  var moves = game.moves({
    //�������� ������ ����� ��� ����
    square: square,
    verbose: true,
  });
  if (moves.length === 0) return; //���� � ������ ��� ����� - �����
  greySquare(square); //���������� ������� ����
  for (var i = 0; i < moves.length; i++) {
    //���������� ����, ���� ����� ������
    greySquare(moves[i].to);
  }
};

var greySquare = function (square) {
  //��������������� ������� ��������� �����
  var squareEl = $("#board .square-" + square);
  var background = "#a9a900"; //���� ��������� ����� �����
  if (squareEl.hasClass("black-3c85d") === true) {
    background = "#696900"; //���� ��������� ������ �����
  }
  squareEl.css("background", background);
};

function setCookie(name, value, expires) {
  var curCookie =
    name +
    "=" +
    escape(value) +
    (expires ? "; expires=" + expires.toGMTString() : "");
  document.cookie = curCookie;
}

function getCookie(name) {
  var prefix = name + "=";
  var cookieStartIndex = document.cookie.indexOf(prefix);
  if (cookieStartIndex == -1) return null;
  var cookieEndIndex = document.cookie.indexOf(
    ";",
    cookieStartIndex + prefix.length
  );
  if (cookieEndIndex == -1) cookieEndIndex = document.cookie.length;
  return unescape(
    document.cookie.substring(cookieStartIndex + prefix.length, cookieEndIndex)
  );
}

var updateStatus = function () {
  //���������� �������
  var status = "";
  specialCase = false;
  var moveColor = "Белые";
  if (game.turn() === game.BLACK) moveColor = "Чёрные";
  if (game.in_checkmate() === true) {
    //���
    status = "" + moveColor + " Ходят";
  } else if (game.in_draw() === true) {
    //�����
    if (game.in_stalemate() === true) status = "Ничья(Пат)";
    else if (game.in_threefold_repetition() === true) {
      specialCase = true;
      status = moveColor + " Ходят";
    } else if (game.insufficient_material() === true) {
      specialCase = true;
      status = moveColor + " Ходят";
    } else {
      specialCase = true;
      status = moveColor + " Ходят";
    }
    if (game.in_check() === true) {
      //���
      status += ", " + moveColor.toLowerCase() + "Ходят";
    }
  } else {
    status = moveColor + " Ходят";
    if (game.in_check() === true) {
      //���
      status += ", " + moveColor.toLowerCase() + " Ходят";
    }
  }
  statusEl.html(status);
  var fen = game.fen();
  fenEl.html(fen);
  var now = new Date();
  now.setTime(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  setCookie("fen", fen, now);
  updatePGNHeaders(fen);
  pgnEl.html(game.pgn());
};

var cfg = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
};
var sfen = getCookie("fen");
if (sfen) {
  cfg.position = sfen;
  game = new Chess(sfen);
  if (sfen != initialFen) tagFen = true;
} else game = new Chess();
board = ChessBoard("board", cfg);
updateStatus();

function undoMe() {
  //������ ����
  $("#coronar").hide();
  var u = game.undo();
  if (u) board.position(game.fen());
  updateStatus();
  if (!u) statusEl.append("; �� ���� �������� ���!");
}

function flipMe() {
  //�������� �����
  if (board) board.flip();
}

function trim(string) {
  //��������� ���� ������ ��������
  return string.replace(/\s+/g, " ").replace(/(^\s*)|(\s*)$/g, "");
}

function putFENMe() {
  //������ FEN
  var fen = prompt("������� ������� FEN:", "");
  var noFenMsg = "; �� ���� ��������� FEN!";
  if (typeof fen == "string" && fen != "") {
    var r = game.load(trim(fen));
    if (r) board.position(game.fen());
    updateStatus();
    if (!r) statusEl.append(noFenMsg);
  } else if (statusEl.text().indexOf(noFenMsg) === -1)
    statusEl.append(noFenMsg);
}

function updatePGNHeaders(fen) {
  //��������� PGN
  if (game) {
    if (fen != initialFen && tagFen == true) {
      game.header("FEN", fen);
      tagFen = false;
    }
    game.header("Event", "Tournament");
    game.header("Site", "City, Country");
    game.header("Date", dateFmt());
    game.header("Round", "1");
    game.header("White", "Player1");
    game.header("Black", "Player2");
    game.header("Result", getCurrentResult());
  }
}

function dateFmt() {
  //���� ����.��.��
  var date = new Date();
  var day = date.getDate();
  if (day < 10) day = "0" + day;
  var month = date.getMonth() + 1;
  if (month < 10) month = "0" + month;
  var year = date.getFullYear();
  return year + "." + month + "." + day;
}

function getCurrentResult() {
  //�������� ������� ��������� �� game
  return game.in_stalemate() || game.in_draw()
    ? "1/2-1/2"
    : game.in_checkmate()
    ? game.turn() === game.BLACK
      ? "1-0"
      : "0-1"
    : "*";
}

function switchShow(id) {
  //������������ ��������� ��� ������ ����������
  var div = document.getElementById("instructionBox");
  div.style.display = div.style.display == "none" ? "block" : "none";
  document.getElementById("instructionLink").innerHTML =
    div.style.display == "block" ? "������ ����������" : "����������";
  return false;
}

function selectElement(id) {
  //�������� ������� � ��������� id �� �����
  var element = document.getElementById(id);
  var range = document.createRange();
  range.selectNodeContents(element);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function reloadMe() {
  //������������
  var now = new Date();
  now.setTime(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  setCookie("fen", initialFen, now);
  window.location.reload(true);
}

///////////////////// ��������� ����������� ������
function reina() {
  document.getElementById("promote").value = "q";
  promo();
  updateStatus();
}
function torre() {
  document.getElementById("promote").value = "r";
  promo();
  updateStatus();
}
function alfil() {
  document.getElementById("promote").value = "b";
  promo();
  updateStatus();
}
function caballo() {
  document.getElementById("promote").value = "n";
  promo();
  updateStatus();
}
function pwh() {
  document.getElementById("promo_blancas").style.display = "none";
}
function pbh() {
  document.getElementById("promo_negras").style.display = "none";
}
function pws() {
  document.getElementById("promo_blancas").style.display = "";
}
function pbs() {
  document.getElementById("promo_negras").style.display = "";
}
function kw3() {
  $("#coronar .start button").on("click", function () {
    $("#coronar").hide();
    game.turn();
  });
  $("#coronar").show();
}

var hist;

function mente() {
  hist = game.history();
  kw3();
  game.undo();
}

function promo() {
  var nu = hist.pop();
  var tp = nu.length;
  var ab, cd, ef, a_from, b_to, c_promotion, res;
  if (tp === 7) {
    ab = nu.substring(2, nu.length - 3); //= h8
    cd = nu.substring(0, nu.length - 6); //= g
    ef = nu.substring(3, nu.length - 3); // =8
    if (game.turn() === "w") {
      res = ef - 1;
    } else {
      res = parseInt(ef) + parseInt(1);
    }
    a_from = cd + res;
    b_to = ab;
    c_promotion = document.getElementById("promote").value;
  } else {
    if (tp === 5) {
      ab = nu.substring(0, nu.length - 3); //= g8
      cd = nu.substring(0, nu.length - 4); //= g
      ef = nu.substring(1, nu.length - 3); // =8
      if (game.turn() === "w") {
        res = ef - 1;
      } else {
        res = parseInt(ef) + parseInt(1);
      }
      a_from = cd + res;
      b_to = ab;
      c_promotion = document.getElementById("promote").value;
    } else {
      if (tp === 6) {
        ab = nu.substring(2, nu.length - 2); //= h8
        cd = nu.substring(0, nu.length - 5); //= g
        ef = nu.substring(3, nu.length - 2); // =8
        if (game.turn() === "w") {
          res = ef - 1;
        } else {
          res = parseInt(ef) + parseInt(1);
        }
        a_from = cd + res;
        b_to = ab;
        c_promotion = document.getElementById("promote").value;
      } else {
        if (tp === 4) {
          ab = nu.substring(0, nu.length - 2); //= f8
          cd = nu.substring(0, nu.length - 3); //= g
          ef = nu.substring(1, nu.length - 2); // =8
          if (game.turn() === "w") {
            res = ef - 1;
          } else {
            res = parseInt(ef) + parseInt(1);
          }
          a_from = cd + res;
          b_to = ab;
          c_promotion = document.getElementById("promote").value;
        }
      }
    }
  }
  hist = game.move({ from: a_from, to: b_to, promotion: c_promotion });
  board.position(game.fen());
  $("#coronar").hide();
  pws();
  pbs();
  updateStatus();
}

function listenCookieChange(callback, interval = 1000) {
  let lastCookie = document.cookie;
  setInterval(() => {
    let cookie = document.cookie;
    if (cookie !== lastCookie) {
      try {
        callback({ oldValue: lastCookie, newValue: cookie });
      } finally {
        lastCookie = cookie;
      }
    }
  }, interval);
}

listenCookieChange(({ oldValue, newValue }) => {
  console.log(`Cookie changed from "${oldValue}" to "${newValue}"`);
  updateStatus();
}, 1000);
