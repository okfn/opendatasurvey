jQuery(document).ready(function($) {
  var $yninputs = $('.yntable .js-dependent');
  var $existsInput = $('input[name="exists"]');
  $existsInput.change(function() {
    showHideAvailabilityTable();
  });

  function showHideAvailabilityTable() {
    var val = $('input[name="exists"]:checked').val();
    if(val === "No" || val === "Unsure") {
      $yninputs.find('input[value="'+ val +'"]')
        .prop('checked', true);
      $yninputs.addClass('hide').slideUp();
    } else if (val === "Yes") {
      $yninputs.hide().removeClass('hide').slideDown();
    } // else do nothing
  }

  $('input[name=public], input[name=online]').change(function() {
    var public = $('input[name=public]:checked').val() === 'Yes'
      , online = $('input[name=online]:checked').val() === 'Yes'
      , $url = $('input[name=url]')
      , $header = $url.prev('h4')
      ;

    if (public && online) {
      $url.attr('required', 'required');
      $header.addClass('required');
    } else {
      $url.removeAttr('required');
      $header.removeClass('required');
    }
  });

  $('input[name=openlicense]').change(function() {
    var open = $('input[name=openlicense]:checked').val() === 'Yes'
      , $url = $('input[name=licenseurl]')
      , $header = $url.prev('h4')
      ;

    if (open) {
      $url.attr('required', 'required');
      $header.addClass('required');
    } else {
      $url.removeAttr('required');
      $header.removeClass('required');
    }
  });

  var $select = $('#dataset-select');
  $select.change(function(e) {
    e.preventDefault();
    showCurrentDatasetInfo();
  });

  function showCurrentDatasetInfo() {
    var val = $select.val();
    $('.dataset-description').hide();
    $('.js-dataset-' + val).show('slow');
  }

  showHideAvailabilityTable();
  showCurrentDatasetInfo();
});

