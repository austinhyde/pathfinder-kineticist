define([], function() {

  function load() {
    return $.get('pfsrd_dump.html').then(function(d){ return $(d); });
  }

  function section($els) {
    return $els.filter('h3').map(function(i) {
      var $h3 = $(this);
      var items = $h3.nextUntil('h3', 'div[style]').map(function() {
        return listing($(this).children());
      }).get();
      var headers = _.chain(items)
          .map(function(i) { return _.keys(i.attrs); })
          .flatten()
          .unique()
          .value();

      items.forEach(function(i) {
        i.attrs = _.defaults(_.object(headers), i.attrs);
      });
      return {
        title: $h3.text(),
        items: items,
        headers: headers
      };
    }).get();
  }

  function listing($els) {
    return $els.filter('h4').map(function(){
      var $this = $(this);
      var item = parseItem($this.nextUntil('h4'));
      return {
        title: $this.text(),
        attrs: _.omit(item, 'Description'),
        desc: item.Description || ''
      };
    }).get();
  }

  function parseItem($els) {
    var attrs = $els.filter('p').map(function(){
      var $p = $(this);
      if ($p.children().first().is('b')) {
        return parseAttrs($p.children());
      } else {
        return [{name: 'Description', value: $p.html()}];
      }
    }).get();

    return _.reduce(attrs, function(o, a) {
      if (a.name in o) {
        o[a.name] += '<br><br>' + a.value;
      } else {
        o[a.name] = a.value;
      }
      return o;
    }, {});
  }

  function parseAttrs($contents) {
    return $contents.filter('b').map(function() {
      return {
        name: this.innerText,
        value: parseAttrValue(this.nextSibling)
      };
    }).get();
  }

  function parseAttrValue(node) {
    var value = '';
    while (node && node.nodeName != 'B') {
      switch (node.nodeType) {
        case 1:
          value += node.outerHTML;
          break;
        case 3:
          value += node.nodeValue;
          break;
      }
      node = node.nextSibling;
    }

    value = value.replace(/(^:? +)|(;? +$)/g, '');

    var v;
    if (!_.isNaN(v = parseInt(value))) {
      return v;
    }

    if (v == String.fromCharCode(8212) || v == "—") {
      return 0;
    }

    return value;
  }

  return function() {
    return load().then(section);
  };
});