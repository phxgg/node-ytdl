$('#btnConvert').click(function(e) {
    e.preventDefault();

    $('#loading').show()

    var csrf        = $('input[name="_csrf"]').val();
    var sid         = socketId; // $('input[name="socketId"]').val()
    var url         = $('input[name="url"]').val();
    var quality     = $('input[name="quality"]:checked').val();

    if (!sid) {
        alert('Socket ID is not set. Please try again.');
        return;
    }

    $.ajax({            
        url: '/convert',
        data: {
            _csrf       : csrf,
            socketId    : sid,
            url         : url,
            quality     : quality
        },
        xhrFields: {
            responseType: 'blob'
        },
        method: 'POST',

        success: function (res, status, xhr) {
            $('#loading').hide();
            
            var header = xhr.getResponseHeader('Content-Disposition');

            // if header is null, this means that we already got a response message. Otherwise move on to file download
            if (!header)
                return;

            var filename = header.match(/filename="(.+)"/)[1];

            // made this using pure javascript cuz idk why it didnt work in jquery lol
            var btnDownload = document.getElementById('btnDownload');
            var wndFile = window.URL || window.webkitURL;
            var blobUrl = wndFile.createObjectURL(res);

            btnDownload.href = blobUrl;
            btnDownload.download = filename;
            btnDownload.target = "_blank"; // idk
            btnDownload.click();

            // we have to revoke the blob url when we no longer need it (when the user has downloaded the file)
            // find a way to know when the file has been downloaded
            //wndFile.revokeObjectURL(blobUrl);
        }
    });
});

$('input[name="url"]').on('input', function () {
    var url = $(this).val();

    if (helper.isValidYtLink(url)) {
        $('#yt-loading').show();

        var csrf    = $('input[name="_csrf"]').val();
        var sid     = socketId;

        $.ajax({
            url: '/videoinfo',
            data: {
                _csrf       : csrf,
                socketId    : sid,
                url         : url
            },
            dataType: 'JSON',
            method: 'POST',

            success: function(res, status, xhr) {
                var statusCode = res.statusCode;
                var info = res.info;

                switch (statusCode) {
                    case 'error':
                        $('#yt-videoinfo').hide();
                        $('#url').addClass('is-invalid');
                        $('#labelInvalidLink').show();
                        break;
                    case 'success':
                        $('#yt-thumbnail').html(`<a href="${url}" target="_blank"><img src="${info.thumbnail.url}"></a>`);
                        $('#yt-title').html(`${info.title}`);

                        var likes = parseInt(info.likes);
                        var dislikes = parseInt(info.dislikes);

                        var dislikePercentage = Math.round(dislikes/likes * 100);
                        var likePercentage = 100 - dislikePercentage;

                        $('#url').removeClass('is-invalid');
                        $('#labelInvalidLink').hide();

                        $('#yt-views').html(`Views: ${helper.num(info.views)}`);

                        $('#yt-likeperc').css('width', `${likePercentage}%`);
                        $('#yt-likeperc').attr('aria-valuenow', `${likePercentage}`);
                        $('#yt-likeperc').attr('data-original-title', `${helper.num(likes)} Likes`);

                        $('#yt-dislikeperc').css('width', `${dislikePercentage}%`);
                        $('#yt-dislikeperc').attr('aria-valuenow', `${dislikePercentage}`);
                        $('#yt-dislikeperc').attr('data-original-title', `${helper.num(dislikes)} Dislikes`);

                        $('#yt-likes').html(`${helper.num(info.likes)}`);
                        $('#yt-dislikes').html(`${helper.num(info.dislikes)}`);

                        $('#yt-videoinfo').show();
                        break;
                }

                $('#yt-loading').hide();
            }
        });
    }
});

$('#btnContact').click(function (e) {
    e.preventDefault();

    // todo
});

// tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});
