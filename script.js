/*************************************
UTILITIES
*************************************/
// custom event polyfill
(function () {
  if (typeof window.CustomEvent === 'function') return false;

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

// create optimized scrolling event
(function () {
  const throttle = function (type, name, obj) {
    obj = obj || window;
    let running = false;
    const func = function () {
      if (running) {return;}
      running = true;
      requestAnimationFrame(() => {
        obj.dispatchEvent(new CustomEvent(name));
        running = false;
      });
    };
    obj.addEventListener(type, func);
  };

  /* init - you can init any event */
  throttle('scroll', 'optimizedScroll');
})();

const getScrollXY = () => {
  let scrOfX = 0;
  let scrOfY = 0;
  if (typeof window.pageYOffset === 'number') {
    // Netscape compliant
    scrOfY = window.pageYOffset;
    scrOfX = window.pageXOffset;
  } else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
    // DOM compliant
    scrOfY = document.body.scrollTop;
    scrOfX = document.body.scrollLeft;
  } else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
    // IE6 standards compliant mode
    scrOfY = document.documentElement.scrollTop;
    scrOfX = document.documentElement.scrollLeft;
  }
  return [scrOfX, scrOfY];
};

const getDocHeight = () => {
  const D = document;
  return Math.max(
  D.body.scrollHeight, D.documentElement.scrollHeight,
  D.body.offsetHeight, D.documentElement.offsetHeight,
  D.body.clientHeight, D.documentElement.clientHeight);

};

const isScrollBottom = (tolerance = 0) => {
  return getDocHeight() < getScrollXY()[1] + window.innerHeight + tolerance;
};

function shuffle(a) {
  let b = [...a];
  for (let i = b.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [b[i - 1], b[j]] = [b[j], b[i - 1]];
  }
  return b;
}

/*************************************
COMPONENT: FILTERED GRID
*************************************/
const filteredGrid = {
  props: {
    items: {
      type: Array,
      required: true },

    emptyResult: {
      type: Object,
      required: true },

    query: {
      type: String,
      default: '' },

    filter: {
      type: String,
      default: '' },

    queryBy: {
      type: String,
      default: '' },

    filterBy: {
      type: String,
      default: '' },

    numResults: {
      type: Number,
      default: 6 },

    initNumResults: {
      type: Number,
      default: 6 },

    numCols: {
      type: Number,
      default: 1 },

    infiniteDistance: {
      type: Number,
      default: 600 } },


  computed: {
    results: function () {
      const _results = this.items.filter(i => {
        return (
          (!this.queryBy ||
          i[this.queryBy].toLowerCase().indexOf(this.query.toLowerCase()) !== -1) && (
          !this.filterBy ||
          i[this.filterBy].indexOf(this.filter) !== -1 || this.filter === ''));

      }).slice(0, this.numResults);
      return _results.length > 0 ? _results : this.emptyResult;
    } },

  watch: {
    query: function (val, oldVal) {
      this.numResults = this.initNumResults;
    },
    filter: function (val, oldVal) {
      this.numResults = this.initNumResults;
    } },

  created: function () {
    window.addEventListener('optimizedScroll', () => {
      if (isScrollBottom(this.infiniteDistance) && this.numResults < this.items.length) {
        this.numResults += this.numCols;
      }
    });
  },
  template: `<transition-group
    tag="ul"
    name="gsf-filtered-grid"
    class="gsf-filtered-grid">
    <slot v-for="i in results"
      v-bind:data="i"
      v-bind:last="results.indexOf(i) === results.length - 1"
      v-bind:card-width="numCols === 1 ? '100%' : ((100/numCols) - 1.5) + '%'">
    </slot>
  </transition-group>` };


/*************************************
COMPONENT: FILTER LIST
*************************************/
const filterList = {
  props: {
    activeFilter: {
      type: String,
      default: '' },

    allText: {
      type: String,
      default: 'All' },

    backdrop: {
      type: Boolean,
      default: true },

    drawerOpen: {
      type: Boolean,
      default: false },

    filters: {
      type: Array,
      required: true },

    onChange: {
      type: Function,
      required: true } },


  methods: {
    toggleDrawer: function (bool) {
      this.drawerOpen = bool;
    } },

  watch: {
    activeFilter: function (val, oldVal) {
      this.drawerOpen = false;
    } },

  template: `<div class="gsf-filters" v-bind:class="{'gsf-filters-backdrop': backdrop, 'gsf-mobile-filters-open': drawerOpen}">
    <a v-on:click="toggleDrawer(!drawerOpen)" class="gsf-mobile-filters-drawer">
      <span class="gsf-mobile-filters-heading">Filter</span>
      <span class="gsf-mobile-filters-selected">{{ activeFilter === '' ? allText : activeFilter }}</span>
    </a>
    <div class="gsf-filter-list-wrap">
      <ul class="gsf-filter-list">
        <li><a
          v-bind:class="{'gsf-filter-active': activeFilter === ''}"
          v-on:click="onChange('')"><span>{{allText}}</span></a></li>
        <li v-for="filter in filters"><a
          v-bind:class="{'gsf-filter-active': activeFilter === filter}"
          v-on:click="onChange(filter)"><span>{{filter}}</span></a></li>
      </ul>
    </div>
  </div>` };


/*************************************
COMPONENT: CAREER LISTING
*************************************/
const careerListing = {
  props: {
    cardWidth: {
      type: String,
      default: '100%' },

    data: {
      type: Object,
      required: true },

    last: {
      type: Boolean,
      default: false } },


  template: `<li class="gsf-career-listing" v-bind:class="{'gsf-career-listing-last': last}" v-bind:style="{width: cardWidth}">
    <a class="gsf-career-listing-inner" v-bind:href="data.url">
      <h2 class="gsf-career-title" v-html="data.title"></h2>
      <p class="gsf-career-description" v-html="data.summary"></p>
    </a>
  </li>` };


/*************************************
MAIN
*************************************/
const careers = {
  components: {
    'filtered-grid': filteredGrid,
    'filter-list': filterList,
    'career-listing': careerListing },

  props: {
    listings: {
      type: Array,
      required: true },

    categories: {
      type: Array,
      required: true } },


  data: () => ({
    activeCategory: '',
    noListings: [{
      id: -1,
      title: 'There are no current career listings that match your criteria.',
      summary: '' }] }),


  methods: {
    setCategory: function (cat) {
      this.activeCategory = cat;
    } },

  template: `<div class="careers-main">
    <filter-list
      allText="All Jobs"
      v-bind:backdrop="false"
      v-bind:filters="categories"
      v-bind:active-filter="activeCategory"
      v-bind:on-change="setCategory" />
    <filtered-grid
      filter-by="categories"
      v-bind:items="listings"
      v-bind:filter="activeCategory"
      v-bind:empty-result="noListings">
      <template scope="props">
        <career-listing
          v-bind:data="props.data"
          v-bind:key="props.data.id"
          v-bind:card-width="props.cardWidth"
          v-bind:last="props.last"/>
      </template>
    </filtered-grid>
  </div>` };


/*************************************
GET DATA AND MOUNT
*************************************/
const careerListings = document.getElementById('career-listings');
const listingData = JSON.parse(careerListings.getAttribute('data-listings'));
const categoryData = JSON.parse(careerListings.getAttribute('data-categories'));

new Vue({
  el: '#career-listings',
  render: function (createElement) {
    return createElement(careers, {
      props: {
        listings: listingData.
        map((e, i) => {
          return {
            id: i,
            title: e.title,
            summary: e.summary,
            url: e.url,
            categories: e.categories };

        }),
        categories: categoryData } });


  } });