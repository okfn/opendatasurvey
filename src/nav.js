$(document).ready(function(){

  $("ul.subnav").parent().append("<span></span>"); //Only shows drop down
  
  $("ul.nav li span").click(function() { //When trigger is clicked...
    
    //Following events are applied to the subnav itself (moving subnav up
    //and down)
    $(this).parent().find("ul.subnav").slideDown('fast').show(); //Drop

    $(this).parent().hover(function() {
    }, function(){  
      $(this).parent().find("ul.subnav").slideUp('slow'); //When the mouse
    });

    //Following events are applied to the trigger (Hover events for the
    //trigger)
    }).hover(function() { 
      $(this).addClass("subhover"); //On hover over, add class "subhover"
    }, function(){  //On Hover Out
      $(this).removeClass("subhover"); //On hover out, remove class
"subhover"
  });

});
