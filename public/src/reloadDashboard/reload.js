var ReloadActions = (function () {

  var main = {
    setDefaultState: function () {
      var status = getDefaultReloadStatus();
      $('#reload-status').text(status);
    },
    setLoadingReloadStatus: function (status) {
      setNewReloadStatus(status);
      $('#reload-status-wrapper').css('background-color', 'yellow');
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
    getFailedReloadStatus: function () {
      return 'fail - ';
    },
    getloadingReloadStatus: function () {
      return 'loading...';
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
    reloadDatasets: function (callback) {
      var url = Routes.getReloadDatasetsRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadQuestions: function (callback) {
      var url = Routes.getReloadQuestionsRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadRegistry: function (callback) {
      var url = Routes.getReloadRegistryRoute();
      var params = {
        url: url
      };
      sendReloadRequest(params, function (response) {
        callback(response);
      });
    },
    reloadConfig: function (callback) {
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
    return 'idle';
  }


  function sendReloadRequest(params, callback) {
    var requestUrl = params['url'];
    $.ajax({
      url: requestUrl,
      cache: false,
      success: function (response) {
        callback(response);
      },
      error: function (xhr, status, error) {
        var errorResult = JSON.parse(xhr['responseText'])
          || {status: 'error', message: error};
        callback(errorResult);
      }
    });
  }

  function setNewReloadStatus(status) {
    $('#reload-status').text(status);
  }


})();



