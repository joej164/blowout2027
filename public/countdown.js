window.startCountdown = function () {
      /* ---- Countdown configuration ---- */
      var EVENT_START = "2027-01-14T00:00:00-08:00"; // Pacific midnight, Thu Jan 14
      var EVENT_END   = "2027-01-19T00:00:00-08:00"; // end of Mon Jan 18 (checkout day)
      var LABEL_BEFORE = "Until Jan 14 \u00b7 Pacific time";
      var MSG_DURING = "Snow Blowout is happening right now!";
      var MSG_AFTER  = "Snow Blowout 2027 is a wrap — see you next year!";

      clearInterval(window.__countdownTimer);
      var wrap = document.getElementById("countdown-wrap");
      if (!wrap) return;

      var startMs = new Date(EVENT_START).getTime();
      var endMs   = new Date(EVENT_END).getTime();

      function render() {
        var now = Date.now();

        if (now >= endMs) {
          wrap.innerHTML = '<div class="countdown-message">' + MSG_AFTER + "</div>";
          return false; // stop ticking
        }

        if (now >= startMs) {
          wrap.innerHTML = '<div class="countdown-message">' + MSG_DURING + "</div>";
          return true; // keep ticking so we transition to after-event
        }

        var diff = startMs - now;
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);

        wrap.innerHTML =
          '<p class="countdown-label">' + LABEL_BEFORE + "</p>" +
          '<div class="countdown">' +
            unit(d, "day")  +
            unit(h, "hr")   +
            unit(m, "min")  +
            unit(s, "sec")  +
          "</div>";
        return true; // keep ticking
      }

      function unit(n, label) {
        return (
          '<div class="countdown-unit">' +
            '<span class="num">' + n + "</span>" +
            '<span class="lbl">' + label + (n !== 1 ? "s" : "") + "</span>" +
          "</div>"
        );
      }

      if (render()) {
        var tid = window.__countdownTimer = setInterval(function () {
          if (!render()) clearInterval(tid);
        }, 1000);
      }
    };
window.startCountdown();
