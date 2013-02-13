$(function(){

  $('.city').typeahead({
  source: function(query, process) {
      var url = 'http://open.mapquestapi.com/search?format=json&q=' + query;
      $.getJSON(url, function(data) {
        var out = _.pluck(data, 'display_name');
        process(out);
      });
    },
    minLength: 2
  });

  $('form').submit(function(e) {
    e.preventDefault();
    var formKey = 'dEEycENNYXQtU1RIbzRSYVRxLXFOdHc6MQ';
    var data = $(e.target).serializeArray();
    var invalid = validateForm(data);
    if (invalid.length === 0) {
      data = JSON.stringify(data);
      gform(formKey, data);
    } else {
      alert('Please fill out the following fields:\n' +
        invalid.join('\n'));
    }
  });

  function validateForm(data) {
    var d = {};
    _.each(data, function(nameValue){
      d[nameValue.name] = nameValue.value;
    });
    var invalid = [];
    var required = {
      'city': 'City',
      'exists': 'Does the data exist?',
      'pulbic': 'Is it publicly available?',
      'digital': 'Is it in digital form?',
      'machine-readable': 'Is it machine readable?',
      'bulk': 'Available in bulk?',
      'open-license': 'Is it openly licensed?',
      'up-to-date': 'Is it up to date?'
    };
    _.each(required, function(value, key){
      if(!d[key]) { invalid.push(value); }
    });
    return invalid;
  }

  function gform(fk, val) {
    var gurl = "https://docs.google.com/spreadsheet/formResponse?formkey="+ fk +"&ifq";
    var data = {
      "entry.0.single": val,
      "submit": "Submit",
      "pageNumber":0,
      "backupCache":undefined
    };
    $.post(gurl, data, function(d) {
      console.log('submitted ok');
    });
  }

  $('input[name="exists"]').change(function(){
    var input = $(this);
    if(input.val() !== "Yes") {
      $.each([
          "public",
          "digital",
          "machine-readable",
          "bulk",
          "open-license",
          "up-to-date"
        ],
        function(i, name) {
          $('input[name="' + name + '"][value="'+ input.val() +'"]')
            .prop('checked', true);
        }
      );
    } else {
      $('#dataset-properties').find('.hide').hide().removeClass('hide').slideDown();
    }
  });
  recline.Backend.GDocs.fetch({
    url: 'https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc#gid=1'
  }).done(function(result) {
    var select = $('#dataset-select');
    var groups = {};
    _.each(result.records, function(record, i){
      groups[record.category] = groups[record.category] || [];
      groups[record.category].push(record);
    });
    _.each(groups, function(group, key){
      if (!key) { return; }
      var optgroup = $('<optgroup>', {label: key});
      _.each(group, function(record){
        optgroup.append('<option value="' + record.datasetquestion + '"> ' + record.datasetquestion + '</option>');
      });
      select.append(optgroup);
    });
  });
});
