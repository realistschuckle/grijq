(function($) {
  var counter = 0;
  $.fn.genid = function() {
    this.each(function() {
      var self = $(this);
      if(!self.attr('id')) {
        var generatedId;
        do {
          generatedId = 'lsip-' + counter;
          counter += 1;
        } while(document.getElementById(generatedId));
        self.attr('id', generatedId);
      }
      return this;
    });
  }
})(jQuery);
