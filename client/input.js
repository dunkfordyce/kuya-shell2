var _ = require('underscore'),
    $ = require('jquery-browserify');

var CURSOR = '\uFEFF';

function FakeInput($el, options) { 
    this.$el = $el;
    this.options = options || {};
    this.options.cursor = this.options.cursor || CURSOR;
    this._val = '';
    this._selectionStart = -1;
    this.init();
    this.refresh();
}
FakeInput.prototype.init = function() {
    var self = this;
    (this.$el
        .html(this.render())
        .css({
            zIndex: 10
        })
        .click(function(e) { 
            self.$input.focus();
        })
    );
    this.$output = this.$el.find('#cli');
    this.$wrapper = this.$el.find('#cli-wrapper');
    var p = this.$output.position();
    console.log(p);
    this.$cursor = this.$el.find('#cli-cursor');

    var refresh = this.refresh.bind(this);

    this.$input = ($('<input type="text"/>')
        .appendTo(this.$wrapper)
        .css({
            zIndex: 0, 
            width: 2, 
            height: 2,
            position: 'absolute',
            left: p.left,
            top: p.top,
            opacity: 0
        })
        .keyup(function(e) { 
            if( e.which == 13 && self.options.onenter ) { 
                self.options.onenter.call(self, e, self.val());
            } else {
                refresh();
            }
        })
        .focus(refresh)
        .change(refresh)
    );
    this.input = this.$input[0];
};
FakeInput.prototype.render = function() { 
    FakeInput.prototype.render = _.template(this.options.template || $('#template-fakeinput').text()).bind(undefined, this);
    return this.render();
};
FakeInput.prototype.refresh = function(e) { 
    var v = this.val_with_cursor();
    if( this.options.parse ) {  
        v = this.options.parse.call(this, v); 
    } else { 
        v = v.replace(' ', '&nbsp;', 'g'); 
    }
    v = v.replace(this.options.cursor, '<span id="cursor-start"></span>');
    if( v !== this._val ) { 
        this._val = v;
        this.$output.html( v );
    }
    if( this.input.selectionStart !== this._selectionStart ) { 
        this._selectionStart = this.input.selectionStart;
        var p = $('#cursor-start').position();
        if( p ) { 
            this.$cursor.css({
                left: p.left
            });
        }
    }
};
FakeInput.prototype.input = function() { 
    return this.$input;
};
FakeInput.prototype.val = function(arg) { 
    if( arguments.length ) { 
        this.$input.val(arg);
        this.refresh();
        return this;
    } else {
        return this.$input.val();
    }
};
FakeInput.prototype.val_with_cursor = function() { 
    var v = this.$input.val(),
        s = this.input.selectionStart;
    return v.substring(0, s) + this.options.cursor + v.substring(s);
};
FakeInput.prototype.contains_cursor = function(s) { return s.indexOf(this.options.cursor) !== -1; }
FakeInput.prototype.end = function() { 
    return this.$el;
};

$.fn.fakeinput = function(opts_or_command) { 
    var $this = $(this),
        interf = $this.data('fakeinput');
    if( !interf ) { 
        interf = new FakeInput($(this), opts_or_command);
        $this.data('fakeinput', interf);
        return this;
    }
    var args = Array.prototype.slice.call(this, 1);
    return interf[opts_or_command].call(interf, args);
};
