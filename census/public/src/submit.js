jQuery(document).ready(function($) {

  var fields = {
    exists: {
      require: ["digital", "public", "uptodate"],
      optional: ["publisher", "officialtitle"]
    },
    digital: {
      require: ["online", "machinereadable", "bulk"]
    },
    public: {
      require: ["free"],
      expectFalse: ["online", "bulk"]
    },
    free: {
      require: ["openlicense"]
    },
    online: {
      require: ["url"]
    },
    openlicense: {
      require: ["licenseurl"]
    },
    machinereadable: {
      require: ["format"]
    },
    bulk: {
    },
    uptodate: {
    },
    publisher: {
      type: "dependant"
    },
    officialtitle: {
      type: "dependant"
    },
    format: {
      type: "dependant"
    },
    url: {
      type: "dependant"
    },
    licenseurl: {
      type: "dependant"
    }
  };

  var $yninputs = $('.yntable .js-dependent'),
      $existsInput = $('input[name="exists"]'),
      $choiceSwitches = $('.true, .false, .null'),
      $radioInputs = $('.yntable input[type="radio"]'),
      $dataInputs = $('input[type=text], input[type=url]'),
      readmoreConfig = {
        maxHeight: 58,
        embedCSS: false,
        moreLink: '<a href="#">Show more</a>',
        lessLink: '<a href="#">Hide</a>'
      },
      // whether to hide inapplicable questions or disable
      hideQuestions = $existsInput.filter(':checked').val() === 'null',
      $form = $('form.submission-create, form.submission-review'),
      canEdit = $form.length > 0;

  function getInput(question) {
    return $('.yntable input[name=' + question + ']');
  }

  function getInputRadioValue(question) {
    return getInput(question).filter("input[type=radio]:checked").val();
  }

  function getRow(question) {
    var row = fields[question].type === "dependant" ?
          ".submission-dependant" : ".submission-row";
    return getInput(question).closest(row);
  }

  function getChildren(question, expectFalse){
    /**
     * Get all "children" questions from required & optional lists.
     * If expectFalse is truthy also include questions from expectFalse list.
     */
    var expectFalse = expectFalse || false,
        field = fields[question];
    return (field.require || []).concat(
      field.optional || [], expectFalse && field.expectFalse || []);
  }

  function iterateOverChildren(question, callback) {
    $.each(getChildren(question, getInputRadioValue(question) === 'false'), function(i, child) {
      callback(child, question);
      iterateOverChildren(child, callback);
    });
  }

  function resetInput(question, value, resetrequired) {
      var $input = getInput(question);
      if ($input.is('[type=radio]')) {
        $input = $input.filter('[value=' + value + ']');
        $input.prop('checked', true);
        answerDiff($input);
      } else {
        $input.val('');
        if (resetrequired) {
          $input.prop('required', false);
          $input.prev('h4').removeClass('required');
        }
      }
  }

  function resetRecursively(question, value, resetrequired) {
    iterateOverChildren(question, function(child) {
      resetInput(child, value, resetrequired);
    });
  }

  function makeInputsRequired(question, value) {
    $.each(fields[question].require || [], function(i, child) {
      var $input = getInput(child);
      if (!$input.is('[type=radio]')) {
        $input.prop('required', value);
        if (value)
          $input.prev('h4').addClass('required');
        else
          $input.prev('h4').removeClass('required');
      }
    });
  }

  function getParent(question) {
    for (var name in fields) {
      if ((fields[name].require || []).indexOf(question) !== -1) {
        return name;
      }
    }
    return null;
  }

  function disableQuestion(question) {
    var row = getRow(question);
    if (fields[question].type === "dependant") {
      row.slideUp();
    } else {
      row.find('input[type=radio]').prop('disabled', true);
      row.slideDown(); // we should always display disabled Y/N/U questions
    }
  }

  function enableQuestion(question) {
    var row = getRow(question);
    if (canEdit) {
      row.find('input[type=radio]').prop('disabled', false);
    }
    row.slideDown();
  }

  function hideOrDisableQuestion(question) {
    if (hideQuestions) {
      getRow(question).slideUp();
    } else {
      disableQuestion(question);
    }
  }

  function resolveQuestion(question) {

    iterateOverChildren(question, function(child, parent) {

      var val = getInput(child).filter(':checked').val(),
          parentVal = getInput(parent).filter(':checked').val();

      if (parentVal === "true") {
        enableQuestion(child, parentVal);
      } else {
        hideOrDisableQuestion(child);
      }
    });

  }

  function resolvePositiveAnswer(question, donotreset) {
    if (!donotreset)
      resetRecursively(question, "null");
    makeInputsRequired(question, true);
    resolveQuestion(question);
  }

  function resolveNegativeAnswer(question, val, donotreset) {
    if (!donotreset)
      resetRecursively(question, val, true);
    resolveQuestion(question);
  }

  function maybeShowHiddenQuestions(question) {
    // unhide previously hidden questions
    $.each(fields[question].expectFalse, function(i, child) {
      var parent = getParent(child),
          $parentInput = getInput(parent),
          parentVal = $parentInput.filter(':checked').val();
      if (parentVal == "true") {
        resolvePositiveAnswer(parent);
      }
    });
  }

  function answerChanged($input, donotreset) {
    var name = $input.attr('name'),
        val = getInputRadioValue(name);

    if (val === "true") {
      resolvePositiveAnswer(name, donotreset);
    } else if (val === "false" || val === "null") {
      resolveNegativeAnswer(name, val, donotreset);
    }
    if (val !== "false" && fields[name].expectFalse) {
      maybeShowHiddenQuestions(name);
    }
    ensureZebraStriping();
  }

  $radioInputs.on('click', function() {
    answerChanged($(this));
  });

  $choiceSwitches.on('click', function() {
      answerDiff($(this));
      $('.readmore').readmore(readmoreConfig);
  });

  $dataInputs.on('keyup', function () {
    inputDiff($(this));
  });

  function ensureZebraStriping() {
    $(".submission-row:visible").removeClass('odd').each(function(i) {
      if (i % 2) {
        $(this).addClass('odd');
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

  function answerDiff($el) {
    var $currentEntry = $el.parent().siblings('.submission-current').first(),
        currentValue = $currentEntry.attr('data-value'),
        diff_msg = 'The new value differs from the one currently on record.',
        diff_bg = '#EFED8A';

    if ($.inArray(currentValue, ['true', 'false', 'null']) !== -1  &&
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
        $edit_pane.attr('disabled', 'disabled');
      } else {
        $(this).html(show_preview_msg);
        $edit_pane.removeAttr('disabled', 'disabled');
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

  $form.on("submit", function (event){
    var $form = $(this);

    // disabled inputs are not submitted by default, so enable them
    $form.find('input[type=radio]:disabled').prop('disabled', false);
  });

  answerChanged($existsInput, !hideQuestions);
  ensureZebraStriping();
  showCurrentDatasetInfo();
  enableMarkdownPreview();
  initializeAnswerDiff($choiceSwitches);
  initializeInputDiff($dataInputs);
  $('.readmore').readmore(readmoreConfig);

});
