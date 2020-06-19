$('#btnConvert').click( function(e) {
    e.preventDefault();

    var csrf        = $('input[name="_csrf"]').val();
    var sid         = socketId; // $('input[name="socketId"]').val()
    var url         = $('input[name="url"]').val();
    var quality     = $('input[name="quality"]:checked').val();

    if (!url || !helper.isValidYtLink(url)) {
        $('#url').addClass('is-invalid');
        return;
    }

    if (!sid) {
        alert('Socket ID is not set. Please try again.');
        return;
    }

    $('#btnConvert').attr('disabled', true);
    $('#btnConvert').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Converting...');
    
    $('#dl-percentage').show();

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
            /*$('#btnConvert').html('Convert');
            $('#btnConvert').removeAttr('disabled');

            $('#dl-percentage').html('');
            $('#dl-percentage').hide();*/
            
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

$('input[name="url"]').on('input', function() {
    var url = $(this);

    if (helper.isValidYtLink(url.val())) {
        url.removeClass('is-invalid');
        url.addClass('is-valid');
    } else {
        url.removeClass('is-valid');
        url.addClass('is-invalid');
    }
});

$('#btnContact').click( function(e) {
    e.preventDefault();

    // todo
});

// tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});
