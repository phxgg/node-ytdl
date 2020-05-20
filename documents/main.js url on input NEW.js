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

                console.log(res);

                switch (statusCode) {
                    case 'error':
                        $('#yt-videoinfo').hide();
                        $('#url').addClass('is-invalid');
                        $('#labelInvalidLink').show();
                        break;
                    case 'success':
                        $('#url').removeClass('is-invalid');
                        $('#labelInvalidLink').hide();
                        
                        $('#yt-embed').html(`<iframe width="360" height="215" src="https://www.youtube.com/embed/${info.video_id}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);

                        $('#yt-videoinfo').show();
                        break;
                }

                $('#yt-loading').hide();
            }
        });
    }
});