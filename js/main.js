require(['data'], function(loadData) {
  var ops = {
    '=': function(a, b) { return a === b; },
    '<': function(a, b) { return a <= b; },
    '>': function(a, b) { return a > b; }
  };
  var sortProgression = {
    'none': 'asc',
    'asc': 'desc',
    'desc': 'none'
  };

  function getData() {
    return loadData();
  }

  function Page() {
    this.sections = ko.observable();
  }
  Page.prototype.load = function() {
    var self = this;
    getData().then(function(sects){
      self.sections(_.map(sects, function(d) {
        return new Section(d);
      }));
    });
  };

  function Section(s) {
    _.assign(this, s);

    this.attrFilters = _.transform(this.headers, function(r, h) {
      r[h] = ko.observable('');
    }, {});
    this.nameFilter = ko.observable('');

    this.sortKey = ko.observable('name');
    this.sortDir = ko.observable('asc');

    this.filteredItems = ko.computed(function() {
      var fs = _.mapValues(this.attrFilters, _.flow(ko.unwrap, _.method('toLowerCase')));
      var nf = this.nameFilter().toLowerCase();

      return this.items.filter(function(i) {
        var attrMatch = _.all(fs, function(f, k) {
          return filterMatch(f, i.attrs[k]);
        });

        var nameMatch = filterMatch(nf, i.title);

        return nameMatch && attrMatch;
      });
    }, this);

    this.sortedFilteredItems = ko.computed(function() {
      var key = this.sortKey();
      var dir = this.sortDir();
      var items = this.filteredItems();
      if (dir == 'none') {
        return items;
      }
      return _.sortByOrder(items, [key == 'name' ? 'Name' : 'attrs.'+key], [dir]);
    }, this);
  }

  Section.prototype.clickSort = function(k) {
    if (k == this.sortKey()) {
      this.sortDir(sortProgression[this.sortDir()]);
    } else {
      this.sortKey(k);
      this.sortDir('asc');
    }
  };

  function filterMatch(filter, value) {
    if (!filter.length) {
      return true;
    }
    if (_.isUndefined(value)) {
      return false;
    }
    if (value == '-' || value == '—' || value == '–' || value == '—') {
      value = 0;
    }
    if (_.isNumber(value)) {
      var op = '=';
      if (filter[0] in ops) {
        op = filter[0];
        filter = filter.substr(1);
      }
      filter = parseInt(filter);
      return !_.isNaN(filter) && ops[op](value, filter);
    }
    return value.toLowerCase().indexOf(filter) != -1;
  }


  var page = window.page = new Page();
  ko.applyBindings(page);
  page.load();
});