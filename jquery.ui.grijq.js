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
    , DOT = 190
    , DASH = 109
    , NUM_DOT = 110
    , TAB = 9
    , DELETE = 46
    , BACKSPACE = 8
    , editing = false
    , editors = {
        'date': {
          'edit': function(target, options) {
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
        'autocomplete': {
          'edit': function(target, options) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width());
            var source = options['source'];
            if(typeof window[source] !== undefined) {
              source = window[source];
            }
            input.autocomplete({source: source});
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
          'edit': function(target) {
            target.addClass('editing');
            var input = $('<input>').val(target.text())
                                    .width(target.width())
                                    .keydown(function(e) {
                                      if(e.keyCode === TAB || e.keyCode === LEFT || e.keyCode === UP || e.keyCode === RIGHT || e.keyCode === DOWN || e.keyCode === BACKSPACE || e.keyCode === DELETE) {
                                        return;
                                      }
                                      if((e.keyCode < ZERO || e.keyCode > NINE) && (e.keyCode < NUM_ZERO || e.keyCode > NUM_NINE) && e.keyCode !== DOT && e.keyCode !== DASH && e.keyCode !== NUM_DOT) {
                                        e.preventDefault();
                                      }
                                    });
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
            setTimeout(function() {target.html('<div>' + parseFloat(text, 10) + '</div>')}, 0);
          }
        }
      }
    , columnBuilder = function() {
        var t = $(this).text()
          , f = +t
          , d = new Date(t)
          , spec = $(this).attr('data-type')
          ;
        if(spec) {
          var data = $(this).data()
            , t = {'type': spec, 'options': {}}
            ;
          for(var i in data) {
            t.options[i] = data[i];
          }
          return t;
        } else if(!isNaN(d.getTime()) && isNaN(f)) {
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
      grijq.headerTable = grijq.element.children().first();
      grijq.verticalScroller = grijq.element.children().last();
      grijq.bodyTable = grijq.verticalScroller.children().first();
      $('td', grijq.bodyTable).focus(function(e) {
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
                              });
      grijq.wrapper = grijq.element;
      grijq.bodyTable.click(function(e) {
                        var cell = $(e.target).closest('td');
                        if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
                          return;
                        }
                        grijq._clearSelection();
                        grijq['selectedCell'] = cell.addClass('ui-state-default').trigger('focus');
                      });
      grijq.verticalScroller.width(parseInt(grijq.bodyTable.prop('width')) + 16)
                            .height(this.options.height);
      $('thead th', grijq.headerTable).addClass('unselectable')
                                      .hover(function() {$(this).addClass('ui-state-hover')}, function() {$(this).removeClass('ui-state-hover')})
                                      .click(function() {
                                        var col = getCol.call(this, 0, grijq.element);
                                        grijq._clearSelection();
                                        grijq['selectedHeader'] = $(this).addClass('ui-state-active');
                                        col.addClass('ui-state-default');
                                        grijq['selectedColumn'] = col;
                                      });
      $('.mover', grijq.headerTable).draggable({
        axis: 'x',
        helper: function() {
                  grijq.columnResizer.height(grijq.wrapper.height());
                  return grijq.columnResizer.show()[0];
                },
        stop: function(event, ui) {
                var offset = ui.position.left - ui.originalPosition.left;
                var col = getCol.call(this, 1, grijq.bodyTable);
                var newColWidth = Math.max(minWidth, offset + parseInt(col.prop('width')));
                col.prop('width', newColWidth);
                col = getCol.call(this, 1, grijq.headerTable);
                col.prop('width', newColWidth);

                var newTableWidth = Math.max(minWidth, offset + parseInt(grijq.headerTable.prop('width')));
                grijq.bodyTable.prop('width', newTableWidth);
                grijq.headerTable.prop('width', newTableWidth);
                grijq.verticalScroller.width(newTableWidth + 16);
              }
      });
      grijq.columnResizer = $('<div>').addClass('resizer');
      grijq.wrapper.append(grijq.columnResizer);
      // grijq.element.keydown(function(e) {
      //   var target = $(e.target);
      //   switch(e.keyCode) {
      //     case LEFT:
      //       if(editing) {
      //         return;
      //       }
      //       target.prev().focus();
      //       e.preventDefault();
      //       break;
      //     case RIGHT:
      //       if(editing) {
      //         return;
      //       }
      //       target.next().focus();
      //       e.preventDefault();
      //       break;
      //     case UP:
      //       if(editing) {
      //         return;
      //       }
      //       var index = target.prevAll().length + 1;
      //       $(':nth-child(' + index + ')', target.closest('tr').prev()).focus();
      //       e.preventDefault();
      //       break;
      //     case DOWN:
      //       if(editing) {
      //         return;
      //       }
      //       var index = target.prevAll().length + 1;
      //       $(':nth-child(' + index + ')', target.closest('tr').next()).focus();
      //       e.preventDefault();
      //       break;
      //     case F2:
      //       if(editing) {
      //         return;
      //       }
      //       editing = true;
      //       var index = target.prevAll().length;
      //       var editor = grijq.options.columns[index];
      //       grijq['currentEditor'] = editors[editor['type']];
      //       grijq['currentEditor'].edit(target, editor['options']);
      //       break;
      //     default:
      //       if(editing || e.ctrlKey) {
      //         return;
      //       }
      //       if((e.keyCode >= A && e.keyCode <= Z) || (e.keyCode >= ZERO && e.keyCode <= NINE) || (e.keyCode >= NUM_ZERO && e.keyCode <= NUM_NINE) || e.keyCode === DOT || e.keyCode === NUM_DOT) {
      //         editing = true;
      //         var index = target.prevAll().length;
      //         var editor = grijq.options.columns[index];
      //         grijq['currentEditor'] = editors[editor['type']];
      //         grijq['currentEditor'].edit(target, editor['options']);
      //       }
      //       break;
      //   }
      // });
      // if(grijq.options.columns.length === 0) {
      //   $('tr:first', databody).children().each(function() {
      //     grijq.options.columns.push(columnBuilder.apply(this));
      //   });
      // }
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
