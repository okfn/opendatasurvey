jQuery(document).ready(function($) {

  var $yninputs = $('.yntable .js-dependent'),
      $choiceSwitches = $('.Yes, .No, .Unsure'),
      $dataInputs = $('input[type=text], input[type=url]');
      $existsInput = $('input[name="exists"]'),
      readmoreConfig = {
          maxHeight: 58,
          embedCSS: false,
          moreLink: '<a href="#">Show more</a>',
          lessLink: '<a href="#">Hide</a>'
      };

  $existsInput.change(function() {
    showHideAvailabilityTable();
  });

  $choiceSwitches.on('click', function() {
      manageDependants($(this));
      answerDiff($(this));
      $('.readmore').readmore(readmoreConfig);
  });

  $dataInputs.on('keyup', function () {
     inputDiff($(this));
  });

  function initializeDependants($els) {
      $els.each(function(index) {
          if ($(this).hasClass('Yes') && $(this).is(':checked')) {
              manageDependants($(this));
          }
      });
  }

  function initializeAnswerDiff($els) {
       $els.each(function(index) {
          if ($(this).is(':checked')) {
              answerDiff($(this));
          }
      });
  }

  function initializeInputDiff($els) {
      $els.each(function(index) {
          inputDiff($(this));
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
          currentValue = $currentEntry.text().trim(),
          diff_msg = 'The new value differs from the one currently on record.',
          diff_bg = '#EFED8A';

      if ($.inArray(currentValue, ['Yes', 'No', 'Unsure']) !== -1  &&
          !$el.hasClass(currentValue) && $el.is(':checked')) {
          $el.attr('title', diff_msg).parent().attr('title', diff_msg).css({'cursor': 'pointer', 'backgroundColor': diff_bg});
          $el.parent().siblings().removeAttr('title').css('backgroundColor', '').find('input[type=radio]').removeAttr('title').css({'cursor': 'auto', 'backgroundColor': ''});

      } else {
          $el.parent().siblings().removeAttr('title').css('backgroundColor', '').find('input[type=radio]').removeAttr('title').css({'cursor': 'auto', 'backgroundColor': ''});
      }
  }

  function inputDiff($el) {
      var $currentEntry = $el.closest('.submission-dependant').find('.current-entry-value').first(),
          currentValue = $currentEntry.text().trim(),
          thisValue = $el.val().trim(),
          diff_msg = 'The new value differs from the one currently on record.',
          diff_bg = '#EFED8A';

      if (thisValue && currentValue !== $el.val().trim()) {
          $el.attr('title', diff_msg).css('backgroundColor', diff_bg);
      } else {
          $el.attr('title', '').css('backgroundColor', '');
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
    $('#toggle-markdown-preview').click(function() {

        var user_input = $('#details').val(),
            $preview_pane = $('#markdown-preview'),
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

  // POSTDOWN
  (function () {
      var help = function () { return window.open("http://stackoverflow.com/editing-help", "_blank"); },
      options = {
          helpButton: { handler: help }
      };
      var mdConverter = Markdown.getSanitizingConverter();
      var mdEditor = new Markdown.Editor(mdConverter, null, options);
      mdEditor.run();
  })();

  publicAndOnline();
  openLicense();
  showHideAvailabilityTable();
  showCurrentDatasetInfo();
  enableMarkdownPreview();
  initializeDependants($choiceSwitches);
  initializeAnswerDiff($choiceSwitches);
  initializeInputDiff($dataInputs);
  $('.readmore').readmore(readmoreConfig);

});

