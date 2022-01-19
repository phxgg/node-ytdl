var socket = io();
var socketId = null;

// grab the socket id globally
socket.on('connect', () => {
  socketId = socket.id;
  console.log(`[socket connected]: ${socketId}`);

  // set socket id into form
  $('input[name="socketId"]').val(socketId);
});

// download percentage
socket.on('send downloadPercentage', (text) => {
  $('#dl-percentage').html(text);
});

// convert notifications
socket.on('send notification', (statusCode, message) => {
  var color = null;
  var randomId = 'notif_id_' + helper.randomStr(5);

  // colors from bootstrap
  switch (statusCode) {
    case 'primary':
      color = '#007aff';
      break;
    case 'success':
      color = '#28a745';
      break;
    case 'error':
      color = '#dc3545';
      break;
    case 'info':
      color = '#17a2b8';
      break;
    case 'warning':
      color = '#ffc107';
      break;
  }

  if (statusCode == 'success' || statusCode == 'error') {
    $('#btnConvert').html('Convert');
    $('#btnConvert').removeAttr('disabled');

    $('#dl-percentage').html('Your video is converting, do not close this window <i class="far fa-grin-beam"></i>');
    $('#dl-percentage').hide();
  }

  $('#notifications-box').append(`
        <div class="toast" id="${randomId}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <svg class="bd-placeholder-img rounded mr-2" width="20" height="20" focusable="false" role="img">
                    <rect fill="${color}" width="100%" height="100%"></rect>
                </svg>
                <strong class="mr-auto">${statusCode}</strong>
                <small class="text-muted">just now</small>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `);

  $(`#${randomId}`).toast({ delay: 5000 });
  $(`#${randomId}`).toast('show');
  $(`#${randomId}`).on('hidden.bs.toast', () => {
    $(`#${randomId}`).remove();
  });

});