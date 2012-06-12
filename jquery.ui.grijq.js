(function($) {
  var LEFT = 37
    , UP = 38
    , RIGHT = 39
    , DOWN = 40
    , F2 = 113
    , ESC = 27
    , A = 65
    , Z = 90
    , ZERO = 48
    , NINE = 57
    , NUM_ZERO = 96
    , NUM_NINE = 105
    , editing = false
    , editors = {
        'date': {
          'edit': function(target) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width());
            target.html('').append(input);
            input.datepicker({
              onSelect: function() {
                var date = input.datepicker('getDate');
                input.val($.datepicker.formatDate('m/d/yy', date));
                input.select();
                input.focus();
              }
            });
            input.select();
            input.focus();
            input.datepicker('show');
          },
          'unedit': function(target) {
            editing = false;
            target.removeClass('editing');
            var input = target.children().first();
            if(input.length === 0) {
              return;
            }
            var date = new Date(input.val());
            date = $.datepicker.formatDate('m/d/yy', date);
            input.remove();
            setTimeout(function() {target.html('<div>' + date + '</div>')}, 0);
          }
        },
        'text': {
          'edit': function(target) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width());
            target.html('').append(input);
            input.select();
            input.focus();
          },
          'unedit': function(target) {
            editing = false;
            target.removeClass('editing');
            var input = target.children().first();
            if(input.length === 0) {
              return;
            }
            var text = input.val();
            input.remove();
            setTimeout(function() {target.html('<div>' + text + '</div>')}, 0);
          }
        },
        'number': {
          'edit': function() {

          },
          'unedit': function() {
            editing = false;
          }
        }
      }
    , columnBuilder = function() {
        var t = $(this).text()
          , f = +t
          , d = new Date(t)
          ;
        if(!isNaN(d.getTime()) && isNaN(f)) {
          return {'type': 'date'};
        } else if(!isNaN(f)) {
          return {'type': 'number'};
        } else {
          return {'type': 'text'};
        }
      }
    ;
  $.widget("curtissimo.grijq", {
    options: {
      width: 'auto',
      height: 'auto',
      columns: []
    },
    _create: function() {
      var grijq = this
        , ie = (!+'\v1')
        , minWidth = ie? 1 : 0
        , iefocus = null
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
                             var cell = $(e.target).closest('td');
                             if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
                               return;
                             }
                              grijq._clearSelection();
                              grijq['selectedCell'] = cell.addClass('ui-state-default');
                              if(ie) {
                                clearTimeout(iefocus);
                                iefocus = setTimeout(function() {cell.focus();}, 100);
                              }
                            }).genid();
      grijq.wrapper = grijq.element.wrap('<div class="grijq-wrapper">').parent().width(this.options.width + 16);
      grijq.headerTable = $('<table>').prop('width', grijq.element.prop('width'))
                                      .addClass('ui-widget grijq')
                                      .append($('<colgroup>').append($('col', grijq.element).clone()))
                                      .append($('thead', grijq.element));
      grijq.wrapper.prepend(grijq.headerTable);
      grijq.element.addClass('ui-widget grijq')
                   .click(function(e) {
                     var cell = $(e.target).closest('td');
                     if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
                       return;
                     }
                     grijq._clearSelection();
                     grijq['selectedCell'] = cell.addClass('ui-state-default').trigger('focus');
                   });
      grijq.verticalScroller = $('<div>').addClass('grijq-vertical')
                                         .width(parseInt(grijq.element.prop('width')) + 16)
                                         .height(this.options.height);
      grijq.element.wrap(grijq.verticalScroller);
      grijq.verticalScroller = grijq.element.parent();
      $('thead th', grijq.headerTable).addClass('unselectable')
                                      .hover(function() {$(this).addClass('ui-state-hover')}, function() {$(this).removeClass('ui-state-hover')})
                                      .click(function() {
                                        var col = getCol.call(this, 0, grijq.element);
                                        grijq._clearSelection();
                                        grijq['selectedHeader'] = $(this).addClass('ui-state-active');
                                        col.addClass('ui-state-default');
                                        grijq['selectedColumn'] = col;
                                      })
                                      .children().prepend($('<span>').addClass('mover').html('.').attr('unselectable', 'on'));
      var databody = $('tbody', grijq.element).addClass('ui-widget-content');
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
            if(editing) {
              return;
            }
            target.prev().focus();
            e.preventDefault();
            break;
          case RIGHT:
            if(editing) {
              return;
            }
            target.next().focus();
            e.preventDefault();
            break;
          case UP:
            if(editing) {
              return;
            }
            var index = target.prevAll().length + 1;
            $(':nth-child(' + index + ')', target.closest('tr').prev()).focus();
            e.preventDefault();
            break;
          case DOWN:
            if(editing) {
              return;
            }
            var index = target.prevAll().length + 1;
            $(':nth-child(' + index + ')', target.closest('tr').next()).focus();
            e.preventDefault();
            break;
          case F2:
            if(editing) {
              return;
            }
            editing = true;
            var index = target.prevAll().length;
            var editorType = grijq.options.columns[index]['type'];
            grijq['currentEditor'] = editors[editorType];
            grijq['currentEditor'].edit(target);
            break;
          default:
            if(editing || e.ctrlKey) {
              return;
            }
            if((e.keyCode >= A && e.keyCode <= Z) || (e.keyCode >= ZERO && e.keyCode <= NINE) || (e.keyCode >= NUM_ZERO && e.keyCode <= NUM_NINE)) {
              editing = true;
              var index = target.prevAll().length;
              var editorType = grijq.options.columns[index]['type'];
              grijq['currentEditor'] = editors[editorType];
              grijq['currentEditor'].edit(target);
            }
            break;
        }
      });
      if(grijq.options.columns.length === 0) {
        $('tr:first', databody).children().each(function() {
          grijq.options.columns.push(columnBuilder.apply(this));
        });
      }
    },
    _clearSelection: function() {
      if(this['selectedColumn']) {
        this['selectedHeader'].removeClass('ui-state-active');
        this['selectedColumn'].removeClass('ui-state-default');
      }
      if(this['currentEditor']) {
        this['currentEditor'].unedit(this['selectedCell']);
        this['currentEditor'] = null;
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
