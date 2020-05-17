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