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

