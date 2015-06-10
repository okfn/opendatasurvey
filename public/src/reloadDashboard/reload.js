var ReloadActions = (function () {

  var main = {
    setDefaultState: function () {
      var status = getDefaultReloadStatus();
      $('#reload-status').text(status);
    },
    setSuccessReloadStatus: function (status) {
      setNewReloadStatus(status);
      $('#reload-status-wrapper').css('background-color', 'yellowgreen');
    },
    setFailedReloadStatus: function (status) {
      setNewReloadStatus(status);
      $('#reload-status-wrapper').css('background-color', 'red');
    },
    getSuccessReloadStatus: function () {
      return 'success';
    },
    getFailedDefaultStatus: function () {
      return 'fail';
    },
    reloadPlaces: function (callback) {
      var url = Routes.getReloadPlacesRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadDatasets: function () {
      var url = Routes.getReloadDatasetsRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadQuestions: function () {
      var url = Routes.getReloadQuestionsRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadRegistry: function () {
      var url = Routes.getReloadRegistryRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadConfig: function () {
      var url = Routes.getReloadConfigRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    }
  };

  return main;

  function getDefaultReloadStatus() {
    return 'wating';
  }


  function sendReloadRequest(params, callback) {
    var requestUrl = params['url'];
    $.ajax({
      url: requestUrl,
      cache: false,
      success: function (response) {
        callback(response);
      }
    });
  }

  function setNewReloadStatus(status) {
    $('#reload-status').text(status);
  }


})();



