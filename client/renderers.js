var O = require('kuya-O'),
    _ = require('underscore'),
    $ = require('jquery-browserify');

exports.Renderers = {
    create: function(initial) { 
        return O.spawn(this, {modes: {}}).extend(initial);
    },
    get: function(mode) { 
        var r = this.modes[mode];
        if( !r ) { throw new Error('no such mode "'+mode+'"'); }
        return r;
    },
    add: function(mode, func) { 
        this.modes[mode] = func;
        return this;
    },
    extend: function(more) { 
        var self = this;
        _.each(more, function(func, mode) { self.add(mode, func); });
        return this;
    }
};

exports.register_templates = function() {
    $('script[type=text/html][data-template-for]').each(function() { 
        var $script = $(this),
            cls_name = $script.data('template-for'),
            cls = O.default_registry.get(cls_name),
            mode = $script.data('template-mode'),
            template = _.template($script.text());   
        //console.log($script, cls_name, cls, mode, template);
        cls.renderers.add(mode, function() { return template(this); });
    });
};
