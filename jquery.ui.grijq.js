(function ($) {
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
            'edit': function (value, options) {
                var input = $('<input>').val(value);
                var wrapper = $('<div>').append(input);
                input.datepicker({
                    onSelect: function () {
                        var date = input.datepicker('getDate');
                        input.val($.datepicker.formatDate('m/d/yy', date));
                        input.select();
                        input.focus();
                    }
                });
                return {
                    element: wrapper,
                    afterAppend: function () {
                        input.select();
                        input.focus();
                        var horizPad = 2 * parseInt(input.css('padding-left'));
                        var vertPad = 2 * parseInt(input.css('padding-top'));
                        input.height(wrapper.height() - vertPad);
                        input.width(wrapper.width() - horizPad);
                        input.datepicker('show');
                    }
                };
            },
            'unedit': function (wrapper) {
                var date = new Date(wrapper.children().val());
                return $.datepicker.formatDate('m/d/yy', date);
            }
        },
        'autocomplete': {
            'edit': function (value, options) {
                var input = $('<input>').val(value).keydown(function (e) {
                    if (e.keyCode === $.ui.keyCode.DOWN || e.keyCode === $.ui.keyCode.UP) {
                        e.stopPropagation();
                    }
                });
                var wrapper = $('<div>').append(input);
                var source = options['source'];
                if (typeof window[source] !== 'undefined') {
                    options['source'] = window[source];
                }
                return {
                    element: wrapper,
                    afterAppend: function () {
                        input.autocomplete(options);
                        input.select();
                        input.focus();
                        var horizPad = 2 * parseInt(input.css('padding-left'));
                        var vertPad = 2 * parseInt(input.css('padding-top'));
                        input.height(wrapper.height() - vertPad);
                        input.width(wrapper.width() - horizPad);
                        if (!target.attr('data-bind')) {
                            setTimeout(function () { input.autocomplete('search'); }, 10);
                        }
                    }
                };
            },
            'unedit': function (wrapper) {
                var input = wrapper.children().first();
                var text = input.val();
                input.autocomplete('destroy');
                return text;
            }
        },
        'text': {
            'edit': function (value, options) {
                var input = $('<input>').val(value);
                var wrapper = $('<div>').append(input);
                return {
                    element: wrapper,
                    afterAppend: function () {
                        input.select();
                        input.focus();
                        var horizPad = 2 * parseInt(input.css('padding-left'));
                        var vertPad = 2 * parseInt(input.css('padding-top'));
                        input.height(wrapper.height() - vertPad);
                        input.width(wrapper.width() - horizPad);
                    }
                };
            },
            'unedit': function (wrapper) {
                return wrapper.children().val();
            }
        },
        'number': {
            'edit': function (value, options) {
                var keyHandler = function (e) {
                    switch (e.keyCode) {
                        case $.ui.keyCode.TAB:
                        case $.ui.keyCode.LEFT:
                        case $.ui.keyCode.UP:
                        case $.ui.keyCode.RIGHT:
                        case $.ui.keyCode.DOWN:
                        case $.ui.keyCode.BACKSPACE:
                        case $.ui.keyCode.DELETE:
                            return;
                    }
                    if ((e.keyCode < ZERO || e.keyCode > NINE)
                            && (e.keyCode < NUM_ZERO || e.keyCode > NUM_NINE)
                            && e.keyCode !== DOT && e.keyCode !== DASH
                            && e.keyCode !== NUM_DOT) {
                        e.preventDefault();
                    }
                };
                var input = $('<input>').val(value).keydown(keyHandler);
                var wrapper = $('<div>').append(input);
                return {
                    element: wrapper,
                    afterAppend: function () {
                        input.select();
                        input.focus();
                        var horizPad = 2 * parseInt(input.css('padding-left'));
                        var vertPad = 2 * parseInt(input.css('padding-top'));
                        input.height(wrapper.height() - vertPad);
                        input.width(wrapper.width() - horizPad);
                        setTimeout(function () {
                            if (isNaN(+input.val())) {
                                input.val('');
                            }
                        }, 0);
                    }
                };
            },
            'unedit': function (wrapper) {
                return parseFloat(wrapper.children().val());
            }
        }
    }
    , columnBuilder = function () {
        var t = $(this).text()
        , f = +t
        , d = new Date(t)
        , spec = $(this).attr('data-type')
        ;
        if (spec) {
            var data = $(this).data()
            , t = { 'type': spec, 'options': {} }
            ;
            for (var i in data) {
                t.options[i] = data[i];
            }
            return t;
        } else if (!isNaN(d.getTime()) && isNaN(f)) {
            return { 'type': 'date' };
        } else if (!isNaN(f)) {
            return { 'type': 'number' };
        } else {
            return { 'type': 'text' };
        }
    };
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
        _create: function () {
            var grijq = this
              , minWidth = 1 //ie? 1 : 0
              , iefocus = null
              , origTableWidth = 0
              , getCol = function (offset, table) {
                  offset = offset || 0;
                  var index = $(this).attr('data-index');
                  if (!index) {
                      index = parseInt($(this).parents('[data-index]').attr('data-index'));
                  }
                  return $($('col', table).get(index - offset));
              }
            ;
            if (grijq.element.length === 0) {
                return;
            }

            grijq.cols = grijq.element.children('colgroup').children();
            grijq.cols.each(function (i) {

                        // Set the initial table width based on the individual column widths
                        // this is done to handle column resize issues while dragging.
                        origTableWidth += parseInt(this.width, 10);

                        // Handle column visibility event
                        $(this).on('hidden', function (e,value) {
                            var column = $(this);                        
                            var index = column.prevAll().length +1;
                            var headerColumn = $(grijq.head.find('tr th:nth-child('+(index)+')'));
                            var columnsCells = $(grijq.body.find('tr td:nth-child('+(index)+')'));
                            if(value){
                                headerColumn.hide();                                  
                                columnsCells.hide();                                
                            } 
                            else{
                                    headerColumn.show();   
                                    columnsCells.show();    
                                    
                                    // re-layout the table in IE to handle column and table width resize issues
                                    if(ie){                                    
                                        setTimeout(function() {
                                            var display = grijq.element.css('display');
                                            grijq.element.css('display', '');
                                            setTimeout(function() {
                                                    grijq.element.css('display', display);
                                            }, 0);
                                        }, 0);                                                                                
                                    }                               
                            }    

                            // re-set table width to match hidden columns                             
                            var newTableWidth =grijq.head.width(); 
                            grijq.element.prop('width', newTableWidth);
                            grijq.element.css('width', newTableWidth);                                  
                        });
            });
            
            grijq.element.prop('width', origTableWidth);            
            grijq.scroller = $('<div class="ui-grijq-scroll"></div>');
            grijq.wudget = $('<div class="ui-grijq"></div>').append(grijq.scroller);
            grijq.element
                .addClass('ui-widget')
                .after(grijq.wudget)
                .children('thead')
                .addClass('ui-widget-header ui-state-default')
                .children()
                .first('tr')
                .find('th')
                    .append('<span id="sortImg" class="ui-grijq-sort"></span>')
                    .append(ie ? '<span class="mover ie">.</span>' : '<span class="mover">.</span>')
                    .wrapInner('<div style="float:left;"></div>')
                    .end();
            grijq.head = grijq.element.children('thead');
            grijq.body = grijq.element.children('tbody');

            if (!grijq.options.hasDivs) {
                $('td', grijq.element).wrapInner('<div></div>');
            }
            if (ie) {
                var dom = grijq.element.get(0);
                dom.style.display = 'none';
                grijq.element.appendTo(grijq.scroller);
                dom.style.display = '';
            }
            else {
                grijq.element.appendTo(grijq.scroller);
            }            
            for (var key in editors) {
                if (typeof grijq.options.editors[key] === 'undefined') {
                    grijq.options.editors[key] = editors[key];
                }
            }
            grijq.scroller
                .height(this.options.height)
                .scroll(function () {
                    grijq.head.css('left', -grijq.scroller.scrollLeft() - 1);
                });
            grijq.element
                    .on('focus', 'td', function (e) {
                        var cell = $(e.target).closest('td');
                        var row = cell.parent();
                        if (cell.next().length === 0) {
                            var nextRow = row.next();
                            nextRow.children().prop('tabindex', '0');
                        }
                        else if (cell.prev().length === 0) {
                            var previousRow = row.prev();
                            previousRow.children().prop('tabindex', '0');
                        }
                        if (grijq['selectedCell']
                                && grijq['selectedCell'].length
                                && cell.length
                                && grijq['selectedCell'][0] === cell[0]) {
                            return;
                        }
                        grijq._clearSelection();
                        var oldrow = grijq['selectedRow'];
                        grijq['selectedRow'] = row.addClass('ui-state-default');
                        if (typeof oldrow === 'undefined' || oldrow === null || oldrow.get(0) !== row.get(0)) {
                            grijq._trigger('rowselected', null, { row: row });
                            cell.parent().children().prop('tabindex', '0');
                        }
                        grijq['selectedCell'] = cell.addClass('ui-state-active');
                        if (ie) {
                            clearTimeout(iefocus);
                            iefocus = setTimeout(function () { cell.focus(); }, 200);
                        }
                    })                   
                    .click(function (e) {
                                    if (ie) {
                                        return;
                                    }
                                    var cell = $(e.target).closest('td');
                                    if (grijq['selectedCell']
                                            && grijq['selectedCell'].length
                                            && cell.length
                                            && grijq['selectedCell'][0] === cell[0]) {
                                        return;
                                    }
                                    cell.parent().children().prop('tabindex', '0');
                                    grijq._clearSelection();
                                    grijq['selectedCell'] = cell.trigger('focus');
                                })
                    .dblclick(function (e) {
                                    clearTimeout(iefocus);
                                    var target = $(e.target).closest('td');
                                    if (grijq.options.readonly
                                            || editing || target.hasClass('readonly')
                                            || target.parent().hasClass('readonly')) {
                                        return;
                                    }
                                    grijq._edit(target);
                                })
            ;

            if (grijq.options.width !== 'auto') {
                grijq.scroller.css('max-width', parseInt(grijq.options.width));
                grijq.wudget.css('max-width', parseInt(grijq.options.width));
            }

            $('th', grijq.head)
                    .addClass('unselectable')
                    .click(function (e) {
                        e.stopPropagation();
                        var index = $(this).prevAll().length;
                        var col = $(grijq.cols.get(index));
                        grijq._clearSelection();
                        grijq['selectedHeader'] = $(this).addClass('ui-state-active');
                        col.addClass('ui-state-default');
                        var colHeaderSortable = $(e.target).closest('th').data('sortable');
                        if (colHeaderSortable) {
                            grijq._sortCol($(this));
                        }
                        grijq['selectedColumn'] = col;
                    })
                    .dblclick(function (e) {
                        e.preventDefault();
                        return false;
                    })
                    .each(function (i) {
                        var $this = $(this);
                        var pad = parseInt($this.css('padding-left')) +
                        parseInt($this.css('padding-right'));
                        $(this)
                        .attr('data-index', i)
                        .width(+$(grijq.cols[i]).prop('width') - 1 - pad);
                    })
            ;

            $('.mover', grijq.head).draggable({
                axis: 'x',
                helper: function () {
                    grijq.wudget.append(grijq.columnResizer);
                    grijq.columnResizer.height(grijq.wudget.height() - 16).css('z-index', 1000);
                    return grijq.columnResizer.show()[0];
                },
                stop: function (event, ui) {
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

            grijq.columnResizer = $('<div class="resizer"></div>');

            grijq.element.keydown(function (e) {
                var target = $(e.target);
                switch (e.keyCode) {
                    case $.ui.keyCode.TAB:
                        var td = target.closest('td');
                        if (!e.shiftKey
                            && (e.target.nodeName.toLowerCase() === 'td'
                                        || (editing && td.next().length === 0))
                            && typeof grijq.options.newrow === 'function'
                            && td.next().length === 0
                            && td.parent().next().length === 0) {
                            grijq.options.newrow();
                            td.parent().next().children().prop('tabindex', 0);
                        }
                        break;
                    case $.ui.keyCode.LEFT:
                        if (editing) {
                            return;
                        }
                        target.prev().focus();
                        e.preventDefault();
                        break;
                    case $.ui.keyCode.RIGHT:
                        if (editing) {
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
                        if (editing) {
                            return;
                        }
                        grijq._trigger('editcomplete', null, { val: null, cell: grijq['selectedCell'] });
                        break;
                    case $.ui.keyCode.ESCAPE:
                        if (!editing || !grijq['currentEditor']) {
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
                        if (grijq.options.readonly || editing || e.ctrlKey || e.metaKey
                            || target.hasClass('readonly') || target.parent().hasClass('readonly')) {
                            return;
                        }
                        if ((e.keyCode >= A && e.keyCode <= Z) || (e.keyCode >= ZERO && e.keyCode <= NINE)
                            || (e.keyCode >= NUM_ZERO && e.keyCode <= NUM_NINE) || e.keyCode === DOT
                            || e.keyCode === NUM_DOT || e.keyCode === F2) {
                            grijq._edit(target.closest('td'));
                        }
                        break;
                }
            });

            if (grijq.options.columns.length === 0) {
                $('tr', grijq.head).last().children().each(function () {
                    grijq.options.columns.push(columnBuilder.apply(this));
                });
            }

            grijq.scroller.css('margin-top', grijq.head.height());
            $('<style type="text/css">.ui-grijq .ui-grijq-scroll .ui-widget td {margin-top: '
                + grijq.head.height() + 'px;}</style>')
                        .appendTo(document.head);
            $('<input style="position: absolute; top: -10000px; left: -10000px;">')
                        .appendTo(grijq.scroller);
        },
        _sortCol: function (column) {
            var direction = 'asc';
            var index = column.prevAll().length;
            var columnSpan = column.find('span#sortImg');

            if (columnSpan.hasClass('ui-icon ui-icon-triangle-1-n')) {
                direction = 'desc';
                this._resetSort(column);
                columnSpan.addClass('ui-icon ui-icon-triangle-1-s');
            }
            else if (columnSpan.hasClass('ui-icon ui-icon-triangle-1-s')) {
                this._resetSort(column);
                columnSpan.addClass('ui-icon ui-icon-triangle-1-n');
            }
            else {
                this._resetSort(column);
                columnSpan.addClass('ui-icon ui-icon-triangle-1-n');
            }

            var cell = $(this.body.find('tr:first-child').children()[index]);
            this._trigger('sort', null, { header: column, cell: cell, index: index, direction: direction });
        },
        _resetSort: function (column) {
            $(column).parent().children().find('span#sortImg')
            .removeClass('ui-icon ui-icon-triangle-1-n')
            .removeClass('ui-icon ui-icon-triangle-1-s');
        },
        selectLastRow: function () {
            var cell = this.element.find('tr').last().children().first();
            if (this['selectedCell'] && this['selectedCell'].length
                    && cell.length && this['selectedCell'][0] === cell[0]) {
                return;
            }
            cell.parent().children().prop('tabindex', '0');
            this._clearSelection();
            this['selectedCell'] = cell.trigger('focus');
        },
        _clearSelection: function () {
            if (this['selectedColumn']) {
                this['selectedHeader'].removeClass('ui-state-active');
                this['selectedColumn'].removeClass('ui-state-default');
            }
            if (this['currentEditor']) {
                var value = this._unedit();
                this._trigger('editcomplete', null, { val: value, cell: this['selectedCell'] });
            }
            if (this['selectedRow']) {
                this['selectedRow'].removeClass('ui-state-default');
            }
            if (this['selectedCell']) {
                this['selectedCell'].removeClass('ui-state-active');
            }
        },
        _edit: function (target) {
            var index = target.prevAll().length
            , value = target.children().first().text()
            , editorSpec = this.options.columns[index]
            ;
            this['currentEditor'] = this.options.editors[editorSpec['type']]
            var editor = this['currentEditor'].edit(value, editorSpec['options'])
            this['currentEditorEl'] = editor.element || editor
            editing = true;
            this['currentEditorEl']
            .width(target.outerWidth() - parseInt(target.css('border-right')))
            .height(target.outerHeight() - parseInt(target.css('border-bottom')));
            target.addClass('editing').children().hide();
            target.append(this['currentEditorEl']);
            if (typeof editor.afterAppend == 'function') {
                editor.afterAppend();
            }
        },
        _unedit: function () {
            editing = false;
            var target = this['selectedCell'];
            if (!target) {
                return;
            }
            target.removeClass('editing');
            this['currentEditorEl'].remove();
            var value = this['currentEditor'].unedit(this['currentEditorEl']);
            this['currentEditor'] = null;
            this['currentEditorEl'] = null;
            target.children().show();
            return value;
        },
        _setOption: function (key, value) {
            this._super();
            if (key === 'height') {
                this.options.height = value === 'auto' ? value : parseInt(value) - 25;
                this.scroller.height(this.options.height);
            } else if (key === 'width') {
                this.options.width = value === 'auto' ? value : parseInt(value);
                value = this.options.width === 'auto' ? '' : value + 'px';
                this.scroller.css('max-width', value);
                this.wudget.css('max-width', value);
            } else if (key === 'readonly') {
                this.options.width = !!value;
                if (value) {
                    this.element.addClass('ui-state-disabled');
                } else {
                    this.element.removeClass('ui-state-disabled');
                }
            } else if (key === 'columns') {
                this.options.columns = value;
            }
        },
        _init: function () {
        },
        _destroy: function() {
			var grijq = this
			  , element = grijq.element
			  , wudget = element.closest('.ui-grijq')
			  ;
			element.unbind();
			$('th', grijq.head).unbind('click');
			wudget
				.after(element)
				.remove();
			
			element
				.find('span')
					.remove()
				.end()
				.removeClass('ui-widget')
				.find('thead').removeClass('ui-widget-header ui-state-default');
		}
  });
})(jQuery);
