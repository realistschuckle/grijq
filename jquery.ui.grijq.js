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
            var input = $('<input>').val(target.text()).width(target.width() - 11);
            target.children().hide().end().append(input);
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
            var input = target.children().last();
            if(input.length === 0) {
              return;
            }
            var date = new Date(input.val());
            date = $.datepicker.formatDate('m/d/yy', date);
            input.remove();
            target.children().show();
            return date;
          }
        },
        'autocomplete': {
          'edit': function(target, options) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width() - 11);
            var source = options['source'];
            if(typeof window[source] !== 'undefined') {
              options['source'] = window[source];
            }
            target.children().hide().end().append(input);
            input.autocomplete(options);
            input.select();
            input.focus();
            if(!target.attr('data-bind')) {
              setTimeout(function() {input.autocomplete('search');}, 10);
            }
          },
          'unedit': function(target) {
            editing = false;
            target.removeClass('editing');
            var input = target.children().last();
            if(input.length === 0) {
              return;
            }
            var text = input.val();
            input.autocomplete('destroy');
            input.remove();
            target.children().show();
            return text;
          }
        },
        'text': {
          'edit': function(target) {
            target.addClass('editing');
            var input = $('<input>').val(target.text()).width(target.width() - 11);
            target.children().hide().end().append(input);
            input.select();
            input.focus();
          },
          'unedit': function(target) {
            editing = false;
            target.removeClass('editing');
            var input = target.children().last();
            if(input.length === 0) {
              return;
            }
            var text = input.val();
            input.remove();
            target.children().show();
            return text;
          }
        },
        'number': {
          'edit': function(target) {
            target.addClass('editing');
            var input = $('<input>').val(target.text())
                                    .width(target.width() - 11)
                                    .keydown(function(e) {
                                      if(e.keyCode === TAB || e.keyCode === LEFT || e.keyCode === UP || e.keyCode === RIGHT || e.keyCode === DOWN || e.keyCode === BACKSPACE || e.keyCode === DELETE) {
                                        return;
                                      }
                                      if((e.keyCode < ZERO || e.keyCode > NINE) && (e.keyCode < NUM_ZERO || e.keyCode > NUM_NINE) && e.keyCode !== DOT && e.keyCode !== DASH && e.keyCode !== NUM_DOT) {
                                        e.preventDefault();
                                      }
                                    });
            target.children().hide().end().append(input);
            input.select();
            input.focus();
          },
          'unedit': function(target) {
            editing = false;
            target.removeClass('editing');
            var input = target.children().last();
            if(input.length === 0) {
              return;
            }
            var text = input.val();
            input.remove();
            target.children().show();
            return parseFloat(text);
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
      readonly: false,
      newrow: true,
      columns: [],
      editors: {}
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
      if(grijq.wrapper.length === 0) {
        return;
      }
      if(grijq.wrapper.get(0).tagName.toLowerCase() === 'table') {
        grijq.wrapper = $('<div class="grijq-wrapper"><div class="grijq-horizontal"><table class="ui-widget grijq ui-widget-header-holder"><colgroup></colgroup></table></div><div class="grijq-vertical"></div></div>');
      }

      grijq.horizontalScroller = grijq.wrapper.children().first();
      grijq.headerTable = grijq.horizontalScroller.children();
      grijq.verticalScroller = grijq.wrapper.children().last();
      grijq.bodyTable = grijq.verticalScroller.children().first();

      if(grijq.bodyTable.length === 0) {
        grijq.bodyTable = grijq.element;
        grijq.bodyTable
          .find('thead')
          .remove()
          .clone()
          .addClass('ui-widget-header ui-state-default')
          .find('th')
            .prepend('<span class="mover ui-draggable">.</span>')
            .wrapInner('<div></div>')
            .each(function(i) {
              $(this).attr('data-index', i);
            })
          .end()
          .appendTo(grijq.headerTable);
        grijq.headerTable.prop('width', grijq.bodyTable.prop('width'));
        grijq.bodyTable
          .addClass('ui-widget grijq ui-widget-content')
          .after(grijq.wrapper)
          .find('tbody')
            // .addClass('ui-widget-content')
            .find('td')
              .wrapInner('<div></div>')
            .end()
          .end()
          .find('colgroup')
          .clone()
          .children()
          .appendTo(grijq.headerTable.find('colgroup'));
        grijq.verticalScroller.append(grijq.bodyTable);
      }

      grijq.verticalScroller.css('top', grijq.headerTable.height());

      for(var key in editors) {
        if(typeof grijq.options.editors[key] === 'undefined') {
          grijq.options.editors[key] = editors[key];
        }
      }

      if(grijq.options.scroll === 'window') {
        grijq.verticalScroller.removeClass('grijq-vertical');
        grijq.wrapper.css('overflow', 'visible');
      }
      grijq.wrapper.height(this.options.height);

      $(grijq.bodyTable).on('focus', 'td', function(e) {
        var cell = $(e.target).closest('td');
        var row = cell.parent();
        if(cell.next().length === 0) {
          var nextRow = row.next();
          nextRow.children(':not(.readonly)').prop('tabindex', '0');
        } else if(cell.prev().length === 0) {
          var previousRow = row.prev();
          previousRow.children(':not(.readonly)').prop('tabindex', '0');
        }
        if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
          return;
        }
        grijq._clearSelection();
        var oldrow = grijq['selectedRow'];
        grijq['selectedRow'] = row.addClass('ui-state-default');
        if(oldrow && oldrow.get(0) !== row.get(0)) {
          grijq._trigger('rowselected', null, {row: row});
        } else {
          cell.parent().children(':not(.readonly)').prop('tabindex', '0');
        }
        grijq['selectedCell'] = cell.addClass('ui-state-active');
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
        cell.parent().children(':not(.readonly)').prop('tabindex', '0');
        grijq._clearSelection();
        grijq['selectedCell'] = cell.trigger('focus');
      });
      if(grijq.options.scroll !== 'window') {
        grijq.verticalScroller.height(this.options.height - 25)
                              .scroll(function(e) {
                                var sl = grijq.verticalScroller.scrollLeft();
                                grijq.headerTable.css('left', -sl);
                              });
        if(grijq.options.width !== 'auto') {
          grijq.verticalScroller.css('max-width', parseInt(grijq.options.width) + 18)
          grijq.horizontalScroller.css('max-width', parseInt(grijq.options.width));
          grijq.wrapper.css('max-width', parseInt(grijq.options.width) + 18);
        }
      }
      $('thead th', grijq.headerTable).addClass('unselectable')
                                      .hover(function() {$(this).addClass('ui-state-hover')}, function() {$(this).removeClass('ui-state-hover')})
                                      .click(function() {
                                        var col = getCol.call(this, 0, grijq.bodyTable);
                                        console.log(col);
                                        grijq._clearSelection();
                                        grijq['selectedHeader'] = $(this).addClass('ui-state-active');
                                        col.addClass('ui-state-active');
                                        grijq['selectedColumn'] = col;
                                        console.log(col);
                                      });
      $('.mover', grijq.headerTable).draggable({
        axis: 'x',
        helper: function() {
                  grijq.wrapper.append(grijq.columnResizer);
                  grijq.columnResizer.height(grijq.wrapper.height() * 2).css('z-index', 1000);
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
                  if(grijq.options.width === 'auto') {
                    grijq.verticalScroller.width('');
                  } else {
                    grijq.verticalScroller.width(newTableWidth + 16);
                  }
                }
              }
      });
      grijq.columnResizer = $('<div>').addClass('resizer');
      grijq.wrapper.append(grijq.columnResizer);
      grijq.bodyTable.keydown(function(e) {
        var target = $(e.target);
        switch(e.keyCode) {
          case TAB:
            if((e.target.nodeName.toLowerCase() === 'td' || (editing && target.closest('td').next().length === 0)) && typeof grijq.options.newrow === 'function' && target.next().length === 0 && target.parent().next().length === 0) {
              grijq.options.newrow();
              target.parent().next().children(':not(.readonly)').prop('tabindex', 0);
            }
            break;
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
            tr.children(':not(.readonly)').prop('tabindex', '0');
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
            tr.children(':not(.readonly)').prop('tabindex', '0');
            $(':nth-child(' + index + ')', tr).focus();
            e.preventDefault();
            break;
          case F2:
            if(grijq.options.readonly || editing || target.hasClass('readonly') || target.parent().hasClass('readonly')) {
              return;
            }
            editing = true;
            var index = target.prevAll().length;
            var editor = grijq.options.columns[index];
            grijq['currentEditor'] = grijq.options.editors[editor['type']];
            grijq['currentEditor'].edit(target, editor['options']);
            break;
          default:
            if(grijq.options.readonly || editing || e.ctrlKey || target.hasClass('readonly') || target.parent().hasClass('readonly')) {
              return;
            }
            if((e.keyCode >= A && e.keyCode <= Z) || (e.keyCode >= ZERO && e.keyCode <= NINE) || (e.keyCode >= NUM_ZERO && e.keyCode <= NUM_NINE) || e.keyCode === DOT || e.keyCode === NUM_DOT) {
              editing = true;
              var index = target.prevAll().length;
              var editor = grijq.options.columns[index];
              grijq['currentEditor'] = grijq.options.editors[editor['type']];
              grijq['currentEditor'].edit(target, editor['options']);
            }
            break;
        }
      });
      if(grijq.options.columns.length === 0) {
        $('tr:last', grijq.headerTable).children().each(function() {
          grijq.options.columns.push(columnBuilder.apply(this));
        });
      }
    },
    selectLastRow: function() {
      var cell = this.bodyTable.find('tr').last().children(':not(.readonly)').first();
      if(this['selectedCell'] && this['selectedCell'].length && cell.length && this['selectedCell'][0] === cell[0]) {
        return;
      }
      cell.parent().children(':not(.readonly)').prop('tabindex', '0');
      this._clearSelection();
      this['selectedCell'] = cell.trigger('focus');
    },
    _clearSelection: function() {
      if(this['selectedColumn']) {
        this['selectedHeader'].removeClass('ui-state-active');
        this['selectedColumn'].removeClass('ui-state-active');
      }
      if(this['currentEditor']) {
        var value = this['currentEditor'].unedit(this['selectedCell']);
        this['currentEditor'] = null;
        this._trigger('editcomplete', null, {val: value, cell: this['selectedCell']});
      }
      if(this['selectedRow']) {
        this['selectedRow'].removeClass('ui-state-default');
      }
      if(this['selectedCell']) {
        this['selectedCell'].removeClass('ui-state-active');
      }
    },
    _setOption: function(key, value) {
      $.Widget.prototype._setOption.apply(this, arguments);
      if(key === 'height') {
        this.wrapper.height(value);
        this.verticalScroller.height(value - 25);
      }
    },
    _init: function() {

    },
    destroy: function() {
      $.Widget.prototype.destroy.call(this);
    }
  });
})(jQuery);
