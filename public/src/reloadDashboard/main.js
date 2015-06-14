var ReloadDashboard = (function () {
  var main = {
    init: function () {
      ReloadActions.setDefaultState();
      listenToReloadEntitiesRequest();
    }
  };

  main.init();
  return main;

})();

function listenToReloadEntitiesRequest() {
  $('.reload-entity').on('click', function () {
    var newStatus = ReloadActions.getloadingReloadStatus();
    ReloadActions.setSuccessReloadStatus(newStatus);
    var entityId = $(this).attr('id');
    var reloadCallback = function (response) {
      handleReloadResponse(response);
    };
    switch (entityId) {
      case 'place':
        ReloadActions.reloadPlaces(reloadCallback);
        break;
      case 'dataset':
        ReloadActions.reloadDatasets(reloadCallback);
        break;
      case 'question':
        ReloadActions.reloadQuestions(reloadCallback);
        break;
      case 'registry':
        ReloadActions.reloadRegistry(reloadCallback);
        break;
      case 'config':
        ReloadActions.reloadConfig(reloadCallback);
        break;
      default:
        break;
    }
  });
}

function handleReloadResponse(response) {
  var newStatus = false;
  if (response.status === 'ok') {
    newStatus = ReloadActions.getSuccessReloadStatus();
    ReloadActions.setSuccessReloadStatus(newStatus);
  } else {
    newStatus = ReloadActions.getFailedReloadStatus() + ' ' + response.message;
    ReloadActions.setFailedReloadStatus(newStatus);
  }


}


