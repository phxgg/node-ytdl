/* Whatever has to do with cookies */

function setCookie(name, value, days) { // from http://www.quirksmode.org/js/cookies.html
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toGMTString();
  } else var expires = "";
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

window.onload = function () {
  // we use cookies thing
  var weUseCookies = getCookie('weUseCookies');

  if (weUseCookies == "ok") {
    $('#cookies-info').hide();
  } else {
    $('#cookies-info').show();
  }

  $('#cookies-ok').click(function () {
    setCookie('weUseCookies', 'ok', 365);
    $('#cookies-info').hide();
  });

  $('#cookies-cancel').click(function () {
    window.location.href = 'https://www.google.com';
  });

  // quality radio button cookie
  var quality = getCookie('qualityCookie');

  if (quality) {
    if (quality == "mp3low") {
      $('#customRadio1').click(); // or .checked=true; 
    }
    else if (quality == "mp3best") {
      $('#customRadio2').click();
    }
    // else if (quality == "mp4best") {
    //     $('#customRadio3').click();
    // }
  }

  $('#customRadio').click(function () {
    var radioValue = $("input[name='quality']:checked").val();
    setCookie('qualityCookie', radioValue, 30);
  });

  $('#customRadio2').click(function () {
    var radioValue = $("input[name='quality']:checked").val();
    setCookie('qualityCookie', radioValue, 30);
  });

  /*$('#customRadio3').click(function() {
      var radioValue = $("input[name='quality']:checked").val();
      setCookie('qualityCookie', radioValue, 30);
  });*/
}