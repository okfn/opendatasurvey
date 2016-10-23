define(['jquery', 'bootstrap', 'chroma', 'tablesorter', 'stickykit'],
  function($, bootstrap, chroma, tablesorter, stickykit) {

    var placeCount = placeCount || 260,
      colorSteps = ['#ff0000', '#edcf3b', '#7ab800'],
      colorScale = chroma.scale(colorSteps).domain([0, 100]),
      naString = 'n/a',
      $dataTable = $('.data-table'),
      $scoreDisplay = $('.score'),
      popover = $('#popover'),
      popoverProps = {
        title: popover.find('.popover-title'),
        content: popover.find('.popover-content'),
        visible: null
      },
      tablesorterPlaceOptions = {
        sortList: [[0, 0]],
        headers: {
          2: {sorter: false},
          3: {sorter: false},
          4: {sorter: false},
          5: {sorter: false},
          6: {sorter: false},
          7: {sorter: false},
          8: {sorter: false},
          9: {sorter: false},
          10: {sorter: false},
          11: {sorter: false},
        }
      },
      tablesorterDatasetOptions = {
        sortList: [[0, 0]],
        headers: {
          2: {sorter: false},
          3: {sorter: false},
        }
      },
      tablesorterSliceOptions = {
        sortList: [[0, 0]],
        headers: {
          2: {sorter: false},
          3: {sorter: false},
          4: {sorter: false},
          5: {sorter: false},
          6: {sorter: false},
        }
      },
      sortFlag = true;

    $('#places_overview_table').tablesorter(tablesorterPlaceOptions);
    $('#datasets_overview_table').tablesorter(tablesorterDatasetOptions);
    $('#slice-table').tablesorter(tablesorterSliceOptions);

    $("#datasets_overview_table thead").stick_in_parent();
    $("#slice-table thead").stick_in_parent();

    $('.content').on('click', '.sexyHeader .sort_rank, .sexyHeader .sort_place',
      function(e) {
        $("#places_overview_table").trigger("sorton",
          [[[$(e.target).hasClass('sort_place') / 1, sortFlag]]]);
        $('.headerSortDown').removeClass('headerSortDown');
        $('.headerSortUp').removeClass('headerSortUp');
        $(e.target).addClass((sortFlag) ? "headerSortUp" : "headerSortDown");
        sortFlag = !sortFlag;
      });

    function filterTable(table, query) {
      if (query.length < 2) {
        return;
      }

      table.find('tbody tr').each(function(index, value) {
        if ($(this).data('name').toLowerCase().indexOf(query) === -1) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });
    }

    function setInteractions() {

      var popovers = $('[data-toggle="popover"]');
      $("[data-toggle='tooltip']").tooltip({html: true});

      popovers.on('click', function(e) {

        var target = $(e.target.parentNode),
          offset;

        // in case popover already visible, it will propagate event to body
        // and hide this element
        if (popoverProps.visible && popoverProps.visible.is(target)) {
          return true;
        }

        e.preventDefault();
        e.stopPropagation();

        popoverProps.visible = target;

        offset = target.offset();

        popoverProps.title.html(target.attr('title'));
        popoverProps.content.html(target.data('content'));

        popover.css({
          top: offset.top + target.height(),
          left: offset.left + target.width() / 2 - popover.width() / 2,
          display: 'block'
        });

        return false;
      });

      $('body').on('click', function() {
        popoverProps.visible = null;
        popover.hide();
      });

      $('.filter-table').on('keyup', function() {
        var query = $(this).val().toLowerCase().replace(' ', '-')
          .replace(',', '');
        filterTable($dataTable, query);
      });

      $.each($scoreDisplay, function(index, el) {
        var score,
          $el = $(el);
        if ($el.data('score') === naString) {
          score = 0;
        } else {
          score = parseInt($el.data('score'), 10);
        }
        $el.css({
          'background-color': colorScale(score).hex(),
          'color': 'white'
        });
      });
    }

    function setColumnTHWidths() {
      $('thead th').each(function() {
        $(this).css('width', $(this).outerWidth());
      });
    }

    function initializeTable() {
      setInteractions();
      setColumnTHWidths();
    }

    return {
      init: initializeTable,
    };
  });
