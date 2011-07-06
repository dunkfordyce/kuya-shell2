
function FakeInput($el, options) { 
    this.$el = $el;
    this.options = options || {};
    this._val = '';
    this._selectionStart = -1;
    this.init();
    this.refresh();
}
FakeInput.prototype.init = function() {
    var self = this;
    console.log('init');
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
        .keyup(refresh)
        .focus(refresh)
        .change(refresh)
    );
};
FakeInput.prototype.render = function() { 
    FakeInput.prototype.render = _.template(this.options.template || $('#template-fakeinput').text()).bind(undefined, this);
    return this.render();
};
FakeInput.prototype.refresh = function(e) { 
    var v = this.$input.val();
    var s = this.$input[0].selectionStart;
    v = v.substring(0, s) + '\uFEFF' + v.substring(s);
    if( this.options.parse ) { v = this.options.parse(v); }
    else { v = v.replace(' ', '&nbsp;', 'g'); }
    v = v.replace('\uFEFF', '<span id="cursor-start"></span>');
    if( v !== this._val ) { 
        this._val = v;
        this.$output.html( v );
    }
    if( s !== this._selectionStart ) { 
        this._selectionStart = s;
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
