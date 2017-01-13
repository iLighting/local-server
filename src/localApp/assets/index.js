moment.locale('zh-cn');

function updateAll() {
  // sysInfo
  $.getJSON('/sysInfo', function(data) {
    $('#uptime').text(Math.floor(data.uptime / 3600) + ' 小时');
    $('#ip').text(data.addrList[0]);
  });
  $('#time').text(moment().format('YYYY-M-D k:m'));
}

$(function() {
  updateAll();
  setInterval(updateAll, 1000*30);
})