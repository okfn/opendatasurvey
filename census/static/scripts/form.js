$( document ).ready(function() {

  $("div.source.question ul li").each(function() {
    // determine whether source fields are filled
    var url = $( this ).find("input[type='url']");
    var desc = $( this ).find("input[type='text']");
    if ($(url).val() ) {
      $(this).parent("ul").addClass( "url-filled");
    }
    if ($(desc).val()) {
      $(this).parent("ul").addClass( "desc-filled");
    }
  });

  // add answered class if already filled
  $( ".scale input:checked, .yes-no input:checked, .multiple input:checked, .source ul.url-filled.desc-filled").parents(".question").addClass( "answered" );

  $("div.select.question").each(function() {
    var slct = $( this ).find("select");
    if ($(slct).val() ) {
      $(this).addClass( "answered");
    }
  });

  $("div.text.question").each(function() {
    var ta = $( this ).find("textarea");
    if ($(ta).val() ) {
      $(this).addClass( "answered");
    }
    var i = $( this ).find("input");
    if ($(i).val() ) {
      $(this).addClass( "answered");
    }
  });

  // add answered class when fields change
  $(".scale input, .yes-no input, .multiple input, .source input[type='text'], .select select, .text textarea, .text input").change(function(){
    $( this ).parents(".question").addClass( "answered" );
  });


  // heading dropdown
  $(".form-header .primary-meta h1").each(function() {
    var wrapper = $( this ).children("span");
    var btn = $( wrapper ).children("a");

    $(wrapper).removeClass( "no-js" );

    $(btn).click(function(event) {
      event.preventDefault();
      $(this).parent("span").toggleClass("active");
    });
  });

});
