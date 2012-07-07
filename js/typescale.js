(function($) {

    // scale type to fit parent container

    $.fn.typescale = function() {
        var targettypesize = 1;
        var targettypewidth = this.width();
        var targetsize = this.parent().width();
        while( targettypewidth < targetsize ) {
            targettypesize = targettypesize + 1;
            this.css('font-size', targettypesize + 'px');
            targettypewidth = this.width();
        };
        this.css('font-size', targettypesize - 1 + 'px');   
    }

})(jQuery);