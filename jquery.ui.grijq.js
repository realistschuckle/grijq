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
    , ENTER = 13
    , editing = false
    , ie = (!+'\v1')
    , editors = {
        'date': {
          'edit': function(target, options) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width() - 1);
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
        'reading': {
          'edit': function(target, options) {
            target.addClass('editing reading');
            var text = target.text().split(' ');
            var foot = $('<input>').prop({'maxlength': '3'}).val(parseInt(text[0]) || 0);
            var inch = $('<input>').prop({'maxlength': '2'}).val(parseInt(text[1]) || 0);
            var inc = $('<input>').prop({'maxlength': '1'}).val(parseInt(text[2]) || 0);
            target.html('').append(foot).append('&prime; ').append(inch).append('&Prime;').append(inc).append('/8');
            foot.select();
            foot.focus();
          },
          'unedit': function(target) {
            editing = false;
            var inputs = $('input', target)
              , markers = ['&prime;', '&Prime;', '/8']
              , output = []
              ;
            inputs.each(function(i) {
              output.push($(this).val() + markers[i]);
            });
            target.html(output.join(' ')).removeClass('editing reading');
          }
        },
        'autocomplete': {
          'edit': function(target, options) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width() - 1);
            var source = options['source'];
            if(typeof window[source] !== 'undefined') {
              options['source'] = window[source];
            }
            target.html('').append(input);
            input.autocomplete(options);
            input.select();
            input.focus();
            setTimeout(function() {input.autocomplete('search');}, 10);
          },
          'unedit': function(target) {
            editing = false;
            target.removeClass('editing');
            var input = target.children().first();
            if(input.length === 0) {
              return;
            }
            var text = input.val();
            input.autocomplete('destroy');
            input.remove();
            setTimeout(function() {target.html('<div>' + text + '</div>')}, 0);
          }
        },
        'text': {
          'edit': function(target) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width() - 1);
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
                                    .width(target.width() - (ie? 11 : 0))
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
      scroll: 'internal',
      columns: []
    },
    _create: function() {
      var grijq = this
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
      grijq.wrapper = grijq.element;
      grijq.headerTable = grijq.element.children().first();
      grijq.verticalScroller = grijq.element.children().last();
      grijq.bodyTable = grijq.verticalScroller.css('top', grijq.headerTable.height()).children().first();

      if(grijq.options.scroll === 'window') {
        grijq.verticalScroller.removeClass('grijq-vertical');
        grijq.wrapper.css('overflow', 'visible');
      }
      grijq.wrapper.height(this.options.height);

      $('td', grijq.bodyTable).focus(function(e) {
                                 var cell = $(e.target).closest('td');
                                 if(cell.next().length === 0) {
                                   var nextRow = cell.parent().next();
                                   nextRow.attr('data-tabindexed', true);
                                   nextRow.children().prop('tabindex', '0');
                                 } else if(cell.prev().length === 0) {
                                   var previousRow = cell.parent().prev();
                                   previousRow.attr('data-tabindexed', true);
                                   previousRow.children().prop('tabindex', '0');
                                 }
                                 if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
                                   return;
                                 }
                                 grijq._clearSelection();
                                 grijq['selectedCell'] = cell.addClass('ui-state-default');
                                 if(ie) {
                                   clearTimeout(iefocus);
                                   iefocus = setTimeout(function() {cell.focus();}, 200);
                                 }
                              });
      grijq.bodyTable.click(function(e) {
                        var cell = $(e.target).closest('td');
                        if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
                          return;
                        }
                        cell.parent().children().prop('tabindex', '0');
                        grijq._clearSelection();
                        grijq['selectedCell'] = cell.addClass('ui-state-default').trigger('focus');
                      });
      if(grijq.options.scroll !== 'window') {
        grijq.verticalScroller.css('max-width', parseInt(grijq.bodyTable.prop('width')) + 18)
                              .height(this.options.height - 25)
                              .scroll(function(e) {
                                var sl = grijq.verticalScroller.scrollLeft();
                                grijq.headerTable.css('left', -sl);
                              });
      }
      $('thead th', grijq.headerTable).addClass('unselectable')
                                      .hover(function() {$(this).addClass('ui-state-hover')}, function() {$(this).removeClass('ui-state-hover')})
                                      .click(function() {
                                        var col = getCol.call(this, 0, grijq.bodyTable);
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
                if(grijq.options.scroll !== 'window') {
                  grijq.verticalScroller.width(newTableWidth + 16);
                }
              }
      });
      grijq.columnResizer = $('<div>').addClass('resizer');
      grijq.wrapper.append(grijq.columnResizer);
      grijq.bodyTable.keydown(function(e) {
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
            var tr = target.closest('tr').prev();
            tr.children().prop('tabindex', '0');
            $(':nth-child(' + index + ')', tr).focus();
            e.preventDefault();
            break;
          case DOWN:
          case ENTER:
            if(editing) {
              return;
            }
            var index = target.prevAll().length + 1;
            var tr = target.closest('tr').next();
            tr.children().prop('tabindex', '0');
            $(':nth-child(' + index + ')', tr).focus();
            e.preventDefault();
            break;
          case F2:
            if(editing) {
              return;
            }
            editing = true;
            var index = target.prevAll().length;
            var editor = grijq.options.columns[index];
            grijq['currentEditor'] = editors[editor['type']];
            grijq['currentEditor'].edit(target, editor['options']);
            break;
          default:
            if(editing || e.ctrlKey) {
              return;
            }
            if((e.keyCode >= A && e.keyCode <= Z) || (e.keyCode >= ZERO && e.keyCode <= NINE) || (e.keyCode >= NUM_ZERO && e.keyCode <= NUM_NINE) || e.keyCode === DOT || e.keyCode === NUM_DOT) {
              editing = true;
              var index = target.prevAll().length;
              var editor = grijq.options.columns[index];
              grijq['currentEditor'] = editors[editor['type']];
              grijq['currentEditor'].edit(target, editor['options']);
            }
            break;
        }
      });
      if(grijq.options.columns.length === 0) {
        $('tr:first', grijq.bodyTable).children().each(function() {
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
