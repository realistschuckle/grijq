(function($) {
  var F2 = 113
    , A = 65
    , Z = 90
    , ZERO = 48
    , NINE = 57
    , NUM_ZERO = 96
    , NUM_NINE = 105
    , DOT = 190
    , DASH = 109
    , NUM_DOT = 110
    , editing = false
    , ie = /*@cc_on!@*/0
    , editors = {
        'date': {
          'edit': function(value, options) {
            var input = $('<input>').val(value);
            input.datepicker({
              onSelect: function() {
                var date = input.datepicker('getDate');
                input.val($.datepicker.formatDate('m/d/yy', date));
                input.select();
                input.focus();
              }
            });
            return {
              element: input,
              afterAppend: function() {
                input.select();
                input.focus();
                input.datepicker('show');
              }
            };
          },
          'unedit': function(input) {
            var date = new Date(input.val());
            return $.datepicker.formatDate('m/d/yy', date);
          }
        },
        'autocomplete': {
          'edit': function(value, options) {
            var input = $('<input>').val(value).keydown(function(e) {
              if(e.keyCode === $.ui.keyCode.DOWN || e.keyCode === $.ui.keyCode.UP) {
                e.stopPropagation();
              }
            });
            var source = options['source'];
            if(typeof window[source] !== 'undefined') {
              options['source'] = window[source];
            }
            return {
              element: input,
              afterAppend: function() {
                input.autocomplete(options);
                input.select();
                input.focus();
                if(!target.attr('data-bind')) {
                  setTimeout(function() {input.autocomplete('search');}, 10);
                }
              }
            };
          },
          'unedit': function(input) {
            var text = input.val();
            input.autocomplete('destroy');
            return text;
          }
        },
        'text': {
          'edit': function(value, options) {
            var input = $('<input>').val(value);
            return {
              element: input,
              afterAppend: function() {
                input.select();
                input.focus();
              }
            };
          },
          'unedit': function(input) {
            return input.val();
          }
        },
        'number': {
          'edit': function(value, options) {
            var keyHandler = function(e) {
              if(e.keyCode === $.ui.keyCode.TAB || e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.UP || e.keyCode === $.ui.keyCode.RIGHT || e.keyCode === $.ui.keyCode.DOWN || e.keyCode === $.ui.keyCode.BACKSPACE || e.keyCode === $.ui.keyCode.DELETE) {
                return;
              }
              if((e.keyCode < ZERO || e.keyCode > NINE) && (e.keyCode < NUM_ZERO || e.keyCode > NUM_NINE) && e.keyCode !== DOT && e.keyCode !== DASH && e.keyCode !== NUM_DOT) {
                e.preventDefault();
              }
            };
            var input = $('<input>').val(value).keydown(keyHandler);
            return {
              element: input,
              afterAppend: function() {
                input.select();
                input.focus();
                setTimeout(function() {
                  if(isNaN(+input.val())) {
                    input.val('');
                  }
                }, 0);
              }
            };
          },
          'unedit': function(input) {
            return parseFloat(input.val());
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
      readonly: false,
      newrow: true,
      hasDivs: false,
      columns: [],
      editors: {}
    },
    _create: function() {
      var grijq = this
        , minWidth = 1 //ie? 1 : 0
        , iefocus = null
        , getCol = function(offset, table) {
                     offset = offset || 0;
                     var index = $(this).attr('data-index');
                     if(!index) {
                       index = parseInt($(this).parents('[data-index]').attr('data-index'));
                     }
                     return $($('col', table).get(index - offset));
                   }
        // , timings = []
        ;
      if(grijq.element.length === 0) {
        return;
      }

      grijq.cols = grijq.element.children('colgroup').children();
      grijq.scroller = $('<div class="ui-grijq-scroll"></div>');
      grijq.widget = $('<div class="ui-grijq"></div>').append(grijq.scroller);
      grijq.element
        .addClass('ui-widget ui-widget-content')
        .after(grijq.widget)
        .children('thead')
          .addClass('ui-widget-header ui-state-default')
          .find('th')
            .append(ie? '<span class="mover ie">.</span>' : '<span class="mover">.</span>')
            .wrapInner('<div></div>')
          .end();
      grijq.head = grijq.element.children('thead');
      if(!grijq.options.hasDivs) {
        $('td', grijq.element).wrapInner('<div></div>');
      }

      if(ie) {
        var dom = grijq.element.get(0);
        dom.style.display = 'none';
        grijq.element.appendTo(grijq.scroller);
        dom.style.display = '';
      } else {
        grijq.element.appendTo(grijq.scroller);
      }

      // timings.push(['copying editors', new Date()]);
      for(var key in editors) {
        if(typeof grijq.options.editors[key] === 'undefined') {
          grijq.options.editors[key] = editors[key];
        }
      }

      // timings.push(['setting height', new Date()]);
      grijq.scroller
        .height(this.options.height)
        .scroll(function() {
          grijq.head.css('left', -grijq.scroller.scrollLeft() - 1);
        });

      // timings.push(['setting focus', new Date()]);
      grijq.element
        .on('focus', 'td', function(e) {
          var cell = $(e.target).closest('td');
          var row = cell.parent();
          if(cell.next().length === 0) {
            var nextRow = row.next();
            nextRow.children().prop('tabindex', '0');
          } else if(cell.prev().length === 0) {
            var previousRow = row.prev();
            previousRow.children().prop('tabindex', '0');
          }
          if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
            return;
          }
          grijq._clearSelection();
          var oldrow = grijq['selectedRow'];
          grijq['selectedRow'] = row.addClass('ui-state-default');
          if(typeof oldrow === 'undefined' || oldrow === null || oldrow.get(0) !== row.get(0)) {
            grijq._trigger('rowselected', null, {row: row});
            cell.parent().children().prop('tabindex', '0');
          }
          grijq['selectedCell'] = cell.addClass('ui-state-active');
          if(ie) {
            clearTimeout(iefocus);
            iefocus = setTimeout(function() {cell.focus();}, 200);
          }
        })
        .click(function(e) {
          if(ie) {
            return;
          }
          var cell = $(e.target).closest('td');
          if(grijq['selectedCell'] && grijq['selectedCell'].length && cell.length && grijq['selectedCell'][0] === cell[0]) {
            return;
          }
          cell.parent().children().prop('tabindex', '0');
          grijq._clearSelection();
          grijq['selectedCell'] = cell.trigger('focus');
        })
        .dblclick(function(e) {
          clearTimeout(iefocus);
          var target = $(e.target).closest('td');
          if(grijq.options.readonly || editing || target.hasClass('readonly') || target.parent().hasClass('readonly')) {
            return;
          }
          grijq._edit(target);
        });

      // timings.push(['setting widths', new Date()]);
      if(grijq.options.width !== 'auto') {
        grijq.scroller.css('max-width', parseInt(grijq.options.width));
        grijq.widget.css('max-width', parseInt(grijq.options.width));
      }

      // timings.push(['setting header class, hover, and click', new Date()]);
      $('th', grijq.head)
        .addClass('unselectable')
        .click(function(e) {
          e.stopPropagation();
          var index = $(this).prevAll().length;
          var col = $(grijq.cols.get(index));
          grijq._clearSelection();
          grijq['selectedHeader'] = $(this).addClass('ui-state-active');
          col.addClass('ui-state-default');
          grijq['selectedColumn'] = col;
        })
        .each(function(i) {
          var $this = $(this);
          var pad = parseInt($this.css('padding-left')) + 
                    parseInt($this.css('padding-right'));
          $(this)
            .attr('data-index', i)
            .width(+$(grijq.cols[i]).prop('width') - 1 - pad);
        });

      // timings.push(['setting mover functionality', new Date()]);
      $('.mover', grijq.head).draggable({
        axis: 'x',
        helper: function() {
                  grijq.widget.append(grijq.columnResizer);
                  grijq.columnResizer.height(grijq.widget.height() - 16).css('z-index', 1000);
                  return grijq.columnResizer.show()[0];
                },
        stop: function(event, ui) {
                var th = $(this).closest('th');
                var pad = parseInt(th.css('padding-left')) + 
                          parseInt(th.css('padding-right'));
                var offset = ui.position.left - ui.originalPosition.left;
                var index = th.prevAll().length;
                var col = $(grijq.cols.get(index));
                var newColWidth = Math.max(pad + 5, Math.max(minWidth, offset + parseInt(col.prop('width'))));
                col.prop('width', newColWidth);
                var newHeaderWidth = Math.max(minWidth, newColWidth - 1 - pad);
                $(grijq.head.children().first().children().get(index)).width(newHeaderWidth);
                var newTableWidth = Math.max(minWidth, offset + parseInt(grijq.element.prop('width')));
                grijq.element.prop('width', newTableWidth);
                grijq.element.css('width', newTableWidth);
              }
      });

      // timings.push(['creating resizer', new Date()]);
      grijq.columnResizer = $('<div class="resizer"></div>');

      // timings.push(['setting keydown functionality', new Date()]);
      grijq.element.keydown(function(e) {
        var target = $(e.target);
        switch(e.keyCode) {
          case $.ui.keyCode.TAB:
            if(!e.shiftKey && (e.target.nodeName.toLowerCase() === 'td' || (editing && target.closest('td').next().length === 0)) && typeof grijq.options.newrow === 'function' && target.next().length === 0 && target.parent().next().length === 0) {
              grijq.options.newrow();
              target.parent().next().children().prop('tabindex', 0);
            }
            break;
          case $.ui.keyCode.LEFT:
            if(editing) {
              return;
            }
            target.prev().focus();
            e.preventDefault();
            break;
          case $.ui.keyCode.RIGHT:
            if(editing) {
              return;
            }
            target.next().focus();
            e.preventDefault();
            break;
          case $.ui.keyCode.UP:
            var index = target.closest('td').prevAll().length;
            var tr = target.closest('tr').prev();
            tr.children().prop('tabindex', '0');
            $(tr.children()[index]).focus();
            e.preventDefault();
            break;
          case $.ui.keyCode.DELETE:
            if(editing) {
              return;
            }
            grijq._trigger('editcomplete', null, {val: null, cell: grijq['selectedCell']});
            break;
          case $.ui.keyCode.ESCAPE:
            if(!editing || !grijq['currentEditor']) {
              return;
            }
            grijq._unedit();
            grijq['selectedCell'].focus();
            break;
          case $.ui.keyCode.DOWN:
          case $.ui.keyCode.ENTER:
            var index = target.closest('td').prevAll().length;
            var tr = target.closest('tr').next();
            tr.children().prop('tabindex', '0');
            $(tr.children()[index]).focus();
            e.preventDefault();
            break;
          default:
            if(grijq.options.readonly || editing || e.ctrlKey || e.metaKey || target.hasClass('readonly') || target.parent().hasClass('readonly')) {
              return;
            }
            if((e.keyCode >= A && e.keyCode <= Z) || (e.keyCode >= ZERO && e.keyCode <= NINE) || (e.keyCode >= NUM_ZERO && e.keyCode <= NUM_NINE) || e.keyCode === DOT || e.keyCode === NUM_DOT || e.keyCode === F2) {
              grijq._edit(target.closest('td'));
            }
            break;
        }
      });

      // timings.push(['building column types', new Date()]);
      if(grijq.options.columns.length === 0) {
        $('tr', grijq.head).last().children().each(function() {
          grijq.options.columns.push(columnBuilder.apply(this));
        });
      }

      // timings.push(['setting top', new Date()]);
      grijq.scroller.css('margin-top', grijq.head.height());

      $('<style type="text/css">.ui-grijq .ui-grijq-scroll .ui-widget td {height: ' + grijq.head.height() + 'px;}</style>').appendTo(document.head);
      $('<input style="position: absolute; top: -10000px; left: -10000px;">').appendTo(grijq.scroller);

      // timings.push(['movement done', new Date()]);
      // setTimeout(function() {
      //   timings.push(['reflowed', new Date()]);
      //   var baseTime = timings[0][1];
      //   for(var i = 0; i < timings.length; i += 1) {
      //     var offset = timings[i][1].valueOf() - baseTime.valueOf();
      //     --(offset, timings[i][0]);
      //   }
      // }, 1);
    },
    selectLastRow: function() {
      var cell = this.element.find('tr').last().children().first();
      if(this['selectedCell'] && this['selectedCell'].length && cell.length && this['selectedCell'][0] === cell[0]) {
        return;
      }
      cell.parent().children().prop('tabindex', '0');
      this._clearSelection();
      this['selectedCell'] = cell.trigger('focus');
    },
    _clearSelection: function() {
      if(this['selectedColumn']) {
        this['selectedHeader'].removeClass('ui-state-active');
        this['selectedColumn'].removeClass('ui-state-default');
      }
      if(this['currentEditor']) {
        var value = this._unedit();
        this._trigger('editcomplete', null, {val: value, cell: this['selectedCell']});
      }
      if(this['selectedRow']) {
        this['selectedRow'].removeClass('ui-state-default');
      }
      if(this['selectedCell']) {
        this['selectedCell'].removeClass('ui-state-active');
      }
    },
    _edit: function(target) {
      var index = target.prevAll().length
        , value = target.children().first().text()
        , editorSpec = this.options.columns[index]
        ;
      this['currentEditor'] = this.options.editors[editorSpec['type']]
      var editor = this['currentEditor'].edit(value, editorSpec['options'])
      this['currentEditorEl'] = editor.element || editor
      editing = true;
      this['currentEditorEl'].width(target.width()).height(target.height());
      target.addClass('editing').children().hide();
      target.append(this['currentEditorEl']);
      if(typeof editor.afterAppend == 'function') {
        editor.afterAppend();
      } 
    },
    _unedit: function() {
      editing = false;
      var target = this['selectedCell'];
      target.removeClass('editing');
      this['currentEditorEl'].remove();
      var value = this['currentEditor'].unedit(this['currentEditorEl']);
      this['currentEditor'] = null;
      this['currentEditorEl'] = null;
      target.children().show();
      return value;
    },
    _setOption: function(key, value) {
      $.Widget.prototype._setOption.apply(this, arguments);
      if(key === 'height') {
        this.options.height = value === 'auto'? value : parseInt(value) - 25;
        this.scroller.height(this.options.height);
      } else if(key === 'width') {
        this.options.width = value === 'auto'? value : parseInt(value);
        value = this.options.width === 'auto'? '' : value + 'px';
        this.scroller.css('max-width', value);
        this.widget.css('max-width', value);
      } else if(key === 'readonly') {
        this.options.width = !!value;
        if(value) {
          this.element.addClass('ui-state-disabled');
        } else {
          this.element.removeClass('ui-state-disabled');
        }
      } else if(key === 'columns') {
        this.options.columns = value;
      }
    },
    _init: function() {

    },
    destroy: function() {
      $.Widget.prototype.destroy.call(this);
    }
  });
})(jQuery);
