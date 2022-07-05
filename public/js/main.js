// Save file function
var saveData = (function () {
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  return function (data, fileName) {
      var blob = new Blob([data], {type: 'octet/stream'}),
          url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
  };
}());

// Convert button
$('#btnConvert').click(function (e) {
  e.preventDefault();

  var csrf = $('input[name="_csrf"]').val();
  var sid = socketId; // $('input[name="socketId"]').val()
  var url = $('input[name="url"]').val();
  var quality = $('input[name="quality"]:checked').val();

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
      _csrf: csrf,
      socketId: sid,
      url: url,
      quality: quality
    },
    xhrFields: {
      responseType: 'blob'
    },
    method: 'POST',

    success: function (res, status, xhr) {
      var header = xhr.getResponseHeader('Content-Disposition');

      // if header is null, this means that we already got a response message. Otherwise move on to file download
      if (!header || header.indexOf('attachment') == -1)
        return;

      var filename = '';
      // var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      var filenameRegex = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/;
      var matches = filenameRegex.exec(header);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/[\/|\\:*?"<>]/g, ''); // .replace(/['"]/g, '')
      }

      filename = decodeURIComponent(filename);

      // made this using pure javascript cuz idk why it didnt work in jquery lol

      // var wndFile = window.URL || window.webkitURL;
      // var btnDownload = document.getElementById('btnDownload');
      // var blobUrl = wndFile.createObjectURL(res);

      // btnDownload.href = blobUrl;
      // btnDownload.download = filename;
      // btnDownload.target = '_blank'; // idk, it works
      // btnDownload.click();

      saveData(res, filename);

      // we have to revoke the blob url when we no longer need it (when the user has downloaded the file)
      // find a way to know when the file has been downloaded
      //wndFile.revokeObjectURL(blobUrl);
    }
  });
});

$('input[name="url"]').on('input', function () {
  var url = $(this);

  if (helper.isValidYtLink(url.val())) {
    url.removeClass('is-invalid');
    url.addClass('is-valid');
  } else {
    url.removeClass('is-valid');
    url.addClass('is-invalid');
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
