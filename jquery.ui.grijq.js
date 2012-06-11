(function($) {
  var LEFT = 37
    , UP = 38
    , RIGHT = 39
    , DOWN = 40
    ;
  $.widget("curtissimo.grijq", {
    options: {
      width: 'auto',
      height: 'auto'
    },
    _create: function() {
      var grijq = this
        , ie = (!+'\v1')
        , minWidth = ie? 1 : 0
        , getCol = function(offset, table) {
                     offset = offset || 0;
                     var index = $(this).attr('data-index');
                     if(!index) {
                       index = parseInt($(this).parents('[data-index]').attr('data-index'));
                     }
                     return $($('col', table).get(index - offset));
                   }
        ;

      $('td', grijq.element).focus(function(e) {
                              grijq._clearSelection();
                              grijq['selectedCell'] = $(e.target).closest('td').addClass('ui-state-default');
                            }).genid();
      grijq.wrapper = grijq.element.wrap('<div class="grijq-wrapper">').parent().width(this.options.width + 16);
      grijq.headerTable = $('<table>').prop('width', grijq.element.prop('width'))
                                      .addClass('ui-widget grijq')
                                      .append($('<colgroup>').append($('col', grijq.element).clone()))
                                      .append($('thead', grijq.element));
      grijq.wrapper.prepend(grijq.headerTable);
      grijq.element.addClass('ui-widget grijq')
                   .click(function(e) {
                     grijq._clearSelection();
                     grijq['selectedCell'] = $(e.target).closest('td').addClass('ui-state-default').trigger('focus');
                   });
      grijq.verticalScroller = $('<div>').addClass('grijq-vertical')
                                         .width(parseInt(grijq.element.prop('width')) + 16)
                                         .height(this.options.height);
      grijq.element.wrap(grijq.verticalScroller);
      grijq.verticalScroller = grijq.element.parent();
      $('thead th', grijq.headerTable).addClass('unselectable')
                                      .hover(function() {$(this).addClass('ui-state-hover')}, function() {$(this).removeClass('ui-state-hover')})
                                      .click(function() {
                                        grijq._clearSelection();
                                        grijq['selectedHeader'] = $(this).addClass('ui-state-active');
                                        var col = getCol.call(this, 0, grijq.element);
                                        col.addClass('ui-state-default');
                                        grijq['selectedColumn'] = col;
                                      })
                                      .children().prepend($('<span>').addClass('mover').html('.').attr('unselectable', 'on'));
      $('tbody', grijq.element).addClass('ui-widget-content');
      $('thead', grijq.headerTable).addClass('ui-widget-header ui-state-default');
      $('.mover', grijq.headerTable).draggable({
        axis: 'x',
        helper: function() {
                  grijq.columnResizer.height(grijq.element.height() + grijq.headerTable.height());
                  return grijq.columnResizer.show()[0];
                },
        stop: function(event, ui) {
                var offset = ui.position.left - ui.originalPosition.left;
                var col = getCol.call(this, 1, grijq.element);
                var newColWidth = Math.max(minWidth, offset + parseInt(col.prop('width')));
                col.prop('width', newColWidth);
                col = getCol.call(this, 1, grijq.headerTable);
                col.prop('width', newColWidth);

                var newTableWidth = Math.max(minWidth, offset + parseInt(grijq.element.prop('width')));
                grijq.element.prop('width', newTableWidth);
                grijq.headerTable.prop('width', newTableWidth);
                grijq.verticalScroller.width(newTableWidth + 16);
              }
      });
      grijq.columnResizer = $('<div>').addClass('resizer');
      grijq.wrapper.append(grijq.columnResizer);
      grijq.element.keydown(function(e) {
        var target = $(e.target);
        switch(e.keyCode) {
          case LEFT:
            target.prev().focus();
            e.preventDefault();
            break;
          case RIGHT:
            target.next().focus();
            e.preventDefault();
            break;
          case UP:
            var index = $(target).prevAll().length + 1;
            $(':nth-child(' + index + ')', target.closest('tr').prev()).focus();
            e.preventDefault();
            break;
          case DOWN:
            var index = $(target).prevAll().length + 1;
            $(':nth-child(' + index + ')', target.closest('tr').next()).focus();
            e.preventDefault();
            break;
        }
      });
    },
    _clearSelection: function() {
      if(this['selectedColumn']) {
        this['selectedHeader'].removeClass('ui-state-active');
        this['selectedColumn'].removeClass('ui-state-default');
      }
      if(this['selectedCell']) {
        this['selectedCell'].removeClass('ui-state-default');
      }
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
