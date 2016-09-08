define(['jquery', 'bootstrap', 'sexyTables'], function($, bootstrap, sexy) {

    function initializeUI() {
        $('.download-action').on('click', function() {
            $("#tell-us").modal();
        });

        $('body').on('click', 'a.ok-ribbon', function(e) {
            $(this).toggleClass("closed open");
            $('#ok-panel').toggleClass("closed open");
            return false;
        });

        $(document).ready(function() {
            sexyTables();
        })
    }

    return {
        init: initializeUI,
    };

});
