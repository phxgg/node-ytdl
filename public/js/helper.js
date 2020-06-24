/* Misc functions */

var helper = {
    randomStr: function(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },

    isValidYtLink: function(url) {
        if (url != undefined || url != '') {
            var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
            var match = url.match(regExp);
            if (match && match[2].length == 11) {
                // match[2] = youtube id
                return true;

                //$('#ytplayerSide').attr('src', 'https://www.youtube.com/embed/' + match[2] + '?autoplay=0');
            }
        }
        return false;
    },

    num: function (num) {
        return Number(num).toLocaleString('el-GR');
    }
};

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
    var quality = getCookie('qualityCookie');

    if (quality) {
        if (quality == "mp3low") $('#customRadio1').click(); // or .checked=true; 
        else if (quality == "mp3best") $('#customRadio2').click();
        //else if (quality == "mp4best") $('#customRadio3').click();
    }

    $('#customRadio').click(function() {
        var radioValue = $("input[name='quality']:checked").val();
        setCookie('qualityCookie', radioValue, 30);
    });

    $('#customRadio2').click(function() {
        var radioValue = $("input[name='quality']:checked").val();
        setCookie('qualityCookie', radioValue, 30);
    });

    /*$('#customRadio3').click(function() {
        var radioValue = $("input[name='quality']:checked").val();
        setCookie('qualityCookie', radioValue, 30);
    });*/
}