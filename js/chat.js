
var talksDb = 'talks';
var dataDb = 'data';
var params = get_params();

var dataValues;

var CHAT = CHAT || {};
CHAT.fire = {
  init:function() {
    this.setParameters();
    this.bindEvent();
  },

  setParameters: function() {
    this.$chatBoard =  $('#chat-board');
    this.$nameArea =   $('#name-area');
    this.$textArea =   $('#message-area');
    this.$sendButton = $('#send-button');
    this.$muteCheck = $('#mute-check');
    this.$scrollCheck = $('#scroll-check');
    this.$aaCheck = $('#aa-check');

    var room = params['room'] || '';
    talksDb += room;
    dataDb += room;
    if(room) {
      $('#head').append('「' + room + '」');
    }
    this.$nameArea.val(params['user']);

    this.chatDataStore = new Firebase('TODO: url');
  },

  bindEvent: function() {
    var self = this;
    this.$sendButton.on('click', function() {
      self.sendMsg();
    });
    this.$textArea.keydown(function (e) {
      if (event.ctrlKey && e.keyCode === 13) {
        self.sendMsg();
        return false;
      }
    });

    this.isBeep = false;
    this.isBeeping = false;

    var limit = Number(params['limit']) || 100;
    this.chatDataStore.child(talksDb).limitToLast(limit).on('child_added', function(snapshot) {
      var json = snapshot.val();
      var username = json['user'];
      self.addText(username, json['message'], json['timestamp']);

      if(self.isBeep && !self.$muteCheck.prop('checked') && username !== self.$nameArea.val()) {
        if(!self.isBeeping) {
          self.isBeeping = true;
          beep();
          self.isBeeping = false;
        }
      }
      if(self.$scrollCheck.prop('checked')) {
        scroll_bottom(self.$chatBoard);
      }
    });
    this.chatDataStore.child(dataDb).on('value', function(snapshot) {
      var v = snapshot.val();
      if(v) {
        dataValues = v.values;
      }
      if(!dataValues) {
        dataValues = {};
      }
    });
    setTimeout(function() {
      self.isBeep = true;
    }, 1000);
  },

  send: function(user, message) {
    this.chatDataStore.child(talksDb).push({
      user: user,
      message: message,
      timestamp: dateFormatter.format(new Date(), 'hh:mm:ss')
    });
  },

  sendMsg: function() {
    var user = this.$nameArea.val().trim() || '名無しさん';
    var body = this.$textArea.val().trim();
    if (body === '') {
      return;
    }

    if(this.$aaCheck.prop('checked')) {
      this.send(user, '@@' + body);
    } else {
      this.send(user, body);
    }
    this.$textArea.val('');

    body = to_hankaku(body).toLowerCase();
    // bot機能など
  },

  addText: function(username, message, timestamp) {
    var senderClass;
    var balloonClass;
    if (username == this.$nameArea.val()) {
      senderClass = "sender me";
      balloonClass = "balloon right";
    } else {
      senderClass = "sender";
      balloonClass = "balloon left";
    }
    if(username === "system") {
      balloonClass += " system";
    }

    var mes = "<il>"
    + "<p class='" + senderClass  + "'>" + this.escape_html(username,  2)  + "</p>"
    + "<p class='timestamp'>"            + this.escape_html(timestamp, 0)  + "</p>"
    + "<p class='" + balloonClass + "'>" + this.escape_html(message,   1)  + "</p>"
    + "</il>";

    this.$chatBoard.append($(mes)[0]);
  },

  escape_html: function(txt, mode) {
    if(typeof txt !== 'string') {
      return txt;
    }
    txt = escape_html(txt);

    if(txt.substr(0, 2) === "@@") {
        txt = txt.substr(2);
    } else {
        txt = join_surround(txt.split("*"), "<span style='font-weight: bold'>",             "</span>");
        txt = join_surround(txt.split("_"), "<span style='font-style: italic'>",            "</span>");
        txt = join_surround(txt.split("~"), "<span style='text-decoration: line-through'>", "</span>");
        txt = join_surround(txt.split("^"), "<span style='text-decoration: underline'>",    "</span>");
    }

    txt = txt.replace(/\\n|\n/g, '<br>');
    txt = txt.replace(/\\t|\t/g, '<span style="margin-right: 4em;"></span>');
    
    txt = txt.replace('[q]', '<q>');
    txt = txt.replace('[/q]', '</q>');
    
    if(mode === 1 || mode === 2) {
      txt = txt.replace('[img]', '<img src="');
      txt = txt.replace('[di]', '<img src="http://drive.google.com/uc?id=');
      if(mode === 1) {
        txt = txt.replace('[/img]', '" style="max-width: 400px;">');
        txt = txt.replace('[/di]', '" style="max-width: 400px;">');
        
        txt = txt.replace('[youtu]', '<iframe width="640" height="360" src="https://www.youtube.com/embed/');
        txt = txt.replace('[/youtu]', '?rel=0" frameborder="0" allowfullscreen></iframe>');
      } else {
        txt = txt.replace('[/img]', '" style="max-height: 80px;">');
        txt = txt.replace('[/di]', '" style="max-height: 80px;">');
      }
    }
    return txt;
  }
}

$(function() {
  CHAT.fire.init();
});
