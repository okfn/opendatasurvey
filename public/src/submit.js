jQuery(document).ready(function($) {

  var $yninputs = $('.yntable .js-dependent'),
      $choiceSwitches = $('.Yes, .No, .Unsure'),
      $existsInput = $('input[name="exists"]');

  $existsInput.change(function() {
    showHideAvailabilityTable();
  });

  $choiceSwitches.on('click', function() {
      manageDependants($(this));
      answerDiff($(this));
  });

  function initializeDependants($els) {
      $els.each(function(index) {
          manageDependants($(this));
          answerDiff($(this));
      });
  }

  function initializeAnswerDiff($els) {
       $els.each(function(index) {
          answerDiff($(this));
      });
  }

  function manageDependants($el) {
      var $dependants = $el.parent().siblings('.submission-dependant'),
          $dependant_inputs = $dependants.find(':input');

      if ($el.hasClass('Yes') && $el.is(':checked')) {
          $dependants.show();
      } else {
          $dependants.hide();
          $dependant_inputs.each(function(index) {
              $(this).removeAttr('value');
          });
      }
  }

  function answerDiff($el) {
      var $currentEntry = $el.parent().siblings('.submission-current').first(),
          currentValue = $currentEntry.text().trim();

      if ($.inArray(currentValue, ['Yes', 'No', 'Unsure']) !== -1  &&
          !$el.hasClass(currentValue) && $el.is(':checked')) {
          $currentEntry.css('backgroundColor', '#FFCDCA');
      } else {
          $currentEntry.css('backgroundColor', '');
      }
  }

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

  function publicAndOnline() {
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
  }

  function openLicense() {
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
  }

  $('input[name=public], input[name=online]').change(publicAndOnline);
  $('input[name=openlicense]').change(openLicense);

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

  function enableMarkdownPreview() {

    // Adds a preview pane so the user can validate markdown in
    // the comment field before submitting
    markdownPreviewDetails();
    markdownPreviewReviewComments();

  }

  function markdownPreviewDetails() {
      $('#toggle-markdown-preview_details').click(function() {

          var user_input = $('#details').val(),
              $preview_pane = $('#markdown-preview_details'),
              $edit_pane = $('#details'),
              show_preview_msg = 'Show Markdown Preview',
              hide_preview_msg = 'Hide Markdown Preview';

          $preview_pane.toggle().html(marked(user_input));

          if ($preview_pane.is(':visible')) {
              $(this).html(hide_preview_msg);
              $edit_pane.attr('disabled', 'disabled')
          } else {
              $(this).html(show_preview_msg);
              $edit_pane.removeAttr('disabled', 'disabled')
          }

      });
  }

  function markdownPreviewReviewComments() {
      $('#toggle-markdown-preview_reviewcomments').click(function() {

          var user_input = $('#reviewcomments').val(),
              $preview_pane = $('#markdown-preview_reviewcomments'),
              $edit_pane = $('#reviewcomments'),
              show_preview_msg = 'Show Markdown Preview',
              hide_preview_msg = 'Hide Markdown Preview';

          $preview_pane.toggle().html(marked(user_input));

          if ($preview_pane.is(':visible')) {
              $(this).html(hide_preview_msg);
              $edit_pane.attr('disabled', 'disabled')
          } else {
              $(this).html(show_preview_msg);
              $edit_pane.removeAttr('disabled', 'disabled')
          }

      });
  }

  publicAndOnline();
  openLicense();
  showHideAvailabilityTable();
  showCurrentDatasetInfo();
  enableMarkdownPreview();
  initializeDependants($choiceSwitches);
  initializeAnswerDiff($choiceSwitches);

});

