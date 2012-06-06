(function($) {
  $.widget("curtissimo.grijq", {
    options: {},
    _create: function() {
      var getCol = function(offset) {
        offset = offset || 0;
        var index = $(this).attr('data-index');
        if(!index) {
          index = parseInt($(this).parents('[data-index]').attr('data-index'));
        }
        return $($('colgroup col', grijq.element).get(index - offset));
      };

      var grijq = this;
      grijq.wrapper = grijq.element.wrap('<div class="grijq-wrapper">').parent();
      grijq.element.addClass('ui-widget grijq');
      $('thead th', grijq.element).addClass('unselectable')
                                  .hover(function() {$(this).addClass('ui-state-hover')}, function() {$(this).removeClass('ui-state-hover')})
                                  .click(function() {
                                    if(grijq['selectedColumn']) {
                                      grijq['selectedHeader'].removeClass('ui-state-active');
                                      grijq['selectedColumn'].css('background-color', '');
                                    }
                                    grijq['selectedHeader'] = $(this).addClass('ui-state-active');
                                    var col = getCol.apply(this);
                                    col.css('background-color', '#E3F1FA');
                                    grijq['selectedColumn'] = col;
                                  })
                                  .children().prepend($('<span>').addClass('mover').html('.').attr('unselectable', 'on'));
      $('tbody', grijq.element).addClass('ui-widget-content');
      $('thead', grijq.element).addClass('ui-widget-header ui-state-default');
      $('.mover', grijq.element).draggable({
        axis: 'x',
        helper: function() {
                  grijq.columnResizer.height(grijq.element.height());
                  return grijq.columnResizer.show()[0];
                },
        stop: function(event, ui) {
                var offset = ui.position.left - ui.originalPosition.left;
                var col = getCol.call(this, 1);
                col.prop('width', offset + parseInt(col.prop('width')));
                grijq.element.prop('width', offset + parseInt(grijq.element.prop('width')));
              }
      });
      grijq.columnResizer = $('<div>').addClass('resizer');
      grijq.wrapper.append(grijq.columnResizer);
    },
    _setOption: function(key, value) {
      $.Widget.prototype._setOption.apply(this, arguments);
    },
    _init: function() {

    },
    destroy: function() {
      $.Widget.prototype.destroy.call(this);
    }
  });
})(jQuery);
