var dbslice = (function (exports) {
	'use strict';

	var dbsliceData = {
	  data: undefined,
	  files: [],
	  session: {},
	  merging: {}
	}; // dbsliceData

	function _typeof(obj) {
	  "@babel/helpers - typeof";

	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof = function (obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof = function (obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof(obj);
	}

	function _classCallCheck(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  return Constructor;
	}

	function _inherits(subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function");
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) _setPrototypeOf(subClass, superClass);
	}

	function _getPrototypeOf(o) {
	  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
	    return o.__proto__ || Object.getPrototypeOf(o);
	  };
	  return _getPrototypeOf(o);
	}

	function _setPrototypeOf(o, p) {
	  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
	    o.__proto__ = p;
	    return o;
	  };

	  return _setPrototypeOf(o, p);
	}

	function _isNativeReflectConstruct() {
	  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
	  if (Reflect.construct.sham) return false;
	  if (typeof Proxy === "function") return true;

	  try {
	    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
	    return true;
	  } catch (e) {
	    return false;
	  }
	}

	function _assertThisInitialized(self) {
	  if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return self;
	}

	function _possibleConstructorReturn(self, call) {
	  if (call && (typeof call === "object" || typeof call === "function")) {
	    return call;
	  }

	  return _assertThisInitialized(self);
	}

	function _createSuper(Derived) {
	  var hasNativeReflectConstruct = _isNativeReflectConstruct();

	  return function _createSuperInternal() {
	    var Super = _getPrototypeOf(Derived),
	        result;

	    if (hasNativeReflectConstruct) {
	      var NewTarget = _getPrototypeOf(this).constructor;

	      result = Reflect.construct(Super, arguments, NewTarget);
	    } else {
	      result = Super.apply(this, arguments);
	    }

	    return _possibleConstructorReturn(this, result);
	  };
	}

	function _toConsumableArray(arr) {
	  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
	}

	function _arrayWithoutHoles(arr) {
	  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}

	function _iterableToArray(iter) {
	  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
	}

	function _unsupportedIterableToArray(o, minLen) {
	  if (!o) return;
	  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
	  var n = Object.prototype.toString.call(o).slice(8, -1);
	  if (n === "Object" && o.constructor) n = o.constructor.name;
	  if (n === "Map" || n === "Set") return Array.from(o);
	  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}

	function _arrayLikeToArray(arr, len) {
	  if (len == null || len > arr.length) len = arr.length;

	  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

	  return arr2;
	}

	function _nonIterableSpread() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}

	var color = {
	  // The color controls should probably be moved to a single location, i.e. a single button on a toolbar somewhere. Maybe create a floating top toolbat to control all general behaviour.
	  // To perform the task it seems it is the simplest if this variable holds the color palette for all other plots to share. The color change effects need then only change the color palette here. Specifically: this palette will replace ctrl.tools.cscale.
	  defaultPalette: function defaultPalette() {
	    return "cornflowerblue";
	  },
	  // defaultPalette
	  colorPalette: d3.scaleOrdinal(d3.schemeDark2),
	  // colorPalette
	  togglePalette: function togglePalette(varName) {
	    // Setup the color function.
	    if (color.settings.scheme == undefined) {
	      // Color scale is set to the default. Initialise a color scale.
	      // The default behaviour of d3 color scales is that they extend the domain as new items are passed to it. Even if the domain is fixed upfront, the scale will extend its domain when new elements are presented to it.
	      color.settings.scheme = "color";
	      color.settings.variable = varName;
	    } else if (color.settings.variable != varName) {
	      // The color metadata option has changed. Clear the scale domain so that the scale will be used with the new parameter.
	      color.colorPalette.domain([]);
	      color.settings.variable = varName;
	    } else {
	      // The same color option has been selected - return to the default color options.
	      color.settings.scheme = undefined;
	      color.settings.variable = undefined;
	      color.colorPalette.domain([]);
	    } // if

	  },
	  // togglePalette
	  // settings holds the flag for the scheme to use, and the variable it is supposed to be used with. 
	  settings: {
	    name: "Colour",
	    scheme: undefined,
	    val: undefined,
	    options: undefined,
	    event: function event(ctrl, varName) {
	      // The on-click functionality takes care of the options that are specific to an individual plot. Coloring is cross plot, and therefore must coordinate the menus of several plots. This is done here.
	      // Update the plot ctrls
	      toggleAllColorSubmenuItems(); // If a color option is defined, and this is the option corresponding to it, then make it active.

	      color.togglePalette(varName); // do the render so that all plots are updated with the color.

	      sessionManager.render();

	      function toggleAllColorSubmenuItems() {
	        dbsliceData.session.plotRows.forEach(function (plotRow) {
	          plotRow.plots.forEach(function (plot) {
	            if (plot.view.cVarOption != undefined) {
	              // Adjust the plot color value
	              plot.view.cVarOption.val = varName; // Toggle the html options

	              plot.figure.select("div.bottomLeftControlGroup").selectAll("p.submenu-toggle").each(function () {
	                if (this.innerHTML == "Colour") {
	                  // Color submenu to be adjusted.
	                  d3.select(this.parentElement).selectAll("a.submenu-item").each(function () {
	                    if (this.innerHTML == varName) {
	                      this.classList.replace("deselected", "selected");
	                    } else {
	                      this.classList.replace("selected", "deselected");
	                    } // if

	                  }); // each
	                } // if

	              }); // each
	            } // if

	          }); // forEach
	        }); // forEach
	      } // toggleAllColorSubmenuItems

	    } // event

	  },
	  get: function get(key) {
	    // Coloring is expected to be done on the categorical variable key basis.
	    // Perform any input check on the input key, and return the appropriate color code. So that the colors don't baloon out of control?
	    var palette = color.defaultPalette;
	    var colorIsChosen = color.settings.scheme != undefined;
	    var keyIsValid = color.settings.val == undefined ? false : dbsliceData.data.categoricalUniqueValues[color.settings.val].includes(key);

	    if (colorIsChosen && keyIsValid) {
	      palette = color.colorPalette;
	    } // if			


	    return palette(key);
	  } // get

	}; // crossPlotColoring

	var crossPlotHighlighting = {
	  on: function on(d, sourcePlotName) {
	    // Functionality:
	    //    - highlight points in scatter plots on other plots too on mouseover.
	    //    - same for bar plots and histograms?
	    // The input is a data object. For scatter plots this is the entire line from metadata.csv corresponding to a particular point.
	    // For this datapoint find all other plots that might be interesting, determine what they are plotting, and which variables they are using, collect the elements belonging to the particular datapoint, and highlight it by updating it's style.
	    // First go through all plot rows to see if there are data.
	    // Note that different functionality must be allowed for different source and target plots. For each of the available plot types (bar, histogram, scatter, line, contour) for which the on-mouseover effects are required a different functionality might be needed.
	    // Find all the data that needs to be highlighted.
	    var allDataPoints = crossPlotHighlighting.helpers.findAllData(d, sourcePlotName);
	    dbsliceData.session.plotRows.forEach(function (plotRow) {
	      // If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
	      plotRow.plots.forEach(function (plotCtrl) {
	        // First all the elements need to be unhiglighted.
	        // crossPlotHighlighting.helpers.unHighlightAll(plotDOM, plot);
	        plotCtrl.plotFunc.helpers.unhighlight(plotCtrl); // Now highlight the needed datapoints.

	        plotCtrl.plotFunc.helpers.highlight(plotCtrl, allDataPoints);
	      }); // each
	    }); // forEach
	  },
	  // on
	  off: function off(d, sourcePlotName) {
	    dbsliceData.session.plotRows.forEach(function (plotRow) {
	      // If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
	      plotRow.plots.forEach(function (plotCtrl) {
	        plotCtrl.plotFunc.helpers.defaultStyle(plotCtrl);
	      }); // forEach
	    }); // forEach
	  },
	  // off
	  helpers: {
	    findAllData: function findAllData(d, sourcePlotName) {
	      var allDataPoints;

	      switch (sourcePlotName) {
	        case "cfD3Scatter":
	          allDataPoints = [d];
	          break;

	        case "cfD3BarChart":
	          // Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE crossfilter.filter - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
	          //var allPoints = dbsliceData.data.cf.all()
	          // This should return the data in the filter, as well as the data corresponding to the outline that has the cursor over it. It relies on the fact that when all items are in the filter the filter is in fact empty.
	          // 
	          var highlight = true;
	          var varFilter = dbsliceData.data.filterSelected[d.key];

	          if (varFilter != undefined) {
	            // FOR NOW: when mousing over rectangles that are not selected only display the data that is already in hte filter. In the future implement a preview, but to do this functionalities of all plots need to be adjusted to contain points for all tasks at all times.
	            // if:
	            // Rect not chosen, but moused over: do nothing
	            // Rect chosen,     but moused over: show data corresponding to it
	            // mouse over selected item: d.val in filter
	            // If the filter has some values then some rectangles are active! Highlight the data is the moused over rectangle is one of the active ones.
	            var filterHasValues = varFilter.length > 0;
	            var filterHasRect = varFilter.includes(d.val);

	            if (filterHasValues && filterHasRect) {
	              highlight = true;
	            } // if	

	          } // if
	          // If highlighting is desired, then find the items in hte current filter that should be highlighted. Otherwise return all the filter contents.


	          var allDataPoints = dbsliceData.data.taskDim.top(Infinity);

	          if (highlight) {
	            allDataPoints = allDataPoints.filter(function (p) {
	              return p[d.key] == d.val;
	            }); // filter
	          } // if


	          break;

	        case "cfD3Line":
	          // Collect all the relevant data points by tskId.
	          var cfDataPoints = dbsliceData.data.taskDim.top(Infinity);
	          allDataPoints = cfDataPoints.filter(function (p) {
	            return p.taskId == d.task.taskId;
	          });
	          break;

	        case "cfD3Contour2d":
	          // The relevant points are those that were passed into the cross plot highlighting.
	          allDataPoints = d;
	          break;
	      } // switch


	      return allDataPoints;
	    } // findAllData

	  },
	  // helpers
	  manuallySelectedTasks: function manuallySelectedTasks() {
	    // Loop through all the plots, and if they have a function that highlights manually selected tasks, run it.
	    dbsliceData.session.plotRows.forEach(function (plotRow) {
	      // If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
	      plotRow.plots.forEach(function (plotCtrl) {
	        // Check if manually selected tasks need to be included.
	        if (plotCtrl.plotFunc.helpers.updateManualSelections != undefined) {
	          plotCtrl.plotFunc.helpers.updateManualSelections(plotCtrl);
	        } // if

	      }); // each
	    }); // forEach
	  } // manuallySelectedTasks

	}; // crossPlotHighlighting

	var filter = {
	  remove: function remove() {
	    // Remove all filters if grouping information etc is required for the whole dataset.
	    var cf = dbsliceData.data; // Bar charts

	    Object.keys(cf.categoricalDims).forEach(function (property) {
	      cf.categoricalDims[property].filterAll();
	    }); // forEach
	    // Histograms

	    Object.keys(cf.ordinalDims).forEach(function (property) {
	      cf.ordinalDims[property].filterAll();
	    }); // forEach
	    // Plots with individual tasks.

	    cf.taskDim.filterAll();
	  },
	  // remove
	  apply: function apply() {
	    // Crossfilter works by applying the filtering operations, and then selecting the data.
	    // E.g.:
	    //
	    // var dim = dataArrayCfObject.dimension(function(d) { return d.[variable]; });
	    // dim.filter(“Design A”)
	    //
	    // This created a 'crossfilter' dimension obeject on the first line, which operates on the poperty named by the string 'variable'. his objecathen be used to perform filtering operations onthe data.
	    // On the second line a filter is added. In this case the filter selects only 'facts' (individual items of data), for which the 'variable' is equal to "Design A". The selection is applied directly on the dataArrayCfObject, so trying to retrive the top 10 data points using dataArrayCfObject.top(10) will return the first 10 points of "Design A".
	    //
	    // Thus the filters can be applied here, and will be observed in the rest of the code.
	    // UPDATE THE CROSSFILTER DATA SELECTION:
	    var cf = dbsliceData.data; // Bar charts. Maybe this should be split between two separate functions? This would also make it clearer for the user, as well as making hte object clearer. First make it work though.

	    updateBarChartFilters();
	    applyBarChartFilters(); // Histograms

	    updateHistogramChartFilters();
	    applyHistogramChartFilters(); // Manual selections - but this should happen only if the manual switch is on!! 

	    updateManualSelections();
	    applyManualSelections(); // Checking for bar charts.

	    function updateBarChartFilters() {
	      // 'updateBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. This is required as the user could select a bar, and then change variables. In this case the filter would be retained, and the variable not seen anymore, which would potentially mislead the user. Therefore it has been decided that filters should be visible at all times, and if the user desires to hide some information from the screen then they should be given the option to minimise the plot rows.
	      // 'keys' vs 'getOwnPropertyNames' returns only the enumerable properties, in this case the property 'length' of array is not returned by 'keys'.
	      var filteredVariables = Object.keys(cf.filterSelected); // Check which of the filters stored still correspond to the on screen bar charts.

	      filteredVariables.forEach(function (variable) {
	        // Loop through the bar charts to see if this variable is still on screen.
	        var isVariableActive = false;
	        dbsliceData.session.plotRows.forEach(function (plotRow) {
	          plotRow.plots.forEach(function (plot) {
	            if (plot.plotFunc.name == "cfD3BarChart") {
	              // The flag is cumulative over all the bar charts, and if it is present in any of them the variable is active. Therefore an or statement is used.
	              isVariableActive = isVariableActive || plot.view.yVarOption.val == variable;
	            } // if

	          }); // forEach
	        }); // forEach
	        // If the variable is no longer active, then remove the filter by deleting the appropriate object property.

	        if (!isVariableActive) {
	          delete cf.filterSelected[variable];
	        } // if

	      }); // forEach
	    } // updateBarChartFilters


	    function applyBarChartFilters() {
	      // 'applyBarChartFilters' applies the filters selected based on metadata variables to the crossfilter object.
	      // First deselect all filters, and then subsequently apply only those that are required.
	      // Deselect all metadata filters.
	      Object.keys(cf.categoricalDims).forEach(function (variable) {
	        cf.categoricalDims[variable].filterAll();
	      }); // forEach
	      // Apply required filters. Reselect the filtered variables, as some might have been removed.

	      var filteredVariables = Object.keys(cf.filterSelected);
	      filteredVariables.forEach(function (variable) {
	        var filterItems = cf.filterSelected[variable]; // if the filters array is empty: ie. all values are selected, then reset the dimension

	        if (filterItems.length === 0) {
	          // Reset the filter
	          cf.categoricalDims[variable].filterAll();
	        } else {
	          // Apply the filter
	          cf.categoricalDims[variable].filter(function (d) {
	            // Here d is the value of the individual task property called <variable> already.
	            return filterItems.indexOf(d) > -1;
	          }); // filter
	        }
	      }); // forEach
	    } // applyBarChartFilters
	    // Checking for histograms


	    function updateHistogramChartFilters() {
	      // 'updateBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. This is required as the user could select a bar, and then change variables. In this case the filter would be retained, and the variable not seen anymore, which would potentially mislead the user. Therefore it has been decided that filters should be visible at all times, and if the user desires to hide some information from the screen then they should be given the option to minimise the plot rows.
	      // 'keys' vs 'getOwnPropertyNames' returns only the enumerable properties, in this case the property 'length' of array is not returned by 'keys'.
	      var filteredVariables = Object.keys(cf.histogramSelectedRanges); // Check which of the filters stored still correspond to the on screen bar charts.

	      filteredVariables.forEach(function (variable) {
	        // Loop through the bar charts to see if this variable is still on screen.
	        var isVariableActive = false;
	        dbsliceData.session.plotRows.forEach(function (plotRow) {
	          plotRow.plots.forEach(function (plot) {
	            if (plot.plotFunc.name == "cfD3Histogram") {
	              // The flag is cumulative over all the bar charts, and if it is present in any of them the variable is active. Therefore an or statement is used.
	              isVariableActive = isVariableActive || plot.view.xVarOption.val == variable;
	            } // if

	          }); // forEach
	        }); // forEach
	        // If the variable is no longer active, then remove the filter by deleting the appropriate object property.

	        if (!isVariableActive) {
	          delete cf.histogramSelectedRanges[variable];
	        } // if

	      }); // forEach
	    } // updateHistogramChartFilters


	    function applyHistogramChartFilters() {
	      // 'updateApplyBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. Same logic as for the bar chart.
	      // Deselect all metadata filters.
	      Object.keys(cf.ordinalDims).forEach(function (variable) {
	        cf.ordinalDims[variable].filterAll();
	      }); // forEach
	      // Get the fitlered variables. These are selected differently than for filter deselection as an additional safety net - all filters are definitely removed this way.

	      var filteredVariables = Object.keys(cf.histogramSelectedRanges); // Apply required filters. Reselect the filtered variables, as some might have been removed.

	      filteredVariables.forEach(function (variable) {
	        var selectedRange = cf.histogramSelectedRanges[variable];

	        if (selectedRange.length !== 0) {
	          // If the selected range has some bounds prescribed attempt to apply them. Note that the filter here is NOT the array.filter, but crossfitler.dimension.fitler.
	          cf.ordinalDims[variable].filter(function (d) {
	            return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
	          }); // filter
	        }
	      }); // forEach
	    } // applyHistogramChartFilters
	    // Individual selection plots


	    function updateManualSelections() {
	      // Ensure that the manually selected points are coherent with the other filters.
	      var filterTaskIds = cf.taskDim.top(Infinity).map(function (d) {
	        return d.taskId;
	      });
	      cf.manuallySelectedTasks = cf.manuallySelectedTasks.filter(function (d) {
	        return filterTaskIds.includes(d);
	      });
	    } // updateManualSelections


	    function applyManualSelections() {
	      var isManualFilterApplied = checkIfManualFilterIsApplied();

	      if (isManualFilterApplied) {
	        var filters = cf.manuallySelectedTasks;

	        if (filters.length === 0) {
	          // if the filters array is empty: ie. all values are selected, then reset the dimension
	          cf.taskDim.filterAll();
	        } else {
	          // If there are tasks, then apply the filter.
	          cf.taskDim.filter(function (d) {
	            return filters.indexOf(d) > -1;
	          }); // filter
	        }
	      } else {
	        cf.taskDim.filterAll();
	      } // if

	    } // applyManualSelections
	    // Helpers


	    function checkIfManualFilterIsApplied() {
	      var isManualFilterApplied = false;
	      var scatterPlots = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']");

	      if (!scatterPlots.empty()) {
	        var toggle = scatterPlots.select("input[type='checkbox']");

	        if (!toggle.empty()) {
	          isManualFilterApplied = toggle.node().checked;
	        } // if

	      } // if


	      return isManualFilterApplied;
	    } // checkIfManualFilterIsApplied

	  },
	  // apply
	  addUpdateMetadataFilter: function addUpdateMetadataFilter(property, value) {
	    // Initialise filter if necessary
	    if (dbsliceData.data.filterSelected[property] === undefined) {
	      dbsliceData.data.filterSelected[property] = [];
	    } // if
	    // check if current filter is already active


	    var currentFilter = dbsliceData.data.filterSelected[property];

	    if (currentFilter.indexOf(value) !== -1) {
	      // This value is already in the filter, therefore the user decided to remove it from the filter on it's repeated selection.
	      var ind = currentFilter.indexOf(value);
	      currentFilter.splice(ind, 1);
	    } else {
	      // Filter not active, add the item to the filter.
	      currentFilter.push(value);
	    } // if

	  },
	  // addUpdateMetadataFilter
	  addUpdateDataFilter: function addUpdateDataFilter(property, limits) {
	    /*
	    var dimId = dbsliceData.data.ordinalProperties.indexOf(ctrl.view.xVarOption.val)
	    var filter = dbsliceData.data.histogramSelectedRanges[dimId]
	    if(filter !== undefined){
	    	xMin = filter[0]
	    	xMax = filter[1]
	    } else {
	    	dbsliceData.data.histogramSelectedRanges[dimId] = [xMin, xMax]
	    } // if
	    */
	    dbsliceData.data.histogramSelectedRanges[property] = limits;
	  } // addUpdateDataFilter

	}; // filter

	var helpers = {
	  isIterable: function isIterable(object) {
	    // https://stackoverflow.com/questions/18884249/checking-whether-something-is-iterable
	    return object != null && typeof object[Symbol.iterator] === 'function';
	  },
	  // isIterable
	  makeTranslate: function makeTranslate(x, y) {
	    return "translate(" + x + "," + y + ")";
	  },
	  // makeTranslate
	  // Arrays
	  unique: function unique(d) {
	    // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
	    function onlyUnique(value, index, self) {
	      return self.indexOf(value) === index;
	    } // unique


	    return d.filter(onlyUnique);
	  },
	  // unique
	  arrayEqual: function arrayEqual(A, B) {
	    return helpers.arrayIncludesAll(A, B) && helpers.arrayIncludesAll(B, A);
	  },
	  // arrayEqual
	  arrayIncludesAll: function arrayIncludesAll(A, B) {
	    // 'arrayIncludesAll' checks if array A includes all elements of array B. The elements of the arrays are expected to be strings.
	    // Return element of B if it is not contained in A. If the response array has length 0 then A includes all elements of B, and 'true' is returned.
	    var f = B.filter(function (b) {
	      return !A.includes(b);
	    });
	    return f.length == 0 ? true : false;
	  },
	  // arrayIncludesAll
	  indexOfObjectByAttr: function indexOfObjectByAttr(array, attr, value) {
	    // Return hte index of the first object with the attribute 'attr' of value 'value'. 
	    for (var i = 0; i < array.length; i += 1) {
	      if (array[i][attr] === value) {
	        return i;
	      }
	    }

	    return -1;
	  },
	  // indexOfObjectByAttr
	  findObjectByAttribute: function findObjectByAttribute(A, attribute, values, flag) {
	    // Return the objects in an object array 'A', which have an attribute 'attribute', with the value 'value'. If they do not an empty set is returned. In cases when a single item is selected the item is returned as the object, without the wrapping array.
	    var subset = A.filter(function (a) {
	      return values.includes(a[attribute]);
	    }); // If only one output is expected, return a single output.

	    if (subset.length > 0 && flag == 1) {
	      subset = subset[0];
	    } // if


	    return subset;
	  },
	  // findObjectByAttribute
	  collectObjectArrayProperty: function collectObjectArrayProperty(A, attribute) {
	    // Take input object array 'A', collect all of the object members attribute 'attribute', and flattens the array of arrays into a single array of values once.
	    var C = A.map(function (a) {
	      return a[attribute];
	    });
	    return [].concat.apply([], C);
	  },
	  // collectObjectArrayProperty
	  setDifference: function setDifference(A, B) {
	    var a = new Set(A);
	    var b = new Set(B);
	    return {
	      aMinusB: new Set(_toConsumableArray(a).filter(function (x) {
	        return !b.has(x);
	      })),
	      bMinusA: new Set(_toConsumableArray(b).filter(function (x) {
	        return !a.has(x);
	      }))
	    };
	  },
	  // setDifference
	  // Comparing file contents
	  // Text sizing
	  fitTextToBox: function fitTextToBox(text, box, dim, val) {
	    // `text' and `box' are d3 selections. `dim' must be either `width' or `height', and `val' must be a number.
	    if (["width", "height"].includes(dim) && !isNaN(val)) {
	      var fontSize = 16;
	      text.style("font-size", fontSize + "px");

	      while (box.node().getBoundingClientRect()[dim] > val && fontSize > 0) {
	        // Reduce the font size
	        fontSize -= 1;
	        text.style("font-size", fontSize + "px");
	      } // while

	    } // if

	  },
	  // fitTextToBox
	  calculateExponent: function calculateExponent(val) {
	    // calculate the exponent for the scientific notation.
	    var exp = 0;

	    while (Math.floor(val / Math.pow(10, exp + 1)) > 0) {
	      exp += 1;
	    } // Convert the exponent to multiple of three


	    return Math.floor(exp / 3) * 3;
	  },
	  // calculateExponent
	  // FILES
	  createFileInputElement: function createFileInputElement(loadFunction) {
	    // This button is already created. Just add the functionaity.
	    var dataInput = document.createElement('input');
	    dataInput.type = 'file';

	    dataInput.onchange = function (e) {
	      loadFunction(e.target.files);
	    }; // onchange


	    return dataInput;
	  } // createFileInputElement

	}; // helpers

	var positioning = {
	  // Basic grid functionality
	  nx: function nx(container) {
	    var nx;
	    container.each(function (d) {
	      nx = d.grid.nx;
	    });
	    return nx;
	  },
	  // nx
	  dx: function dx(container) {
	    // First access the grid associated with the container.
	    var nx = positioning.nx(container);
	    return container.node().offsetWidth / nx;
	  },
	  // dx
	  dy: function dy(container) {
	    // The height of the container can change, and the number of grid points cannot be fixed. Instead the aspect ratio (dx/dy) is defined as 1. This is also taken into account when new plots are created.
	    return positioning.dx(container);
	  },
	  // dy
	  // Dragging plots
	  dragStart: function dragStart(d) {
	    // Raise the plot.
	    d.format.wrapper.raise(); // Calculate the delta with the reference to the plot wrapper.

	    d.format.position.delta = d3.mouse(d.format.wrapper.node());
	  },
	  // dragStart
	  dragMove: function dragMove(d, i) {
	    var f = d.format;
	    var container = d3.select(f.parent);
	    var nx = positioning.nx(container);
	    var dx = positioning.dx(container);
	    var dy = positioning.dy(container); // Calculate the proposed new position on the grid.
	    // d3.event is relative to the top left card corner
	    // d.format.position.ix*dx corrects for the position within the container
	    // d.format.position.delta.x corrects for the clicked offset to the corner
	    //let ix = Math.round( (d3.event.x + f.position.ix*dx - f.position.delta.x) / dx);
	    //let iy = Math.round( (d3.event.y + f.position.iy*dy - f.position.delta.y) / dy);

	    var ix = Math.round((d3.mouse(f.parent)[0] - f.position.delta[0]) / dx);
	    var iy = Math.round((d3.mouse(f.parent)[1] - f.position.delta[1]) / dy); // Implement rules on how far the contour can be moved. Prevent the contour to go even partially off-screen.
	    // EAST BOUNDARY

	    if (ix + f.position.iw > nx) {
	      ix = nx - f.position.iw;
	    } // if
	    // WEST BOUNDARY


	    if (ix < 0) {
	      ix = 0;
	    } // if
	    // SOUTH BOUNDARY: If it is breached then the parent size should be increased.
	    // if( iy + d.format.position.ih > grid.ny ){
	    //    iy = grid.ny - d.format.position.ih
	    // } // if
	    // NORTH BOUNDARY


	    if (iy < 0) {
	      iy = 0;
	    } // if
	    // Update the container position.


	    var movement = ix != f.position.ix || iy != f.position.iy;

	    if (movement) {
	      f.position.ix = ix;
	      f.position.iy = iy; // The exact location must be corrected for the location of the container itself.

	      f.wrapper.style("left", f.parent.offsetLeft + f.position.ix * dx + "px").style("top", f.parent.offsetTop + f.position.iy * dy + "px").raise(); // Move this to the individual functions. This allows the contour plot to change both the plot and plot row sizes. The contour plot will also have to move the other plots if necessary!!

	      d.plotFunc.interactivity.refreshContainerSize(d);
	    } // if

	  },
	  // dragMove
	  dragEnd: function dragEnd(d) {
	    // On drag end clear out the delta.
	    d.format.position.delta = undefined;
	  },
	  // dragEnd
	  // Resizing plots
	  resizeStart: function resizeStart(d) {
	    // Bring hte plot to front.
	    d.format.wrapper.raise();
	  },
	  // resizeStart
	  resizeMove: function resizeMove(d) {
	    // Calculate the cursor position on the grid. When resizing the d3.event.x/y are returned as relative to the top left corner of the svg containing the resize circle. The cue to resize is when the cursor drags half way across a grid cell.
	    // this < svg < bottom div < plot body < card < plotWrapper
	    var f = d.format;
	    var parent = d.format.parent;
	    var container = d3.select(parent);
	    var p = d.format.position;
	    var nx = positioning.nx(container);
	    var dx = positioning.dx(container);
	    var dy = positioning.dy(container); // clientX/Y is on-screen position of the pointer, but the width/height is relative to the position of the plotWrapper, which can be partially off-screen. getBoundingClientRect retrieves teh plotRowBody position relative to the screen.

	    var x = d3.event.sourceEvent.clientX - parent.getBoundingClientRect().left - p.ix * dx;
	    var y = d3.event.sourceEvent.clientY - parent.getBoundingClientRect().top - p.iy * dy;
	    var ix = p.ix;
	    var iw = Math.round(x / dx);
	    var ih = Math.round(y / dy); // Calculate if a resize is needed

	    var increaseWidth = iw > p.iw;
	    var decreaseWidth = iw < p.iw;
	    var increaseHeight = ih > p.ih;
	    var decreaseHeight = ih < p.ih; // Update the container size if needed

	    if ([increaseWidth, decreaseWidth, increaseHeight, decreaseHeight].some(function (d) {
	      return d;
	    })) {
	      // Corrections to force some size. The minimum is an index width/height of 1, and in px. The px requirement is to make sure that the plot does not squash its internal menus etc. In practice 190/290px seems to be a good value. This finctionality handles the contours as well, therefore the minimum limits are in the format.position attribute.
	      iw = iw * dx < p.minW ? Math.ceil(p.minW / dx) : iw;
	      ih = ih * dy < p.minH ? Math.ceil(p.minH / dy) : ih; // RETHINK THIS LIMIT!! FOR CONTOUR PLOTS THE PX LIMIT IS NOT NEEDED!!
	      // Correction to ensure it doesn't exceed limits.

	      iw = ix + iw > nx ? nx - ix : iw; // Width must simultaneously not be 1, and not exceed the limit of the container.

	      p.ih = ih;
	      p.iw = iw; // this < svg < bottom div < plot body < card < plotWrapper

	      f.wrapper.style("max-width", iw * dx + "px").style("width", iw * dx + "px").style("height", ih * dy + "px");
	      f.wrapper.select("div.card").style("max-width", iw * dx + "px").style("width", iw * dx + "px").style("height", ih * dy + "px"); // UPDATE THE PLOT

	      d.plotFunc.rescale(d); // Resize the containers accordingly

	      d.plotFunc.interactivity.refreshContainerSize(d); // Redo the graphics.
	    } // if

	  },
	  // resizeMove
	  resizeEnd: function resizeEnd(d) {
	    // After teh resize is finished update teh contour.
	    var container = d3.select(d.format.parent);
	    builder.refreshPlotRowHeight(container);
	    builder.refreshPlotRowWidth(container);
	  },
	  // resizeEnd
	  // Positioning a new plot
	  newPlot: function newPlot(plotRowCtrl, newPlotCtrl) {
	    // Now find the first opening for the new plot. The opening must fit the size of the new plot.
	    // IMPOSE PIXEL LIMITS HERE, IF ANYWHERE.
	    // plotRowCtrl has its DOM stored in hte attribute `element'
	    // Somehow count through the domain and see if the plot fits. 
	    // First collect all occupied grid nodes.
	    var h = positioning.helpers;
	    var occupiedNodes = [];
	    plotRowCtrl.plots.forEach(function (d) {
	      // Collect the occupied points as x-y coordinates.
	      var p = d.format.position;
	      h.pushNodes(occupiedNodes, p.ix, p.iy, p.iw, p.ih);
	    }); // forEach plot
	    // Position the new plot.

	    positioning.onGrid(plotRowCtrl.grid.nx, occupiedNodes, newPlotCtrl.format.position); //return newPlotCtrl
	  },
	  // newPlot
	  // This is only really used by the contour2d plot
	  onGrid: function onGrid(nx, occupiedNodes, pn) {
	    // POSITIONONGRID finds the first free spot on a grid with `nx' horizontal nodes, which already has plots occupying the `occupiedNodes' grid nodes, for a plot whose size and position is defined by the position object `pn'.
	    // Moving through the nodes and construct all nodes taken up if the plot is positioned there.
	    var h = positioning.helpers;
	    var ind = 0;
	    var areaFound = false;
	    var x0, y0;
	    var proposedNodes;

	    while (areaFound == false) {
	      // CAN BE IMPROVED IF IT TAKES INTO ACCOUNT THE WIDTH OF THE PROPOSED ELEMENT
	      // Calculate the starting point for the suggested position.
	      // The `12th' point doesnt need to be evaluated, as it is on the edge. 
	      y0 = Math.floor(ind / nx);
	      x0 = ind - y0 * nx;

	      if (x0 > nx - pn.iw) ; else {
	        proposedNodes = h.pushNodes([], x0, y0, pn.iw, pn.ih); // Check if any of the queried points are occupied.

	        areaFound = h.isAreaFree(occupiedNodes, proposedNodes);
	      } // if
	      // Increase the node index


	      ind += 1;
	    } // while
	    // If the are was found, the suggested nodes are free. Assign them to the new plot. The first node is the top left corner by the loop definition in pushNodes.


	    pn.ix = x0;
	    pn.iy = y0;
	  },
	  // onGrid
	  helpers: {
	    pushNodes: function pushNodes(array, ix, iy, iw, ih) {
	      for (var i = 0; i < iw; i++) {
	        for (var j = 0; j < ih; j++) {
	          array.push({
	            ix: ix + i,
	            iy: iy + j
	          }); // push
	        } // for row

	      } // for column


	      return array;
	    },
	    // pushNodes
	    isAreaFree: function isAreaFree(existing, proposed) {
	      var intersect = proposed.filter(function (node) {
	        var isIntersect = false;

	        for (var i = 0; i < existing.length; i++) {
	          isIntersect = existing[i].ix == node.ix && existing[i].iy == node.iy;

	          if (isIntersect) {
	            break;
	          }
	        } // for


	        return isIntersect;
	      }); // intersect
	      // If there are any intersections return false.

	      return intersect.length > 0 ? false : true;
	    },
	    // isAreaFree
	    findContainerSize: function findContainerSize(container, memberClass) {
	      // CHANGE THE CORRESPONDING FUNCTION IN POSITIONING TO ABSORB THIS ONE!!
	      var dy = positioning.dy(container); // Index of the lowest plot bottom.

	      var ih = 0;
	      container.selectAll(memberClass).each(function (d) {
	        var ipb = d.format.position.iy + d.format.position.ih;
	        ih = ipb > ih ? ipb : ih;
	      });
	      return Math.ceil(ih * dy);
	    },
	    // findContainerSize
	    repositionSiblingPlots: function repositionSiblingPlots(plotCtrl) {
	      // A plot has moved. Reposition other plots around it.
	      // Maybe change this to reposition only the affected plots??
	      var h = positioning.helpers; // If the body of the plot moves, then hte other plots must also move.

	      var plotRowBody = d3.select(plotCtrl.format.parent);
	      var plotRowCtrl = plotRowBody.data()[0];
	      var dx = positioning.dx(plotRowBody);
	      var dy = positioning.dy(plotRowBody); // Update the positions of all hte other plots in this plot row.

	      var occupiedNodes = [];
	      var pn = plotCtrl.format.position;
	      h.pushNodes(occupiedNodes, pn.ix, pn.iy, pn.iw, pn.ih);
	      plotRowCtrl.plots.forEach(function (plotCtrl_) {
	        // Only reposition plots that aren't the current plot.
	        // Maybe change this to reposition only the affected plots?? Change it such that the plot moves a minimal amount?? If the adjacent positions are not free then move it down??
	        if (plotCtrl_ != plotCtrl) {
	          var f = plotCtrl_.format;
	          var _pn = f.position; // Find a new position for this plot.

	          positioning.onGrid(plotRowCtrl.grid.nx, occupiedNodes, _pn); // Update the occupied nodes.

	          h.pushNodes(occupiedNodes, _pn.ix, _pn.iy, _pn.iw, _pn.ih); // Update the plot DOMs.

	          if (f.wrapper) {
	            f.wrapper.style("left", f.parent.offsetLeft + f.position.ix * dx + "px").style("top", f.parent.offsetTop + f.position.iy * dy + "px");
	          } // if

	        } // if

	      });
	    },
	    // repositionSiblingPlots
	    readjustPlotSize: function readjustPlotSize(plotCtrl) {
	      // Calculate the new size of the plot based on the current size in 'px', and the new grid dimension. The new size must definitely be larger than before to ensure the plots don't get too small.
	      var f = plotCtrl.format;
	      var p = plotCtrl.format.position; // By recalculating the indices of the grid the plots never really get any smaller, and therefore cannot violate the smallest size.

	      var wrapperDOM = f.wrapper.node();
	      var height = wrapperDOM.offsetHeight;
	      var width = wrapperDOM.offsetWidth;
	      var container = d3.select(f.parent);
	      var nx = positioning.nx(container);
	      var dx = positioning.dx(container);
	      var dy = positioning.dy(container); // Find the smallest option that would work.

	      p.iw = Math.ceil(width / dx);
	      p.ih = Math.ceil(height / dy); // Make sure the new iw doesn't exceed the limit.

	      p.iw = p.iw > nx ? nx : p.iw;
	      f.wrapper.style("max-width", p.iw * dx + "px").style("width", p.iw * dx + "px").style("height", p.ih * dy + "px");
	      f.wrapper.select("div.card").style("max-width", p.iw * dx + "px").style("width", p.iw * dx + "px").style("height", p.ih * dy + "px"); // UPDATE THE PLOT

	      plotCtrl.plotFunc.rescale(plotCtrl); // Resize the containers accordingly

	      plotCtrl.plotFunc.interactivity.refreshContainerSize(plotCtrl);
	    },
	    // readjustPlotSize
	    readjustPlotPosition: function readjustPlotPosition(plotCtrl) {
	      // Calculate the new size of the plot based on the current size in 'px', and the new grid dimension. The new size must definitely be larger than before to ensure the plots don't get too small.
	      var f = plotCtrl.format;
	      var p = plotCtrl.format.position;
	      var container = d3.select(f.parent);
	      var nx = positioning.nx(container);
	      var dx = positioning.dx(container);
	      var dy = positioning.dy(container); // Readjust the ix so that the plot is not out of the container.

	      p.ix = p.ix + p.iw > nx ? nx - p.iw : p.ix;
	      f.wrapper.style("left", f.parent.offsetLeft + p.ix * dx + "px"); // Move this to the individual functions. This allows the contour plot to change both the plot and plot row sizes. The contour plot will also have to move the other plots if necessary!!

	      plotCtrl.plotFunc.interactivity.refreshContainerSize(plotCtrl);
	    } // readjustPlotPosition

	  } // helpers

	}; // positioning

	var plotHelpers = {
	  setupPlot: {
	    general: {
	      // Making the plot DOM
	      makeNewPlot: function makeNewPlot(plotCtrl, index) {
	        plotCtrl.format.parent = this._parent; // Note that here `this' is a d3 object.

	        var p = plotCtrl.format.position;
	        var container = plotCtrl.format.parent;
	        var dx = positioning.dx(d3.select(container));
	        var dy = positioning.dy(d3.select(container));
	        var iw_min = Math.ceil(p.minW / dx);
	        var ih_min = Math.ceil(p.minH / dy);
	        p.iw = p.iw > iw_min ? p.iw : iw_min;
	        p.ih = p.ih > ih_min ? p.ih : ih_min;
	        var wrapper = d3.select(this).append("div").attr("class", "plotWrapper").attr("plottype", plotCtrl.plotFunc.name).style("position", "absolute").style("left", container.offsetLeft + p.ix * dx + "px").style("top", container.offsetTop + p.iy * dy + "px").style("width", p.iw * dx + "px").style("height", p.ih * dy + "px");
	        var plot = wrapper.append("div").attr("class", "card"); // Apply the drag to all new plot headers

	        var drag = d3.drag().on("start", positioning.dragStart).on("drag", positioning.dragMove).on("end", positioning.dragEnd);
	        var plotHeader = plot.append("div").attr("class", "card-header plotTitle").style("cursor", "grab").call(drag); // Add the actual title

	        var titleBox = plotHeader.append("div").attr("class", "title").style("display", "inline"); // Add a div to hold all the control elements.

	        plotHeader.append("div").attr("class", "ctrlGrp float-right").attr("style", "display:inline-block").append("button").attr("class", "btn btn-danger float-right").html("x").on("mousedown", function () {
	          d3.event.stopPropagation();
	        }).on("click", addMenu.removePlotControls); // Now add the text - this had to wait for hte button to be added first, as it takes up some space.

	        titleBox.html(plotCtrl.format.title).attr("spellcheck", false).attr("contenteditable", true).style("cursor", "text").on("mousedown", function () {
	          d3.event.stopPropagation();
	        }).each(function (ctrl) {
	          this.addEventListener("input", function () {
	            ctrl.format.title = this.innerHTML;
	          });
	        });
	        var plotBody = plot.append("div").attr("class", "plot"); // Bind the DOM element to the control object.

	        plotCtrl.figure = plotBody;
	        plotCtrl.format.wrapper = wrapper; // Draw the plot

	        plotCtrl.plotFunc.make(plotCtrl);
	      },
	      // makeNewPlot
	      setupPlotBackbone: function setupPlotBackbone(ctrl) {
	        /* This function makes the skeleton required for a plot that will have interactive inputs on both axes.
	        _________________________________________________
	        || div | | div                                   |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||-----| |---------------------------------------|
	        ||-----| |---------------------------------------|
	        || div | | div                                   |
	        ||_____| |_______________________________________|
	        
	        */
	        var plot = ctrl.figure; // Left Control

	        plot.append("div").attr("class", "leftAxisControlGroup").style("width", ctrl.format.margin.left + "px").style("float", "left"); // Main plot with its svg.

	        plot.append("div").attr("class", "plotContainer").style("margin-left", ctrl.format.margin.left + "px"); // Bottom left corner div
	        // A height of 38px is prescribed, as that is the height of a bootstrap button.

	        plot.append("div").attr("class", "bottomLeftControlGroup").attr("style", "width: " + ctrl.format.margin.left + "px; height:" + ctrl.format.margin.bottom + "px; float:left"); // Bottom controls

	        plot.append("div").attr("class", "bottomAxisControlGroup").attr("style", "margin-left: " + ctrl.format.margin.left + "px;"); // Add the resize item.

	        var resize = d3.drag().on("start", positioning.resizeStart).on("drag", positioning.resizeMove).on("end", positioning.resizeEnd);
	        plot.select(".bottomAxisControlGroup").append("svg").attr("width", "10").attr("height", 10).style("position", "absolute").style("bottom", "0px").style("right", "0px").append("circle").attr("cx", 5).attr("cy", 5).attr("r", 5).attr("fill", "DarkGrey").attr("cursor", "nwse-resize").call(resize);
	      },
	      // setupPlotBackbone
	      setupPlotContainerBackbone: function setupPlotContainerBackbone(ctrl) {
	        // Fill in the plot container backbone.
	        var plotContainer = ctrl.figure.select("div.plotContainer");
	        var svg = plotContainer.append("svg").attr("class", "plotArea"); // Background group will hold any elements required for functionality in the background (e.g. zoom rectangle). 

	        svg.append("g").attr("class", "background"); // Group holding the primary data representations.

	        svg.append("g").attr("class", "data"); // Markup group will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. 

	        svg.append("g").attr("class", "markup"); // Group for the x axis

	        svg.append("g").attr("class", "axis--x").append("g").attr("class", "exponent").append("text").attr("fill", "none").attr("y", "-0.32em").append("tspan").html("x10").append("tspan").attr("class", "exp").attr("dy", -5); // Group for the y axis

	        svg.append("g").attr("class", "axis--y").append("g").attr("class", "exponent").append("text").attr("fill", "none").attr("x", -8).append("tspan").html("x10").append("tspan").attr("class", "exp").attr("dy", -5);
	      },
	      // setupPlotContainerBackbone
	      //Scaling
	      rescaleSvg: function rescaleSvg(ctrl) {
	        // RESIZE ALL THE PLOT CONTAINERS AS NEEDED.
	        // First enforce the size based on the size of the wrapper.
	        // Now calculate the size of the svg.
	        var svg = ctrl.figure.select("svg.plotArea");
	        var cardDOM = ctrl.figure.node().parentElement;
	        var wrapperDOM = cardDOM.parentElement;
	        var headerDOM = d3.select(cardDOM).select(".plotTitle").node(); // These are margins of the entire drawing area including axes. The left and top margins are applied explicitly, whereas the right and bottom are applied implicitly through the plotWidth/Height parameters.

	        var margin = ctrl.format.margin;
	        var axesMargin = ctrl.format.axesMargin; // Width of the plotting area is the width of the div intended to hold the plot (.plotContainer). ctrl.format.margin.bottom is the margin for hte button.

	        var width = wrapperDOM.offsetWidth - margin.left - margin.right;
	        var height = wrapperDOM.offsetHeight - headerDOM.offsetHeight - margin.bottom - margin.top; // The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.

	        var plotWidth = width - axesMargin.left - axesMargin.right;
	        var plotHeight = height - axesMargin.bottom - axesMargin.top; // Outer svg. This is required to separate the plot from the axes. The axes need to be plotted onto an svg, but if the zoom is applied to the same svg then the zoom controls work over the axes. If rescaling of individual axes is needed the zoom must therefore be applied to a separate, inner svg.
	        // This svg needs to be translated to give some space to the controls on the y-axes.

	        svg.attr("width", width).attr("height", height); // If margins are too small the ticks will be obscured. The transform is applied from the top left corner.

	        var axesTranslate = makeTranslate(axesMargin.left, axesMargin.top); // Make a group that will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. This group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.

	        var background = svg.select("g.background").attr("transform", axesTranslate);
	        background.select("clipPath").select("rect").attr("width", plotWidth).attr("height", plotHeight).style("fill", "rgb(255,255,255)");
	        background.select("rect.zoom-area").attr("width", plotWidth).attr("height", plotHeight).style("fill", "rgb(255,255,255)"); // Transform the markup to the right location.

	        svg.select("g.markup").attr("transform", axesTranslate); // Group holding the primary data representations. Needs to be after g.markup, otherwise the white rectangle hides all the elements.

	        svg.select("g.data").attr("transform", axesTranslate).attr("width", plotWidth).attr("height", plotHeight); // Group for the x axis

	        svg.select("g.axis--x").attr("transform", makeTranslate(axesMargin.left, plotHeight + axesMargin.top)).select("g.exponent").select("text").attr("x", plotWidth - 12); // Group for the y axis

	        svg.select("g.axis--y").attr("transform", axesTranslate).attr("x", -12).attr("y", 5);

	        function makeTranslate(x, y) {
	          return "translate(" + [x, y].join() + ")";
	        } // makeTranslate	

	      },
	      // rescaleSvg
	      // Select menus
	      appendVerticalSelection: function appendVerticalSelection(figure, onChangeFunction) {
	        var container = figure.select(".leftAxisControlGroup");
	        var s = container.append("select").attr("class", "select-vertical custom-select"); // This is just the text label - it has no impact on the select functionality. Fit the text into a box here.

	        var txt = container.append("text").text(s.node().value).attr("class", "txt-vertical-axis");
	        plotHelpers.helpers.adjustAxisSelect(figure);
	        s.on("change", onChangeFunction);
	      },
	      // appendVerticalSelection
	      updateVerticalSelection: function updateVerticalSelection(ctrl) {
	        // THIS WORKS!!
	        // NOTE THAT CHANGING THE SELECT OPTIONS THIS WAY DID NOT TRIGGER THE ON CHANGE EVENT!!
	        var variables = ctrl.view.yVarOption.options;
	        var container = ctrl.figure.select(".leftAxisControlGroup"); // Handle the select element.

	        var s = container.select("select");
	        var options = s.selectAll("option").data(variables);
	        options.enter().append("option").attr("class", "dropdown-item").html(function (d) {
	          return d;
	        }).attr("value", function (d) {
	          return d;
	        });
	        options.html(function (d) {
	          return d;
	        });
	        options.exit().remove(); // Force the appropriate selection to be selected.

	        s.node().value = ctrl.view.yVarOption.val; // Update the text to show the same.

	        container.select("text").text(ctrl.view.yVarOption.val);
	        plotHelpers.helpers.adjustAxisSelect(ctrl.figure);
	      },
	      // updateVerticalSelection
	      appendHorizontalSelection: function appendHorizonalSelection(figure, onChangeFunction) {
	        var container = figure.select(".bottomAxisControlGroup");
	        var s = container.append("select").attr("class", "custom-select").attr("dir", "rtl").attr("style", 'float:right;');
	        s.on("change", onChangeFunction);
	      },
	      // appendHorizonalSelection
	      updateHorizontalSelection: function updateHorizontalSelection(ctrl, variables) {
	        // THIS WORKS!!
	        // NOTE THAT CHANGING THE SELECT OPTIONS THIS WAY DID NOT TRIGGER THE ON CHANGE EVENT!!
	        var variables = ctrl.view.xVarOption.options;
	        var container = ctrl.figure.select(".bottomAxisControlGroup"); // Handle the select element.

	        var s = container.select("select");
	        var options = s.selectAll("option").data(variables);
	        options.enter().append("option").attr("class", "dropdown-item").html(function (d) {
	          return d;
	        });
	        options.html(function (d) {
	          return d;
	        });
	        options.exit().remove(); // Force the appropriate selection to be selected.

	        s.node().value = ctrl.view.xVarOption.val;
	      },
	      // updateHorizontalSelection
	      // Toggle in the header
	      appendToggle: function appendToggle(container, onClickEvent) {
	        // Additional styling was added to dbslice.css to control the appearance of the toggle.
	        var toggleGroup = container.append("label").attr("class", "switch float-right");
	        var toggle = toggleGroup.append("input").attr("type", "checkbox");
	        toggleGroup.append("span").attr("class", "slider round"); // Add it's functionality.

	        toggle.on("change", onClickEvent);
	      } // appendToggle

	    },
	    // general
	    twoInteractiveAxes: {
	      setupPlotBackbone: function setupPlotBackbone(ctrl) {
	        /* This function makes the skeleton required for a plot that will have interactive inputs on both axes.
	        _________________________________________________
	        || div | | div                                   |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||     | |                                       |
	        ||-----| |---------------------------------------|
	        ||-----| |---------------------------------------|
	        || div | | div                                   |
	        ||_____| |_______________________________________|
	        
	        */
	        // Make the general backbone.
	        plotHelpers.setupPlot.general.setupPlotBackbone(ctrl);
	        plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl); // Fill in custom elements.

	        var svg = ctrl.figure.select("div.plotContainer").select("svg.plotArea"); // The markup group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.
	        // USE THIS RESTANGLE AS THE clipPAth too??

	        var background = svg.select("g.background"); // At some point this didn't work:
	        // .attr("clipPathUnits","objectBoundingBox")

	        background.append("clipPath").attr("id", "zoomClip").append("rect");
	        background.append("rect").attr("class", "zoom-area").attr("fill", "rgb(255,25,255)");
	        background.append("g").attr("class", "tooltipAnchor").append("circle").attr("class", "anchorPoint").attr("r", 1).attr("opacity", 0);
	        svg.select("g.data").attr("clip-path", "url(#zoomClip)");
	      },
	      // setupPlotBackbone
	      // Button Menu
	      buttonMenu: {
	        make: function make(ctrl) {
	          var container = ctrl.figure.select(".bottomLeftControlGroup");
	          var menuWrapper = container.append("div").attr("class", "dropup"); // The button that will toggle the main menu.

	          var button = menuWrapper.append("button").attr("class", "btn dropup-toggle").html("O"); // The div that will hold the accordion options.

	          var menu = menuWrapper.append("div").attr("class", "dropup-content").style("display", "none"); // REQUIRED CUSTOM FUNCTIONALITY

	          var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers; // When the button is clicked the dropup should toggle visibility.

	          button.on("click", h.toggleDropupMenu); // When outside of the menu, and the main menu items is clicked close the dropup menu.

	          window.addEventListener("click", h.closeDropupMenu(menu));
	        },
	        // make
	        update: function update(ctrl, optionGroups) {
	          var container = ctrl.figure.select(".bottomLeftControlGroup");
	          var menu = container.select(".dropup").select(".dropup-content"); // First remove all previous groups.

	          while (menu.node().firstChild) {
	            menu.node().removeChild(menu.node().lastChild);
	          } // while
	          // Now append all the options required.


	          optionGroups.forEach(function (option) {
	            appendGroup(menu, option);
	          });

	          function appendGroup(menu, option) {
	            // Append the group div, the p holding the name, and another div holding the options.
	            var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers;
	            var submenuWrapper = menu.append("div"); // By clicking on this p I want to show the submenu.

	            var p = submenuWrapper.append("p").attr("class", "dropup-toggle submenu-toggle").html(option.name).style("font-weight", "bold").style("font-size", "12px");
	            p.on("click", h.toggleDropupSubmenu); // on

	            var submenu = submenuWrapper.append("div").attr("class", "submenu-content").style("display", "none");
	            submenu.selectAll("a").data(option.options).enter().append("a").attr("class", function (d) {
	              // This function intitialises the selection.
	              var classList = ["submenu-item"];

	              if (option.val == d) {
	                classList.push("selected");
	              } else {
	                classList.push("deselected");
	              } // if


	              return classList.join(" ");
	            }).html(function (d) {
	              return d;
	            }).on("click", function (d) {
	              // Several events should occur on an item click. First of all the selection should be highlighted in the selection menu. Then the corresponding ctrl attributes should be updated. And finally a redraw should be ordered.
	              // Perform the usual toggling of the menu items. This also allows an option to be deselected!
	              h.toggleSubmenuItemHighlight(this); // Update the corresponding ctrl attribute.
	              // 'option' is a reference to either a manually created option in 'update', or a reference to an actual option in 'ctrl.view.options'.

	              var optionSame = option.val == d;
	              option.val = optionSame ? undefined : d; // If a special event is specified, execute it here. This event might require to know the previous state, therefore execute it before updating the state.

	              if (option.event != undefined) {
	                ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated();
	                option.event(ctrl, option.val, optionSame);
	                ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.instantaneous();
	              } // if
	              // The data defined options, if they exist, must not be deselected however. Highlight the selected ones.
	              // if for ctrl.view.options is here to account for the cases where the only options are those that feature only functionality.


	              if (ctrl.view.options != undefined) {
	                var userOptionNames = ctrl.view.options.map(function (o) {
	                  return o.name;
	                });

	                if (userOptionNames.includes(option.name)) {
	                  // This item belongs to an option defined by the data. It must remain selected.
	                  this.classList.replace("deselected", "selected");
	                } // if

	              } // if

	            });
	          } // appendGroup

	        },
	        // update
	        helpers: {
	          toggleDisplayBlock: function toggleDisplayBlock(menu) {
	            if (menu.style.display === "none") {
	              menu.style.display = "block";
	            } else {
	              menu.style.display = "none";
	            } // if

	          },
	          // toggleDisplayBlock
	          toggleDropupMenu: function toggleDropupMenu() {
	            var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers;
	            var menu = d3.select(this.parentElement).select("div"); // Toggle the display of the overall menu.

	            h.toggleDisplayBlock(menu.node()); // Hide all the accordion submenu menus.

	            menu.selectAll(".submenu-content").each(function () {
	              this.style.display = "none";
	            }); // FAILED CONSIDERATIONS:
	            // document.getElementById("myDropdown").classList.toggle("show");
	            //wrapper.select(".dropup-content").node().classList.toggle("show");
	          },
	          // toggleDropupMenu
	          toggleDropupSubmenu: function toggleDropupSubmenu() {
	            // Collect helper object for code readability.
	            var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers; // Collect the submenu corresponding to the clicked element.

	            var clickedSubmenu = d3.select(this.parentElement).select(".submenu-content").node(); // This needs to toggle itself, but also all the other submenus, therefor search for them, and loop over them.

	            var allSubmenu = d3.select(this.parentElement.parentElement).selectAll(".submenu-content");
	            allSubmenu.each(function () {
	              if (clickedSubmenu == this) {
	                // The current one that was clicked needs to toggle depending on the current state.
	                h.toggleDisplayBlock(this);
	              } else {
	                // All others must collapse.
	                this.style.display = "none";
	              } // if

	            }); // each
	          },
	          // toggleDropupSubmenu
	          closeDropupMenu: function closeDropupMenu(menu) {
	            // 'closeDropupMenu' creates the function to be executed upon click outside the interactive area of the dropup menu. It is targeted for a particular menu, therefore a new function must be created everytime.
	            return function (event) {
	              // If the desired element is NOT preseed, close the corresponding menu.
	              if (!event.target.matches('.dropup-toggle')) {
	                menu.node().style.display = "none";
	              } // if
	              // If the event matches a submenu, then it's options should be expanded.

	            };
	          },
	          // closeDropupMenu
	          toggleSubmenuItemHighlight: function toggleSubmenuItemHighlight(clickedItem) {
	            //
	            // Deselect competing options
	            var allOptions = d3.select(clickedItem.parentNode).selectAll(".submenu-item");
	            allOptions.each(function () {
	              if (this == clickedItem) {
	                // Toggle this option on or off as required.
	                if (clickedItem.classList.contains("selected")) {
	                  clickedItem.classList.replace("selected", "deselected");
	                } else {
	                  clickedItem.classList.replace("deselected", "selected");
	                } // if

	              } else {
	                // Deselect.
	                this.classList.replace("selected", "deselected");
	              } // if

	            });
	          } // toggleSubmenuItemHighlight

	        } // helpers

	      },
	      // buttonMenu
	      // Title toggle
	      updatePlotTitleControls: function updatePlotTitleControls(ctrl) {
	        // Add the toggle to switch manual selection filter on/off
	        var container = d3.select(ctrl.figure.node().parentElement).select(".plotTitle").select("div.ctrlGrp");

	        var onClickEvent = function onClickEvent() {
	          // Update teh DOM accordingly.
	          plotHelpers.setupInteractivity.general.toggleToggle(this); // Update filters

	          filter.apply();
	          sessionManager.render();
	        }; // onClickEvent


	        plotHelpers.setupPlot.general.appendToggle(container, onClickEvent);
	      } // updatePlotTitleControls

	    } // twoInteractiveAxes

	  },
	  // setupPlot
	  setupInteractivity: {
	    general: {
	      onSelectChange: {
	        vertical: function vertical(ctrl, selectedVar) {
	          // Update the vertical text and the state.
	          // Change the text.
	          ctrl.figure.select(".leftAxisControlGroup").select(".txt-vertical-axis").text(selectedVar); // Update the y-variable for the plot.

	          ctrl.view.yVarOption.val = selectedVar;
	        },
	        // vertical
	        horizontal: function horizontal() {// Horizontal select change requires so little to update itself that this function here is not necessary as of now.
	        } // horizontal

	      },
	      // onSelectChange
	      toggleToggle: function toggleToggle(clickedToggleDOM) {
	        var currentVal = clickedToggleDOM.checked; // All such switches need to be activated.

	        var allToggleSwitches = d3.selectAll(".plotWrapper").selectAll(".plotTitle").selectAll(".ctrlGrp").selectAll(".switch").selectAll("input[type='checkbox']");
	        allToggleSwitches.each(function () {
	          this.checked = currentVal;
	        }); // each
	      } // toggleToggle

	    },
	    // general
	    twoInteractiveAxes: {
	      onSelectChange: {
	        vertical: function vertical(ctrl) {
	          // 'vertical' returns a function in order to be able to include a reference to the correct 'ctrl' object in it.
	          return function () {
	            // `this' is the vertical select! 
	            var selectedVar = this.value; // Perform the regular task for y-select.

	            plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar); // Perform other needed tasks and refresh.

	            ctrl.plotFunc.interactivity.onSelectChange(ctrl);
	          }; // return
	        },
	        // vertical
	        horizontal: function horizontal(ctrl) {
	          // 'horizontal' returns a function in order to be able to include a reference to the correct 'ctrl' object in it.
	          return function () {
	            var selectedVar = this.value; // Update the y-variable for the plot.

	            ctrl.view.xVarOption.val = selectedVar; // Perform other needed tasks and refresh.

	            ctrl.plotFunc.interactivity.onSelectChange(ctrl);
	          }; // return
	        } // horizontal

	      },
	      // onSelectChange
	      addAxisScaling: function addAxisScaling(ctrl) {
	        var svg = ctrl.figure.select("svg.plotArea");
	        var mw;
	        var downx = Math.NaN;
	        var downscalex;
	        var mh;
	        var downy = Math.NaN;
	        var downscaley;
	        svg.select(".axis--x").on("mousedown", function (d) {
	          mw = Number(svg.select("g.data").attr("width"));
	          mh = Number(svg.select("g.data").attr("height"));
	          var axisXDOM = svg.select("g.axis--x").node();
	          var p = d3.mouse(axisXDOM)[0];
	          downx = ctrl.tools.xscale.invert(p);
	          downscalex = ctrl.tools.xscale;
	        });
	        svg.select(".axis--y").on("mousedown", function (d) {
	          mw = Number(svg.select("g.data").attr("width"));
	          mh = Number(svg.select("g.data").attr("height"));
	          var axisYDOM = svg.select("g.axis--y").node();
	          var p = d3.mouse(axisYDOM)[1];
	          downy = ctrl.tools.yscale.invert(p);
	          downscaley = ctrl.tools.yscale;
	        }); // attach the mousemove and mouseup to the body
	        // in case one wonders off the axis line

	        svg.on("mousemove", function (d) {
	          var axisXDOM = d3.select(this).select("g.axis--x").node();
	          var axisYDOM = d3.select(this).select("g.axis--y").node();

	          if (!isNaN(downx)) {
	            var px = d3.mouse(axisXDOM)[0];

	            if (downscalex(px) != downx) {
	              // Here it would be great if the dragged number would move to where the cursor is.
	              //let tx = ctrl.view.t.x
	              //let tv = downscalex.invert( tx )
	              //let vb = tv + ( downx - tv )/( px - tx )*( mw - tx )
	              //let va = tv - ( downx - tv )/( px - tx )*tx
	              var va = downscalex.domain()[0];
	              var vb = mw * (downx - downscalex.domain()[0]) / px + downscalex.domain()[0];
	              ctrl.tools.xscale.domain([va, vb]);
	            } // if
	            // Execute redraw


	            ctrl.plotFunc.interactivity.dragAdjustAR(ctrl);
	          } // if


	          if (!isNaN(downy)) {
	            var py = d3.mouse(axisYDOM)[1];

	            if (downscaley(py) != downy) {
	              ctrl.tools.yscale.domain([downscaley.domain()[0], mh * (downy - downscaley.domain()[0]) / (mh - py) + downscaley.domain()[0]]);
	            } // if
	            // Execute redraw


	            ctrl.plotFunc.interactivity.dragAdjustAR(ctrl);
	          } // if

	        }).on("mouseup", function (d) {
	          downx = Math.NaN;
	          downy = Math.NaN; // When the domain is manually adjusted the previous transformations are no longer valid, and to calculate the delta at next zoom event the transformation needs to be reinitiated.

	          ctrl.view.t = -1;
	        });
	      },
	      // addAxisScaling
	      addZooming: function addZooming(ctrl) {
	        // The current layout will keep adding on zoom. Rethink this for more responsiveness of the website.
	        var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed); // Zoom operates on a selection. In this case a rect has been added to the markup to perform this task.

	        ctrl.figure.select("svg.plotArea").select("g.background").select("rect.zoom-area").call(zoom); // ctrl.svg.select(".plotArea").on("dblclick.zoom", null);
	        // As of now (23/03/2020) the default zoom behaviour (https://d3js.org/d3.v5.min.js) does not support independantly scalable y and x axis. If these are implemented then on first zoom action (panning or scaling) will have a movement as the internal transform vector (d3.event.transform) won't corespond to the image. 
	        // The transformation vector is based on the domain of the image, therefore any manual scaling of the domain should also change it. The easiest way to overcome this is to apply the transformation as a delta to the existing state.
	        // ctrl.view.t is where the current state is stored. If it is set to -1, then the given zoom action is not performed to allow any difference between d3.event.transform and ctrl.view.t due to manual rescaling of the domain to be resolved.

	        ctrl.view.t = d3.zoomIdentity;

	        function zoomed() {
	          // Get the current scales, and reshape them back to the origin.
	          var t = d3.event.transform;
	          var t0 = ctrl.view.t; // Check if there was a manual change of the domain

	          if (t0 == -1) {
	            t0 = t;
	          } // Hack to get the delta transformation.


	          var dt = d3.zoomIdentity;
	          dt.k = t.k / t0.k;
	          dt.x = t.x - t0.x;
	          dt.y = t.y - t0.y;
	          ctrl.view.t = t;
	          var xScaleDefined = ctrl.tools.xscale != undefined;
	          var yScaleDefined = ctrl.tools.yscale != undefined;

	          if (xScaleDefined && yScaleDefined) {
	            // Simply rescale the axis to incorporate the delta event.  
	            ctrl.tools.xscale = dt.rescaleX(ctrl.tools.xscale);
	            ctrl.tools.yscale = dt.rescaleY(ctrl.tools.yscale); // Assign appropriate transitions

	            ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.instantaneous(); // Update the plot

	            ctrl.plotFunc.refresh(ctrl);
	          } // if

	        } // zoomed

	      } // addZooming

	    } // twoInteractiveAxes

	  },
	  // setupInteractivity
	  setupTools: {
	    go: function go(ctrl) {
	      // The plot tools are either setup based on data (e.g. upon initialisation), or on where the user has navigated to.
	      var bounds = plotHelpers.setupTools.getPlotBounds(ctrl); // Create the required scales.

	      ctrl.tools.xscale = d3.scaleLinear().range(bounds.range.x).domain(bounds.domain.x);
	      ctrl.tools.yscale = d3.scaleLinear().range(bounds.range.y).domain(bounds.domain.y);
	    },
	    // go
	    getPlotBounds: function getPlotBounds(ctrl) {
	      // This function should determine the domain of the plot and use it to control the plots aspect ratio.
	      var h = ctrl.plotFunc.setupPlot;
	      var h_ = plotHelpers.setupTools; // Get the bounds based on the data.

	      var domain = h.findDomainDimensions(ctrl);
	      var range = h.findPlotDimensions(ctrl.figure.select("svg.plotArea"));

	      if (!isNaN(ctrl.view.viewAR)) {
	        // Adjust the plot domain to preserve an aspect ratio of 1, but try to use up as much of the drawing area as possible.
	        h_.adjustAR(range, domain, ctrl.view.viewAR);
	      } else {
	        // The aspect ratio is the ratio between pixels per unit of y axis to the pixels per unit of the x axis. As AR = 2 is expected to mean that the n pixels cover 2 units on y axis, and 1 unit on x axis teh actual ration needs to be ppdx/ppdy.
	        ctrl.view.dataAR = h_.calculateAR(range, domain);
	        ctrl.view.viewAR = h_.calculateAR(range, domain);
	      } // switch
	      // Finally, adjust the plot so that there is some padding on the sides of the plot.


	      h_.adjustPadding(range, domain);
	      return {
	        domain: domain,
	        range: range
	      };
	    },
	    // getPlotBounds
	    adjustPadding: function adjustPadding(range, domain) {
	      // The padding must be equal both on the x and y axes in terms of pixels used for padding. Specify this simply in terms of pixels. This inadvertently impacts the AR of the actual final plot.
	      var padding = 10;
	      var xPad = (d3.max(domain.x) - d3.min(domain.x)) / (d3.max(range.x) - d3.min(range.x)) * padding;
	      var yPad = (d3.max(domain.y) - d3.min(domain.y)) / (d3.max(range.y) - d3.min(range.y)) * padding;
	      domain.x[0] = domain.x[0] - xPad;
	      domain.x[1] = domain.x[1] + xPad;
	      domain.y[0] = domain.y[0] - yPad;
	      domain.y[1] = domain.y[1] + yPad;
	    },
	    // adjustPadding
	    calculateAR: function calculateAR(range, domain) {
	      var ppdx = (range.x[1] - range.x[0]) / (domain.x[1] - domain.x[0]);
	      var ppdy = (range.y[0] - range.y[1]) / (domain.y[1] - domain.y[0]);
	      return ppdx / ppdy;
	    },
	    // calculateAR
	    adjustAR: function adjustAR(range, domain, AR) {
	      // The limits of the data definitely need to be within the plot.
	      // If the x range is fixed, then there is a maximum AR that can be imposed. If the forced AR is larger the x range will need to be adjusted to display it appropriately
	      // The smaller of these will be the dominating one.
	      var xAR = (d3.max(range.x) - d3.min(range.x)) / (d3.max(domain.x) - d3.min(domain.x));
	      var yAR = (d3.max(range.y) - d3.min(range.y)) / (d3.max(domain.y) - d3.min(domain.y));

	      if (xAR * AR <= yAR) {
	        // Resize the y domain.
	        var yDiff = (d3.max(range.y) - d3.min(range.y)) / (xAR / AR);
	        domain.y[1] = domain.y[0] + yDiff;
	      } else {
	        // Resize the x domain.
	        var xDiff = (d3.max(range.x) - d3.min(range.x)) / (yAR * AR);
	        domain.x[1] = domain.x[0] + xDiff;
	      } // if

	    } // adjustAR

	  },
	  // setupTools
	  helpers: {
	    formatAxisScale: function formatAxisScale(scale) {
	      // With a million tasks it is possible that the min and max are more than O(3) different. In that case a logarithmic scale would be better!
	      var dom = scale.domain();
	      var format = {
	        scale: scale,
	        exp: undefined,
	        fill: undefined
	      }; // format
	      // In cases where the exponent of hte min and the exponent of the max are very different, pick the one in between! We're likely only going to be able to handle 1e6 tasks, in which case the most extreme case is minExp = 0, and maxExp = 6. In that case pick the middle value of 3.

	      var maxExp = helpers.calculateExponent(dom[1]);
	      var minExp = helpers.calculateExponent(dom[0]);
	      format.exp = maxExp - minExp > 3 ? 3 : minExp;

	      if (format.exp > 0) {
	        format.scale = d3.scaleLinear().domain(dom.map(function (d) {
	          return d / Math.pow(10, format.exp);
	        })).range(scale.range());
	        format.fill = "currentColor";
	      } else {
	        format.fill = "none";
	        format.exp = "";
	      } // if


	      return format;
	    },
	    // formatExponent
	    fitTextToBox: function fitTextToBox(text, box, orientation) {
	      // `text' is a d3 selection. `box' must have height and width attributes. `orientation' can be either `horizontal' or `vertical'.
	      // So, when the text orientation is horizontal the font size will impact the height, otherwise it impacts the width.
	      var d = {
	        fontDim: {
	          horizontal: "height",
	          vertical: "width"
	        },
	        lengthDim: {
	          horizontal: "width",
	          vertical: "height"
	        }
	      }; // d

	      var fontSize = parseInt(window.getComputedStyle(text.node(), null).getPropertyValue('font-size')); // Font size.

	      while (exceedsDim(text, box, d.fontDim[orientation])) {
	        // Reduce the font size
	        fontSize -= 1;
	        text.style("font-size", fontSize + "px"); // Safety break

	        if (fontSize < 2) {
	          break;
	        }
	      } // while
	      // String length.


	      var s = text.html();
	      var j = Math.floor(s.length / 2);

	      while (exceedsDim(text, box, d.lengthDim[orientation])) {
	        var first = s.substr(0, j);
	        var last = s.substr(s.length - j, s.length);
	        text.html(first + " ... " + last);
	        j -= 1;

	        if (j < 3) {
	          break;
	        }
	      } // while


	      function exceedsDim(text, box, dim) {
	        return text.node().getBoundingClientRect()[dim] > box[dim];
	      } // exceedsDim

	    },
	    // fitTextToBox
	    getAxisBox: function getAxisBox(figure) {
	      var plot = figure.node().getBoundingClientRect();
	      var blcg = figure.select("div.bottomLeftControlGroup").node().getBoundingClientRect();
	      return {
	        height: plot.height - blcg.height,
	        width: plot.width - blcg.width
	      };
	    },
	    // getAxisBox
	    adjustAxisSelect: function adjustAxisSelect(figure) {
	      // Horizontal axis doesn't use a separate text tag
	      var group = figure.select("div.leftAxisControlGroup");

	      if (group.select("select").node()) {
	        var box = plotHelpers.helpers.getAxisBox(figure);
	        plotHelpers.helpers.fitTextToBox(group.select("text"), box, "vertical");
	      } // if

	    } // adjustAxisSelect

	  } // helpers

	}; // plotHelpers

	var cfD3BarChart = {
	  name: "cfD3BarChart",
	  make: function make(ctrl) {
	    // Remove any controls in the plot title.
	    // cfD3BarChart.interactivity.updatePlotTitleControls(element)
	    plotHelpers.setupPlot.general.setupPlotBackbone(ctrl);
	    plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl);
	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // Create the necessary markup groups.

	    var svg = ctrl.figure.select("svg.plotArea");
	    var markup = svg.select("g.markup");
	    markup.append("g").attr("class", "highlight");
	    markup.append("g").attr("class", "extent");
	    markup.append("g").attr("class", "label"); // Handle the select.

	    var i = cfD3BarChart.interactivity.onSelectChange;
	    plotHelpers.setupPlot.general.appendVerticalSelection(ctrl.figure, i.vertical(ctrl));
	    plotHelpers.setupPlot.general.updateVerticalSelection(ctrl);
	    cfD3BarChart.setupPlot.setupPlotTools(ctrl);
	    cfD3BarChart.helpers.axes.addXLabel(ctrl);
	    cfD3BarChart.update(ctrl);
	  },
	  // make
	  update: function update(ctrl) {
	    // Plot some bars to the background, which show the entire extent of the data, and additional bars on top to show current selection.
	    // Create some common handles.
	    var h = cfD3BarChart.draw; // Check if the data should be regrouped, or if an update to the existing state is required. This check should be performed here, as a need to regroup might come from outside (by changing the color variable).

	    if (h.isRegroupNeeded(ctrl)) {
	      // Perform the regroup
	      h.regroup(ctrl);
	    } else {
	      // Just update the view
	      h.update(ctrl);
	    } // if
	    // VARIABLE CHANGE MUST BE HANDLED SEPARATELY TO ALLOW THE DATA EXTENT TO UPDATE TOO!! MUST SIGNAL THAT THE Y VARIABLE CHANGED

	  },
	  // update
	  draw: {
	    plotDataExtent: function plotDataExtent(ctrl, items) {
	      var target = ctrl.figure.select("svg.plotArea").select("g.markup").select("g.extent");
	      cfD3BarChart.draw.bars(ctrl, items, target, "black", 0.2);
	    },
	    // plotDataExtent
	    plotSelectionBackground: function plotSelectionBackground(ctrl, items) {
	      var target = ctrl.figure.select("svg.plotArea").select("g.background");
	      cfD3BarChart.draw.bars(ctrl, items, target, "cornflowerblue", 0.5);
	    },
	    // plotSelectionBackground
	    plotCurrentSelection: function plotCurrentSelection(ctrl, items) {
	      // THIS HAS TO PLOT INTO THE BACKGROUND TOO!!
	      var target = ctrl.figure.select("svg.plotArea").select("g.data");
	      cfD3BarChart.draw.bars(ctrl, items, target, ctrl.tools.getFill, 1);
	    },
	    // plotCurrentSelection
	    bars: function bars(ctrl, items, target, color, opacity) {
	      // THIS HAS TO PLOT INTO THE BACKGROUND TOO!!
	      var t = ctrl.view.transitions; // The items should be plotted as rectangles. Everytime the grouping of the data is changed the rectangles retreat, regroup, and reappear.

	      var rect = target.selectAll("rect").data(items);
	      rect.enter().append("rect").attr("x", 0).attr("y", ctrl.tools.getY).attr("height", ctrl.tools.getHeight).attr("width", 0).style("fill", color).attr("opacity", opacity).attr("stroke-width", 0).transition().duration(t.duration).attr("x", ctrl.tools.getX).attr("width", ctrl.tools.getWidth);
	      rect.transition().duration(t.duration).attr("x", ctrl.tools.getX).attr("y", ctrl.tools.getY).attr("height", ctrl.tools.getHeight).attr("width", ctrl.tools.getWidth).style("fill", color).attr("opacity", opacity);
	      rect.exit().transition().duration(t.duration).attr("x", ctrl.tools.getX).attr("width", ctrl.tools.getWidth).remove();
	    },
	    // bars
	    plotMarkup: function plotMarkup(ctrl, items) {
	      var keyLabels = ctrl.figure.select("svg.plotArea").select("g.markup").select("g.label").selectAll(".keyLabel").data(items);
	      keyLabels.enter().append("text").attr("class", "keyLabel").attr("x", 0).attr("y", ctrl.tools.getLabelPosition).attr("dx", 5).attr("dy", ".35em").attr("text-anchor", "start").text(ctrl.tools.getLabel);
	      keyLabels.transition().attr("y", ctrl.tools.getLabelPosition).text(ctrl.tools.getLabel);
	      keyLabels.exit().remove();
	    },
	    // plotMarkup
	    isRegroupNeeded: function isRegroupNeeded(ctrl) {
	      var flag = ctrl.view.gVar != ctrl.view.yVarOption.val || ctrl.view.gClr != color.settings.val; // Update the 'gVar' and 'gClr' flags for next draw.				

	      ctrl.view.gVar = ctrl.view.yVarOption.val;
	      ctrl.view.gClr = color.settings.val;
	      return flag;
	    },
	    // isRegroupNeeded
	    regroup: function regroup(ctrl) {
	      // This function controls the retreat of the data to prepare for the redrawing using the new grouping of the data.
	      var svg = ctrl.figure.select("svg.plotArea"); // Remove the labels too.

	      svg.select("g.markup").selectAll(".keyLabel").transition().remove(); // Check which rectangles need to be removed. If just some grouping was changed (color), then only the colored rectangles in g.data need to be changed. If the y variable changed, then also the data extent needs to be changed.

	      var rects;

	      if (ctrl.view.yVarChanged) {
	        rects = svg.selectAll("g").selectAll("rect");
	        ctrl.view.yVarChanged = false;
	      } else {
	        // 
	        rects = svg.selectAll("g.data").selectAll("rect");
	      } // Remove the rectangles, and when completed order a redraw.


	      rects.transition().duration(500).attr("x", ctrl.tools.xscale(0)).attr("width", 0).remove().end().then(function () {
	        // All elements were removed. Update teh chart.
	        cfD3BarChart.draw.update(ctrl);
	      }); // then
	    },
	    // regroup
	    update: function update(ctrl) {
	      var h = cfD3BarChart.helpers;
	      var draw = cfD3BarChart.draw;
	      var unfilteredItems = h.getUnfilteredItems(ctrl.view.yVarOption.val);
	      var filterItems = h.getFilteredItems(ctrl.view.yVarOption.val);
	      var filterItemsGrouped = h.getFilteredItemsGrouped(ctrl.view.yVarOption.val); // Unfiltered data extent

	      draw.plotDataExtent(ctrl, unfilteredItems); // Current selection background

	      draw.plotSelectionBackground(ctrl, filterItems); // Handle the entering/updating/exiting of bars.

	      draw.plotCurrentSelection(ctrl, filterItemsGrouped); // Handle the entering/updating/exiting of bar labels.

	      draw.plotMarkup(ctrl, unfilteredItems); // Handle the axes.

	      h.axes.update(ctrl); // Add interactivity:

	      cfD3BarChart.interactivity.addOnMouseOver(ctrl);
	      cfD3BarChart.interactivity.addOnMouseClick(ctrl);
	    } // update

	  },
	  // draw
	  rescale: function rescale(ctrl) {
	    // What should happen if the window is resized?
	    // 1.) The svg should be resized appropriately
	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // 2.) The plot tools need to be updated 

	    cfD3BarChart.setupPlot.setupPlotTools(ctrl); // 3.) The plot needs to be redrawn

	    cfD3BarChart.update(ctrl);
	  },
	  // rescale
	  setupPlot: {
	    setupPlotTools: function setupPlotTools(ctrl) {
	      // The x and y axis tools need to be set up here. 
	      // Get the items to plot. This is done on all the data here, and the scales are created here as well. This will make the axes fixed, and the bars move accordingly. This can be changed if needed by adjusting the xscale domain appropriately
	      var property = ctrl.view.yVarOption.val;
	      var g = ctrl.figure.select("svg.plotArea").select("g.data");
	      var width = g.attr("width");
	      var height = g.attr("height"); // TEMPORARY

	      var items = cfD3BarChart.helpers.getUnfilteredItems(property); // The scale that will control the property used to visually convey numeric information.

	      ctrl.tools.xscale = d3.scaleLinear().range([0, width]).domain([0, d3.max(items, function (v) {
	        return v.members.length;
	      })]); // 'd2.scaleBand' does the division of the plotting area into separate bands based on input categorical values, and returns the number corresponding to the position of the band, and to the width of the band by calling '<scale>()', and '<scale>.bandwidth()' respectively.
	      // 'padding' sets the amount of space between the bands (innerPadding), and before and after the bands (outerPadding), to the same value.
	      // 'align' controls how the outer padding is distributed between both ends of the band range.

	      ctrl.tools.yscale = d3.scaleBand().range([0, height]).domain(items.map(function (d) {
	        return d.val;
	      }).sort()).padding([0.2]).align([0.5]);

	      ctrl.tools.getHeight = function (d) {
	        return ctrl.tools.yscale.bandwidth();
	      };

	      ctrl.tools.getWidth = function (d) {
	        return ctrl.tools.xscale(d.members.length);
	      };

	      ctrl.tools.getX = function (d) {
	        return ctrl.tools.xscale(d.x);
	      };

	      ctrl.tools.getY = function (d) {
	        return ctrl.tools.yscale(d.val);
	      };

	      ctrl.tools.getFill = function (d) {
	        return color.get(d.cVal);
	      };

	      ctrl.tools.getLabelPosition = function (d) {
	        return ctrl.tools.getY(d) + 0.5 * ctrl.tools.getHeight(d);
	      };

	      ctrl.tools.getLabel = function (d) {
	        return d.val;
	      };
	    } // setupPlotTools

	  },
	  // setupPlot
	  interactivity: {
	    onSelectChange: {
	      vertical: function vertical(ctrl) {
	        // Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
	        return function () {
	          var selectedVar = this.value; // Perform the regular task for y-select: update teh DOM elements, and the plot state object.

	          plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar); // Update the filter. If a variable is removed from view then it's filter must be removed as well. It is completely REMOVED, and not stored in the background. Filter checks the variables in the control objects.

	          filter.apply(); // Setup the tools anew.

	          cfD3BarChart.setupPlot.setupPlotTools(ctrl); // Signal that a regroup is required.

	          ctrl.view.yVarChanged = true; // Render is called because the filter may have changed.

	          sessionManager.render();
	        }; // return
	      } // vertical

	    },
	    // onSelectChange
	    addOnMouseClick: function addOnMouseClick(ctrl) {
	      // Add the mouse click event
	      var property = ctrl.view.yVarOption.val;
	      var svg = ctrl.figure.select("svg.plotArea").select("g.markup");
	      svg.selectAll("rect").on("click", onClick);

	      function onClick(d) {
	        // Update the filter selection.
	        filter.addUpdateMetadataFilter(property, d.val); // Apply the selected filters to the crossfilter object.

	        filter.apply(); // Everything needs to b rerendered as the plots change depending on one another according to the data selection.

	        sessionManager.render();
	      } // onClick

	    },
	    // addOnMouseClick
	    addOnMouseOver: function addOnMouseOver(ctrl) {
	      // Onle the rectangles showing the data outline are interactive.
	      var rects = ctrl.figure.select("svg.plotArea").select("g.markup").selectAll("rect");
	      rects.on("mouseover", crossHighlightOn).on("mouseout", crossHighlightOff);

	      function crossHighlightOn(d) {
	        // When mousing over a deselected item it should show the user the preview. This means it should show extra data. But it also means that it needs to keep track of active/inactive rectangles.
	        crossPlotHighlighting.on(d, "cfD3BarChart");
	      }

	      function crossHighlightOff(d) {
	        crossPlotHighlighting.off(d, "cfD3BarChart");
	      }
	    },
	    // addOnMouseOver
	    refreshContainerSize: function refreshContainerSize(ctrl) {
	      var container = d3.select(ctrl.format.parent);
	      builder.refreshPlotRowHeight(container);
	    } // refreshContainerSize

	  },
	  // interactivity
	  helpers: {
	    // Initialisation/saving
	    createDefaultControl: function createDefaultControl() {
	      var ctrl = {
	        plotFunc: cfD3BarChart,
	        figure: undefined,
	        svg: undefined,
	        view: {
	          yVarOption: undefined,
	          nBins: undefined,
	          transitions: cfD3BarChart.helpers.transitions.instantaneous(),
	          gVar: undefined,
	          gClr: undefined
	        },
	        tools: {
	          xscale: undefined,
	          yscale: undefined,
	          histogram: undefined
	        },
	        format: {
	          title: "Edit title",
	          margin: {
	            top: 10,
	            right: 0,
	            bottom: 30,
	            left: 30
	          },
	          axesMargin: {
	            top: 10,
	            right: 30,
	            bottom: 30,
	            left: 10
	          },
	          parent: undefined,
	          position: {
	            ix: 0,
	            iy: 0,
	            iw: 4,
	            ih: 4,
	            minH: 290,
	            minW: 190
	          }
	        }
	      }; // ctrl

	      var options = dbsliceData.data.categoricalProperties;
	      ctrl.view.yVarOption = {
	        name: "varName",
	        val: options[0],
	        options: options
	      };
	      ctrl.view.gVar = options[0];
	      return ctrl;
	    },
	    // createDefaultControl
	    createLoadedControl: function createLoadedControl(plotData) {
	      var ctrl = cfD3BarChart.helpers.createDefaultControl(); // If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.

	      if (plotData.yProperty != undefined) {
	        if (dbsliceData.data.categoricalProperties.includes(plotData.yProperty)) {
	          ctrl.view.yVarOption.val = plotData.yProperty;
	          ctrl.view.gVar = plotData.yProperty;
	        } // if						

	      } // if				


	      ctrl.format.title = plotData.title;
	      return ctrl;
	    },
	    // createLoadedControl
	    writeControl: function writeControl(ctrl) {
	      var s = "";
	      s = s + '{';
	      s = s + '"type": "' + ctrl.plotFunc.name + '", ';
	      s = s + '"title": "' + ctrl.format.title + '"'; // For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
	      // Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.

	      var xProperty = accessProperty(ctrl.view.yVarOption, "val");
	      s = s + writeOptionalVal("xProperty", xProperty);
	      s = s + '}';
	      return s;

	      function writeOptionalVal(name, val) {
	        var s_ = "";

	        if (val !== undefined) {
	          s_ = s_ + ', ';
	          s_ = s_ + '"' + name + '": "' + val + '"';
	        } // if


	        return s_;
	      } // writeOptionalVal


	      function accessProperty(o, p) {
	        // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
	        // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
	        return o == undefined ? undefined : o[p];
	      } // accessProperty

	    },
	    // writeControl
	    // Functions supporting interactivity
	    axes: {
	      update: function update(ctrl) {
	        cfD3BarChart.helpers.axes.formatAxesX(ctrl); // Empty y-axis as the labels are drawn.

	        ctrl.figure.select("svg.plotArea").select("g.axis--y").call(d3.axisLeft(ctrl.tools.yscale).tickValues([]));
	      },
	      // update
	      formatAxesX: function formatAxesX(ctrl) {
	        var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale);
	        ctrl.figure.select(".axis--x").selectAll("g.exponent").select("text").attr("fill", format.fill).select("tspan.exp").html(format.exp);
	        ctrl.figure.select(".axis--x").call(d3.axisBottom(format.scale).ticks(5));
	      },
	      // formatAxesY
	      addXLabel: function addXLabel(ctrl) {
	        ctrl.figure.select("div.bottomAxisControlGroup").append("text").attr("class", "txt-horizontal-axis").style("float", "right").style("margin-right", "15px").text("Number of Tasks");
	      } // addXLabel

	    },
	    // axes
	    transitions: {
	      instantaneous: function instantaneous() {
	        // For 'cfD3BarChart' animated transitions handles filter changes.
	        return {
	          duration: 500,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      },
	      // instantaneous
	      animated: function animated() {
	        // For 'cfD3BarChart' animated transitions handles variable changes.
	        return {
	          duration: 500,
	          updateDelay: 500,
	          enterDelay: 0
	        };
	      } // animated

	    },
	    // transitions
	    getItems: function getItems(tasks, groupKey, subgroupKey) {
	      // Make the subgroup the graphic basis, and plot it directly. Then make sure that the grouping changes are handled properly!!
	      var groupVals = dbsliceData.data.categoricalUniqueValues[groupKey];
	      var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.categoricalUniqueValues[subgroupKey]; // Loop over them to create the rectangles.

	      var items = [];
	      groupVals.forEach(function (groupVal) {
	        var x = 0;
	        subgroupVals.forEach(function (subgroupVal) {
	          // This will run at least once with the subgroup value of 'undefined'. In that case the item array will hold a single rectangle for each of the expected bars.
	          var members = tasks.filter(function (task) {
	            // In case where the subgroupKey passed in is 'undefined' this statement evaluates as 'undefined' == 'undefined'
	            return task[groupKey] == groupVal && task[subgroupKey] == subgroupVal;
	          });
	          var rectData = {
	            key: groupKey,
	            val: groupVal,
	            cKey: subgroupKey,
	            cVal: subgroupVal,
	            x: x,
	            members: members
	          };
	          items.push(rectData); // Update the position for the next subgroup.

	          x = x + members.length;
	        }); // subgroup
	      }); // group

	      return items;
	    },
	    // getItems
	    getFilteredItems: function getFilteredItems(property) {
	      var tasks = dbsliceData.data.categoricalDims[property].top(Infinity);
	      return cfD3BarChart.helpers.getItems(tasks, property, undefined);
	    },
	    // getFilteredItems
	    getFilteredItemsGrouped: function getFilteredItemsGrouped(property) {
	      var tasks = dbsliceData.data.categoricalDims[property].top(Infinity);
	      return cfD3BarChart.helpers.getItems(tasks, property, color.settings.variable);
	    },
	    // getFilteredItemsGrouped
	    getUnfilteredItems: function getUnfilteredItems(property) {
	      // 1.) get the unfiltered items for plotting. This means the plot will never zoom in, regardless of selection.
	      // 2.) get the items for plotting as before. This will change with selection, but will still allow subsets to be highlighted later on.
	      // First attempt with 1.). the other will be implemented later when it will be visible.
	      // When using 'filter.remove' and later 'filter.apply' the object 'items' changes after the filters are reapplied.
	      // Get all tasks.
	      var tasks = dbsliceData.data.cf.all(); // Make the items.

	      return cfD3BarChart.helpers.getItems(tasks, property, undefined); // https://stackoverflow.com/questions/33102032/crossfilter-group-a-filtered-dimension
	      // Crossfilter groups respect all filters except those of the dimension on which they are defined. Define your group on a different dimension and it will be filtered as you expect.
	    },
	    // getUnfilteredItems
	    // Functions supporting cross plot highlighting
	    unhighlight: function unhighlight(ctrl) {
	      /*
	      ctrl.figure
	        .select("svg.plotArea")
	        .select("g.data")
	        .selectAll("rect")
	          .attr("opacity", 0.5)
	      */
	    },
	    // unhighlight
	    highlight: function highlight(ctrl, allDataPoints) {
	      // Create bars for hte highlight
	      var highlightedData = cfD3BarChart.helpers.getItems(allDataPoints, ctrl.view.yVarOption.val, color.settings.variable); // Adjust hte transition times.

	      ctrl.view.transitions = cfD3BarChart.helpers.transitions.instantaneous(); // Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?

	      cfD3BarChart.draw.plotCurrentSelection(ctrl, highlightedData); // Reset the transition times.

	      ctrl.view.transitions = cfD3BarChart.helpers.transitions.animated();
	    },
	    // highlight
	    defaultStyle: function defaultStyle(ctrl) {
	      // Adjust hte transition times.
	      ctrl.view.transitions = cfD3BarChart.helpers.transitions.instantaneous();
	      cfD3BarChart.draw.update(ctrl); // Reset the transition times.

	      ctrl.view.transitions = cfD3BarChart.helpers.transitions.animated();
	    } // defaultStyle

	  } // helpers

	}; // cfD3BarChart

	var cfD3Histogram = {
	  name: "cfD3Histogram",
	  make: function make(ctrl) {
	    // Setup the object that will internally handle all parts of the chart.
	    plotHelpers.setupPlot.general.setupPlotBackbone(ctrl);
	    plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl);
	    plotHelpers.setupPlot.general.rescaleSvg(ctrl);
	    ctrl.figure.select("svg.plotArea").select("g.markup").append("g").attr("class", "extent");
	    var i = cfD3Histogram.interactivity.onSelectChange;
	    plotHelpers.setupPlot.general.appendHorizontalSelection(ctrl.figure, i.horizontal(ctrl));
	    plotHelpers.setupPlot.general.updateHorizontalSelection(ctrl);
	    cfD3Histogram.setupPlot.setupPlotTools(ctrl);
	    cfD3Histogram.interactivity.addBrush.make(ctrl);
	    cfD3Histogram.interactivity.addBinNumberControls.make(ctrl); // Add the y label to the y axis.

	    cfD3Histogram.helpers.axes.addYLabel(ctrl);
	    cfD3Histogram.update(ctrl);
	  },
	  update: function update(ctrl) {
	    // Create some common handles.
	    var h = cfD3Histogram.draw; // Check if the data should be regrouped, or if an update to the existing state is required. This check should be performed here, as a need to regroup might come from outside (by changing the color variable).

	    if (h.isRegroupNeeded(ctrl)) {
	      // Perform the regroup
	      h.regroup(ctrl);
	    } else {
	      // Just update the view
	      h.update(ctrl);
	    } // if

	  },
	  // update
	  draw: {
	    plotDataExtent: function plotDataExtent(ctrl, items) {
	      var target = ctrl.figure.select("svg.plotArea").select("g.markup").select("g.extent");
	      cfD3Histogram.draw.bars(ctrl, items, target, "black", 0.1);
	    },
	    // plotDataExtent
	    plotSelectionBackground: function plotSelectionBackground(ctrl, items) {
	      var target = ctrl.figure.select("svg.plotArea").select("g.background");
	      cfD3Histogram.draw.bars(ctrl, items, target, "cornflowerblue", 0.5);
	    },
	    // plotSelectionBackground
	    plotCurrentSelection: function plotCurrentSelection(ctrl, items) {
	      var target = ctrl.figure.select("svg.plotArea").select("g.data");
	      cfD3Histogram.draw.bars(ctrl, items, target, ctrl.tools.fill, 1);
	    },
	    // plotCurrentSelection
	    bars: function bars(ctrl, items, target, color, opacity) {
	      // Plotting
	      var t = ctrl.view.transitions; // Handle entering/updating/removing the bars.

	      var bars = target.selectAll("rect").data(items); // Finally append any new bars with 0 height, and then transition them to the appropriate height

	      var newBars = bars.enter();
	      newBars.append("rect").attr("transform", ctrl.tools.startState).attr("x", 1).attr("width", ctrl.tools.width).attr("height", 0).style("fill", color).attr("opacity", opacity).transition().delay(t.enterDelay).duration(t.duration).attr("height", ctrl.tools.height).attr("transform", ctrl.tools.finishState); // Now move the existing bars.

	      bars.transition().delay(t.updateDelay).duration(t.duration).attr("transform", ctrl.tools.finishState).attr("x", 1).attr("width", ctrl.tools.width).attr("height", ctrl.tools.height); // Remove any unnecessary bars by reducing their height to 0 and then removing them.

	      bars.exit().transition().duration(t.duration).attr("transform", ctrl.tools.startState).attr("height", 0).remove();
	    },
	    // bars
	    isRegroupNeeded: function isRegroupNeeded(ctrl) {
	      var flag = ctrl.view.gVar != ctrl.view.xVarOption.val || ctrl.view.gClr != color.settings.val; // Update the 'gVar' and 'gClr' flags for next draw.				

	      ctrl.view.gVar = ctrl.view.xVarOption.val;
	      ctrl.view.gClr = color.settings.val;
	      return flag;
	    },
	    // isRegroupNeeded
	    regroup: function regroup(ctrl) {
	      // This function controls the retreat of the data to prepare for the redrawing using the new grouping of the data.
	      var g = ctrl.figure.select("svg.plotArea").select("g.data"); // Remove the rectangles, and when completed order a redraw.

	      g.selectAll("rect").transition().duration(500).attr("transform", ctrl.tools.startState).attr("height", 0).remove().end().then(function () {
	        // Redo the plot tools
	        cfD3Histogram.setupPlot.setupPlotTools(ctrl); // Update the brush limits.

	        ctrl.figure.select("svg.plotArea").select(".selection").attr("xMin", d3.min(ctrl.tools.xscale.domain())).attr("xMax", d3.max(ctrl.tools.xscale.domain()));
	        cfD3Histogram.interactivity.addBrush.updateBrush(ctrl); // Update any bin controls.

	        cfD3Histogram.interactivity.addBinNumberControls.updateMarkers(ctrl); // All elements were removed. Update teh chart.

	        cfD3Histogram.draw.update(ctrl);
	      }); // then
	    },
	    // regroup
	    update: function update(ctrl) {
	      var h = cfD3Histogram.helpers;
	      var unfilteredItems = h.getUnfilteredItems(ctrl);
	      var filterItems = h.getFilteredItems(ctrl);
	      var filterItemsGrouped = h.getFilteredItemsGrouped(ctrl); // Unfiltered data extent

	      cfD3Histogram.draw.plotDataExtent(ctrl, unfilteredItems); // Current selection background

	      cfD3Histogram.draw.plotSelectionBackground(ctrl, filterItems); // Handle the entering/updating/exiting of bars.

	      cfD3Histogram.draw.plotCurrentSelection(ctrl, filterItemsGrouped); // Handle the axes.

	      cfD3Histogram.helpers.axes.update(ctrl);
	    } // update

	  },
	  // draw
	  rescale: function rescale(ctrl) {
	    // What should happen if the window is resized?
	    // 1.) The svg should be resized appropriately
	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // 2.) The plot tools need to be updated

	    cfD3Histogram.setupPlot.setupPlotTools(ctrl); // 3.) The plot needs to be redrawn

	    cfD3Histogram.update(ctrl); // Update the bin number controls.

	    cfD3Histogram.interactivity.addBinNumberControls.updateMarkers(ctrl); // UPDATE THE SELECT RECTANGLE TOO!!

	    cfD3Histogram.interactivity.addBrush.updateBrush(ctrl);
	  },
	  // rescale
	  setupPlot: {
	    setupPlotTools: function setupPlotTools(ctrl) {
	      // Desired properties for the bin widths:
	      //   1.) Constant bin width
	      //   2.) "nice" bin thresholds
	      //   Constant bin widths are achieved by specifying the ticks to be created via 'd3.ticks'. This also results in nice bin thresholds. Using '.nice()' is expected to round the domain limits to values that naturally coincide with the values created by 'd3.ticks'*.
	      //   The function requires the number of ticks to be created to be specified by the user. 'd3.thresholdSturges' computes a 'sensible' number of bins.
	      //   * This is potentially error prone as d3.ticks will not always return the number of ticks requested, but will instead try to find 'sesnible bins instead. This will need to be reworked if the number of bins is to be changeable...
	      //  */
	      // Get the values on which the calculation is performed
	      var items = dbsliceData.data.cf.all();
	      var g = ctrl.figure.select("svg.plotArea").select("g.data");
	      var width = Number(g.attr("width"));
	      var height = Number(g.attr("height"));

	      function xAccessor(d) {
	        return d[ctrl.view.xVarOption.val];
	      } // Create the domains and ranges that can be. The y domain is dependent on the binning of the data. Therefore it can only be specified after the histogram data has been created.


	      var xDomain = [d3.min(items, xAccessor), d3.max(items, xAccessor)];
	      var xRange = [0, width];
	      var yRange = [height, 0]; // Create the xscale to be used to calculate both the y domain, as well as to facilitate the plotting.

	      var x = d3.scaleLinear().domain(xDomain).range(xRange).nice(); // Create the histogram data. Note that the bin number will likely be altered by 'd3.ticks'...

	      var nBins = ctrl.view.nBins;

	      if (nBins == undefined) {
	        var values = [];
	        items.forEach(function (d) {
	          values.push(xAccessor(d));
	        });
	        nBins = d3.thresholdSturges(values);
	      } // if
	      // Calculate the thresholds by hand. Use the nice x domain as a starting point. D3.histogram insists on adding an additional bin that spans from 'maxVal' to the end of the domain, therefore remove the last value in the manually created thresholds.


	      var maxVal = d3.max(x.domain());
	      var minVal = d3.min(x.domain());
	      var t = d3.range(minVal, maxVal, (maxVal - minVal) / nBins); // t.splice(t.length-1, 1)
	      // If the minVal and maxVal are the same the d3.<calculateBinNumber> methods will still come up with a number of bins, as it only depends on the number of observations. In that case t will be empty, and the histogram will have no items displayed. Should the desired behavior be different?
	      // Due to the imprecision of storing values with repeated decimal patterns it can be that the last value is not included in the thresholds. This is a workaround.
	      // if(t.indexOf(maxVal) == -1){ t.push(maxVal) }

	      var histogram = d3.histogram().value(function (d) {
	        return d[ctrl.view.xVarOption.val];
	      }).domain(x.domain()).thresholds(t);
	      var bins = histogram(items); // Create the corresponding y scale. 
	      // NOTE: It might be required that this becomes a reactive scale, in which case it will need to be updated when brushing.

	      var yDomain = [0, d3.max(bins, function (d) {
	        return d.length;
	      })];
	      var y = d3.scaleLinear().domain(yDomain).range(yRange); // Assign the objects required for plotting and saving hte plot.

	      ctrl.tools.xscale = x;
	      ctrl.tools.yscale = y;
	      ctrl.tools.histogram = histogram; // nBins is saved instead of the actual bins, as those are expected to change with the movements of the brush.

	      ctrl.view.nBins = nBins;
	      ctrl.view.thresholds = t;

	      ctrl.tools.height = function height(d) {
	        // Height 
	        return ctrl.figure.select("svg.plotArea").select("g.data").attr("height") - ctrl.tools.yscale(d.members.length);
	      }; // height


	      ctrl.tools.width = function width(d) {
	        var width = ctrl.tools.xscale(d.x1) - ctrl.tools.xscale(d.x0) - 1;
	        width = width < 1 ? 1 : width;
	        return width;
	      }; // width


	      ctrl.tools.startState = function startState(d) {
	        var x = ctrl.tools.xscale(d.x0);
	        var y = ctrl.figure.select("svg.plotArea").select("g.data").attr("height");
	        return "translate(" + [x, y].join() + ")";
	      }; // startState


	      ctrl.tools.finishState = function finishState(d) {
	        var x = ctrl.tools.xscale(d.x0);
	        var y = ctrl.tools.yscale(d.members.length + d.x);
	        return "translate(" + [x, y].join() + ")";
	      }; // finishState


	      ctrl.tools.fill = function fill(d) {
	        return color.get(d.cVal);
	      }; // fill

	    } // setupPlotTools

	  },
	  // setupPlot
	  interactivity: {
	    onSelectChange: {
	      horizontal: function horizontal(ctrl) {
	        // Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
	        return function () {
	          var selectedVar = this.value; // Update the y-variable for the plot, and re-intialise the number of bins.

	          ctrl.view.xVarOption.val = selectedVar;
	          ctrl.view.nBins = undefined; // Update the filters. As the variable has changed perhaps the limits of the brush have as well.

	          filter.apply();
	          ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated(); // Update the graphics. As the variable changed and the fitler is getting removed the other plots should be notified.

	          sessionManager.render();
	        }; // return
	      } // vertical

	    },
	    // onSelectChange
	    addBrush: {
	      make: function make(ctrl) {
	        var h = cfD3Histogram.interactivity.addBrush;
	        var property = ctrl.view.xVarOption.val; // The hardcoded values need to be declared upfront, and abstracted.

	        var svg = ctrl.figure.select("svg.plotArea"); // Get the scale. All properties requried are in the svg.

	        var x = ctrl.tools.xscale; // There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again

	        var brush = svg.select(".brush");

	        if (brush.empty()) {
	          brush = svg.select("g.markup").append("g").attr("class", "brush").attr("xDomMin", x.domain()[0]).attr("xDomMax", x.domain()[1]);
	          var xMin = x.domain()[0];
	          var xMax = x.domain()[1]; // Initialise the filter if it isn't already.

	          var limits = dbsliceData.data.histogramSelectedRanges[property];

	          if (limits !== undefined) {
	            xMin = limits[0];
	            xMax = limits[1];
	          } else {
	            filter.addUpdateDataFilter(property, [xMin, xMax]);
	          } // if

	        } else {
	          // Setup the filter bounds in the cfInit??
	          var limits = dbsliceData.data.histogramSelectedRanges[property];
	          var xMin = limits[0];
	          var xMax = limits[1];
	          brush.selectAll("*").remove();
	        } // if


	        var width = x(xMax) - x(xMin);
	        var height = Number(svg.select("g.data").attr("height"));
	        var rect = brush.append("rect").attr("class", "selection").attr("cursor", "move").attr("width", width).attr("height", height).attr("x", x(xMin)).attr("y", 0).attr("opacity", 0.2).attr("xMin", xMin).attr("xMax", xMax); // Make the rect draggable

	        rect.call(d3.drag().on("drag", function () {
	          h.dragmove(this, ctrl);
	        })); // Make the rect scalable, and add rects to the left and right, and use them to resize the rect.

	        brush.append("rect").attr("class", "handle handle--e").attr("cursor", "ew-resize").attr("x", Number(rect.attr("x")) + Number(rect.attr("width"))).attr("y", Number(rect.attr("y")) + Number(rect.attr("height")) / 4).attr("width", 10).attr("height", Number(rect.attr("height")) / 2).attr("opacity", 0).call(d3.drag().on("drag", function () {
	          h.dragsize(this, ctrl);
	        }));
	        brush.append("rect").attr("class", "handle handle--w").attr("cursor", "ew-resize").attr("x", Number(rect.attr("x")) - 10).attr("y", Number(rect.attr("y")) + Number(rect.attr("height")) / 4).attr("width", 10).attr("height", Number(rect.attr("height")) / 2).attr("opacity", 0).call(d3.drag().on("drag", function () {
	          h.dragsize(this, ctrl);
	        })); // Decorative handles.	

	        brush.append("path").attr("d", h.drawHandle(rect, "e")).attr("stroke", "#000").attr("fill", "none").attr("class", "handle handle--decoration-e");
	        brush.append("path").attr("d", h.drawHandle(rect, "w")).attr("stroke", "#000").attr("fill", "none").attr("class", "handle handle--decoration-w");
	      },
	      // make
	      drawHandle: function drawHandle(rect, side) {
	        // Figure out the dimensions.
	        var height = Number(rect.attr("height"));
	        var width = Number(rect.attr("width"));
	        var xWest = Number(rect.attr("x"));
	        var yWest = Number(rect.attr("y")) + height / 4;
	        var x = side == "w" ? xWest : xWest + width;
	        var y = side == "w" ? yWest : yWest; // Figure out if the west or east handle is needed.

	        var flipConcave = side == "e" ? 1 : 0;
	        var flipDir = side == "e" ? 1 : -1;
	        var lambda = 30 / 300;
	        var r = lambda * height / 2;
	        r = r > 10 ? 10 : r;
	        var start = "M" + x + " " + y;
	        var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir * r, r].join(" ");
	        var leftLine = "h0 v" + (height / 2 - 2 * r);
	        var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir * r, r].join(" ");
	        var closure = "Z";
	        var innerLine = "M" + [x + flipDir * r / 2, y + r].join(" ") + leftLine;
	        return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ");
	      },
	      // drawHandle
	      dragmove: function dragmove(rectDOM, ctrl) {
	        // Setup the appropriate transition
	        ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous();
	        var h = cfD3Histogram.interactivity.addBrush;
	        var x = ctrl.tools.xscale;
	        var rect = d3.select(rectDOM);
	        var brush = d3.select(rectDOM.parentNode); // Update teh position of the left edge by the difference of the pointers movement.

	        var oldWest = Number(rect.attr("x"));
	        var oldEast = Number(rect.attr("x")) + Number(rect.attr("width"));
	        var newWest = oldWest + d3.event.dx;
	        var newEast = oldEast + d3.event.dx; // Check to make sure the boundaries are within the axis limits.

	        if (x.invert(newWest) < d3.min(x.domain())) {
	          newWest = d3.min(x.range());
	        } else if (x.invert(newEast) > d3.max(x.domain())) {
	          newEast = d3.max(x.range());
	        } // if
	        // Update the xMin and xMax values.


	        rect.attr("xMin", x.invert(newWest));
	        rect.attr("xMax", x.invert(newEast)); // Update the selection rect.

	        h.updateBrush(ctrl); // Update the data selection

	        h.updateSelection(ctrl);
	      },
	      // dragmove
	      dragsize: function dragsize(handleDOM, ctrl) {
	        // Setup the appropriate transition
	        ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous(); // Update teh position of the left edge by the difference of the pointers movement.

	        var h = cfD3Histogram.interactivity.addBrush;
	        var x = ctrl.tools.xscale;
	        var handle = d3.select(handleDOM);
	        var brush = d3.select(handleDOM.parentNode);
	        var rect = brush.select("rect.selection");
	        var oldWidth = Number(rect.attr("width"));
	        var oldWest = Number(rect.attr("x"));

	        switch (handle.attr("class")) {
	          case "handle handle--e":
	            // Change the width.
	            var newWidth = oldWidth + d3.event.dx;
	            var newWest = oldWest;
	            break;

	          case "handle handle--w":
	            // Change the width, and x both
	            var newWidth = oldWidth - d3.event.dx;
	            var newWest = oldWest + d3.event.dx;
	            break;
	        } // switch


	        var newEast = newWest + newWidth; // Check to make sure the boundaries are within the axis limits.

	        if (x.invert(newWest) < d3.min(x.domain())) {
	          newWest = d3.min(x.range());
	        } else if (x.invert(newEast) > d3.max(x.domain())) {
	          newEast = d3.max(x.range());
	        } // if
	        // Handle the event in which a handle has been dragged over the other.


	        if (newWest > newEast) {
	          newWidth = newWest - newEast;
	          newWest = newEast;
	          newEast = newWest + newWidth; // In this case just reclass both the handles - this takes care of everything.

	          var he = d3.select(".brush").select(".handle--e");
	          var hw = d3.select(".brush").select(".handle--w");
	          hw.attr("class", "handle handle--e");
	          he.attr("class", "handle handle--w");
	        } // if
	        // Update all brushes corresponding to the same dimId. This will take an overhaul of the process here. The update will have to read the min and max values straight from the filter, but this causes accelerated movement of the brush...
	        // Update the xMin and xMax values.


	        brush.select(".selection").attr("xMin", x.invert(newWest));
	        brush.select(".selection").attr("xMax", x.invert(newEast)); // Update the brush rectangle

	        h.updateBrush(ctrl); // Update the data selection

	        h.updateSelection(ctrl);
	      },
	      // dragsize
	      updateSelection: function updateSelection(ctrl) {
	        var nTasks_ = dbsliceData.data.taskDim.top(Infinity).length;
	        var x = ctrl.tools.xscale;
	        var rect = ctrl.figure.select("svg.plotArea").select(".selection");
	        var lowerBound = Number(rect.attr("x"));
	        var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"));
	        var selectedRange = [x.invert(lowerBound), x.invert(upperBound)]; // Update the filter range

	        filter.addUpdateDataFilter(ctrl.view.xVarOption.val, selectedRange); // Apply the appropriate filters to the crossfilter

	        filter.apply(); // Only update other plots if the number of elements in the filter has changed.

	        var nTasks = dbsliceData.data.taskDim.top(Infinity).length;

	        if (nTasks_ != nTasks) {
	          sessionManager.render();
	        } // if

	      },
	      // updateSelection
	      updateBrush: function updateBrush(ctrl) {
	        var h = cfD3Histogram.interactivity.addBrush; // First get the scale

	        var svg = ctrl.figure.select("svg.plotArea");
	        var height = svg.select("g.data").attr("height");
	        var rect = svg.select(".selection");
	        var x = ctrl.tools.xscale; // Now get the values that are supposed to be selected.

	        var xMin = Number(rect.attr("xMin"));
	        var xMax = Number(rect.attr("xMax")); // Update teh rect.

	        rect.attr("x", x(xMin)).attr("width", x(xMax) - x(xMin)).attr("height", height); // Update the handles				

	        svg.select(".brush").select(".handle--e").attr("x", x(xMax)).attr("y", height / 4).attr("height", height / 2);
	        svg.select(".brush").select(".handle--w").attr("x", x(xMin) - 10).attr("y", height / 4).attr("height", height / 2); // Update the handle decorations

	        svg.select(".brush").select(".handle--decoration-e").attr("d", h.drawHandle(rect, "e"));
	        svg.select(".brush").select(".handle--decoration-w").attr("d", h.drawHandle(rect, "w"));
	      } // updateBrush

	    },
	    // addBrush
	    addBinNumberControls: {
	      make: function make(ctrl) {
	        // GENERALISE THE GROUP TRANSFORM!!
	        var h = cfD3Histogram.interactivity.addBinNumberControls;
	        var svg = ctrl.figure.select("svg.plotArea");
	        var height = svg.select("g.data").attr("height"); // Add in the markers

	        var g = svg.select("g.markup").select("g.binControls");

	        if (g.empty()) {
	          // this g already has a transform added to it (the y-axes translate). Therefore only the height needs to be corrected in order for the markers to be located at the x axis.
	          g = svg.select("g.markup").append("g").attr("class", "binControls").attr("transform", "translate(0," + height + ")");
	        } // if
	        // Add in the controls.


	        h.updateMarkers(ctrl); // Add interactivity to the axis
	        // Initialise the behaviour monitors

	        var downx = Math.NaN;
	        var dx = Math.NaN;
	        svg.select("g.binControls").on("mousedown", function (d) {
	          downx = d3.event.x;
	          dx = 0;
	        }); // on
	        // attach the mousemove and mouseup to the body
	        // in case one wonders off the axis line

	        svg.on("mousemove", function (d) {
	          // Check if the update of bin numbers has been appropriately initiated.
	          if (!isNaN(downx)) {
	            // Update the distance moved.
	            dx = d3.event.x - downx;

	            if (Math.abs(dx) > 20) {
	              // rebase the dx by changing downx, otherwise a new bin is added for every pixel movement above 20, wheteher positive or negative.
	              downx = d3.event.x; // Only the bin number depends on the dx, and it does so because the number of bins can be increased or decreased

	              h.updateBinNumber(ctrl, dx); // Update the plot

	              h.update(ctrl);
	            } // if

	          } // if

	        }).on("mouseup", function (d) {
	          downx = Math.NaN;
	          dx = Math.NaN;
	        });
	      },
	      // make
	      update: function update(ctrl) {
	        var h = cfD3Histogram.interactivity.addBinNumberControls; // First update the plotting tools.

	        cfD3Histogram.setupPlot.setupPlotTools(ctrl); // Update the markers

	        h.updateMarkers(ctrl); // Update transition times

	        ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated(); // Update the chart graphics.

	        cfD3Histogram.update(ctrl);
	      },
	      // update
	      updateBinNumber: function updateBinNumber(ctrl, dx) {
	        // Change the number of bins, and redo the plotting tools. Note that if the number of bins is 1 the bin should not be removed.
	        // Control the direction of the behavior.
	        var sign = dx > 0 ? -1 : 1; // Update the bin number

	        ctrl.view.nBins = ctrl.view.nBins + 1 * sign; // Impose minimum number of bins as 1

	        if (ctrl.view.nBins < 1) {
	          ctrl.view.nBins = 1;
	        }
	      },
	      // updateBinNumber
	      updateMarkers: function updateMarkers(ctrl) {
	        var svg = ctrl.figure.select("svg.plotArea");
	        var height = svg.select("g.data").attr("height"); // Update the bin control markers. The white markers do not interfere with the axis ticks as those are added later in the main update method.

	        var markers = svg.select("g.markup").select("g.binControls").attr("transform", "translate(0," + height + ")").selectAll("polygon");
	        markers.data(ctrl.view.thresholds).enter().append("polygon").attr("points", "0,0 10,12, -10,12").attr("transform", makeTranslate).attr("style", "fill:white;cursor:ew-resize");
	        markers.transition().duration(ctrl.view.transitions.duration).attr("transform", makeTranslate);
	        markers.exit().remove();

	        function makeTranslate(d) {
	          return "translate(" + ctrl.tools.xscale(d) + ",1)";
	        } // makeTRanslate

	      } // updateMarkers

	    },
	    // addBinNumberControls
	    refreshContainerSize: function refreshContainerSize(ctrl) {
	      var container = d3.select(ctrl.format.parent);
	      builder.refreshPlotRowHeight(container);
	    } // refreshContainerSize

	  },
	  // setupInteractivity
	  helpers: {
	    axes: {
	      update: function update(ctrl) {
	        cfD3Histogram.helpers.axes.formatAxesY(ctrl);
	        cfD3Histogram.helpers.axes.formatAxesX(ctrl);
	      },
	      // update
	      formatAxesY: function formatAxesY(ctrl) {
	        var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.yscale);
	        var gExponent = ctrl.figure.select(".axis--y").selectAll("g.exponent").select("text").attr("fill", format.fill).select("tspan.exp").html(format.exp); // The y axis shows a number of items, which is always an integer. However, integers in scientific notation can have decimal spaces. Therefore pick integers from the original scale, and then transform them into the new scale.

	        var yAxisTicks = ctrl.tools.yscale.ticks().filter(function (d) {
	          return Number.isInteger(d);
	        }).map(function (d) {
	          return Number.isInteger(format.exp) ? d / Math.pow(10, format.exp) : d;
	        });
	        ctrl.figure.select(".axis--y").call(d3.axisLeft(format.scale).tickValues(yAxisTicks).tickFormat(d3.format("d")));
	      },
	      // formatAxesY
	      formatAxesX: function formatAxesX(ctrl) {
	        var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale);
	        var gExponent = ctrl.figure.select(".axis--x").selectAll("g.exponent");
	        gExponent.select("tspan.exp").html(format.exp);
	        gExponent.select("text").attr("fill", format.fill);
	        ctrl.figure.select(".axis--x").call(d3.axisBottom(format.scale).ticks(5));
	      },
	      // formatAxesY
	      addYLabel: function addYLabel(ctrl) {
	        ctrl.figure.select("g.axis--y").selectAll("text.yAxisLabel").data(["Number of tasks"]).enter().append("text").attr("class", "yAxisLabel").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -25).attr("text-anchor", "end").style("font-weight", "bold").style("font-size", 12).text(function (d) {
	          return d;
	        });
	      } // addYLabel

	    },
	    // axes
	    createAxes: function createAxes(ctrl) {
	      var svg = ctrl.figure.select("svg.plotArea");
	      svg.select("g.axis--x").call(d3.axisBottom(ctrl.tools.xscale)); // Y AXIS
	      // Find the desirable tick locations - integers.

	      var yAxisTicks = ctrl.tools.yscale.ticks().filter(function (d) {
	        return Number.isInteger(d);
	      });
	      svg.select("g.axis--y").transition().duration(ctrl.view.transitions.duration).call(d3.axisLeft(ctrl.tools.yscale).tickValues(yAxisTicks).tickFormat(d3.format("d")));
	    },
	    // createAxes
	    transitions: {
	      instantaneous: function instantaneous() {
	        return {
	          duration: 500,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      },
	      // instantaneous
	      animated: function animated() {
	        return {
	          duration: 500,
	          updateDelay: 500,
	          enterDelay: 1000
	        };
	      } // animated

	    },
	    // transitions
	    // Initialisation
	    createDefaultControl: function createDefaultControl() {
	      var ctrl = {
	        plotFunc: cfD3Histogram,
	        figure: undefined,
	        svg: undefined,
	        view: {
	          xVarOption: undefined,
	          nBins: undefined,
	          gVar: undefined,
	          transitions: {
	            duration: 500,
	            updateDelay: 0,
	            enterDelay: 0
	          }
	        },
	        tools: {
	          xscale: undefined,
	          yscale: undefined,
	          histogram: undefined
	        },
	        format: {
	          title: "Edit title",
	          margin: {
	            top: 10,
	            right: 0,
	            bottom: 30,
	            left: 0
	          },
	          axesMargin: {
	            top: 20,
	            right: 20,
	            bottom: 16,
	            left: 45
	          },
	          parent: undefined,
	          position: {
	            ix: 0,
	            iy: 0,
	            iw: 4,
	            ih: 4,
	            minH: 290,
	            minW: 190
	          }
	        }
	      }; // ctrl

	      var options = dbsliceData.data.ordinalProperties;
	      ctrl.view.xVarOption = {
	        name: "varName",
	        val: options[0],
	        options: options
	      };
	      ctrl.view.gVar = options[0];
	      return ctrl;
	    },
	    // createDefaultControl
	    createLoadedControl: function createLoadedControl(plotData) {
	      var ctrl = cfD3Histogram.helpers.createDefaultControl(); // If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.

	      if (plotData.xProperty != undefined) {
	        if (dbsliceData.data.ordinalProperties.includes(plotData.xProperty)) {
	          ctrl.view.xVarOption.val = plotData.xProperty;
	          ctrl.view.gVar = plotData.xProperty;
	        } // if						

	      } // if	


	      ctrl.format.title = plotData.title;
	      return ctrl;
	    },
	    // createLoadedControl
	    writeControl: function writeControl(ctrl) {
	      var s = "";
	      s = s + '{';
	      s = s + '"type": "' + ctrl.plotFunc.name + '", ';
	      s = s + '"title": "' + ctrl.format.title + '"'; // For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
	      // Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.

	      var xProperty = accessProperty(ctrl.view.xVarOption, "val");
	      s = s + writeOptionalVal("xProperty", xProperty);
	      s = s + '}';
	      return s;

	      function writeOptionalVal(name, val) {
	        var s_ = "";

	        if (val !== undefined) {
	          s_ = s_ + ', ';
	          s_ = s_ + '"' + name + '": "' + val + '"';
	        } // if


	        return s_;
	      } // writeOptionalVal


	      function accessProperty(o, p) {
	        // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
	        // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
	        return o == undefined ? undefined : o[p];
	      } // accessProperty

	    },
	    // writeControl
	    getItems: function getItems(bins, subgroupKey) {
	      // For cfD3Histogram this function transforms the outputs from hte histogram into a format that allows individual color subgroups to be shown. As in the bar chart several rectangles are made for this.
	      // Make the subgroup the graphic basis, and plot it directly. Then make sure that the grouping changes are handled properly!!
	      var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.categoricalUniqueValues[subgroupKey]; // Loop over them to create the rectangles.

	      var items = [];
	      bins.forEach(function (bin) {
	        var x = 0;
	        subgroupVals.forEach(function (subgroupVal) {
	          // This will run at least once with the subgroup value of 'undefined'. In that case the item array will hold a single rectangle for each of the expected bars.
	          var members = bin.filter(function (task) {
	            // In case where the subgroupKey passed in is 'undefined' this statement evaluates as 'undefined' == 'undefined'
	            return task[subgroupKey] == subgroupVal;
	          });
	          var rectData = {
	            x0: bin.x0,
	            x1: bin.x1,
	            cKey: subgroupKey,
	            cVal: subgroupVal,
	            x: x,
	            members: members
	          };
	          items.push(rectData); // Update the position for the next subgroup.

	          x = x + members.length;
	        }); // subgroup
	      }); // group

	      return items;
	    },
	    // getItems
	    getUnfilteredItems: function getUnfilteredItems(ctrl) {
	      var items = dbsliceData.data.cf.all();
	      var bins = ctrl.tools.histogram(items);
	      return cfD3Histogram.helpers.getItems(bins, undefined);
	    },
	    // getUnfilteredItems
	    getFilteredItems: function getFilteredItems(ctrl) {
	      var items = dbsliceData.data.taskDim.top(Infinity);
	      var bins = ctrl.tools.histogram(items);
	      return cfD3Histogram.helpers.getItems(bins, undefined);
	    },
	    // getFilteredItems
	    getFilteredItemsGrouped: function getFilteredItemsGrouped(ctrl) {
	      var items = dbsliceData.data.taskDim.top(Infinity);
	      var bins = ctrl.tools.histogram(items);
	      return cfD3Histogram.helpers.getItems(bins, color.settings.variable);
	    },
	    // getFilteredItemsGrouped
	    // Functions for cross plot highlighting
	    unhighlight: function unhighlight(ctrl) {// Do nothing. On all actions the graphics showing the current selection are being updated, which changes the amount of elements on hte screen accordingly.
	    },
	    // unhighlight
	    highlight: function highlight(ctrl, allDataPoints) {
	      // Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?
	      var highlightedBins = ctrl.tools.histogram(allDataPoints);
	      var highlightedData = cfD3Histogram.helpers.getItems(highlightedBins, color.settings.variable); // Adjust hte transition times.

	      ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous(); // Draw the highlighted data.

	      cfD3Histogram.draw.plotCurrentSelection(ctrl, highlightedData); // Adjust hte transition times.

	      ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous();
	    },
	    // highlight
	    defaultStyle: function defaultStyle(ctrl) {
	      // Adjust hte transition times.
	      ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous();
	      cfD3Histogram.draw.update(ctrl); // Adjust hte transition times.

	      ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous();
	    } // defaultStyle

	  } // helpers

	}; // cfD3Histogram

	var cfD3Scatter = {
	  name: "cfD3Scatter",
	  make: function make(ctrl) {
	    // Major differences from the standalone example to the implemented one:
	    // 1.) The input arguments to the make have been changed to (element, data, layout)
	    // 2.) The data is now an object containing the selected inputs by the user, as well as the crossfilter object governing the data. Therefore the internal access to the data has to be changed. This is done on point of access to the data to ensure that the crossfilter selections are correctly applied.
	    // 3.) Some actions are performed from outside of the object, therefore the ctrl has to be passed in. That is why the ctrl is hidden in layout now.
	    var s = cfD3Scatter.setupPlot;
	    var hs = plotHelpers.setupPlot;
	    var i = cfD3Scatter.interactivity;
	    var hi = plotHelpers.setupInteractivity.twoInteractiveAxes; // Add the manual selection toggle to its title.
	    // hs.twoInteractiveAxes.updatePlotTitleControls(ctrl)
	    // Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.

	    hs.twoInteractiveAxes.setupPlotBackbone(ctrl); // Create the svg with all required children container groups and append it to the appropriate backbone div.

	    hs.general.rescaleSvg(ctrl); // Add in the controls for the y axis.

	    hs.general.appendVerticalSelection(ctrl.figure, hi.onSelectChange.vertical(ctrl)); // Add in the controls for the x axis.

	    hs.general.appendHorizontalSelection(ctrl.figure, hi.onSelectChange.horizontal(ctrl)); // Add teh button menu - in front of the update for it!

	    hs.twoInteractiveAxes.buttonMenu.make(ctrl); // Get the variable options

	    s.updateUiOptions(ctrl); // Setup the scales for plotting

	    plotHelpers.setupTools.go(ctrl); // Scatter plot specific interactivity.

	    hi.addAxisScaling(ctrl); // General interactivity

	    hi.addZooming(ctrl);
	    i.createLineTooltip(ctrl);
	    i.createPointTooltip(ctrl); // Draw the actual plot. The first two inputs are dummies.

	    cfD3Scatter.update(ctrl);
	  },
	  // make
	  update: function update(ctrl) {
	    // On re-render the 'update' is called in the render, therefore it must exist. To conform with the line plot functionality the update plot here executes the redraw for now. Later on it should handle all preparatory tasks as well.
	    cfD3Scatter.draw.plotDataExtent(ctrl);
	    cfD3Scatter.draw.plotCurrentSelection(ctrl);
	    cfD3Scatter.refresh(ctrl);
	  },
	  // update
	  draw: {
	    plotDataExtent: function plotDataExtent(ctrl) {
	      // Plot everything there is.
	      // Accessor functions
	      var accessor = cfD3Scatter.helpers.getAccessors(ctrl);
	      var clipPath = "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")"; // Get the data to draw.

	      var pointData = cfD3Scatter.helpers.getPointData(ctrl); // Deal with the points

	      var points = ctrl.figure.select("svg.plotArea").select(".data").selectAll("circle").data(pointData, function (d) {
	        return d.taskId;
	      });
	      points.join(function (enter) {
	        return enter.append("circle").attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", "Gainsboro").style("opacity", 1).attr("clip-path", clipPath).attr("task-id", accessor.id).each(function (d) {
	          cfD3Scatter.interactivity.addPointTooltip(ctrl, this);
	        });
	      }, function (update) {
	        return update;
	      }, function (exit) {
	        return exit.remove();
	      });
	    },
	    // plotDataExtent
	    plotCurrentSelection: function plotCurrentSelection(ctrl) {
	      // Current selection separates the current selection from the background data extent by coloring them appropriately.
	      // Change the properties of the selected part.
	      // Get the data to draw.
	      var accessor = cfD3Scatter.helpers.getAccessors(ctrl);
	      var pointData = cfD3Scatter.helpers.getPointData(ctrl);
	      var taskIds = pointData.map(function (d) {
	        return d.taskId;
	      }); // Weird... right now all data should still be drawn...

	      var gData = ctrl.figure.select("svg.plotArea").select("g.data");
	      gData.selectAll("circle").filter(function (d_) {
	        return taskIds.includes(d_.taskId);
	      }).style("fill", function (d) {
	        return accessor.c(d);
	      }).raise(); // If drawing was needed, then also the lines need to be updated. Drawing should only be updated if the variable is actiually selected.

	      ctrl.view.gVarOption.action = ctrl.view.gVarOption.val ? "draw" : undefined;
	    } // plotCurrentSelection

	  },
	  // draw
	  refresh: function refresh(ctrl) {
	    // Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.
	    // Refresh is called on zoom!! On zoom nothing is entering or leaving, it's just readjusted.
	    var h = cfD3Scatter.helpers;
	    var i = cfD3Scatter.interactivity; // Check to adjust the width of the plot in case of a redraw.

	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // Accessor functions

	    var accessor = h.getAccessors(ctrl); // Refresh point positions

	    var points = ctrl.figure.select("svg.plotArea").select(".data").selectAll("circle").transition().duration(ctrl.view.transitions.duration).attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).attr("task-id", accessor.id); // Update the markup lines to follow on zoom

	    i.groupLine.update(ctrl); // Update the axes

	    h.axes.update(ctrl); // Highlight any manually selected tasks.

	    i.addSelection(ctrl); // Add in the interactivity of the tooltips

	    i.addLineTooltip(ctrl);
	  },
	  // refresh
	  rescale: function rescale(ctrl) {
	    // What should happen if the window is resized?
	    // 1.) The svg should be resized appropriately
	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // 2.) The plot tools need to be updated

	    plotHelpers.setupTools.go(ctrl); // 3.) The plot needs to be redrawn

	    cfD3Scatter.refresh(ctrl);
	  },
	  // rescale
	  setupPlot: {
	    // This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
	    updateUiOptions: function updateUiOptions(ctrl) {
	      // Improve this so that in case the metadata gets changed this changes appropriately - e.g. if the new metadata has the same values, then these options should keep them.
	      var gh = plotHelpers.setupPlot.general;
	      var h = plotHelpers.setupPlot.twoInteractiveAxes; // Update the actual menus

	      gh.updateVerticalSelection(ctrl);
	      gh.updateHorizontalSelection(ctrl); // Update the dropup menu

	      h.buttonMenu.update(ctrl, assembleButtonMenuOptions());

	      function assembleButtonMenuOptions() {
	        // The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
	        // Make a custom option that fires an aspect ratio readjustment.
	        var arOption = {
	          name: "AR",
	          val: undefined,
	          options: ["User / Unity"],
	          event: cfD3Scatter.interactivity.toggleAR
	        }; // arOption
	        // Make functionality options for the menu.

	        var codedPlotOptions = [color.settings];
	        return codedPlotOptions;
	      } // assembleButtonMenuOptions

	    },
	    // updateUiOptions
	    // Helpers for setting up plot tools.
	    findPlotDimensions: function findPlotDimensions(svg) {
	      return {
	        x: [0, Number(svg.select("g.data").attr("width"))],
	        y: [Number(svg.select("g.data").attr("height")), 0]
	      };
	    },
	    // findPlotDimensions
	    findDomainDimensions: function findDomainDimensions(ctrl) {
	      // Get the data to draw.
	      var pointData = cfD3Scatter.helpers.getPointData(ctrl); // Dealing with single array.

	      var xMinVal = d3.min(pointData, xAccessor);
	      var yMinVal = d3.min(pointData, yAccessor);
	      var xMaxVal = d3.max(pointData, xAccessor);
	      var yMaxVal = d3.max(pointData, yAccessor);
	      return {
	        x: [xMinVal, xMaxVal],
	        y: [yMinVal, yMaxVal]
	      };

	      function xAccessor(d) {
	        return d[ctrl.view.xVarOption.val];
	      }

	      function yAccessor(d) {
	        return d[ctrl.view.yVarOption.val];
	      }
	    } // findDomainDimensions

	  },
	  // setupPlot
	  interactivity: {
	    onSelectChange: function onSelectChange(ctrl) {
	      // Reset the AR values.
	      ctrl.view.dataAR = undefined;
	      ctrl.view.viewAR = undefined; // Update the plot tools

	      plotHelpers.setupTools.go(ctrl); // Update transition timings

	      ctrl.view.transitions = cfD3Scatter.helpers.transitions.animated(); // Update plot itself

	      cfD3Scatter.update(ctrl);
	    },
	    // onSelectChange
	    // Tooltips
	    createLineTooltip: function createLineTooltip(ctrl) {
	      // The tooltips are shared among the plots, therefore check if the tooltip is already available first.
	      if (ctrl.view.lineTooltip == undefined) {
	        ctrl.view.lineTooltip = createTip();
	      } // if


	      function createTip() {
	        // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
	        var tip = d3.tip().attr('class', 'd3-tip').attr("type", "cfD3ScatterLineTooltip").offset([-15, 0]).html(function (d) {
	          return "<span>" + [ctrl.view.gVarOption.val, '=', d[0][ctrl.view.gVarOption.val]].join(' ') + "</span>";
	        });
	        ctrl.figure.select("svg.plotArea").call(tip);
	        return tip;
	      } // createTip

	    },
	    // createLineTooltip
	    addLineTooltip: function addLineTooltip(ctrl, lineDOM) {
	      // This controls al the tooltip functionality.
	      var lines = d3.select(lineDOM);
	      lines.on("mouseover", tipOn).on("mouseout", tipOff);

	      function tipOn(d) {
	        lines.style("opacity", 0.2);
	        d3.select(this).style("opacity", 1.0).style("stroke-width", "4px");
	        var anchorPoint = ctrl.figure.select("svg.plotArea").select(".background").select(".anchorPoint").attr("cx", d3.mouse(this)[0]).attr("cy", d3.mouse(this)[1]);
	        ctrl.view.lineTooltip.show(d, anchorPoint.node());
	      }

	      function tipOff(d) {
	        lines.style("opacity", 1.0);
	        d3.select(this).style("stroke-width", "2.5px");
	        ctrl.view.lineTooltip.hide();
	      }
	    },
	    // addLineTooltip
	    createPointTooltip: function createPointTooltip(ctrl) {
	      if (ctrl.view.pointTooltip == undefined) {
	        ctrl.view.pointTooltip = createTip();
	      } // if


	      function createTip() {
	        var tip = d3.tip().attr('class', 'd3-tip').attr("type", "pointTooltip").offset([-10, 0]).html(function (d) {
	          return "<span>" + d.taskId + "</span>";
	        });
	        ctrl.figure.select("svg.plotArea").call(tip);
	        return tip;
	      } // createTip

	    },
	    // createPointTooltip
	    addPointTooltip: function addPointTooltip(ctrl, pointDOM) {
	      // This controls al the tooltip functionality.
	      var points = d3.select(pointDOM);
	      points.on("mouseover", tipOn).on("mouseout", tipOff);

	      function tipOn(d) {
	        points.style("opacity", 0.2);
	        d3.select(this).style("opacity", 1.0).attr("r", 7);
	        ctrl.view.pointTooltip.show(d);
	        crossPlotHighlighting.on(d, "cfD3Scatter");
	      }

	      function tipOff(d) {
	        points.style("opacity", 1);
	        d3.select(this).attr("r", 5);
	        ctrl.view.pointTooltip.hide();
	        crossPlotHighlighting.off(d, "cfD3Scatter");
	      }
	    },
	    // addPointTooltip
	    // Manual selection
	    addSelection: function addSelection(ctrl) {
	      // This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
	      var points = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle");
	      points.on("click", selectPoint);

	      function selectPoint(d) {
	        var filteredPoints = cfD3Scatter.helpers.getPointData();

	        if (filteredPoints.includes(d)) {
	          // Toggle the selection
	          var p = dbsliceData.data.manuallySelectedTasks; // Is this point in the array of manually selected tasks?

	          var isAlreadySelected = p.indexOf(d.taskId) > -1;

	          if (isAlreadySelected) {
	            // The poinhas currently been selected, but must now be removed
	            p.splice(p.indexOf(d.taskId), 1);
	          } else {
	            p.push(d.taskId);
	          } // if
	          // Highlight the manually selected options.


	          crossPlotHighlighting.manuallySelectedTasks();
	        } // if

	      } // selectPoint

	    },
	    // addSelecton
	    // Custom options for dropup menu
	    groupLine: {
	      update: function update(ctrl) {
	        // 'update' executes what 'make' lined up.
	        // Shorthand handle
	        var h = cfD3Scatter.interactivity.groupLine;

	        switch (ctrl.view.gVarOption.action) {
	          case "zoom":
	            // Just update the lines
	            h.updateLines(ctrl, 0);
	            break;

	          case "draw":
	            h.drawLines(ctrl, ctrl.view.gVarOption.val);
	            break;

	          case "remove":
	            h.removeLines(ctrl);
	            break;

	          case "replace":
	            h.replaceLines(ctrl, ctrl.view.gVarOption.val);
	            break;
	        } // switch
	        // After the action is performed the action needs to be changed to the default - "zoom".


	        ctrl.view.gVarOption.action = "zoom";
	      },
	      // update
	      make: function make(ctrl, varName, linesVarSame) {
	        // This is separated so that the lines just move with the zoom. Notice that this function does not handle zoom!!
	        // Options to cover
	        var noLines = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").empty();

	        if (noLines) {
	          // 1: no existing lines - draw new lines
	          // h.drawLines(ctrl, varName)
	          ctrl.view.gVarOption.action = "draw";
	        } else if (linesVarSame) {
	          // 2: existing lines - same var -> remove lines
	          // h.removeLines(ctrl)
	          ctrl.view.gVarOption.action = "remove";
	        } else {
	          // 2: existing lines - diff var -> remove and add
	          // h.replaceLines(ctrl, varName)
	          ctrl.view.gVarOption.action = "replace";
	        } // if


	        cfD3Scatter.interactivity.groupLine.update(ctrl);
	      },
	      // make
	      drawLines: function drawLines(ctrl, varName) {
	        // Shorthand handles.
	        var h = cfD3Scatter.interactivity.groupLine;
	        var i = cfD3Scatter.interactivity; // Get the data to draw.

	        var pointData = ctrl.plotFunc.helpers.getPointData(ctrl); // Retrieve all the series that are needed.

	        var s = getUniqueArraySeries(pointData, varName); // Now draw a line for each of them.

	        var paths = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").data(s);
	        paths.enter().append("path").attr("stroke", "black").attr("stroke-width", "2").attr("fill", "none").attr("clip-path", "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")").each(function (d) {
	          i.addLineTooltip(ctrl, this);
	        }); // Update transitions:

	        ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated(); // Do the actual drawing of it in the update part.

	        h.updateLines(ctrl, ctrl.view.transitions.duration); // Remove any now unnecessary lines.

	        paths.exit().each(function () {
	          var totalLength = this.getTotalLength();
	          d3.select(this).transition().duration(ctrl.view.transitions.duration).ease(d3.easeLinear).attr("stroke-dashoffset", totalLength).on("end", function () {
	            d3.select(this).remove();
	          });
	        }); // Update the tooltips. These can be missing if new data is added.

	        ctrl.plotFunc.interactivity.addLineTooltip(ctrl); // HELPER

	        function getUniqueArraySeries(array, varName) {
	          // First get the unique values of the variable used for grouping.
	          var u = getUniqueArrayValues(array, varName);
	          var s = [];
	          u.forEach(function (groupName) {
	            var groupData = array.filter(function (d) {
	              return d[varName] == groupName;
	            });
	            s.push(groupData);
	          });
	          return s;
	        } // getUniqueArraySeries


	        function getUniqueArrayValues(array, varName) {
	          // This function returns all the unique values of property 'varName' from an array of objects 'array'.
	          var u = [];
	          array.forEach(function (d) {
	            if (u.indexOf(d[varName]) == -1) {
	              u.push(d[varName]);
	            } // if

	          });
	          return u;
	        } // getUniqueArrayValues

	      },
	      // drawLines
	      removeLines: function removeLines(ctrl) {
	        // Update transitions:
	        ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated(); // Schedule removal transitions.

	        ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").each(function () {
	          var totalLength = this.getTotalLength();
	          d3.select(this).transition().duration(ctrl.view.transitions.duration).ease(d3.easeLinear).attr("stroke-dashoffset", totalLength).on("end", function () {
	            d3.select(this).remove();
	          });
	        });
	      },
	      // removeLines
	      replaceLines: function replaceLines(ctrl, varName) {
	        var h = cfD3Scatter.interactivity.groupLine; // Update transitions:

	        ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated(); // n is a coutner to allow tracking of when all the transitions have finished. This is required as the drawLines should only execute once at teh end.

	        var n = 0;
	        ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").each(function () {
	          n++;
	          var totalLength = this.getTotalLength();
	          d3.select(this).transition().duration(ctrl.view.transitions.duration).ease(d3.easeLinear).attr("stroke-dashoffset", totalLength).on("end", function () {
	            n--;
	            d3.select(this).remove();

	            if (n == 0) {
	              h.drawLines(ctrl, varName); // The lines were removed, therefore new tooltips are needed.

	              ctrl.plotFunc.interactivity.addLineTooltip(ctrl);
	            } // if

	          }); // on
	        }); // each
	      },
	      // replaceLines
	      updateLines: function updateLines(ctrl, t) {
	        // Accessor functions
	        var accessor = ctrl.plotFunc.helpers.getAccessors(ctrl);
	        var line = d3.line().curve(d3.curveCatmullRom).x(accessor.x).y(accessor.y);
	        var paths = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path"); // The whole animation uses the framework of dashed lines. The total length of the desired line is set for the length of the dash and the blank space. Then the transition starts offsetting the start point of the dash to make the 'movement'.	

	        paths.each(function () {
	          var path = d3.select(this).attr("d", line);
	          var totalLength = path.node().getTotalLength();
	          path.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(t).ease(d3.easeLinear).attr("stroke-dashoffset", 0);
	        });
	      } // updateLines

	    },
	    // groupLine
	    toggleAR: function toggleAR(ctrl) {
	      if (ctrl.view.viewAR == 1) {
	        // Change back to the data aspect ratio. Recalculate the plot tools.
	        ctrl.view.viewAR = ctrl.view.dataAR;
	        plotHelpers.setupTools.go(ctrl);
	      } else {
	        // Change to the unity aspect ratio. Adjust the y-axis to achieve it.
	        ctrl.view.viewAR = 1; // When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
	        // Adjust so that the middle of the plot stays at the same place.
	        // How many pixels per dx=1

	        var xRange = ctrl.tools.xscale.range();
	        var yRange = ctrl.tools.yscale.range();
	        var xDomain = ctrl.tools.xscale.domain();
	        var yDomain = ctrl.tools.yscale.domain();
	        var xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0]);
	        var yAR = xAR / ctrl.view.viewAR;
	        var yDomainRange = [yRange[0] - yRange[1]] / yAR;
	        var yDomain_ = [yDomain[0] - yDomainRange / 2, yDomain[0] + yDomainRange / 2];
	        ctrl.tools.yscale.domain(yDomain_);
	      } // if
	      // t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.


	      ctrl.view.t = -1;
	      ctrl.view.transitions = cfD3Scatter.helpers.transitions.animated();
	      cfD3Scatter.update(ctrl);
	      ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous();
	    },
	    // toggleAR
	    // When resizing the axes interactively
	    dragAdjustAR: function dragAdjustAR(ctrl) {
	      // Transitions
	      ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous(); // Offload to the function itself!! Line cannot update as per new axes, because it uses transform -> translate to move the lines around.

	      cfD3Scatter.update(ctrl);
	    },
	    // dragAdjustAR
	    // On resize/drag
	    refreshContainerSize: function refreshContainerSize(ctrl) {
	      var container = d3.select(ctrl.format.parent);
	      builder.refreshPlotRowHeight(container);
	    } // refreshContainerSize

	  },
	  // interactivity
	  helpers: {
	    // Initialisation
	    createDefaultControl: function createDefaultControl() {
	      var ctrl = {
	        plotFunc: cfD3Scatter,
	        figure: undefined,
	        view: {
	          viewAR: NaN,
	          dataAR: NaN,
	          xVarOption: undefined,
	          yVarOption: undefined,
	          cVarOption: undefined,
	          gVarOption: undefined,
	          lineTooltip: undefined,
	          pointTooltip: undefined,
	          transitions: {
	            duration: 0,
	            updateDelay: 0,
	            enterDelay: 0
	          },
	          t: undefined
	        },
	        tools: {
	          xscale: undefined,
	          yscale: undefined
	        },
	        format: {
	          title: "Edit title",
	          margin: {
	            top: 10,
	            right: 10,
	            bottom: 38,
	            left: 30
	          },
	          axesMargin: {
	            top: 20,
	            right: 20,
	            bottom: 16,
	            left: 30
	          },
	          parent: undefined,
	          position: {
	            ix: 0,
	            iy: 0,
	            iw: 4,
	            ih: 4,
	            minH: 290,
	            minW: 190
	          }
	        }
	      }; // ctrl
	      // Initialise the options straight away.

	      var i = cfD3Scatter.interactivity;
	      var options = dbsliceData.data.ordinalProperties;
	      ctrl.view.xVarOption = {
	        name: "varName",
	        val: options[0],
	        options: options
	      };
	      ctrl.view.yVarOption = {
	        name: "varName",
	        val: options[0],
	        options: options
	      };
	      ctrl.view.cVarOption = color.settings; // Custom option.

	      ctrl.view.gVarOption = {
	        name: "Line",
	        val: undefined,
	        options: dbsliceData.data.categoricalProperties,
	        event: i.groupLine.make,
	        action: undefined
	      };
	      return ctrl;
	    },
	    // createDefaultControl
	    createLoadedControl: function createLoadedControl(plotData) {
	      var ctrl = cfD3Scatter.helpers.createDefaultControl(); // If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.

	      if (plotData.xProperty != undefined) {
	        if (dbsliceData.data.ordinalProperties.includes(plotData.xProperty)) {
	          ctrl.view.xVarOption.val = plotData.xProperty;
	        } // if						

	      } // if


	      if (plotData.yProperty != undefined) {
	        if (dbsliceData.data.ordinalProperties.includes(plotData.yProperty)) {
	          ctrl.view.yVarOption.val = plotData.yProperty;
	        } // if						

	      } // if


	      ctrl.format.title = plotData.title;
	      return ctrl;
	    },
	    // createLoadedControl
	    writeControl: function writeControl(ctrl) {
	      var s = "";
	      s = s + '{';
	      s = s + '"type": "' + ctrl.plotFunc.name + '", ';
	      s = s + '"title": "' + ctrl.format.title + '"'; // For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
	      // Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.

	      var xProperty = accessProperty(ctrl.view.xVarOption, "val");
	      var yProperty = accessProperty(ctrl.view.yVarOption, "val");
	      s = s + writeOptionalVal("xProperty", xProperty);
	      s = s + writeOptionalVal("yProperty", yProperty);
	      s = s + '}';
	      return s;

	      function writeOptionalVal(name, val) {
	        var s_ = "";

	        if (val !== undefined) {
	          s_ = s_ + ', ';
	          s_ = s_ + '"' + name + '": "' + val + '"';
	        } // if


	        return s_;
	      } // writeOptionalVal


	      function accessProperty(o, p) {
	        // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
	        // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
	        return o == undefined ? undefined : o[p];
	      } // accessProperty

	    },
	    // writeControl
	    // Interactivity
	    axes: {
	      update: function update(ctrl) {
	        cfD3Scatter.helpers.axes.formatAxesY(ctrl);
	        cfD3Scatter.helpers.axes.formatAxesX(ctrl);
	        cfD3Scatter.helpers.axes.updateTicks(ctrl);
	      },
	      // update
	      formatAxesY: function formatAxesY(ctrl) {
	        var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.yscale);
	        ctrl.figure.select(".axis--y").selectAll("g.exponent").select("text").attr("fill", format.fill).select("tspan.exp").html(format.exp);
	        ctrl.figure.select(".axis--y").call(d3.axisLeft(format.scale));
	      },
	      // formatAxesY
	      formatAxesX: function formatAxesX(ctrl) {
	        var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale);
	        ctrl.figure.select(".axis--x").selectAll("g.exponent").select("text").attr("fill", format.fill).select("tspan.exp").html(format.exp);
	        ctrl.figure.select(".axis--x").call(d3.axisBottom(format.scale).ticks(5));
	      },
	      // formatAxesX
	      updateTicks: function updateTicks(ctrl) {
	        // Update all the axis ticks.
	        ctrl.figure.select("svg.plotArea").select(".axis--x").selectAll(".tick").selectAll("text").style("cursor", "ew-resize");
	        ctrl.figure.select("svg.plotArea").select(".axis--y").selectAll(".tick").selectAll("text").style("cursor", "ns-resize");
	        ctrl.figure.select("svg.plotArea").selectAll(".tick").selectAll("text").on("mouseover", function () {
	          d3.select(this).style("font-weight", "bold");
	        }).on("mouseout", function () {
	          d3.select(this).style("font-weight", "normal");
	        });
	      } // updateTicks

	    },
	    // axes
	    transitions: {
	      instantaneous: function instantaneous() {
	        return {
	          duration: 0,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      },
	      // instantaneous
	      animated: function animated() {
	        return {
	          duration: 500,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      } // animated

	    },
	    // transitions
	    // Data handling
	    getAccessors: function getAccessors(ctrl) {
	      return {
	        x: function xAccessor(d) {
	          return ctrl.tools.xscale(d[ctrl.view.xVarOption.val]);
	        },
	        y: function yAccessor(d) {
	          return ctrl.tools.yscale(d[ctrl.view.yVarOption.val]);
	        },
	        c: function cAccessor(d) {
	          return color.get(d[ctrl.view.cVarOption.val]);
	        },
	        id: function idAccessor(d) {
	          return d.taskId;
	        }
	      };
	    },
	    // getAccessors
	    getPointData: function getPointData(ctrl) {
	      return dbsliceData.data.taskDim.top(Infinity);
	    },
	    // getPointData
	    getUnfilteredPointData: function getUnfilteredPointData(ctrl) {
	      filter.remove();
	      var unfilteredData = dbsliceData.data.taskDim.top(Infinity);
	      filter.apply();
	      return unfilteredData;
	    },
	    // getUnfilteredPointData
	    // Functions for cross plot highlighting:
	    unhighlight: function unhighlight(ctrl) {
	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle").style("fill", "Gainsboro"); // .style("opacity", 0.2);
	    },
	    // unhighlight
	    highlight: function highlight(ctrl, allDataPoints) {
	      var taskIds = allDataPoints.map(function (d) {
	        return d.taskId;
	      });
	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle").filter(function (d_) {
	        return taskIds.includes(d_.taskId);
	      }).style("fill", "cornflowerblue").attr("r", 7);
	    },
	    // highlight
	    defaultStyle: function defaultStyle(ctrl) {
	      // Use crossfilter to do these loops? How to speed this all up?
	      var filteredItems = cfD3Scatter.helpers.getPointData(ctrl);
	      var taskIds = filteredItems.map(function (d) {
	        return d.taskId;
	      }); // This should only color the filtered items in blue.

	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle").filter(function (d_) {
	        return taskIds.includes(d_.taskId);
	      }).style("fill", "cornflowerblue").attr("r", 5);
	    },
	    // defaultStyle
	    // Manual interactivity
	    updateManualSelections: function updateManualSelections(ctrl) {
	      var g = ctrl.figure.select("svg.plotArea").select("g.data"); // Instead of color change the border??
	      // Default style

	      g.selectAll("circle").style("stroke", "none"); // Color in selected circles.

	      dbsliceData.data.manuallySelectedTasks.forEach(function (d) {
	        g.selectAll("circle[task-id='" + d + "']").style("stroke", "rgb(255, 127, 14)").style("stroke-width", 4);
	      }); //forEach
	    } // updateManualSelections

	  } // helpers

	}; // cfD3Scatter

	var categoryInfo = {
	  catCompatibleTypes: {
	    categorical: ["number", "string", "line2dFile", "contour2dFile"],
	    ordinal: ["number"],
	    line2dFile: ["line2dFile"],
	    contour2dFile: ["contour2dFile"]
	  },
	  // catCompatibleTypes
	  cat2type: {
	    categorical: "string",
	    ordinal: "number",
	    line2dFile: "line2dFile",
	    contour2dFile: "contour2dFile"
	  },
	  // cat2type
	  cat2ind: {
	    categorical: 0,
	    ordinal: 1,
	    line2dFile: 2,
	    contour2dFile: 3,
	    unused: 4
	  },
	  // cat2ind
	  cat2prop: {
	    categorical: "categoricalProperties",
	    ordinal: "ordinalProperties",
	    line2dFile: "line2dProperties",
	    contour2dFile: "contour2dProperties",
	    unused: "unusedProperties"
	  },
	  // cat2prop
	  ind2cat: {
	    0: "categorical",
	    1: "ordinal",
	    2: "line2dFile",
	    3: "contour2dFile",
	    4: "unused"
	  },
	  // ind2cat
	  // Move to input testing
	  supportedCategories: ["categorical", "ordinal", "line2dFile", "contour2dFile", "Unused"] // supportedCategories

	}; // categoryInfo

	var errors = {
	  /* ERRORS SHOULD (!!!) BE LOGGED IN AN ERROR OBJECT TO ALLOW THE FAULTY FILES TO BE RELEASED FROM MEMORY!!
	  		Errors are loged into a single array, as it is easier to have all the error sorting in the errors object, rather than scattered throughout the loaders.
	  		Maybe split of the error handling into a separate module?? A sort of reporting module? Add the report generation to it here!
	  		*/
	  log: [],
	  // log
	  report: {
	    generate: function generate() {
	      // Create a section for each of the files. On-demand files should be grouped by the metadata file that asks for it. 
	      // Group all errors by their requester.
	      var report = errors.log.reduce(function (acc, er) {
	        if (acc[er.requester]) {
	          acc[er.requester].push(er);
	        } else {
	          acc[er.requester] = [er];
	        } // if


	        return acc;
	      }, {}); // Errors with user requested files (on-demand files loaded by the user through the UI) should just be reported as individual items.
	      // On-demand files requested indirectly (from metadata) can fail only if the metadata was successfully loaded beforehand. Therefore if the metadata load fails, then the on-demand files will not be loaded at all. Therefore the report as it stands is sufficient! Submenu functionality is not needed!
	      // This report will be bound to the DOM, and as each attribute in report is supposed to have a corresponding DOM element, the report should be an array!!

	      var reportArray = Object.getOwnPropertyNames(report).map(function (name) {
	        return {
	          title: name,
	          content: report[name]
	        };
	      });
	      return reportArray;
	    },
	    // generate
	    // Outside INTERACTIVITY
	    show: function show() {
	      var fullscreenContainer = d3.select("#report-container");
	      fullscreenContainer.style("display", "");
	    },
	    // show
	    hide: function hide() {
	      var fullscreenContainer = d3.select("#report-container"); // Hide the container. Bring up the variable handling.

	      fullscreenContainer.style("display", "none");
	    },
	    // hide
	    // BUILDER
	    builder: {
	      make: function make() {
	        // Clear the parent.
	        var parent = d3.select("#report-container");
	        parent.selectAll("*").remove(); // Collect the error data. The error report should be an array!!

	        var errorReport = errors.report.generate(); // Build the DOM

	        errors.report.builder.build.menu(parent, errorReport); // Make it interactive!

	        var menus = parent.node().querySelectorAll(".accordion");
	        errors.report.builder.addFunctionality(menus);
	      },
	      // make
	      build: {
	        menu: function menu(parent, report) {
	          // Have the fullscreen container in index.html
	          var menuContainer = parent.append("div").attr("class", "card card-menu");
	          menuContainer.append("div").attr("class", "card-header").append("h1").html("Report:"); // Body

	          var varCategories = menuContainer.append("div").attr("class", "card-body").style("overflow-y", "auto").style("overflow-x", "auto").selectAll("div").data(report).enter().append("div").each(function (d) {
	            errors.report.builder.build.submenu(d3.select(this), d);
	          }); // Footer

	          menuContainer.append("div").attr("class", "card-footer").append("button").attr("class", "btn btn-success").html("Understood").on("click", errors.report.hide);
	        },
	        // menu
	        submenu: function submenu(parent, itemReport) {
	          // Builds the whole menu item, which will be an accordion menu.
	          var button = parent.append("button").attr("class", "accordion").style("outline", "none");
	          button.append("strong").html(itemReport.title);
	          button.append("span").attr("class", "badge badge-pill badge-info").style("float", "right").html(itemReport.content.length);
	          var content = parent.append("div").attr("class", "panel").append("ul");
	          content.selectAll("li").data(itemReport.content).enter().append("li").html(errors.report.builder.build.item); // url requester interpreter error

	          return content;
	        },
	        // submenu
	        item: function item(_item) {
	          // No need to report the requestor - this is communicated b the menu structure!
	          // When classifying csv variables onDemandData is used for probable files. Otherwise the classifier restricts the file types!
	          return "<b>".concat(_item.url, "</b> interpreted as <b>").concat(_item.interpreter, "</b> produced <b>").concat(_item.report.message.fontcolor("red"), "</b>");
	        } // item

	      },
	      // build
	      addFunctionality: function addFunctionality(menus) {
	        // Opening the menus.
	        for (var i = 0; i < menus.length; i++) {
	          menus[i].addEventListener("click", function () {
	            this.classList.toggle("active");
	            var panel = this.nextElementSibling;

	            if (panel.style.display === "block") {
	              panel.style.display = "none";
	            } else {
	              panel.style.display = "block";
	            }
	          });
	        } // for

	      } // addFunctionality

	    } // builder

	  } // report

	}; // errors

	var dbsliceFile = /*#__PURE__*/function () {
	  function dbsliceFile(file, requester) {
	    _classCallCheck(this, dbsliceFile); // How to load if file is an actual File object.


	    if (file instanceof File) {
	      file = {
	        url: URL.createObjectURL(file),
	        filename: file.name
	      };
	    } // if


	    this.url = file.url;
	    this.filename = file.filename;
	    this.extension = file.filename.split(".").pop();
	    this.promise = undefined; // Also log the requestor. If this was passed in then use the passed in value, otherwise the requestor is the user.

	    this.requester = requester ? requester : "User";
	  } // constructor


	  _createClass(dbsliceFile, [{
	    key: "load",
	    value: function load() {
	      // Collect the data and perform input testing.
	      var obj = this; // Based on the url decide how to load the file.

	      var loader;

	      switch (this.extension) {
	        case "csv":
	          loader = function loader(url) {
	            return d3.csv(url);
	          };

	          break;

	        case "json":
	          loader = function loader(url) {
	            return d3.json(url);
	          };

	          break;

	        default:
	          // Return a rejected promise as the file extension is wrong.
	          loader = function loader() {
	            return Promise.reject(new Error("LoaderError: Unsupported Extension"));
	          };

	          break;
	      }
	      // Wrap in a larger promise that allows the handling of exceptions.

	      var loadPromise = new Promise(function (resolve, reject) {
	        // If the URL points to a non-existing file the d3 loader will reject the promise and throw an error, but still proceed down the resolve branch!
	        loader(obj.url).then(function (content) {
	          // Since d3 insists on running the resolve branch even though it doesn't find the file, handle missing contents here.
	          // csv files are always read as strings - convert numbers to numbers. Should be done here. If it's done in a preceeding promise then the error is lost.
	          obj.content = content;
	          resolve(obj);
	        }, function (e) {
	          // 'e' is an error triggered during loading.
	          // The two errors that can enter here are file missing, and a problem reading the file.
	          // This routes any errors that d3 might have into hte new promise.
	          reject(e);
	        });
	      }).then(this.format).then(this.onload)["catch"](function (e) {
	        // This catches all the rejects. 'e' is the field into which the error can be logged.
	        delete obj.content;
	        errors.log.push({
	          url: obj.url,
	          interpreter: obj.constructor.name,
	          report: e,
	          requester: obj.requester
	        });
	        return obj;
	      });
	      this.promise = loadPromise;
	    } // load

	  }, {
	    key: "onload",
	    value: function onload(obj) {
	      return obj;
	    } // onload

	  }, {
	    key: "format",
	    value: function format(obj) {
	      return obj;
	    } // format

	  }], [{
	    key: "testrow",
	    value: // test
	    // Maybe move these to helpers??
	    function testrow(array) {
	      if (array.length > 0) {
	        var i = Math.floor(Math.random() * array.length);
	        return {
	          i: i,
	          row: array[i]
	        }; // return
	      } else {
	        throw new Error("InvalidInput: Array without entries");
	      } // if

	    } // testrow

	  }, {
	    key: "convertNumbers",
	    value: function convertNumbers(array) {
	      return array.map(function (row) {
	        var r = {};

	        for (var k in row) {
	          r[k] = +row[k];

	          if (isNaN(r[k])) {
	            r[k] = row[k];
	          } // if

	        } // for


	        return r;
	      });
	    } // convertNumbers

	  }]);

	  return dbsliceFile;
	}(); // dbsliceFile
	// Declare file types here.

	dbsliceFile.test = {
	  structure: function structure(fileClass, content) {
	    // This an abstract test director. When a file is loaded the file classes do not know exactly how to handle to contents. This test director tries different implemented approaches to reformat the data, and stops when a suitable approach is found. In the future this may be extended to the point where the test involves performing a dummy plotting operation, as the plotting is the last operation to be performed on the file data.
	    var content_; // No differentiating between the structure or the content failing - the file classes are trying several different structures.
	    // Try to use all different file structures possible.

	    Object.getOwnPropertyNames(fileClass.structure).every(function (name) {
	      try {
	        content_ = fileClass.structure[name](content); // Return false breaks the loop. This return is reached only if the test was successfully performed and passed.

	        return content_ ? false : true;
	      } catch (e) {
	        // Keep looping
	        content_ = undefined;
	        return true;
	      } // try

	    }); // forEach

	    if (content_) {
	      // Restructuring succeeded.
	      return content_;
	    } else {
	      throw new Error("InvalidFile: Unsupported data structure");
	    } // if

	  } // structure

	};
	var metadataFile = /*#__PURE__*/function (_dbsliceFile) {
	  _inherits(metadataFile, _dbsliceFile);

	  var _super = _createSuper(metadataFile);

	  function metadataFile() {
	    var _this;

	    _classCallCheck(this, metadataFile);

	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    _this = _super.call.apply(_super, [this].concat(args));
	    _this.classify = {
	      all: function all(obj) {
	        // This already executes in a promise chain, therefore it's not needed to update the obj.promise. The promises created here will be resolved before the overhead promise resolves further.
	        // Create all the testing promises.
	        var testPromises = obj.content.variables.map(function (variable) {
	          // Check this column. Variable is now an object!
	          return obj.classify.variable(obj, variable);
	        }); // Return the final promise.

	        return Promise.all(testPromises).then(function (variableClassification) {
	          // The promises update the variable classification into the file object directly.
	          // obj.content.categories = variableClassification
	          return obj;
	        });
	      },
	      // all
	      variable: function variable(obj, _variable) {
	        // Retrieve an actual value already.
	        var testrow = dbsliceFile.testrow(obj.content.data);
	        var testval = testrow.row[_variable.name]; // Split the testing as per the variable type received.

	        var promise;

	        switch (_typeof(testval)) {
	          case "string":
	            // String can be a file too.
	            _variable.type = "string";
	            promise = obj.classify.string(obj, _variable, testval);
	            break;

	          case "number":
	            _variable.category = "ordinal";
	            _variable.type = "number";
	            promise = _variable;
	            break;

	          default:
	            _variable.category = "Unused";
	            _variable.type = undefined;
	            promise = _variable;
	        } // switch


	        return promise;
	      },
	      // variable
	      string: function string(obj, variable, testval) {
	        // If the string is a file, load it in to identify it's structure. It's not important which extension the file has, but what is it's internal structure.
	        // 'obj' is needed to construct an on-load response, 'variable' and 'testval' to have the name value pair.  
	        var promise; // Create a new onDemandFile to load in it's contents.

	        switch (testval.split(".").pop()) {
	          case "json":
	          case "csv":
	            // Try to classify the testval as a file. The requester is the metadata for which the variables are being classified.
	            var testFile = new onDemandFile({
	              url: testval,
	              filename: testval
	            }, obj.filename);
	            promise = obj.classify.file(variable, testFile);
	            break;

	          default:
	            // Unsupported extension.
	            variable.category = "categorical";
	            promise = variable;
	        } // switch


	        return promise;
	      },
	      // string
	      file: function file(variable, testFile) {
	        // Make a new generic on-demand file, and return a promise that will return the file type.
	        testFile.load(); // What can go wrong:
	        // file is not found
	        // file has wrong content
	        // Below 'obj' represents 'testFile'.

	        return Promise.all([testFile.promise]).then(function (obj) {
	          // It's possible that hte file was found and loaded correctly. In that case 'obj.content.format' will contain the name of the file type. Otherwise this field will not be accessible.
	          try {
	            // Category is the categorisation that will actually be used, and type cannot be changed.
	            variable.category = obj[0].content.format;
	            variable.type = obj[0].content.format;
	            return variable;
	          } catch (_unused) {
	            // If the loading failed for whatever reason the variable is retained as a categorical.
	            variable.category = "categorical";
	            return variable;
	          } // try

	        });
	      } // file

	    };
	    return _this;
	  }

	  _createClass(metadataFile, [{
	    key: "onload",
	    value: function onload(obj) {
	      // This executes in a promise chain, therefore the overhead promise will wait until thiss is fully executed.
	      // Check if suitable categories have already been declared.
	      var classificationPromise;

	      if (!obj.content.categories) {
	        // Launch the variable classification.
	        classificationPromise = obj.classify.all(obj);
	      } else {
	        classificationPromise = Promise.resolve().then(function (d) {
	          return obj;
	        });
	      } // if 
	      // To ensure that the classification is included into the loading promise chain a promise must be returned here. This promise MUST return obj. 'classify.all' returns a promise, which returns the object with the classified variables.


	      return classificationPromise;
	    } // onload

	  }, {
	    key: "format",
	    value: function format(obj) {
	      // Restructure the data into an expected format
	      obj.content = dbsliceFile.test.structure(metadataFile, obj.content);
	      return obj;
	    } // format

	  }], [{
	    key: "cat2var",
	    value: // classify
	    // Where is this used??
	    function cat2var(categories) {
	      // If categories are given, just report the categorisation. But do check to make sure all of the variables are in the categories!! What to do with label and taskId??
	      var variables = [];
	      var declaredVariables;
	      Object.getOwnPropertyNames(categories).forEach(function (category) {
	        if (categoryInfo.supportedCategories.includes(category)) {
	          declaredVariables = categories[category].map(function (d) {
	            return {
	              name: d,
	              category: category,
	              type: categoryInfo.cat2type[category]
	            };
	          });
	          variables = variables.concat(declaredVariables);
	        } // if

	      }); // Check that all hte variables are declared!

	      return variables;
	    } // category2variable

	  }]);

	  return metadataFile;
	}(dbsliceFile); // metadataFile
	// For a general unknown on-demand file

	metadataFile.structure = {
	  csv2metadataFile: function csv2metadataFile(content) {
	    var content_; // Data values need to be converted to numbers. Convert the 'variables' into objects?

	    content_ = {
	      variables: content.columns.map(function (d) {
	        return {
	          name: d,
	          category: undefined,
	          type: undefined
	        };
	      }),
	      data: dbsliceFile.convertNumbers(content)
	    };
	    metadataFile.test.content(content_);
	    delete content_.data.columns;
	    return content_;
	  },
	  // array
	  json2metadataFile: function json2metadataFile(content) {
	    var content_;
	    content_ = {
	      variables: Object.getOwnPropertyNames(dbsliceFile.testrow(content.data).row).map(function (d) {
	        return {
	          name: d,
	          category: undefined,
	          type: undefined
	        };
	      }),
	      data: content.data
	    }; // Check if declared variables contain all variables in the data.

	    var allVariablesDeclared = helpers.arrayEqual(metadataFile.cat2var(content.header).map(function (d) {
	      return d.name;
	    }), content_.variables.map(function (d) {
	      return d.name;
	    })); // All variables are declared, but have they been declared in the right categories??

	    if (allVariablesDeclared) {
	      // All variables have been declared. The categories can be assigned as they are.
	      content_.variables = metadataFile.cat2var(content.header);
	    } // if


	    metadataFile.test.content(content_);
	    return content_;
	  } // object

	};
	metadataFile.test = {
	  content: function content(_content) {
	    // Columns require a taskId property.
	    // Declared categories must contain all variables.
	    // All rows must be the same lenght
	    // There must be some rows.
	    // Data must be iterable
	    // Check if the data is an array (has function length)
	    var isThereAnyData = Array.isArray(_content.data) && _content.data.length > 0; // Test to make sure all rows have the same number of columns.

	    var areRowsConsistent = true;
	    var testrow = dbsliceFile.testrow(_content.data).row;

	    _content.data.forEach(function (row) {
	       helpers.arrayEqual(Object.getOwnPropertyNames(testrow), Object.getOwnPropertyNames(row));
	    }); // forEach


	    return isThereAnyData && areRowsConsistent;
	  } // content

	};
	var onDemandFile = /*#__PURE__*/function (_dbsliceFile2) {
	  _inherits(onDemandFile, _dbsliceFile2);

	  var _super2 = _createSuper(onDemandFile);

	  function onDemandFile() {
	    _classCallCheck(this, onDemandFile);

	    return _super2.apply(this, arguments);
	  }

	  _createClass(onDemandFile, [{
	    key: "onload",
	    value: function onload(obj) {
	      // During the data formatting the format of the file is determined already. Here just report it onwards.
	      return obj;
	    } // onload

	  }, {
	    key: "format",
	    value: function format(obj) {
	      // Here try all different ways to format the data. If the formatting succeeds, then check if the contents are fine.
	      var availableFileClasses = [line2dFile, contour2dFile]; // Here just try to fit the data into all hte supported data formats, and see what works.

	      var format;
	      availableFileClasses.every(function (fileClass) {
	        try {
	          // The structure test will throw an error if the content cannot be handled correctly.
	          dbsliceFile.test.structure(fileClass, obj.content); // This file class can handle the data.

	          format = fileClass.name;
	        } catch (_unused2) {
	          return true;
	        } // if

	      }); // Output the object, but add it's format to the name.

	      if (format) {
	        obj.content.format = format;
	        return obj;
	      } else {
	        throw new Error("InvalidFile: Unsupported data structure");
	      } // if

	    } // format
	    // test

	  }]);

	  return onDemandFile;
	}(dbsliceFile); // onDemandFile
	// Established on-demand files

	onDemandFile.test = {
	  content: function content() {
	    // Any content that can be loaded and passes through the format testing is a valid on-demand file.
	    return true;
	  } // content

	};
	var line2dFile = /*#__PURE__*/function (_onDemandFile) {
	  _inherits(line2dFile, _onDemandFile);

	  var _super3 = _createSuper(line2dFile);

	  function line2dFile() {
	    _classCallCheck(this, line2dFile);

	    return _super3.apply(this, arguments);
	  }

	  _createClass(line2dFile, [{
	    key: "format",
	    value: // Can a method be both static and 
	    function format(obj) {
	      var content = dbsliceFile.test.structure(line2dFile, obj.content); // Rename the variables to remove leading and trailing blanks.			

	      obj.content = line2dFile.rename(content);
	      return obj;
	    } // format
	    // Structure should be testable outside as well, as it will have to be called bt onDemandDataFile when its trying to classify the files.

	  }], [{
	    key: "rename",
	    value: // test
	    function rename(content) {
	      // What happens if two names are the same after blanks have been trimmed? Retain the data, but add a modifier to the end.
	      var renamemap = content.variables.reduce(function (acc, oldname) {
	        var newname = oldname.trim();

	        if (oldname != newname) {
	          // Trimming changed something.
	          var allnames = Object.getOwnPropertyNames(acc);
	          var i = 0;

	          while (allnames.includes(newname)) {
	            newname += "_"; // Safety break

	            i += 1;

	            if (i > 10) {
	              break;
	            } // if

	          } // while


	          acc[oldname] = newname;
	        } // if


	        return acc;
	      }, {}); // reduce
	      // Rename the whole content.data array.

	      var namestoreplace = Object.getOwnPropertyNames(renamemap);
	      content.data.forEach(function (row) {
	        namestoreplace.forEach(function (oldname) {
	          var newname = renamemap[oldname];
	          row[newname] = row[oldname];
	          delete row[oldname];
	        });
	      });
	      content.variables = Object.getOwnPropertyNames(content.data[0]);
	      return content;
	    } // rename

	  }]);

	  return line2dFile;
	}(onDemandFile); // line2dFile

	line2dFile.structure = {
	  csv2lineFile: function csv2lineFile(content) {
	    if (Array.isArray(content)) {
	      var content_ = {
	        variables: content.columns,
	        data: dbsliceFile.convertNumbers(content)
	      }; // Test the new contents.

	      line2dFile.test.content(content_); // Structure test succeeded. Delete the columns that accompany the array object.

	      delete content_.data.columns;
	      return content_;
	    } else {
	      return undefined;
	    } // if

	  },
	  // array
	  json2lineFile: function json2lineFile(content) {
	    if (Array.isArray(content.data)) {
	      var content_ = {
	        variables: Object.getOwnPropertyNames(content.data[0]),
	        data: content.data
	      }; // Test the new contents.

	      line2dFile.test.content(content_);
	      return content_;
	    } else {
	      return undefined;
	    } // if

	  } // object

	};
	line2dFile.test = {
	  content: function content(_content2) {
	    if (_content2.variables.length < 2) {
	      throw new Error("InvalidFile: No variable pair detected");
	    } // if
	    // All values MUST be numeric!


	    var testrow = dbsliceFile.testrow(_content2.data);
	    var areAllContentsNumeric = Object.getOwnPropertyNames(testrow.row).every(function (varName) {
	      var value = testrow.row[varName];
	      return typeof value === 'number' && isFinite(value);
	    });

	    if (!areAllContentsNumeric) {
	      // There are non-numeric values in the data.
	      throw new Error("InvalidFile: Some variables include non-numeric values.");
	    } // if


	    return true;
	  } // content

	};
	var contour2dFile = /*#__PURE__*/function (_onDemandFile2) {
	  _inherits(contour2dFile, _onDemandFile2);

	  var _super4 = _createSuper(contour2dFile);

	  function contour2dFile() {
	    _classCallCheck(this, contour2dFile);

	    return _super4.apply(this, arguments);
	  }

	  _createClass(contour2dFile, [{
	    key: "format",
	    value: function format(obj) {
	      obj.content = dbsliceFile.test.structure(contour2dFile, obj.content);
	      return obj;
	    } // format
	    // structure

	  }]);

	  return contour2dFile;
	}(onDemandFile); // contour2dFile
	// Support file types - data mergers, sessions, etc.
	// configFile is used to classify user input files. The format has been changed to retain the transformed content.

	contour2dFile.structure = {
	  // This can now more easily handle different ways of specifying contours. Also convenient to implement the data structure conversion here, e.g. from points to triangles.
	  json2contour2dFile: function json2contour2dFile(content) {
	    // Not supposed to be an array! It should contain a single surface. If content.surfaces IS an array, then just select the first one.
	    var surface = Array.isArray(content.surfaces) ? content.surfaces[0] : content.surfaces; // In the content I expect an array called `y', `x', `v' (or others), and `size'. The first three must all be the same length, and the last one must have 2 numbers.

	    var L = surface.x.length == surface.y.length && surface.x.length > 3 ? surface.x.length : undefined; // Find all possible variables. The variables are deemed available if they are the same length as the x and y arrays. Also, they must contain only numeric values.

	    var compulsory = ["x", "y", "size"];
	    var variables = Object.getOwnPropertyNames(surface).filter(function (d) {
	      var L_;

	      if (!compulsory.includes(d)) {
	        // This is a possible user variable. It fits if it is an array of the same length as the geometrical parameters, and if it has numeric values.
	        var vals = surface[d];
	        L_ = Array.isArray(vals) && !vals.some(isNaN) ? vals.length : undefined;
	      } else {
	        L_ = undefined;
	      } // if
	      // The particular variable has to be an array of exactly the same length as `x' and `y'.


	      return L_ == L;
	    }); // Variables must have at least one option.

	    var content_;

	    if (variables.length > 0) {
	      content_ = {
	        variables: variables,
	        surface: surface
	      };
	    } else {
	      throw new Error("InvalidFile: Unsupported data structure");
	    } // if
	    // Hard-coded expected contents


	    return content_;
	  } // object

	};
	var userFile = /*#__PURE__*/function (_dbsliceFile3) {
	  _inherits(userFile, _dbsliceFile3);

	  var _super5 = _createSuper(userFile);

	  function userFile() {
	    _classCallCheck(this, userFile);

	    return _super5.apply(this, arguments);
	  }

	  _createClass(userFile, [{
	    key: "onload",
	    value: function onload(obj) {
	      // Mutate onload.
	      var mutatedobj;

	      switch (obj.content.format) {
	        case "metadataFile":
	          // Not easy to mutate, as the format of the content may not be correct.
	          mutatedobj = new metadataFile(obj);
	          mutatedobj.content = obj.content;
	          mutatedobj.promise = obj.promise; // Also need to classify...

	          mutatedobj = mutatedobj.classify.all(mutatedobj);
	          break;

	        case "sessionFile":
	          // Return the contents as they are.
	          mutatedobj = new sessionFile(obj);
	          mutatedobj.content = obj.content;
	          mutatedobj.promise = obj.promise;
	          break;
	      } // switch


	      return mutatedobj;
	    } // onload

	  }, {
	    key: "format",
	    value: function format(obj) {
	      // Here try all different ways to format the data. If the formatting succeeds, then check if the contents are fine.
	      // SHOULD ALSO ACCEPT SESSION FILES.
	      var availableFileClasses = [metadataFile, sessionFile]; // Here just try to fit the data into all hte supported data formats, and see what works.

	      var content_;
	      availableFileClasses.every(function (fileClass) {
	        try {
	          // The structure test will throw an error if the content cannot be handled correctly.
	          content_ = dbsliceFile.test.structure(fileClass, obj.content); // This file class can handle the data.

	          content_.format = fileClass.name;
	        } catch (_unused3) {
	          return true;
	        } // if

	      }); // Output the object, but add it's format to the name.

	      if (content_.format) {
	        obj.content = content_;
	        return obj;
	      } else {
	        throw new Error("InvalidFile: Unsupported data structure");
	      } // if

	    } // format

	  }, {
	    key: "mutateToMetadata",
	    value: // test
	    function mutateToMetadata(obj) {
	      var mutatedobj = new metadataFile(obj); // Refactor the 
	    } // mutateToMetadata

	  }]);

	  return userFile;
	}(dbsliceFile); // userFile
	// This one is capable of loading in just about anything, but it's also not getting stored internally.

	userFile.test = {
	  content: function content() {
	    // Any content that can be loaded and passes through the format testing is a valid on-demand file.
	    return true;
	  } // content

	};
	var sessionFile = /*#__PURE__*/function (_userFile) {
	  _inherits(sessionFile, _userFile);

	  var _super6 = _createSuper(sessionFile);

	  function sessionFile() {
	    _classCallCheck(this, sessionFile);

	    return _super6.apply(this, arguments);
	  }

	  _createClass(sessionFile, [{
	    key: "format",
	    value: function format(obj) {
	      obj.content = dbsliceFile.test.structure(sessionFile, obj.content);
	      return obj;
	    } // format
	    // test

	  }]);

	  return sessionFile;
	}(userFile); // sessionFile

	sessionFile.structure = {
	  // This can now more easily handle different ways of specifying contours. Also convenient to implement the data structure conversion here, e.g. from points to triangles.
	  json2sessionFile: function json2sessionFile(content) {
	    // Has to be an object, whose entries are valid categories. The entries of the categories are considered the variables after teh merge. Each of them must have the same exact properties (file names), the names must include all the already loaded files, and all the file variables must be present in those files. 
	    // Expect two parts to hte file: the merging and session info.
	    // What happens when there is no sessionInfo, or nop merging info? Shouldn't it just throw an error??
	    // Prune away anything that is not in line with the expected structure. Using map creates an array, but it should instead remain an object!!
	    var mergingInfo = categoryInfo.supportedCategories.reduce(function (dict, category) {
	      dict[category] = content.mergingInfo[category];
	      return dict;
	    }, {}); // map
	    // There are some attributes that the sessionInfo section must have:
	    // title, plotRows.

	    var sessionInfo = content.sessionInfo;

	    if (!helpers.arrayIncludesAll(Object.getOwnPropertyNames(sessionInfo), ["title", "plotRows"])) {
	      throw new Error("InvalidFile: Session title or rows not specified.");
	    } // if


	    return {
	      merging: mergingInfo,
	      session: sessionInfo
	    };
	  } // object

	};
	sessionFile.test = {
	  content: function content(_content3) {
	    // The philosophy here is that if it can be applied it is valid.
	    // Try to use it and see if it'll be fine.
	    var fileobjs = dbsliceDataCreation.makeInternalData(fileManager.library.retrieve(metadataFile));
	    fileobjs = dbsliceDataCreation.sortByLoadedMergingInfo(fileobjs, _content3); // No need to check if all the loaded files were declared for - just use the merge to do what is possible.
	    // Maybe the same applies to variables too? Just use what you can?
	    // Maybe I don't even need to find common file names??
	    // If there's no metadata files loaded then assume they're metadata files.
	    // At least some of the 

	    return true;
	  } // content

	};

	var dbsliceDataCreation = {
	  // Functionality
	  make: function make() {
	    // Collect the metadata and all the merger info
	    var allMetadataFiles = fileManager.library.retrieve(metadataFile); // Construct the appropriate internal data

	    var fileobjs = dbsliceDataCreation.makeInternalData(allMetadataFiles);
	    fileobjs = dbsliceDataCreation.sortByLoadedMergingInfo(fileobjs, dbsliceData.merging); // Construct the menu itself.

	    dbsliceDataCreation.builder.make(fileobjs);
	  },
	  // make
	  show: function show() {
	    dbsliceDataCreation.make();
	    var fullscreenContainer = d3.select("#merging-container");
	    fullscreenContainer.style("display", "");
	    dbsliceDataCreation.drag.helpers.styling.adjust();
	  },
	  // show
	  hide: function hide() {
	    d3.select("#merging-container").style("display", "none");
	  },
	  // hide
	  submit: function submit() {
	    // Collect the classification from the ui.
	    var mergerInfo = dbsliceDataCreation.collectMergerInfo(); // Store this in the session data.

	    dbsliceData.merging = mergerInfo; // Get the merged data.

	    var mergedData = dbsliceDataCreation.merge(mergerInfo); // Store it internally.

	    cfDataManager.cfChange(mergedData);
	    dbsliceDataCreation.hide();
	  },
	  // submit
	  // Here just allow the movement between the categories too
	  drag: {
	    make: function make() {
	      var h = dbsliceDataCreation.drag.helpers;
	      var drag = d3.drag().on("start", function (d) {
	        this.classList.add('dragging');
	        d.position.t0 = d3.mouse(this.parentElement);
	        d3.select(this).style("position", "relative").style("left", 0 + "px").style("top", 0 + "px");
	      }).on("drag", function (d) {
	        var position = d3.mouse(this.parentElement);
	        d.position.x += position[0] - d.position.t0[0];
	        d.position.y += position[1] - d.position.t0[1];
	        d3.select(this).style("position", "relative").style("left", d.position.x + "px").style("top", d.position.y + "px");
	        d.position.t0 = position; // Find the new position to allow for a preview.

	        d.position.dom.container = h.findNewContainer(this); // Make the preview - a border around the cell. Maybe even allow positioning within the cell if the button is positioned over a ghost element.

	        h.preview(d);
	      }).on("end", function (d) {
	        // Reposition.
	        d.position.dom.replaceElement = h.findNewPositionInContainer(d.position.dom.container, this);
	        h.reposition(this, d); // Update the internal data element

	        d.variable.category = d3.select(this.parentElement).datum().category; // Clear dragging utility

	        this.classList.remove('dragging');
	        d3.select(this).style("position", "");
	        d.position.x = 0;
	        d.position.y = 0; // Remove highlights, and adjust column heights.

	        h.styling.adjust();
	      });
	      return drag;
	    },
	    // make
	    helpers: {
	      // Functionality
	      findNewContainer: function findNewContainer(draggedDOM) {
	        // Find the container.
	        var container;
	        var draggedBox = draggedDOM.getBoundingClientRect(); // button -> cell -> category -> file

	        d3.select(draggedDOM.parentElement.parentElement.parentElement).selectAll("div.category").each(function (d) {
	          // Is the draggedDOM over this category.
	          var categoryBox = this.getBoundingClientRect(); // Bottom is the bottom of the div as is perceived, but the coordinate system begins top left!

	          if (categoryBox.bottom > draggedBox.bottom && categoryBox.top < draggedBox.top) {
	            // The dragged button is over this container. Check if the variable is allowed to be added to it. Otherwise keep it where it is.
	            if (dbsliceDataCreation.drag.helpers.isContainerCompatible(this, draggedDOM)) {
	              container = this;
	            } // if

	          } // if

	        });

	        if (!container) {
	          container = draggedDOM.parentElement;
	        } // if


	        return container;
	      },
	      // findNewPosition
	      isContainerCompatible: function isContainerCompatible(container, draggedDom) {
	        // There are restrictions on which items can be dragged to which category.
	        var category = d3.select(container).datum().category;
	        var varType = d3.select(draggedDom).datum().variable.type;
	        return categoryInfo.catCompatibleTypes[category].includes(varType);
	      },
	      // isContainerCompatible
	      findNewPositionInContainer: function findNewPositionInContainer(container, draggedElement) {
	        // Find the closest element. Calculate the distance between the top of the moved element and the static elements.
	        // MAYBE CHANGE THIS DYNAMIC TO FIND THE NEAREST GAP, WITH ORIGINAL POSITION, GHOST NODES, AND THE END ARE CONSIDERED?? THAT WOULD LIKELY BE MOST ELEGANT.
	        // Still stick with replaceElement, as for all but the final position it works. Forfinal position undefined can be used, and repositioning can figure that out. And also check if sibling element is replaceElement.
	        // Only allow the elements to move into an open position
	        var staticElements = _toConsumableArray(container.querySelectorAll('button.shape-pill'));

	        var ghostElements = _toConsumableArray(container.querySelectorAll('button.ghost'));

	        var draggedBox = draggedElement.getBoundingClientRect(); // Calculate all overlaps and offsets to determine the positioning.

	        var candidates = ghostElements.map(function (child) {
	          var staticBox = child.getBoundingClientRect();
	          return {
	            dist: staticBox.bottom - draggedBox.bottom,
	            element: child
	          };
	        }); // Push original position. What if original position is last position?
	        // Original position

	        candidates.push({
	          dist: draggedBox.y - parseInt(draggedElement.style.top) - draggedBox.top,
	          element: draggedElement
	        }); // ALLOW PUSHING PAST THE END!!
	        // Last element. Only push if it is different to the original position - only push if you really want to move past the end

	        var lastElement = container.lastElementChild;
	        var lastElementBottom;

	        if (lastElement == draggedElement) {
	          // Last element is the dragged one, but try to see what would be best if there was another node after this one.
	          lastElementBottom = draggedBox.y - parseInt(draggedElement.style.top) + 2 * draggedBox.height;
	        } else {
	          lastElementBottom = lastElement.getBoundingClientRect().bottom;
	        } // if


	        candidates.push({
	          dist: lastElementBottom - draggedBox.bottom,
	          element: undefined
	        }); // Find if any overlaps are valid. The minimum overlap is set at 12 so that the margin between the elements does not cancel a repositioning.

	        var closest = candidates.reduce(function (best, current) {
	          return Math.abs(current.dist) < Math.abs(best.dist) ? current : best;
	        }, {
	          dist: Number.POSITIVE_INFINITY
	        }); // Note that this outputs the exact position!

	        return closest.element;
	      },
	      // findNewPositionInContainer
	      // Changing the DOM
	      preview: function preview(d) {
	        // A border around the cell. Maybe even allow positioning within the cell if the button is positioned over a ghost element.
	        // Select all siblings
	        d3.select(d.position.dom.container.parentElement.parentElement).selectAll("div.category").style("border-style", "none");
	        d3.select(d.position.dom.container).style("border-style", "solid");
	      },
	      // preview
	      reposition: function reposition(el, d) {
	        // The button is being repositioned. In the original container a ghost button should replace the dragged button.
	        if (el != d.position.dom.replaceElement) {
	          // If the element should replace itself do nothing.
	          // Ghost element
	          var ghost = dbsliceDataCreation.builder.build.ghostButton();
	          el.parentElement.insertBefore(ghost.node(), el);
	          el.remove();

	          if (d.position.dom.replaceElement) {
	            // If 'd.dom.replaceElement' is defined then the element should be repositioned. When it is repositioned the 'replaceElement' should be removed. 
	            d.position.dom.container.insertBefore(el, d.position.dom.replaceElement);
	            d.position.dom.replaceElement.remove();
	          } else {
	            // Append it at the very end.
	            d.position.dom.container.appendChild(el);
	          } // if

	        } // if 

	      },
	      // reposition
	      styling: {
	        removeGhostElements: function removeGhostElements(categories) {
	          categories.each(function () {
	            if (this.childElementCount > 0) {
	              while (this.lastElementChild.classList.contains("ghost")) {
	                this.lastElementChild.remove();
	              } // while						

	            } // if  

	          }); // each
	        },
	        // removeGhostNodes
	        adjust: function adjust() {
	          // Helper reference
	          var h = dbsliceDataCreation.drag.helpers.styling; // The column sizes need to be controled in rows. But the files are arranged

	          var categories = d3.select("#merging-container").select("div.card-body").selectAll("div.file").selectAll("div.categoryWrapper").selectAll("div.category"); // Remove unnecessary ghost nodes.

	          h.removeGhostElements(categories); // Remove all border previews.

	          categories.style("border-style", "none");
	          dbsliceDataCreation.operateOverCategories(categories, function (categoryCells) {
	            h.columnHeights(categoryCells);
	            h.colorMergers(categoryCells);
	          });
	        },
	        // adjust
	        // MERGE THE FOLLOWING TWO
	        columnHeights: function columnHeights(relevantCells) {
	          // Find the maximum height
	          var h = relevantCells.reduce(function (max, current) {
	            var h_ = current.wrapper.getBoundingClientRect().height;
	            return h_ > max ? h_ : max;
	          }, 0); // reduce

	          relevantCells.forEach(function (d) {
	            d3.select(d.wrapper).style("height", h + "px");
	          }); // forEach
	        },
	        // columnHeights
	        colorMergers: function colorMergers(categoryCells) {
	          // Color the merges for the relevant cells.
	          // Create a color scheme here so it's only created once.
	          var colorscheme = dbsliceDataCreation.builder.color(function (el) {
	            return d3.select(el).datum().category;
	          }); // Operate over individual rows of the category.

	          dbsliceDataCreation.operateOverCategoryRows(categoryCells, function (rowElements, anyInvalid) {
	            // Do the coloring
	            rowElements.forEach(function (el) {
	              if (el) {
	                var clr;

	                if (anyInvalid) {
	                  clr = el.classList.contains("ghost") ? "white" : "gainsboro";
	                } else {
	                  clr = colorscheme(el.parentElement);
	                } // if


	                d3.select(el).style("background-color", clr);
	              } // if

	            }); // forEach
	          }); // operateOverCategoryRows
	        } // colorMergers

	      } // styling

	    } // helpers

	  },
	  // drag
	  // Builder
	  builder: {
	    make: function make(fileobjs) {
	      var build = dbsliceDataCreation.builder.build; // Have the fullscreen container in index.html

	      var fullscreenContainer = d3.select("#merging-container");
	      fullscreenContainer.selectAll("*").remove();
	      var menuContainer = fullscreenContainer.append("div").attr("class", "card card-menu"); // Header - add a legend?

	      menuContainer.append("div").attr("class", "card-header").each(build.header); // Body
	      // The body will have to contain several groups, each of which is a table-row. Create teh required internal data structure.

	      menuContainer.append("div").attr("class", "card-body").style("overflow-y", "scroll").style("overflow-x", "auto").datum(fileobjs).each(build.body); // Footer

	      menuContainer.append("div").attr("class", "card-footer").each(build.footer); // Apply the dragging

	      var drag = dbsliceDataCreation.drag.make();
	      menuContainer.select("div.card-body").selectAll(".draggable").call(drag);
	    },
	    // make
	    // Building repertoire
	    build: {
	      header: function header() {
	        var color = dbsliceDataCreation.builder.color(function (d) {
	          return d;
	        });
	        var types = categoryInfo.supportedCategories;
	        var header = d3.select(this);
	        var title = header.append("div");
	        title.append("h4").html("Metadata merging:");
	        title.append("button").attr("class", "btn report").style("float", "right").on("click", function () {
	          errors.report.builder.make();
	          errors.report.show();
	        }).append("i").attr("class", "fa fa-exclamation-triangle");
	        header.append("div").selectAll("button.shape-pill").data(types).enter().append("button").attr("class", "shape-pill").style("background-color", color).append("strong").html(function (d) {
	          return d;
	        });
	      },
	      // header
	      body: function body(fileobjs) {
	        // This is the actual body
	        d3.select(this).append("div").style("display", "table-row").selectAll("div.files").data(fileobjs).enter().append("div").attr("class", "file").style("display", "table-cell").style("vertical-align", "top").each(dbsliceDataCreation.builder.build.columns);
	      },
	      // body
	      columns: function columns(fileobj) {
	        // Each column is an individual file.
	        // The filename
	        d3.select(this).append("p").style("text-align", "center").append("strong").html(fileobj.filename);
	        d3.select(this).selectAll("div.categoryWrapper").data(fileobj.categories).enter().append("div").attr("class", "categoryWrapper").style("display", "table-row").style("vertical-align", "top").each(dbsliceDataCreation.builder.build.category);
	      },
	      // columns
	      category: function category(catobj) {
	        var color = dbsliceDataCreation.builder.color(function (d) {
	          return d.variable.category;
	        }); // Save the reference to the category wrapper too. The wrapper will be used to adjust the height of the elements as needed.

	        catobj.wrapper = this;
	        d3.select(this).append("div").attr("class", "category").style("display", "table-cell").style("vertical-align", "top").style("border-style", "none").style("border-radius", "15px").selectAll("button.draggable").data(catobj).enter().append("button").attr("class", "shape-pill draggable").style("background-color", color).style("display", "block").append("strong").html(function (d) {
	          return d.variable.name;
	        });
	      },
	      // category
	      ghostButton: function ghostButton() {
	        return d3.create("button").attr("class", "shape-pill ghost").style("background-color", "red").style("display", "block");
	      },
	      // ghostButton
	      footer: function footer() {
	        var foot = d3.select(this);
	        foot.append("button").attr("class", "btn btn-success").html("Submit").on("click", dbsliceDataCreation.submit); // The user can drag in session files or metadata files. Therefore the 'userFile' is used to identify which one it is.

	        /*
	        var mergeInfoInput = helpers.createFileInputElement( function(files){ fileManager.importing.batch(userFile, files) } )
	        	
	        foot
	          .append("button")
	        	.attr("class", "btn btn-info")
	        	.html("Load")
	        	.on("click", function(){mergeInfoInput.click()})	
	        */
	      } // footer

	    },
	    // build
	    color: function color(accessor) {
	      var scheme = d3.scaleOrdinal(d3.schemePastel2).domain(categoryInfo.supportedCategories);
	      return function (d) {
	        var category = accessor(d);
	        return category == "Unused" ? "gainsboro" : scheme(category); // return accessor(d) == "string" ? "aquamarine" : "gainsboro"
	      };
	    } // color

	  },
	  // builder
	  // OPERATE OVER DATA
	  operateOverCategories: function operateOverCategories(categories, action) {
	    // Get the data to operate on.
	    var categoriesData = [];
	    categories.each(function (d) {
	      // Remove all the height properties so that the heights readjust to the content.
	      d.wrapper.style.height = "";
	      categoriesData.push(d);
	    }); // each
	    // Create optional output.

	    var output = {}; // Operate over all the available types.

	    categoryInfo.supportedCategories.forEach(function (categoryType) {
	      // Each cell row represents a single category.
	      var categoryCells = categoriesData.filter(function (d) {
	        return d.category == categoryType;
	      }); // filter
	      // Allow the action to create an output if necessary.

	      action(categoryCells, output);
	    }); // forEach

	    return output;
	  },
	  // operateOverCategories
	  operateOverCategoryRows: function operateOverCategoryRows(categoryCells, action) {
	    // For a particular category go over all the cells (one per file), and establish the aliases that can be used when performing the actual data merge later.
	    // Use .wrapper.querySelector("div.category") to access the actual category.
	    var categoryCellsDOM = categoryCells.map(function (d) {
	      return d.wrapper.querySelector("div.category");
	    });
	    var nMax = Math.max.apply(Math, _toConsumableArray(categoryCellsDOM.map(function (d) {
	      return d.childElementCount;
	    })));

	    if (Number.isFinite(nMax)) {
	      var _loop = function _loop(i) {
	        // Get the corresponding elements.
	        var rowElements = categoryCellsDOM.map(function (d) {
	          return d.children[i];
	        });
	        var anyInvalid = rowElements.some(function (el) {
	          return el ? el.classList.contains("ghost") : true;
	        }); // some

	        action(rowElements, anyInvalid);
	      };

	      for (var i = 0; i < nMax; i++) {
	        _loop(i);
	      } // for

	    } // if

	  },
	  // operateOverCategoryRows
	  // INTERNAL DATA
	  makeInternalData: function makeInternalData(allMetadataFiles) {
	    // Yes, I should have other internal data - I don't want to have the internal data bloat the file objects.
	    // Find the appropriate index.
	    var cat2ind = categoryInfo.cat2ind;
	    var ind2cat = categoryInfo.ind2cat;
	    var fileobjs = allMetadataFiles.map(function (file) {
	      // Organise the different categories here.
	      var catobj = file.content.variables.reduce(function (acc, variable) {
	        var i = cat2ind[variable.category];
	        acc[i].push({
	          filename: file.filename,
	          variable: variable,
	          position: {
	            x: 0,
	            y: 0,
	            t0: undefined,
	            dom: {
	              container: undefined,
	              replaceElement: undefined
	            }
	          }
	        });
	        return acc;
	      }, [[], [], [], [], []]); // reduce
	      // Add the category names to the arrays.

	      catobj.forEach(function (a, i) {
	        a.file = file.filename;
	        a.category = ind2cat[i];
	        a.wrapper = undefined;
	      }); // Convert the categories into an array

	      var fileobj = {
	        filename: file.filename,
	        categories: catobj
	      }; // fileobj

	      return fileobj;
	    }); // map

	    return fileobjs;
	  },
	  // makeInternalData
	  // Stuff for merger
	  merge: function merge(mergerInfo) {
	    // Merged data is a completely new item! Therefore it does not need to have alias in its name unnecessarily.
	    var allMetadataFiles = fileManager.library.retrieve(metadataFile); // The 'mergedData' can be tailored to fit better with 'cfDataManager' later on.

	    var tasks = []; // Determine what filename_id would work for all files. It is simply defined here, and filenameId and taskId are reserved names.

	    var filename_id_name = "filenameId";
	    /*
	    let filename_id_name = "filename_id"
	    let columns = allMetadataFiles.reduce(function(acc, file){
	    	return acc.concat(file.content.variables.map(d=>d.name))
	    },[]) // reduce
	    while(columns.includes(filename_id_name)){
	    	filename_id_name += "_"
	    } // while
	    */

	    allMetadataFiles.forEach(function (metadataFile) {
	      // Loop over all the content and rename the variables.
	      metadataFile.content.data.forEach(function (task_) {
	        // Rename all the necessary variables.
	        // Create a new object to hold the merged data.
	        var d_ = {};
	        d_[filename_id_name] = metadataFile.filename; // mergerInfo is organised by categories. Iterate over all of them here.

	        Object.getOwnPropertyNames(mergerInfo).forEach(function (category) {
	          // In the category there are the variable aliases.
	          Object.getOwnPropertyNames(mergerInfo[category]).forEach(function (variable) {
	            // Each variable holds the aliases that merge the data.
	            d_[variable] = task_[mergerInfo[category][variable][metadataFile.filename]];
	          }); // forEach
	        }); // forEach
	        // Push into the data

	        tasks.push(d_);
	      }); // forEach task
	    }); // forEach file
	    // A task id property MUST be present to allow tracking of individual tasks. It MUST have all unique values. If such a property is not present, then create it. If the taskId is not unique it will overwrite it.

	    var taskIds = tasks.map(function (d) {
	      return d.taskId;
	    });

	    if (helpers.unique(taskIds).length != taskIds.length) {
	      tasks = tasks.map(function (d, i) {
	        d.taskId = i;
	        return d;
	      });
	    } // if
	    // Create the header expected by dbslice.


	    var header = {};
	    Object.getOwnPropertyNames(mergerInfo).forEach(function (category) {
	      header[categoryInfo.cat2prop[category]] = Object.getOwnPropertyNames(mergerInfo[category]);
	    });
	    return {
	      header: header,
	      data: tasks
	    };
	  },
	  // merge
	  collectCategoryMergeInfo: function collectCategoryMergeInfo(categoryCells, dict) {
	    // For a particular category go over all the cells (one per file), and establish the aliases that can be used when performing the actual data merge later.
	    // 'dict' is an empty object into which the results can be stored.
	    // For a particular category operate over the individual rows and determine what to do with the variables.
	    dbsliceDataCreation.operateOverCategoryRows(categoryCells, function (rowElements, anyInvalid) {
	      if (!anyInvalid) {
	        // Variables can be merged. Create a dictionary with an entry for each variable group. The variable group entry then contains the maps to the corresponding variable for each file. The first element is used to name the group.
	        var category = d3.select(rowElements[0].parentElement).datum().category;
	        var varname = d3.select(rowElements[0]).datum().variable.name; // If needed create the category entry.

	        if (!dict[category]) {
	          dict[category] = {};
	        } // if


	        dict[category][varname] = rowElements.reduce(function (entry, el) {
	          // Get the data bound to the element.
	          var d = d3.select(el).datum();
	          entry[d.filename] = d.variable.name;
	          return entry;
	        }, {}); // reduce
	      } // if

	    });
	    return dict;
	  },
	  // collectCategoryMergerInfo
	  collectMergerInfo: function collectMergerInfo() {
	    // Do everything over categories.
	    var categories = d3.select("#merging-container").select("div.card-body").selectAll("div.file").selectAll("div.categoryWrapper").selectAll("div.category");
	    var dict = dbsliceDataCreation.operateOverCategories(categories, dbsliceDataCreation.collectCategoryMergeInfo);
	    return dict;
	  },
	  // collectMergerInfo
	  sortByLoadedMergingInfo: function sortByLoadedMergingInfo(fileobjs, loadedInfo) {
	    // HOW TO MAKE THEM MISMATCH ANY NON-MATCHED VARIABLES? PUSH GHOST OBJS BETWEEN??
	    // FIRST FOCUS ON MAKING EVERYTHING ELSE WORK
	    // How to make sure that only items that are fully declared are being used?? Filter out the things that are not needed??
	    // Reorder the variables in the categories.
	    fileobjs.forEach(function (fileobj) {
	      fileobj.categories.forEach(function (catobj) {
	        var mergedItems = loadedInfo[catobj.category];

	        if (mergedItems) {
	          // Create the reordering dict.
	          var ind = {};
	          Object.getOwnPropertyNames(mergedItems).forEach(function (varname, pos) {
	            var nameInTheFile = mergedItems[varname][fileobj.filename];
	            ind[nameInTheFile] = pos;
	          }); // How to manage this sorting so that all the sosrts are respected? How to make sure that the values are placed exactly in the spots required. Maybe simply creating a new array would be better??

	          catobj.sort(function (a, b) {
	            var aval = typeof ind[a.variable.name] == "number" ? ind[a.variable.name] : Number.POSITIVE_INFINITY;
	            var bval = typeof ind[b.variable.name] == "number" ? ind[b.variable.name] : Number.POSITIVE_INFINITY;
	            var val = isNaN(aval - bval) ? 0 : aval - bval;
	            return val;
	          });
	        } // if

	      }); // forEach
	    }); // forEach

	    return fileobjs;
	  } // sortByLoadedMergingInfo

	}; // dbsliceDataCreation

	var fileManager = {
	  // CHECK TO SEE IF THE FILE WAS ALREADY LOADED!!
	  importing: {
	    // PROMPT SHOULD BE MOVED!!
	    prompt: function prompt(requestPromises) {
	      // Only open the prompt if any of the requested files were metadata files!
	      Promise.allSettled(requestPromises).then(function (loadresults) {
	        if (loadresults.some(function (res) {
	          return res.value instanceof metadataFile;
	        })) {
	          var allMetadataFiles = fileManager.library.retrieve(metadataFile); // PROMPT THE USER

	          if (allMetadataFiles.length > 0) {
	            // Prompt the user to handle the categorication and merging.
	            // Make the variable handling
	            dbsliceDataCreation.make();
	            dbsliceDataCreation.show();
	          } else {
	            // If there is no files the user should be alerted. This should use the reporting to tell the user why not.
	            alert("None of the selected files were usable.");
	          } // if

	        } // if

	      }); // then
	    },
	    // prompt
	    dragdropped: function dragdropped(files) {
	      // In the beginning only allow the user to load in metadata files.
	      var requestPromises;
	      var allMetadataFiles = fileManager.library.retrieve(metadataFile);

	      if (allMetadataFiles.length > 0) {
	        // Load in as userFiles, mutate to appropriate file type, and then push forward.
	        requestPromises = fileManager.importing.batch(userFile, files);
	      } else {
	        // Load in as metadata.
	        requestPromises = fileManager.importing.batch(metadataFile, files);
	      } // if


	      fileManager.importing.prompt(requestPromises);
	    },
	    // dragdropped
	    single: function single(classref, file) {
	      // Construct the appropriate file object.
	      var fileobj = new classref(file); // Check if this file already exists loaded in.

	      var libraryEntry = fileManager.library.retrieve(undefined, fileobj.filename);

	      if (libraryEntry) {
	        fileobj = libraryEntry;
	      } else {
	        // Initiate loading straight away
	        fileobj.load(); // After loading if the file has loaded correctly it has some content and can be added to internal storage.

	        fileManager.library.store(fileobj);
	      } // if
	      // The files are only stored internally after they are loaded, therefore a reference must be maintained to the file loaders here.


	      return fileobj.promise;
	    },
	    // single
	    batch: function batch(classref, files) {
	      // This is in fact an abstract loader for any set of files given by 'files' that are all of a file class 'classref'.
	      var requestPromises = files.map(function (file) {
	        return fileManager.importing.single(classref, file);
	      });
	      return requestPromises;
	    } // batch

	  },
	  // importing
	  library: {
	    update: function update() {
	      // Actually, just allow the plots to issue orders on hteir own. The library update only collects the files that are not required anymore.
	      var filteredTasks = dbsliceData.data.taskDim.top(Infinity);
	      dbsliceData.session.plotRows.forEach(function (plotRowCtrl) {
	        plotRowCtrl.plots.forEach(function (plotCtrl) {
	          // If a sliceId is defined, then the plot requires on-demand data.
	          if (plotCtrl.view.sliceId != undefined) {
	            requiredFiles = requiredFiles.concat(filteredTasks.map(function (d) {
	              return d[plotCtrl.view.sliceId];
	            }) // map
	            ); // concat
	          } // if

	        }); // forEach
	      }); // forEach
	      // Remove redundant files of this classref.

	      var allRequiredFilenames = requiredFiles.map(function (d) {
	        return d.filename;
	      });
	      var filesForRemoval = dbsliceData.files.filter(function (file) {
	        return allRequiredFilenames.includes(file.filename);
	      }); // filter

	      filesForRemoval.forEach(function (file) {
	        var i = dbsliceData.files.indexOf(file);
	        dbsliceData.files.splice(i, 1);
	      });
	    },
	    // update
	    store: function store(fileobj) {
	      fileobj.promise.then(function (obj_) {
	        if (obj_ instanceof sessionFile) {
	          // Session files should not be stored internally! If the user loads in another session file it should be applied directly, and not in concert with some other session files.
	          sessionManager.onSessionFileLoad(obj_);
	        } else {
	          // Other files should be stored if they have any content.
	          if (obj_.content) {
	            dbsliceData.files.push(obj_);
	          } // if

	        } // if

	      });
	    },
	    // store
	    retrieve: function retrieve(classref, filename) {
	      // If filename is defined, then try to return that file. Otherwise return all.
	      var files;

	      if (filename) {
	        files = dbsliceData.files.filter(function (file) {
	          return file.filename == filename;
	        }); // filter

	        files = files[0];
	      } else {
	        files = dbsliceData.files.filter(function (file) {
	          return file instanceof classref;
	        }); // filter
	      } // if


	      return files;
	    },
	    // retrieve
	    remove: function remove(classref, filename) {
	      // First get the reference to all hte files to be removed.
	      var filesForRemoval = fileManager.library.retrieve(classref, filename); // For each of these find it's index, and splice it.

	      filesForRemoval.forEach(function (file) {
	        var i = dbsliceData.files.indexOf(file);
	        dbsliceData.files.splice(i, 1);
	      });
	    } // remove

	  },
	  // library
	  exporting: {
	    session: {
	      download: function download() {
	        // Make a blob from a json description of the session.
	        var b = fileManager.exporting.session.makeTextFile(sessionManager.write()); // Download the file.

	        var lnk = document.createElement("a");
	        lnk.setAttribute("download", "test_session.json");
	        lnk.setAttribute("href", b);
	        var m = document.getElementById("saveSession");
	        m.appendChild(lnk);
	        lnk.click();
	        lnk.remove();
	      },
	      // download
	      makeTextFile: function makeTextFile(text) {
	        var data = new Blob([text], {
	          type: 'text/plain'
	        });
	        var textFile = null; // If we are replacing a previously generated file we need to
	        // manually revoke the object URL to avoid memory leaks.

	        if (textFile !== null) {
	          window.URL.revokeObjectURL(textFile);
	        } // if


	        textFile = window.URL.createObjectURL(data);
	        return textFile;
	      } // makeTextFile

	    } // session

	  } // exporting

	}; // fileManager

	var cfD3Line = {
	  // • report to the user info about the data (missing, duplicated, intersect clashes, maybe even the things that will yield the largest addition of data to the screen)
	  name: "cfD3Line",
	  make: function make(ctrl) {
	    // This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
	    var hs = plotHelpers.setupPlot;
	    var hi = plotHelpers.setupInteractivity.twoInteractiveAxes;
	    var i = cfD3Line.interactivity; // Add the manual selection toggle to its title.
	    // hs.twoInteractiveAxes.updatePlotTitleControls(ctrl)
	    // Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.

	    hs.twoInteractiveAxes.setupPlotBackbone(ctrl); // Create the svg with all required children container groups and append it to the appropriate backbone div.

	    hs.general.rescaleSvg(ctrl); // Add in the controls for the y axis.

	    hs.general.appendVerticalSelection(ctrl.figure, hi.onSelectChange.vertical(ctrl)); // Add in the controls for the x axis.

	    hs.general.appendHorizontalSelection(ctrl.figure, hi.onSelectChange.horizontal(ctrl)); // General interactivity

	    hi.addZooming(ctrl);
	    i.createLineTooltip(ctrl); // Scaling of the axes

	    hi.addAxisScaling(ctrl); // Button menu custom functionality. On first "make" it should host the slice id options.

	    var sliceOption = {
	      name: "Slice Id",
	      val: undefined,
	      options: dbsliceData.data.line2dProperties,
	      event: function event(ctrl, d) {
	        ctrl.view.sliceId = d;
	      }
	    }; // sliceOption

	    hs.twoInteractiveAxes.buttonMenu.make(ctrl);
	    hs.twoInteractiveAxes.buttonMenu.update(ctrl, [sliceOption]); // But it will try to draw when this is updated...
	  },
	  // make
	  getData: function getData(ctrl) {
	    // Setup the appropriate connection between individual tasks and the loaded files.
	    // First establish for which tasks the files are available.
	    var tasks = dbsliceData.data.taskDim.top(Infinity);
	    var requiredUrls = tasks.map(function (d) {
	      return d[ctrl.view.sliceId];
	    }); // Create an itnernal data object for tasks that have a loaded file, and log those that weren't loaded as missing.

	    ctrl.data = tasks.reduce(function (acc, t) {
	      // The library will retrieve at most 1 file!
	      var filename = t[ctrl.view.sliceId];
	      var f = fileManager.library.retrieve(line2dFile, filename);

	      if (f) {
	        // Exactly the right file was found. As on-demand filenames will have the same filename and url this should always happen when the file has been loaded. The series is still empty as the selection of the variables has not been made yet.
	        acc.available.push({
	          task: t,
	          file: f,
	          series: []
	        });
	      } else {
	        // File not found - log as missing
	        acc.missing.push({
	          task: t,
	          value: filename
	        });
	      } // if


	      return acc;
	    }, {
	      available: [],
	      missing: []
	    }); // reduce
	    // Set the intersect of availbale variables.

	    ctrl.data.intersect = ctrl.data.available.length > 0 ? cfD3Line.getIntersectOptions(ctrl.data.available) : undefined;
	  },
	  // getData
	  getIntersectOptions: function getIntersectOptions(dataobjs) {
	    // Find which variables appear in all the dataobj files. These are the variables that can be compared.
	    var commonvars = dataobjs.reduce(function (acc, d) {
	      acc = acc.filter(function (varname) {
	        return d.file.content.variables.includes(varname);
	      });
	      return acc;
	    }, _toConsumableArray(dataobjs[0].file.content.variables));
	    return commonvars;
	  },
	  // getIntersectOptions
	  update: function update(ctrl) {
	    // plotFunc.update is called in render when coordinating the plots with the crossfilter selection. On-demand plots don't respond to the crossfilter, therefore this function does nothing. In hte future it may report discrepancies between its state and the crossfilter.
	    // Called on: AR change, color change
	    // Update the color if necessary.
	    var allSeries = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("path.line").transition().duration(ctrl.view.transitions.duration).style("stroke", ctrl.tools.getColor); // Maybe just introduce separate draw scales and axis scales??
	    // Update the axes

	    cfD3Line.helpers.axes.update(ctrl);
	  },
	  // update
	  updateData: function updateData(ctrl) {
	    // Remove all the previously stored promises, so that only the promises required on hte last redraw are retained.
	    ctrl.data.promises = []; // GETDATAINFO should be launched when new data is loaded for it via the 'refresh' button, and when a different height is selected for it. Otherwise it is just hte data that gets loaded again.

	    var data = cfD3Line.getData(ctrl); // The data must be retrieved here. First initialise the options.

	    if (ctrl.data.intersect != undefined) {
	      cfD3Line.setupPlot.updateUiOptions(ctrl);
	    } // if
	    // Rescale the svg in event of a redraw.


	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // Setup the plot tools. Also collects the data

	    cfD3Line.setupPlot.setupLineSeries(ctrl);
	    plotHelpers.setupTools.go(ctrl);
	    cfD3Line.setupPlot.setupLineTools(ctrl); // The data domain is required for nicer AR adjusting.

	    ctrl.format.domain = {
	      x: ctrl.tools.xscale.domain(),
	      y: ctrl.tools.yscale.domain()
	    };
	    cfD3Line.draw(ctrl); // Update the axes

	    cfD3Line.helpers.axes.update(ctrl); // Adjust the title

	    ctrl.format.wrapper.select("div.title").html(ctrl.view.sliceId);
	  },
	  // updateData
	  draw: function draw(ctrl) {
	    // Draw is used when the data changes. The transform is added in terms of pixels, so it could possibly be kept. So, when introducing new data add the transform already, so everything is kept at the same transform.
	    // This function re-intialises the plots based on the data change that was initiated by the user.
	    // RELOCATE TO DRAW??
	    if (ctrl.data.available.length > 0) {
	      // Update the axes
	      cfD3Line.helpers.axes.update(ctrl); // CHANGE TO JOIN!!
	      // Assign the data

	      var allSeries = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("path.line").data(ctrl.data.available, function (d) {
	        return d.task.taskId;
	      }); // enter

	      allSeries.enter().append("g").attr("class", "plotSeries").append("path").attr("class", "line").attr("d", function (d) {
	        return ctrl.tools.line(d.series);
	      }).style("stroke", ctrl.tools.getColor).style("fill", "none").style("stroke-width", 2.5 / ctrl.view.t.k).on("mouseover", cfD3Line.interactivity.addTipOn(ctrl)).on("mouseout", cfD3Line.interactivity.addTipOff(ctrl)).on("click", cfD3Line.interactivity.addSelection); // update:

	      allSeries.transition().duration(ctrl.view.transitions.duration).attr("d", function (d) {
	        return ctrl.tools.line(d.series);
	      }).style("stroke", ctrl.tools.getColor); // exit

	      allSeries.exit().remove(); // Add the appropriate translate??

	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll("g.plotSeries").attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl));
	    } // if

	  },
	  // draw
	  refresh: function refresh(ctrl) {
	    // Update the axes
	    cfD3Line.helpers.axes.update(ctrl); // Using the transform on g to allow the zooming is much faster.
	    // MAYBE MOVE THE TRANSFORM ON g.data? WILL IT MAKE IT FASTER??

	    ctrl.figure.select("svg.plotArea").select("g.data").selectAll("g.plotSeries").attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl)); // Update the line thickness.

	    ctrl.figure.select("svg.plotArea").select("g.data").selectAll("g.plotSeries").selectAll("path.line").style("stroke-width", 2.5 / ctrl.view.t.k);
	  },
	  // refresh
	  rescale: function rescale(ctrl) {
	    // What should happen if the window is resized?
	    // Update the zoom clip.
	    var background = ctrl.figure.select("svg.plotArea").select("g.background");
	    background.select("clipPath").remove();
	    background.append("clipPath").attr("id", "zoomClip").append("rect");
	    ctrl.figure.select("div.plotContainer").select("svg.plotArea").select("g.data").attr("clip-path", "url(#zoomClip)"); // 1.) The svg should be resized appropriately

	    plotHelpers.setupPlot.general.rescaleSvg(ctrl); // 2.) The plot tools need to be updated

	    if (ctrl.data.compatible != undefined) {
	      cfD3Line.setupPlot.setupLineSeries(ctrl);
	      plotHelpers.setupTools.go(ctrl);
	      cfD3Line.setupPlot.setupLineTools(ctrl);
	    } // if
	    // 3.) The plot needs to be redrawn


	    cfD3Line.draw(ctrl);
	  },
	  // rescale
	  setupPlot: {
	    // This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
	    updateUiOptions: function updateUiOptions(ctrl) {
	      // The current view options may differ from the available data options. Therefore update the corresponding elements here.
	      // Do the same for the x and y axis options
	      if (ctrl.view.xVarOption == undefined) {
	        ctrl.view.xVarOption = {
	          val: ctrl.data.intersect[0],
	          options: ctrl.data.intersect
	        };
	      } else {
	        updateOption(ctrl.view.xVarOption, ctrl.data.intersect);
	      } // if


	      if (ctrl.view.yVarOption == undefined) {
	        ctrl.view.yVarOption = {
	          val: ctrl.data.intersect[0],
	          options: ctrl.data.intersect
	        };
	      } else {
	        updateOption(ctrl.view.yVarOption, ctrl.data.intersect);
	      } // if
	      // Handle the options corresponding to fixed UI elements.


	      var gh = plotHelpers.setupPlot.general;
	      var h = plotHelpers.setupPlot.twoInteractiveAxes;
	      gh.updateVerticalSelection(ctrl);
	      gh.updateHorizontalSelection(ctrl); // Handle the options of the 'button menu'
	      // Manually create the color option.

	      if (ctrl.view.cVarOption == undefined) {
	        ctrl.view.cVarOption = color.settings;
	      } // if
	      // HERE UPDATE THE BUTTON HARMONICA OPTIONS TOO!!	


	      h.buttonMenu.update(ctrl, assembleButtonMenuOptions()); // Helpers

	      function updateOption(viewOption, options) {
	        // If the option does exist, then just update it.
	        if (!options.includes(viewOption.val)) {
	          // The new options do not include the previously selected option value. Initialise a new one.
	          viewOption.val = options[0];
	        } // if


	        viewOption.options = options;
	      } // updateOption


	      function assembleButtonMenuOptions() {
	        // The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
	        // Make functionality options for the menu.
	        var codedPlotOptions = [color.settings];
	        return codedPlotOptions.concat(ctrl.view.options);
	      } // assembleButtonMenuOptions

	    },
	    // updateUiOptions
	    // Functionality required to setup the tools.
	    setupLineSeries: function setupLineSeries(ctrl) {
	      // Create the appropriate data series. Here the user's selection of variables is taken into accout too.
	      ctrl.data.available = ctrl.data.available.map(function (dataobj) {
	        // Pass in the x variable and the y variable. Maintain reference to the task!!
	        dataobj.series = dataobj.file.content.data.map(function (point) {
	          return {
	            x: point[ctrl.view.xVarOption.val],
	            y: point[ctrl.view.yVarOption.val]
	          };
	        });
	        return dataobj;
	      }); // map
	    },
	    // setupLineSeries
	    setupLineTools: function setupLineTools(ctrl) {
	      // Needs to update the accessors.
	      // Make the required line tool too!
	      // The d3.line expects an array of points, and will then connect it. Therefore the data must be in some form of: [{x: 0, y:0}, ...]
	      ctrl.tools.line = d3.line().x(function (d) {
	        return ctrl.tools.xscale(d.x);
	      }).y(function (d) {
	        return ctrl.tools.yscale(d.y);
	      }); // Tools for retrieving the color and taskId

	      ctrl.tools.getTaskId = function (d) {
	        return d.task.taskId;
	      };

	      ctrl.tools.getColor = function (d) {
	        return color.get(d.task[color.settings.variable]);
	      }; // getColor

	    },
	    // setupLineTools
	    findPlotDimensions: function findPlotDimensions(svg) {
	      return {
	        x: [0, Number(svg.select("g.data").attr("width"))],
	        y: [Number(svg.select("g.data").attr("height")), 0]
	      };
	    },
	    // findPlotDimensions
	    findDomainDimensions: function findDomainDimensions(ctrl) {
	      // The series are now an array of data for each of the lines to be drawn. They possibly consist of more than one array of values. Loop over all to find the extent of the domain.
	      var seriesExtremes = ctrl.data.available.map(function (dataobj) {
	        var series = dataobj.series;
	        return {
	          x: [d3.min(series, function (d) {
	            return d.x;
	          }), d3.max(series, function (d) {
	            return d.x;
	          })],
	          y: [d3.min(series, function (d) {
	            return d.y;
	          }), d3.max(series, function (d) {
	            return d.y;
	          })]
	        };
	      }); // map

	      var xExtremesSeries = helpers.collectObjectArrayProperty(seriesExtremes, "x");
	      var yExtremesSeries = helpers.collectObjectArrayProperty(seriesExtremes, "y");
	      return {
	        x: [d3.min(xExtremesSeries), d3.max(xExtremesSeries)],
	        y: [d3.min(yExtremesSeries), d3.max(yExtremesSeries)]
	      }; // Helpers
	    },
	    // findDomainDimensions
	    // Find the appropriate transform for the data
	    adjustTransformToData: function adjustTransformToData(ctrl) {
	      // Calculate the transform. Find the position of the domain minimum using the new scales.
	      // Find the scaling based on the data domain and the scale domain.
	      var xDataDomain = ctrl.format.domain.x;
	      var xScaleDomain = ctrl.tools.xscale.domain();
	      var yDataDomain = ctrl.format.domain.y;
	      var yScaleDomain = ctrl.tools.yscale.domain();
	      var x = (xDataDomain[1] - xDataDomain[0]) / (xScaleDomain[1] - xScaleDomain[0]);
	      var y = (yDataDomain[1] - yDataDomain[0]) / (yScaleDomain[1] - yScaleDomain[0]);
	      var scale = "scale(" + [x, y].join(",") + ")"; // THE SCALE IS APPLIE WITH THE BASIS AT THE TOP CORNER. MEANS THAT AN ADDITIONAL TRANSLATE WILL BE NEEDED!!
	      // y-axis starts at the top! The correction for this, as well as the offset due to the top=based scaling is "- plotHeight + (1-y)*plotHeight"

	      var plotHeight = ctrl.tools.yscale.range()[0] - ctrl.tools.yscale.range()[1]; // y-axis starts at the top!

	      var translate = helpers.makeTranslate(ctrl.tools.xscale(ctrl.format.domain.x[0]), ctrl.tools.yscale(ctrl.format.domain.y[0]) - y * plotHeight);
	      return [translate, scale].join(" ");
	    } // 

	  },
	  // setupPlot
	  interactivity: {
	    // Variable change
	    onSelectChange: function onSelectChange(ctrl) {
	      // Reset the AR values.
	      ctrl.view.dataAR = undefined;
	      ctrl.view.viewAR = undefined; // Update the plot tools. Data doesn't need to change - FIX

	      cfD3Line.setupPlot.setupLineSeries(ctrl);
	      plotHelpers.setupTools.go(ctrl);
	      cfD3Line.setupPlot.setupLineTools(ctrl); // The data domain is required for nicer AR adjusting.

	      ctrl.format.domain = {
	        x: ctrl.tools.xscale.domain(),
	        y: ctrl.tools.yscale.domain()
	      }; // Update transition timings

	      ctrl.view.transitions = cfD3Line.helpers.transitions.animated(); // Update plot itself

	      cfD3Line.draw(ctrl);
	    },
	    // onSelectChange
	    // Tooltips
	    createLineTooltip: function createLineTooltip(ctrl) {
	      // The tooltips are shared among the plots, therefore check if the tooltip is already available first.
	      if (ctrl.view.lineTooltip == undefined) {
	        ctrl.view.lineTooltip = createTip();
	      } // if


	      function createTip() {
	        // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
	        var tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
	          return "<span>" + d.task.label + "</span>";
	        });
	        ctrl.figure.select("svg.plotArea").call(tip);
	        return tip;
	      } // createTip

	    },
	    // createLineTooltip
	    addTipOn: function addTipOn(ctrl) {
	      return function (d) {
	        // path < plotSeries < g.data < svg
	        var coordinates = d3.mouse(this.parentElement.parentElement);
	        var anchorPoint = ctrl.figure.select("svg.plotArea").select("g.background").select(".anchorPoint").attr("cx", coordinates[0]).attr("cy", coordinates[1] - 15);
	        ctrl.view.lineTooltip.show(d, anchorPoint.node());
	        crossPlotHighlighting.on(d, "cfD3Line");
	      }; // return 
	    },
	    // addTipOn
	    addTipOff: function addTipOff(ctrl) {
	      return function (d) {
	        ctrl.view.lineTooltip.hide();
	        crossPlotHighlighting.off(d, "cfD3Line");
	      }; // tipOff
	    },
	    // addTipOff 
	    // Manual selection
	    addSelection: function addSelection(d) {
	      // Functionality to select elements on click. 
	      // Toggle the selection
	      var p = dbsliceData.data.manuallySelectedTasks; // Is this point in the array of manually selected tasks?

	      var isAlreadySelected = p.indexOf(d.task.taskId) > -1;

	      if (isAlreadySelected) {
	        // The poinhas currently been selected, but must now be removed
	        p.splice(p.indexOf(d.task.taskId), 1);
	      } else {
	        p.push(d.task.taskId);
	      } // if
	      // Highlight the manually selected options.


	      crossPlotHighlighting.manuallySelectedTasks();
	    },
	    // addSelecton
	    // On resize/drag
	    refreshContainerSize: function refreshContainerSize(ctrl) {
	      var container = d3.select(ctrl.format.parent);
	      builder.refreshPlotRowHeight(container);
	    },
	    // refreshContainerSize
	    toggleAR: function toggleAR(ctrl) {
	      // Make sure the data stays in the view after the changes!!
	      if (ctrl.view.viewAR == 1) {
	        // Change back to the data aspect ratio. Recalculate the plot tools.
	        ctrl.view.viewAR = ctrl.view.dataAR;
	      } else {
	        // Change to the unity aspect ratio. Adjust the y-axis to achieve it.
	        ctrl.view.viewAR = 1;
	      } // if
	      // When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
	      // Adjust so that the middle of the visible data domain stays in the same place?


	      var yAR = calculateAR(ctrl);
	      var newYDomain = calculateDomain(ctrl.tools.yscale, ctrl.format.domain.y, yAR);
	      ctrl.tools.yscale.domain(newYDomain); // cfD3Line.setupPlot.setupLineTools(ctrl)
	      // t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.

	      ctrl.view.t = -1;
	      ctrl.view.transitions = cfD3Line.helpers.transitions.animated(); // Redraw is handled here, as the data domain must be used for the drawing. Shouldn't this also be true when changing the AR??
	      // Revert back to original domain for drawing, but use the current axis domain for the axis update. d3.line in ctrl.tools.line accesses teh x and yscales when called, and so uses the current scale domains. These change on zooming, but the data must be drawn in the data domain, because the zooming and panning is done via transform -> translate.

	      var xscaleDomain = ctrl.tools.xscale.domain();
	      ctrl.tools.xscale.domain(ctrl.format.domain.x); // Redraw the line in the new AR.

	      var allSeries = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("path.line").transition().duration(ctrl.view.transitions.duration).attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl)).attr("d", ctrl.tools.line);
	      ctrl.tools.xscale.domain(xscaleDomain);

	      function calculateAR(ctrl) {
	        var xRange = ctrl.tools.xscale.range();
	        var yRange = ctrl.tools.yscale.range();
	        var xDomain = ctrl.tools.xscale.domain();
	        var yDomain = ctrl.tools.yscale.domain();
	        var xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0]);
	        var yAR = xAR / ctrl.view.viewAR;
	        return yAR;
	      }

	      function calculateDomain(scale, dataDomain, AR) {
	        // Always adjust teh AR so that the data remains in view. Keep the midpoint of the visible data where it is on the screen.
	        var range = scale.range();
	        var domain = scale.domain(); // First find the midpoint of the visible data.

	        var a = dataDomain[0] < domain[0] ? domain[0] : dataDomain[0];
	        var b = dataDomain[1] > domain[1] ? domain[1] : dataDomain[1];
	        var mid = (a + b) / 2;
	        var domainRange = [range[0] - range[1]] / AR;
	        var newDomain = [mid - domainRange / 2, mid + domainRange / 2];
	        return newDomain;
	      } // calculateDomain

	    },
	    // toggleAR
	    // When resizing the axes interactively
	    dragAdjustAR: function dragAdjustAR(ctrl) {
	      // Should direct redrawing be allowed in hte first place??
	      // Transitions
	      ctrl.view.transitions = cfD3Line.helpers.transitions.instantaneous(); // Uses the scales with updated domains.

	      ctrl.view.t = d3.zoomIdentity;
	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll("g.plotSeries").transition().duration(ctrl.view.transitions.duration).attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl)); // Update the axes

	      cfD3Line.helpers.axes.update(ctrl);
	    } // dragAdjustAR

	  },
	  // interactivity
	  helpers: {
	    // Initialisation
	    createDefaultControl: function createDefaultControl() {
	      // data:
	      // • .promises are promises completed before drawing the graphics.
	      // • .requested is an array of urls whose data are requested by the plotting tool. These need not be the same as the data in promises as those are loaded on user prompt!
	      // • .available is an array of urls which were found in the central booking,
	      // • .missing                              NOT found
	      // • .ordinalProperties is a string array of properties found in the data.
	      // • .data is an array of n-data arrays of the n-task slice files.
	      var ctrl = {
	        plotFunc: cfD3Line,
	        fileClass: line2dFile,
	        figure: undefined,
	        svg: undefined,
	        data: {
	          available: [],
	          missing: [],
	          intersect: []
	        },
	        view: {
	          sliceId: undefined,
	          options: [],
	          viewAR: NaN,
	          dataAR: NaN,
	          xVarOption: undefined,
	          yVarOption: undefined,
	          cVarOption: undefined,
	          lineTooltip: undefined,
	          transitions: {
	            duration: 500,
	            updateDelay: 0,
	            enterDelay: 0
	          },
	          t: undefined
	        },
	        tools: {
	          xscale: undefined,
	          yscale: undefined
	        },
	        format: {
	          title: "Edit title",
	          margin: {
	            top: 10,
	            right: 10,
	            bottom: 38,
	            left: 30
	          },
	          axesMargin: {
	            top: 20,
	            right: 20,
	            bottom: 16,
	            left: 30
	          },
	          parent: undefined,
	          position: {
	            ix: 0,
	            iy: 0,
	            iw: 4,
	            ih: 4,
	            minH: 290,
	            minW: 190
	          }
	        }
	      }; // ctrl

	      return ctrl;
	    },
	    // createDefaultControl
	    createLoadedControl: function createLoadedControl(plotData) {
	      var ctrl = cfD3Line.helpers.createDefaultControl(); // If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.

	      if (plotData.sliceId != undefined) {
	        if (dbsliceData.data.line2dProperties.includes(plotData.sliceId)) {
	          ctrl.view.sliceId = plotData.sliceId;
	        } // if

	      } // if
	      // When the session is loaded all previously existing plots would have been removed, and with them all on demand loaded data. Therefore the variables for this plot cannot be loaded, as they will depend on the data.


	      ctrl.format.title = plotData.title;
	      return ctrl;
	    },
	    // createLoadedControl
	    writeControl: function writeControl(ctrl) {
	      var s = "";
	      s = s + '{';
	      s = s + '"type": "' + ctrl.plotFunc.name + '", ';
	      s = s + '"title": "' + ctrl.format.title + '"'; // For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
	      // Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.

	      var sliceId = accessProperty(ctrl.view, "sliceId");
	      s = s + writeOptionalVal("sliceId", sliceId);
	      s = s + '}';
	      return s;

	      function writeOptionalVal(name, val) {
	        var s_ = "";

	        if (val !== undefined) {
	          s_ = s_ + ', ';
	          s_ = s_ + '"' + name + '": "' + val + '"';
	        } // if


	        return s_;
	      } // writeOptionalVal


	      function accessProperty(o, p) {
	        // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
	        // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
	        return o == undefined ? undefined : o[p];
	      } // accessProperty

	    },
	    // writeControl
	    // Interactivity
	    axes: {
	      update: function update(ctrl) {
	        if (ctrl.tools.xscale && ctrl.tools.yscale) {
	          // Only update the axis if the scales are defined. When calling the update on an empty plot they will be undefined.
	          var xAxis = d3.axisBottom(ctrl.tools.xscale).ticks(5);
	          var yAxis = d3.axisLeft(ctrl.tools.yscale);
	          ctrl.figure.select("svg.plotArea").select(".axis--x").call(xAxis);
	          ctrl.figure.select("svg.plotArea").select(".axis--y").call(yAxis);
	          cfD3Line.helpers.axes.updateTicks(ctrl);
	        } // if

	      },
	      // update
	      updateTicks: function updateTicks(ctrl) {
	        // Update all the axis ticks.
	        ctrl.figure.select("svg.plotArea").select(".axis--x").selectAll(".tick").selectAll("text").style("cursor", "ew-resize");
	        ctrl.figure.select("svg.plotArea").select(".axis--y").selectAll(".tick").selectAll("text").style("cursor", "ns-resize");
	        ctrl.figure.select("svg.plotArea").selectAll(".tick").selectAll("text").on("mouseover", function () {
	          d3.select(this).style("font-weight", "bold");
	        }).on("mouseout", function () {
	          d3.select(this).style("font-weight", "normal");
	        });
	      } // updateTicks

	    },
	    // axes
	    transitions: {
	      instantaneous: function instantaneous() {
	        return {
	          duration: 0,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      },
	      // instantaneous
	      animated: function animated() {
	        return {
	          duration: 500,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      } // animated

	    },
	    // transitions
	    // Manual functionality
	    updateManualSelections: function updateManualSelections(ctrl) {
	      var gData = ctrl.figure.select("svg.plotArea").select("g.data");
	      gData.selectAll("g.plotSeries").each(function (d) {
	        var plotSeries = d3.select(this);
	        var isSelected = dbsliceData.data.manuallySelectedTasks.includes(d.task.taskId);

	        if (isSelected) {
	          // paint it orange, and bring it to the front.
	          plotSeries.select("path.line").style("stroke", "rgb(255, 127, 14)").style("stroke-width", 4 / ctrl.view.t.k);
	          this.remove();
	          gData.node().appendChild(this);
	        } else {
	          plotSeries.select("path.line").style("stroke", ctrl.tools.getColor).style("stroke-width", 2.5 / ctrl.view.t.k);
	        } // if

	      });
	    },
	    // updateManualSelections
	    // Functions supporting cross plot highlighting
	    unhighlight: function unhighlight(ctrl) {
	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll(".line").style("opacity", 0.2).style("stroke", "Gainsboro");
	    },
	    // unhighlight
	    highlight: function highlight(ctrl, allDataPoints) {
	      var highlightedTaskIds = allDataPoints.map(function (d) {
	        return d.taskId;
	      });
	      var plotSeries = ctrl.figure.select("svg.plotArea").select("g.data").selectAll('.plotSeries');
	      plotSeries.each(function (d) {
	        var series = d3.select(this);

	        if (highlightedTaskIds.includes(d.task.taskId)) {
	          series.selectAll(".line").style("opacity", 1.0).style("stroke", ctrl.tools.getColor).style("stroke-width", 4 / ctrl.view.t.k);
	          series.raise();
	        }
	      });
	    },
	    // highlight
	    defaultStyle: function defaultStyle(ctrl) {
	      // Revert the opacity and width.
	      ctrl.figure.select("svg.plotArea").select("g.data").selectAll(".line").style("opacity", 1.0).style("stroke", ctrl.tools.getColor).style("stroke-width", 2.5 / ctrl.view.t.k); // Rehighlight any manually selected tasks.

	      crossPlotHighlighting.manuallySelectedTasks();
	    } // defaultStyle

	  } // helpers

	}; // cfD3Line

	var lasso = {
	  /*
	  The 'lasso.add' method requires a specific input lasso object, which contains all hte information required.
	  
	  var lassoObj = {
	  	element: {
	  		// 'owner': element to attach the lasso to.
	  		// 'svg'  : where to draw the lasso to
	  		// 'ref'  : reference for position retrieval
	  		owner: svg,
	  		svg: svg.select("g.markup"),
	  		ref: svg.select("g.data")
	  	},
	  	data: {
	  		// 'boundary': array holding boundary points
	  		// 'selection': array holding the selected data
	  		// 'getBasisData': accessor getting the actual tasks to be selected by the lasso.
	  		boundary: [],
	  		selection: [],
	  		getBasisData: function(){ return data; }
	  	},		
	  	accessor: {
	  		// accessor retrieving the appropriate attributes of underlying data.
	  		x: function(d){return d.x},
	  		y: function(d){return d.y},
	  	},
	  	scales: {
	  		// scales to convert the on-screen pixels to the values of the data. Inverse of the scales used to convert values to on-screen position.
	  		x: val2pxX.invert,
	  		y: val2pxY.invert
	  	},
	  	// Function to execute in response. The selected tasks are the input
	  	response: highlight,
	  }
	  */
	  add: function add(lassoObj) {
	    lassoObj.element.owner.call(d3.drag().on("start", function () {
	      // Clear previous lasso.
	      lassoObj.data.boundary = [];
	      lasso.draw(lassoObj); // Perform any pre-emptive action required.

	      lassoObj.preemptive();
	    }).on("drag", function () {
	      lasso.addPointToLasso(lassoObj);
	      lasso.draw(lassoObj);
	    }).on("end", function () {
	      if (lassoObj.data.boundary.length > 3) {
	        lassoObj.data.selection = lasso.findTasksInLasso(lassoObj);

	        if (lassoObj.data.selection.length > 0) {
	          lassoObj.response(lassoObj.data.selection);
	        } // if
	        // After the selection is done remove the lasso.


	        lasso.remove(lassoObj);
	      } // if

	    }));
	  },
	  // add
	  addPointToLasso: function addPointToLasso(lassoObj) {
	    var position = d3.mouse(lassoObj.element.ref.node());
	    lassoObj.data.boundary.push({
	      cx: position[0],
	      cy: position[1],
	      x: lassoObj.scales.x(position[0]),
	      y: lassoObj.scales.y(position[1])
	    });
	  },
	  // addPointToLasso
	  findTasksInLasso: function findTasksInLasso(lassoObj) {
	    // Find min and max for the lasso selection. Her the accessors can be hard coded because the points definition is hard coded.
	    var dom = {
	      x: d3.extent(lassoObj.data.boundary, function (d) {
	        return d.x;
	      }),
	      y: d3.extent(lassoObj.data.boundary, function (d) {
	        return d.y;
	      })
	    }; // Don't get the data through the dom elements - this won't work for canvas lassoing. Instead focus directly on the data in hte plot.

	    var allTasks = lassoObj.data.getBasisData();
	    var selectedTasks = allTasks.filter(function (d_) {
	      // Check if it is inside the lasso bounding box. Otherwise no need to check anyway.
	      // Implement an accessor for d.x/y.
	      var d = {
	        x: lassoObj.accessor.x(d_),
	        y: lassoObj.accessor.y(d_)
	      };
	      var isInside = false;

	      if (dom.x[0] <= d.x && d.x <= dom.x[1] && dom.y[0] <= d.y && d.y <= dom.y[1]) {
	        isInside = lasso.isPointInside(d, lassoObj.data.boundary);
	      } // if


	      return isInside;
	    });
	    return selectedTasks;
	  },
	  // findTasksInLasso
	  isPointInside: function isPointInside(point, boundary) {
	    // Check wheteher the 'point' is within the polygon defined by the points array 'boundary'.
	    var isInside = false;

	    for (var i = 1; i < boundary.length; i++) {
	      checkIntersect(boundary[i - 1], boundary[i], point);
	    } // for


	    checkIntersect(boundary[boundary.length - 1], boundary[0], point);
	    return isInside; // Need to check the same number of edge segments as vertex points. The last edge should be the last and the first point.

	    function checkIntersect(p0, p1, point) {
	      // One point needs to be above, while the other needs to be below -> the above conditions must be different.
	      if (p0.y > point.y !== p1.y > point.y) {
	        // One is above, and the other below. Now find if the x are positioned so that the ray passes through. Essentially interpolate the x at the y of the point, and see if it is larger.
	        var x = (p1.x - p0.x) / (p1.y - p0.y) * (point.y - p0.y) + p0.x;
	        isInside = x > point.x ? !isInside : isInside;
	      } // if

	    } // checkIntersect

	  },
	  // isPointInside
	  draw: function draw(lassoObj) {
	    var d = [lassoObj.data.boundary.map(function (d) {
	      return [d.cx, d.cy].join();
	    }).join(" ")];
	    lassoObj.element.svg.selectAll("polygon").data(d).join(function (enter) {
	      return enter.append("polygon").attr("points", function (d) {
	        return d;
	      }).style("fill", "cornflowerblue").style("stroke", "dodgerblue").style("stroke-width", 2).attr("opacity", 0.4);
	    }, function (update) {
	      return update.attr("points", function (d) {
	        return d;
	      });
	    }, function (exit) {
	      return exit.remove();
	    });
	  },
	  // draw
	  remove: function remove(lassoObj) {
	    lassoObj.element.svg.selectAll("polygon").remove();
	  } // remove

	}; // lasso

	var cfD3Contour2d = {
	  // Externally visible methods are:
	  // name, make, update, rescale, helpers.highlught/unhighlight/defaultStyle, helpers.createDefaultControl/createLoadedControl/writeControl
	  // SHOULD: the contour plot always occupy the whole width? Should it just size itself appropriately? It has a potential to cover other plots... Should all plots just reorder. I think only the clashing plots should reorder. Maybe implement this as general functionality first.
	  // SHOULD: instead of looping over the contours when figuring out the dimension the plot dimensions be updated internally on the fly? By saving the maximum ih for example?
	  // SHOULD: when calculating the statistics create domain areas on which to calculate the value for particular contour? Or is this too much? It does involve integration...
	  name: "cfD3Contour2d",
	  make: function make(ctrl) {
	    // This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
	    // How should the user select the variable to be plotted? At the beginning there will be no contours, so the controls need to be elsewhere. For now put them into the plot title.
	    // Scale the card appropriately so that it occupies some area. Needs to be adjusted for hte title height
	    cfD3Contour2d.setupPlot.dimension(ctrl);
	    cfD3Contour2d.setupPlot.setupTrendingCtrlGroup(ctrl); // `cfD3Contour2d' has a different structure than the other plots, therefore the `ctrl.figure' attribute needs to be updated.

	    cfD3Contour2d.setupPlot.setupPlottingArea(ctrl); // Add the lassoing.

	    cfD3Contour2d.interactivity.lassoing(ctrl); // The plotBody must be reassigned here so that the rightcontrolgroup svgs are appended appropriately.

	    cfD3Contour2d.resizing.plotOnExternalChange(ctrl); // NOTES:
	    // How to configure the contour plot on the go? For now the positional variables will be just assumed.
	  },
	  // make
	  getData: function getData(ctrl) {
	    // First establish for which tasks the files are available.
	    var tasks = dbsliceData.data.taskDim.top(Infinity);
	    var requiredUrls = tasks.map(function (d) {
	      return d[ctrl.view.sliceId];
	    }); // Create an itnernal data object for tasks that have a loaded file, and log those that weren't loaded as missing.

	    var dataobjs = tasks.reduce(function (acc, t) {
	      // The library will retrieve at most 1 file!
	      var filename = t[ctrl.view.sliceId];
	      var f = fileManager.library.retrieve(contour2dFile, filename);

	      if (f) {
	        // Exactly the right file was found. As on-demand filenames will have the same filename and url this should always happen when the file has been loaded. The series is still empty as the selection of the variables has not been made yet.
	        acc.available.push({
	          task: t,
	          file: f,
	          graphic: undefined
	        });
	      } else {
	        // File not found - log as missing
	        acc.missing.push({
	          task: t,
	          value: filename
	        });
	      } // if


	      return acc;
	    }, {
	      available: [],
	      missing: []
	    }); // reduce

	    ctrl.data.available = dataobjs.available;
	    ctrl.data.missing = dataobjs.missing; // Set the intersect of availbale variables.

	    ctrl.data.intersect = ctrl.data.available.length > 0 ? cfD3Contour2d.getIntersectOptions(ctrl.data.available) : undefined;
	  },
	  // getData
	  getIntersectOptions: function getIntersectOptions(dataobjs) {
	    // Find which variables appear in all the dataobj files. These are the variables that can be compared.
	    var commonvars = dataobjs.reduce(function (acc, d) {
	      acc = acc.filter(function (varname) {
	        return d.file.content.variables.includes(varname);
	      });
	      return acc;
	    }, _toConsumableArray(dataobjs[0].file.content.variables));
	    return commonvars;
	  },
	  // getIntersectOptions
	  update: function update(ctrl) {// This is called during render. Do nothing. Maybe only signal differences to the crossfilter.
	  },
	  // update
	  updateData: function updateData(ctrl) {
	    // This should do what? Come up with the initial contour data? Maybe calculate the initial threshold items? Set a number of levels to show. Calculate the ideal bin number?
	    // First collect and report the data available.
	    cfD3Contour2d.getData(ctrl); // How to handle contour data? The user should be expected to select the position variables once, and then just change the flow variable if needed. For now this is manually selected here, but the user should be able to select their varioable based on hte name. Implement that later. Maybe a focus out to adjust the contours, and then a focus in to show change. However, in json formats the user should just name the variables correctly!! How should it happen in csv?
	    // Only use the first 6 files for now.
	    // ctrl.data.available = ctrl.data.available.splice(0,6)
	    // Calculate the extent of hte data and the thresholds

	    cfD3Contour2d.setupPlot.setupPlotTools(ctrl); // Get the contours based on the thresholds

	    cfD3Contour2d.draw.getContours(ctrl); // Draw the plot

	    cfD3Contour2d.draw.cards(ctrl); // Draw teh colorbar

	    cfD3Contour2d.draw.rightControlGroup(ctrl); // Resize the plot cotnainers

	    cfD3Contour2d.resizing.plotOnInternalChange(ctrl); // When panning over the levels markers on the colorbar highlight those on hte contours somehow.
	    // Introduce a card folder to the side, and only present 4 at the same time at the beginning. Then the user should add other cards to the view.
	    // A special tool to order the cards roughly? This is the grouping sort-of?
	  },
	  // updateData
	  // MOVE ALL RESCALING TO A SINGLE OBJECT?
	  rescale: function rescale(ctrl) {
	    // Should rescale the whole plot and the individual contours in it.
	    console.log("Rescaling cfD3Contour2d"); // Make sure the overlay is the right size
	  },
	  // rescale
	  resizing: {
	    findContainerSize: function findContainerSize(container, memberClass) {
	      // Index of the lowest plot bottom.
	      var lowestPoint = [];
	      container.selectAll(memberClass).each(function (d) {
	        lowestPoint.push(this.offsetTop + this.offsetHeight);
	      }); // But return only an incremental change - so every time the lowest point is lower than the container return the height incremented by one grid distance.

	      lowestPoint = Math.max.apply(Math, _toConsumableArray(lowestPoint));
	      var dy = positioning.dy(container);
	      return Math.ceil(lowestPoint / dy) * dy;
	    },
	    // findContainerSize
	    contourCard: function contourCard(contourCtrl) {
	      // Retrieve the data AR from the plot ctrl.
	      var format = contourCtrl.graphic.format;
	      var card = format.wrapper;
	      var p = format.position;
	      var plotCtrl = d3.select(format.parent).datum();
	      var dy = positioning.dy(plotCtrl.figure);
	      var dx = positioning.dx(plotCtrl.figure); // Update the position based on the new ih and iw.

	      var position_ = cfD3Contour2d.draw.dimension(p.iw, p.ih, dx, dy, plotCtrl.data.domain.ar);
	      p.w = position_.w;
	      p.h = position_.h;
	      p.sw = position_.sw;
	      p.sh = position_.sh;
	      p.minW = position_.minW;
	      p.minH = position_.minH;
	      p.ar = position_.ar; // Update the relevant DOM elements.
	      // Update the title div. Enforce a 24px height for this div.

	      var title = card.select("div.title").select("p").style("text-align", "center").style("margin-left", "5px").style("margin-right", "5px").style("margin-bottom", "8px");
	      helpers.fitTextToBox(title, title, "height", 24); // Update the plot svg

	      card.select("svg.plotArea").attr("width", p.sw).attr("height", p.sh);
	    },
	    // contourCard
	    plotOnInternalChange: function plotOnInternalChange(ctrl) {
	      // An internal change has occured that prompted the plot to be resized (contours were added, moved, or resized).
	      // Update the plot, AND the plot row. When updating the plot row also the other plots need to be repositioned on the grid.
	      // Needs to update:
	      // 1 plot (div.plot holding the contours), 
	      // 2 plotWrapper (containing hte whole plot)
	      // 3 plotRowBody (containing the plot). 
	      // 4 other plots of hte plot row need to be repositioned.
	      // First update the size of the contour plotting area. Based on this size update the plot wrapper. Based on the new plot wrapper size update the plot row.
	      var h = cfD3Contour2d.resizing;
	      var f = ctrl.format;
	      var w = ctrl.format.wrapper;
	      var dx = positioning.dx(d3.select(f.parent));
	      var dy = positioning.dy(d3.select(f.parent));
	      var rightControlSize = w.select("svg.rightControlSVG").node().getBoundingClientRect();
	      var rightControlY = f.rightControls.format.position.iy * positioning.dy(d3.select(f.rightControls.format.parent)); // Heights of components

	      var titleHeight = w.select("div.plotTitle").node().offsetHeight;
	      var plotHeight = h.findContainerSize(ctrl.figure, ".contourWrapper");
	      var colorbarHeight = rightControlY + rightControlSize.height;
	      var figureHeight = colorbarHeight > plotHeight ? colorbarHeight : plotHeight; // Size the plotWrapper appropriately.

	      var ih = Math.ceil((figureHeight + titleHeight) / dy);
	      f.position.ih = ih < 4 ? 4 : ih; // Update the heights of the wrapper, hte plot body, and the svg overlay.

	      var wrapperHeight = f.position.ih * dy;
	      var plotAreaHeight = wrapperHeight - titleHeight;
	      w.style("height", wrapperHeight + "px");
	      ctrl.figure.style("height", plotAreaHeight + "px");
	      d3.select(ctrl.figure.node().parentElement).style("height", plotAreaHeight + "px");
	      w.select("svg.overlay").style("height", plotAreaHeight + "px"); // Reposition other on-demand plots and size the plot row accordingly.

	      cfD3Contour2d.resizing.plotOnExternalChange(ctrl);
	    },
	    // plotOnInternalChange
	    plotOnExternalChange: function plotOnExternalChange(plotCtrl) {
	      // An external change occured - the plot was moved or resized.
	      // The contour plot is not allowed to clash with other plots. Once an appropriate sizing logic will be selected and implemented this can be relaxed. Therefore when it is moved or resized other plots in the same plot row need to be repositioned.
	      // If the body of the plot moves, then hte other plots must also move.
	      positioning.helpers.repositionSiblingPlots(plotCtrl); // Update the plot row height itself.

	      var plotRowBody = d3.select(plotCtrl.format.parent);
	      builder.refreshPlotRowHeight(plotRowBody);
	    } // plotOnExternalChange

	  },
	  // resizing
	  // Rename setupPlot -> setup
	  // Add groups: plot, controls, cards
	  setupPlot: {
	    // Broadly dimension the plot.
	    dimension: function dimension(ctrl) {
	      // `makeNewPlot' sizes the plot wrapper. Here calculate the dimensions of the internals.
	      var p = ctrl.format.position;
	      var w = ctrl.format.wrapper;
	      var dy = positioning.dy(d3.select(ctrl.format.parent));
	      var wrapperHeight = p.ih * dy;
	      p.titleHeight = w.select(".plotTitle").node().offsetHeight;
	      p.plotHeight = wrapperHeight - p.titleHeight;
	      p.plotWidth = w.node().offsetWidth - p.rightControlWidth;
	    },
	    // dimension
	    setupPlottingArea: function setupPlottingArea(ctrl) {
	      var p = ctrl.format.position;
	      ctrl.figure.attr("class", "card-body plot").style("padding-left", "0px").style("padding-top", "0px").style("padding-right", "0px").style("padding-bottom", "0px"); // `cfD3Contour2d' has a different structure than the other plots, therefore the `ctrl.figure' attribute needs to be updated.

	      var dataDiv = ctrl.figure.append("div").attr("class", "data").style("width", p.plotWidth + "px").style("height", p.plotHeight + "px").style("position", "absolute"); // MOST OF BELOW IS DUE TO LASSOING. MOVE!!

	      var overlaySvg = ctrl.figure.append("svg").attr("class", "overlay").style("width", p.plotWidth + "px").style("height", p.plotHeight + "px").style("position", "absolute").style("top", p.titleHeight + "px").style("display", "none");
	      dataDiv.on("mousemove", function () {
	        if (event.shiftKey) {
	          overlaySvg.style("display", "");
	        } else {
	          overlaySvg.style("display", "none");
	        } // if

	      });
	      overlaySvg.on("mousemove", function () {
	        if (event.shiftKey) ; else {
	          // If shift is released, hide overlay
	          overlaySvg.style("display", "none");
	        } // if

	      }); // Add in hte tooltip that hosts the tools operating on lasso selection.

	      cfD3Contour2d.interactivity.tooltip.add(ctrl); // Reassing hte figure to support drag-move.

	      ctrl.figure = dataDiv; // Also setup the right hand side controls

	      cfD3Contour2d.setupPlot.setupRightControlDOM(ctrl);
	    },
	    // setupPlottingArea
	    setupTrendingCtrlGroup: function setupTrendingCtrlGroup(ctrl) {
	      var variables = dbsliceData.data.ordinalProperties;
	      var trendingCtrlGroup = ctrl.format.wrapper.select("div.plotTitle").append("div").attr("class", "trendingCtrlGroup float-right").style("display", "none").datum(ctrl);
	      var p = cfD3Contour2d.interactivity.piling;
	      p.addRoundButton(trendingCtrlGroup, p.minimise, "times");
	      var menu = trendingCtrlGroup.append("div").attr("class", "trendTools").style("position", "relative").style("top", "5px").style("display", "inline-block").style("float", "right").style("margin-right", "10px");
	      menu.append("label").html("x:").style("margin-left", "10px").style("margin-right", "5px");
	      menu.append("select").attr("axis", "x").style("margin-right", "10px").selectAll("option").data(variables).enter().append("option").attr("value", function (d) {
	        return d;
	      }).html(function (d) {
	        return d;
	      });
	      menu.append("label").html("y:").style("margin-left", "10px").style("margin-right", "5px");
	      menu.append("select").attr("axis", "y").style("margin-right", "10px").selectAll("option").data(variables).enter().append("option").attr("value", function (d) {
	        return d;
	      }).html(function (d) {
	        return d;
	      }); // Add the functionalityto the dropdowns

	      menu.selectAll("select").on("change", function () {
	        console.log("Arrange the contours by: " + this.value); // Find the axis:

	        var axis = d3.select(this).attr("axis");
	        cfD3Contour2d.interactivity.sorting[axis](ctrl, this.value);
	      });
	      /* Buttons needed:
	      		Minimise
	      		Highlight
	      */

	      p.addRoundButton(trendingCtrlGroup, p.highlight, "lightbulb-o");
	    },
	    // setupTrendingCtrlGroup
	    // Right colorbar control group
	    setupContourTools: function setupContourTools(ctrl) {
	      var h = cfD3Contour2d.setupPlot;
	      var dataobjs = ctrl.data.available; // Setup the domain.

	      ctrl.data.domain = {
	        x: h.getDomain(dataobjs, function (d) {
	          return d.file.content.surface.x;
	        }),
	        y: h.getDomain(dataobjs, function (d) {
	          return d.file.content.surface.y;
	        }),
	        v: h.getDomain(dataobjs, function (d) {
	          return d.file.content.surface.v;
	        }),
	        thresholds: undefined,
	        nLevels: undefined
	      }; // Set the AR:

	      ctrl.data.domain.ar = (ctrl.data.domain.y[1] - ctrl.data.domain.y[0]) / (ctrl.data.domain.x[1] - ctrl.data.domain.x[0]);
	      cfD3Contour2d.setupPlot.setupThresholds(ctrl, ctrl.data.domain.v);
	    },
	    // setupContourTools
	    setupColorbarTools: function setupColorbarTools(ctrl) {
	      var c = ctrl.format.rightControls.colorbar; // Tools. `scaleSequential' maps into a range between 0 and 1.

	      ctrl.tools.scales.px2clr = d3.scaleSequential(d3.interpolateViridis).domain([0, c.height]); // Thresholds respond to selections on hte histogram. This is the corresponding scale.

	      ctrl.tools.scales.val2px = d3.scaleLinear().domain(d3.extent(ctrl.data.domain.thresholds)).range([0, c.height]); // Histogram needs to use a fixed scale based on the data domain.

	      ctrl.tools.scales.val2px_ = d3.scaleLinear().domain(ctrl.data.domain.v).range([0, c.height]); // Coloring

	      ctrl.tools.scales.val2clr = d3.scaleSequential(d3.interpolateViridis).domain(d3.extent(ctrl.data.domain.thresholds));
	    },
	    // setupColorbarTools
	    setupHistogramTools: function setupHistogramTools(ctrl) {
	      // There is a lot of data expected, and therefore each pixel can be used as a bin. Avoid making a new large array by calculating the histogram for each file independently, and then sum up all the bins.
	      var s = ctrl.tools.scales;
	      var c = ctrl.format.rightControls.colorbar;
	      var h = ctrl.format.rightControls.histogram; // Get the histogram data

	      var vMin = ctrl.data.domain.v[0];
	      var vMax = ctrl.data.domain.v[1];
	      var nBins = c.height;
	      var thresholds = d3.range(vMin, vMax, (vMax - vMin) / nBins);
	      var histogram = d3.histogram().domain(ctrl.data.domain.v).thresholds(thresholds);
	      var fileBins = ctrl.data.available.map(function (dataobj) {
	        // The returned bins acutally contain all the values. Rework the bins to remove them and thus minimise memory usage.
	        var bins = histogram(dataobj.file.content.surface.v);
	        return bins.map(function (bin) {
	          return {
	            x0: bin.x0,
	            x1: bin.x1,
	            n: bin.length
	          };
	        });
	      }); // Now summ all hte bins together.

	      h.bins = fileBins.reduce(function (acc, val) {
	        // Acc and val are arrays of bins, which have to be summed individually.
	        return acc.map(function (d, i) {
	          d.n += val[i].n;
	          return d;
	        });
	      }); // Take a log of the bin lengths to attempt to improve the histogram

	      h.bins = h.bins.map(function (d) {
	        d.n = d.n == 0 ? 0 : Math.log10(d.n);
	        return d;
	      }); // Tools for the histogram.

	      s.bin2px = d3.scaleLinear().domain([0, d3.max(h.bins, function (d) {
	        return d.n;
	      })]).range([0, h.width]);
	    },
	    // setupHistogramTools
	    sizeRightControlGroup: function sizeRightControlGroup(ctrl) {
	      // Histogram can be narrower!
	      var groupDiv = ctrl.format.wrapper.select("div.rightControlGroup");
	      var width = groupDiv.node().getBoundingClientRect().width;
	      var height = groupDiv.node().getBoundingClientRect().height;
	      var h = ctrl.format.rightControls.histogram;
	      var c = ctrl.format.rightControls.colorbar; // Dimension control group. X and Y are positions of the svgs.			

	      c.width = width * 3 / 5 - c.margin.left - c.margin.right;
	      c.height = height - c.margin.top - c.margin.bottom;
	      c.x = c.margin.left;
	      c.y = c.margin.top;
	      c.legendWidth = c.width * 1 / 2;
	      c.axisWidth = c.width * 1 / 2;
	      h.width = width * 2 / 5 - h.margin.left - h.margin.right;
	      h.height = height - h.margin.top - h.margin.bottom;
	      h.x = c.margin.left + c.width + c.margin.right + h.margin.left;
	      h.y = h.margin.top; // The control group consists of two SVGs side-by-side. The left holds an interactive histogram, the right holds the interactive colorbar. Both have the same size.
	    },
	    // sizeRightControlGroup
	    setupRightControlDOM: function setupRightControlDOM(ctrl) {
	      //Separate this out into colorbar and histogram??
	      var p = ctrl.format.position;
	      var c = ctrl.format.rightControls.colorbar;
	      var h = ctrl.format.rightControls.histogram; // Let teh div be the wrapper, and the parent simultaneously.

	      var rightControlDiv = ctrl.format.wrapper.select("div.plot").append("div").attr("class", "rightControlGroup").style("width", p.rightControlWidth + "px").style("height", p.plotHeight + "px").style("position", "absolute").style("left", p.plotWidth + "px").style("top", p.titleHeight + "px"); // One stationary div

	      var rightControlSvgWrapper = rightControlDiv.append("div").attr("class", "rightControlWrapper");
	      var rightControlSVG = rightControlSvgWrapper.append("svg").attr("class", "rightControlSVG").attr("width", p.rightControlWidth).attr("height", Math.floor(p.plotHeight)).style("position", "absolute");
	      ctrl.format.rightControls.format.parent = rightControlSvgWrapper.node();
	      ctrl.format.rightControls.format.wrapper = rightControlSVG; // Size the components.

	      cfD3Contour2d.setupPlot.sizeRightControlGroup(ctrl); // These should be sized later on, so in case some resizing is needed it is easier to update.

	      h.svg = rightControlSVG.append("svg");
	      c.svg = rightControlSVG.append("svg"); // Update teh svgs

	      h.svg.attr("height", h.height).attr("width", h.width).attr("x", h.x).attr("y", h.y);
	      c.svg.attr("height", c.height).attr("width", c.width).attr("x", c.x).attr("y", c.y); // Colorbar: the transform is required as d3.axisLeft positions itself in reference to the top right corner.

	      var gColorbar = c.svg.append("g").attr("transform", helpers.makeTranslate(c.axisWidth, 0));
	      gColorbar.append("g").attr("class", "gBar");
	      gColorbar.append("g").attr("class", "gBarAxis");
	      gColorbar.append("g").attr("class", "gBarLevels"); // Histogram

	      h.svg.append("g").attr("class", "gHist");
	      h.svg.append("g").attr("class", "gBrush");
	      h.svg.append("g").attr("class", "gHistAxis"); // Additional text for histogram.

	      var logNote = rightControlSVG.append("g").attr("class", "logNote").attr("transform", helpers.makeTranslate(h.x + 20, h.height + h.y + 9)).append("text").style("font", "10px / 15px sans-serif").style("font-size", 10 + "px").style("display", "none");
	      logNote.append("tspan").text("log");
	      logNote.append("tspan").text("10").attr("dy", 7);
	      logNote.append("tspan").text("(n)").attr("dy", -7); // Add the dragging.

	      var drag = d3.drag().on("start", positioning.dragStart).on("drag", positioning.dragMove).on("end", positioning.dragEnd);
	      rightControlSVG.append("g").attr("class", "gRightGroupDrag").append("circle").attr("r", "5").attr("cx", h.x - 15).attr("cy", p.plotHeight - 6).attr("fill", "gainsboro").attr("cursor", "move").attr("opacity", 0).datum(ctrl.format.rightControls).call(drag);
	    },
	    // setupRightControlDOM
	    // The plotting tools
	    setupPlotTools: function setupPlotTools(ctrl) {
	      // Setup the colorbar tools. This is in a separate function to allow it to be updated later if needed. Maybe create individual functions for all three? Contour, Colorbar, Histogram?
	      cfD3Contour2d.setupPlot.setupContourTools(ctrl);
	      cfD3Contour2d.setupPlot.setupColorbarTools(ctrl);
	      cfD3Contour2d.setupPlot.setupHistogramTools(ctrl);
	    },
	    // setupPlotTools
	    setupThresholds: function setupThresholds(ctrl, extent) {
	      // The domain of the data, and the domain of the visualisation need not be the same. This is needed when selecting a subset on hte colorbar histogram.
	      // Calculate the initial threshold values. Note that thresholds don't include teh maximum value.
	      // First check if the number of levels has been determined already.
	      if (ctrl.data.domain.nLevels == undefined) {
	        // Base it off of the values in a single contour.
	        ctrl.data.domain.nLevels = d3.thresholdSturges(ctrl.data.available[0].file.content.surface.v);
	      } // if


	      var thresholds = d3.range(extent[0], extent[1], (extent[1] - extent[0]) / ctrl.data.domain.nLevels);
	      ctrl.data.domain.thresholds = thresholds;
	    },
	    // setupThresholds
	    getDomain: function getDomain(data, accessor) {
	      // Data is expected to be an array of contour chart data 
	      // read from the attached json files.
	      var domain = data.map(function (d) {
	        return d3.extent(accessor(d));
	      }); // map

	      return d3.extent([].concat.apply([], domain));
	    },
	    // getDomain
	    // Contour cards
	    design: function design(ctrl, file) {
	      // This is the initial dimensioning of the size of the contour cards.
	      // Find a range aspect ratio that will fit at least 6 similar contours side by side.
	      // Max width is 3 grid nodes. Find a combination of nx and ny that get an AR lower than the domain AR.
	      var cardsPerRow = 6;
	      var bestCandidate = {
	        ar: 0
	      }; // Margins are implemented on the svg itself. They are taken into account through the projection.

	      var dy = positioning.dy(ctrl.figure);
	      var dx = positioning.dx(ctrl.figure);
	      var nx = positioning.nx(ctrl.figure);

	      for (var iw = 1; iw <= nx / cardsPerRow; iw++) {
	        for (var ih = 1; ih <= nx; ih++) {
	          // Calculate proposed card dimensions  
	          var candidate = cfD3Contour2d.draw.dimension(iw, ih, dx, dy, ctrl.data.domain.ar); // Enforce constraints. The data AR must be larger than the maximum available svg AR to allow the visualisation to fill the space as good as possible.
	          // Find the maximum (!) inner ar of the cnadidates. As candidates are enforced to have an AR smaller than the data AR this will be the closest to the data AR.

	          if (ctrl.data.domain.ar >= candidate.ar && candidate.ar > bestCandidate.ar) {
	            bestCandidate = candidate;
	          } // if

	        } // for

	      } // for


	      return bestCandidate;
	    } // design

	  },
	  // setupPlot
	  positioning: {
	    newCard: function newCard(plotCtrl) {
	      // The difference between plots and cards is that plots are added manually, and the cards are added automatically.
	      var h = positioning.helpers;
	      var occupiedNodes = []; // Collect already occupied nodes. Check if there are any existing contours here already. The existing contours will have valid `ix' and `iy' positions. Position all new cards below the existing ones. This means that all nodes that have an existing card below them are `occupied'.
	      // How to eliminatethe empty space at the top though?? Calculate the min iy index, and offset all plots by it?

	      var minOccupiedIY = d3.min(plotCtrl.data.plotted, function (d) {
	        return d.graphic.format.position.iy;
	      });
	      plotCtrl.data.plotted.forEach(function (d) {
	        d.graphic.format.position.iy -= minOccupiedIY;
	      });
	      var maxOccupiedIY = d3.max(plotCtrl.data.plotted, function (d) {
	        return d.graphic.format.position.iy + d.graphic.format.position.ih;
	      });
	      h.pushNodes(occupiedNodes, 0, 0, plotCtrl.grid.nx, maxOccupiedIY); // With all the occupied nodes known, start positioning the contours that are not positioned.

	      plotCtrl.data.plotted.forEach(function (d) {
	        var pn = d.graphic.format.position; // Position this card, but only if it is unpositioned.

	        if ((pn.ix == undefined || isNaN(pn.ix)) && (pn.iy == undefined || isNaN(pn.iy))) {
	          // Position the plot.
	          positioning.onGrid(plotCtrl.grid.nx, occupiedNodes, pn); // Mark the nodes as occupied.

	          h.pushNodes(occupiedNodes, pn.ix, pn.iy, pn.iw, pn.ih);
	        } // if

	      }); // forEach plot
	    } // newCard

	  },
	  // positioning
	  draw: {
	    // Making the presentation blocks.
	    cards: function cards(ctrl) {
	      // This should handle the enter/update/exit parts.
	      var div = ctrl.figure;
	      var dx = positioning.dx(div);
	      var dy = positioning.dy(div);
	      var drag = cfD3Contour2d.interactivity.dragging.smooth.make(ctrl);

	      function getPositionLeft(d) {
	        return d.graphic.format.position.ix * dx + d.graphic.format.parent.offsetLeft + "px";
	      }

	      function getPositionTop(d) {
	        return d.graphic.format.position.iy * dy + "px";
	      } // The key function must output a string by which the old data and new data are compared.


	      var cards = div.selectAll(".contourWrapper").data(ctrl.data.plotted, function (d) {
	        return d.task.taskId;
	      }); // The update needed to be specified, otherwise errors occured.

	      cards.join(function (enter) {
	        return enter.append("div").attr("class", "card contourWrapper").attr("task", function (d) {
	          return d.task.taskId;
	        }).style("position", "absolute").style("background-color", "white").style("left", getPositionLeft).style("top", getPositionTop).style("cursor", "move").call(drag).each(function (d) {
	          d.graphic.format.wrapper = d3.select(this);
	          cfD3Contour2d.draw.contourBackbone(d); // Draw the actual contours.

	          cfD3Contour2d.draw.contours(d);
	        });
	      }, function (update) {
	        return update.each(function (d) {
	          return cfD3Contour2d.draw.contours(d);
	        }).style("left", getPositionLeft).style("top", getPositionTop);
	      }, function (exit) {
	        return exit.remove();
	      });
	    },
	    // cards
	    contourBackbone: function contourBackbone(d) {
	      // The projection should be updated here to cover the case when the user resizes the plot.
	      var card = d.graphic.format.wrapper; // Set the width of the plot, and of the containing elements.

	      card.style("width", d.graphic.format.position.w + "px").style("max-width", d.graphic.format.position.w + "px").style("height", d.graphic.format.position.h + "px"); // Append the title div. Enforce a 24px height for this div.

	      var title = card.append("div").attr("class", "title").append("p").style("text-align", "center").style("margin-left", "5px").style("margin-right", "5px").style("margin-bottom", "8px").text(function (d) {
	        return d.task.taskId;
	      });
	      helpers.fitTextToBox(title, title, "height", 24); // Append the svg

	      card.append("svg").attr("class", "plotArea").attr("width", d.graphic.format.position.sw).attr("height", d.graphic.format.position.sh).style("fill", "smokewhite").style("display", "block").style("margin", "auto").append("g").attr("class", "contour").attr("fill", "none").attr("stroke", "#fff").attr("stroke-opacity", "0.5"); // The resize behavior. In addition to resizeEnd the resizing should also update the contour.

	      var h = cfD3Contour2d.interactivity.dragging.gridded;
	      var resize = d3.drag().on("start", h.resizeStart).on("drag", h.resizeMove).on("end", function (d) {
	        h.resizeEnd(d);
	        cfD3Contour2d.draw.updateContour(d);
	      });
	      card.append("svg").attr("width", "10").attr("height", 10).style("position", "absolute").style("bottom", "0px").style("right", "0px").append("circle").attr("cx", "5").attr("cy", 5).attr("r", 5).attr("fill", "gainsboro").attr("cursor", "nwse-resize").call(resize);
	    },
	    // contourBackbone
	    // Actual drawing
	    contours: function contours(d) {
	      // The projection should be updated here to cover the case when the user resizes the plot.
	      // Append the contour
	      d.graphic.format.wrapper.select("g.contour").selectAll("path").data(function (d) {
	        return d.graphic.levels;
	      }).join("path").attr("fill", d.graphic.format.color).attr("d", cfD3Contour2d.draw.projection(d));
	    },
	    // contours
	    updateContour: function updateContour(d) {
	      // By this point everything external to the contour has been rescaled. Here the internal parts still need to be rescaled, and the contour levels redrawn.
	      // Readjust the card DOM
	      cfD3Contour2d.resizing.contourCard(d); // The projection should be updated here to cover the case when the user resizes the plot.

	      var card = d.graphic.format.wrapper;
	      var projection = cfD3Contour2d.draw.projection(d); // Update the contour

	      card.select("g.contour").selectAll("path").data(function (d) {
	        return d.graphic.levels;
	      }).join(function (enter) {
	        return enter.append("path").attr("fill", d.graphic.format.color).attr("d", projection);
	      }, function (update) {
	        return update.attr("fill", d.graphic.format.color).attr("d", projection);
	      }, function (exit) {
	        return exit.remove();
	      });
	    },
	    // updateContour
	    // The control group
	    rightControlGroup: function rightControlGroup(ctrl) {
	      // The histogram on the left.
	      cfD3Contour2d.draw.histogram(ctrl); // The colorbar on the right.

	      cfD3Contour2d.draw.colorbar(ctrl);
	      var r = ctrl.format.rightControls; // Turn the group controls and the note on.

	      r.format.wrapper.select("g.gRightGroupDrag").selectAll("circle").attr("opacity", 1);
	      var histogramLogNote = r.format.wrapper.select("g.logNote").select("text").style("display", "initial"); // Enforce that the axis text is the same size on both plots here!

	      var colorbarAxisTicks = r.colorbar.svg.select("g.gBarAxis").selectAll("text");
	      var histogramAxisTicks = r.histogram.svg.select("g.gHistAxis").selectAll("text");
	      var histogramLogNoteText = histogramLogNote.selectAll("tspan");
	      var minFontSize = d3.min([parseInt(colorbarAxisTicks.style("font-size")), parseInt(histogramAxisTicks.style("font-size")), parseInt(histogramLogNote.style("font-size"))]);
	      colorbarAxisTicks.style("font-size", minFontSize);
	      histogramAxisTicks.style("font-size", minFontSize);
	      histogramLogNote.style("font-size", minFontSize); // Draw ticks to show it's a log scale. This will have to be on the background svg. Axis to small to draw ticks - a text has been added instead.
	      // Make the colorbar draggable. For the colorbar to move automatically a scrolling event would have to be listened to. Position sticky positions the colorbar below everything else.
	      // Maybe draw the empty colorbar etc on startup already??
	      // Make the colorbar interactive!!
	    },
	    // rightControlGroup
	    colorbar: function colorbar(ctrl) {
	      // The colorbar must have it's own axis, because the user may want to change the color extents to play with the data more. 
	      var c = ctrl.format.rightControls.colorbar;
	      var s = ctrl.tools.scales; // Color bars

	      c.svg.select("g.gBar").selectAll("rect").data(d3.range(c.height)).enter().append("rect").attr("class", "bars").attr("x", 0).attr("y", function (d) {
	        return d;
	      }).attr("height", 2).attr("width", c.legendWidth).style("fill", s.px2clr); // Add in the axis with some ticks.

	      var gBarAxis = c.svg.select("g.gBarAxis");
	      gBarAxis.call(d3.axisLeft(s.val2px)); // Dimension the axis apropriately. 

	      helpers.fitTextToBox(gBarAxis.selectAll("text"), gBarAxis, "width", c.axisWidth); // Draw the contour plot levels.

	      c.svg.select("g.gBarLevels").selectAll("rect").data(ctrl.data.domain.thresholds).enter().append("rect").attr("class", "bars").attr("x", 2).attr("y", function (d) {
	        return s.val2px(d);
	      }).attr("height", 2).attr("width", c.legendWidth - 3).attr("cursor", "ns-resize").style("fill", "gainsboro");
	    },
	    // colorbar
	    histogram: function histogram(ctrl) {
	      var h = ctrl.format.rightControls.histogram;
	      var s = ctrl.tools.scales;
	      var gHist = h.svg.select("g.gHist");
	      var rects = gHist.selectAll("rect").data(h.bins);
	      rects.enter().append("rect").attr("height", function (d) {
	        return s.val2px_(d.x1) - s.val2px_(d.x0);
	      }).attr("width", function (d) {
	        return s.bin2px(d.n);
	      }).attr("y", function (d) {
	        return s.val2px_(d.x0);
	      }).style("fill", "DarkGrey"); // Brushing and axes.

	      var gBrush = h.svg.select("g.gBrush");
	      var gHistAxis = h.svg.select("g.gHistAxis");
	      var brush = d3.brushY(s.val2px_).on("end", cfD3Contour2d.interactivity.rightControls.histogramBrushMove);
	      gBrush.call(brush); // Add in the axis with some ticks.

	      gHistAxis.call(d3.axisRight(s.val2px_));
	      h.svg.select("g.gHistBottom").append("p").text("log10(n)");
	    },
	    // histogram
	    // MOVE getContours, json2contour, dimensioning, projection TO SETUP PLOT!!
	    getContours: function getContours(ctrl) {
	      var alreadyPlottedTasks = ctrl.data.plotted.map(function (d) {
	        return d.task.taskId;
	      }); // Create contours

	      ctrl.data.plotted = ctrl.data.available.map(function (dataobj) {
	        // What happens if the URL is duplicated?? Instead focus on retrieving the taskId
	        var i = alreadyPlottedTasks.indexOf(dataobj.task.taskId);

	        if (i > -1) {
	          // Return the already existing object.
	          dataobj = ctrl.data.plotted[i];
	        } else {
	          // Initialise new plotting entry.
	          dataobj.graphic = {
	            levels: cfD3Contour2d.draw.json2contour(dataobj.file.content.surface, ctrl.data.domain.thresholds),
	            format: {
	              parent: ctrl.figure.node(),
	              wrapper: undefined,
	              position: cfD3Contour2d.setupPlot.design(ctrl, dataobj),
	              domain: ctrl.data.domain,
	              color: function color(d) {
	                return ctrl.tools.scales.val2clr(d.value);
	              }
	            }
	          }; // item
	        } // if


	        return dataobj;
	      }); // items
	      // Positioning needs to be re-done to allow for update to add cards. Position the new cards below the existing cards.

	      cfD3Contour2d.positioning.newCard(ctrl);
	    },
	    // getContours
	    json2contour: function json2contour(surface, thresholds) {
	      // Create the contour data
	      return d3.contours().size(surface.size).thresholds(thresholds)(surface.v);
	    },
	    // json2contour
	    dimension: function dimension(iw, ih, dx, dy, dataAR) {
	      // Calculates the inner dimensions of a contour plot card, which depend on the data aspect ratio, and the dimensions of the card.
	      // Specify a margin to the card sides, and the title of hte card.
	      // 24px for title, 10px for resize controls. The minimum height of the card in px is the title width plus 30px.
	      var margin = {
	        y: 7,
	        x: 7
	      };
	      var title = 24 + 10; // Calculate proposed card dimensions

	      var divHeight = ih * dy;
	      var divWidth = iw * dx;
	      var innerHeight = divHeight - 2 * margin.y - title;
	      var innerWidth = divWidth - 2 * margin.x;
	      return {
	        ix: undefined,
	        iy: undefined,
	        iw: iw,
	        ih: ih,
	        w: divWidth,
	        h: divHeight,
	        sw: innerHeight / dataAR,
	        sh: innerHeight,
	        minW: dx,
	        minH: title + 30,
	        ar: innerHeight / innerWidth,
	        mouse: {}
	      };
	    },
	    // dimension
	    projection: function projection(dataobj) {
	      // The projection is only concerned by plotting the appropriate contour level points at the appropriate x and y positions. That is why the projection only relies on x and y data, and can be computed for all contours at the same time, if they use the same x and y locations.
	      var f = dataobj.graphic.format;
	      var s = dataobj.file.content.surface;
	      var xscale = d3.scaleLinear().domain(f.domain.x).range([0, f.position.sw]);
	      var yscale = d3.scaleLinear().domain(f.domain.y).range([f.position.sh, 0]);
	      var x = s.x;
	      var y = s.y;
	      var m = s.size[0];
	      var n = s.size[1]; // configure a projection to map the contour coordinates returned by
	      // d3.contours (px,py) to the input data (xgrid,ygrid)

	      var p = d3.geoTransform({
	        point: function point(px, py) {
	          var xfrac, yfrac, xnow, ynow;
	          var xidx, yidx, idx0, idx1, idx2, idx3; // remove the 0.5 offset that comes from d3-contour

	          px = px - 0.5;
	          py = py - 0.5; // clamp to the limits of the xgrid and ygrid arrays (removes "bevelling" from outer perimeter of contours)

	          px < 0 ? px = 0 : px;
	          py < 0 ? py = 0 : py;
	          px > n - 1 ? px = n - 1 : px;
	          py > m - 1 ? py = m - 1 : py; // xidx and yidx are the array indices of the "bottom left" corner
	          // of the cell in which the point (px,py) resides

	          xidx = Math.floor(px);
	          yidx = Math.floor(py);
	          xidx == n - 1 ? xidx = n - 2 : xidx;
	          yidx == m - 1 ? yidx = m - 2 : yidx; // xfrac and yfrac give the coordinates, between 0 and 1,
	          // of the point within the cell 

	          xfrac = px - xidx;
	          yfrac = py - yidx; // indices of the 4 corners of the cell

	          idx0 = xidx + yidx * n;
	          idx1 = idx0 + 1;
	          idx2 = idx0 + n;
	          idx3 = idx2 + 1; // bilinear interpolation to find projected coordinates (xnow,ynow)
	          // of the current contour coordinate

	          xnow = (1 - xfrac) * (1 - yfrac) * x[idx0] + xfrac * (1 - yfrac) * x[idx1] + yfrac * (1 - xfrac) * x[idx2] + xfrac * yfrac * x[idx3];
	          ynow = (1 - xfrac) * (1 - yfrac) * y[idx0] + xfrac * (1 - yfrac) * y[idx1] + yfrac * (1 - xfrac) * y[idx2] + xfrac * yfrac * y[idx3];
	          this.stream.point(xscale(xnow), yscale(ynow));
	        } // point

	      }); // geoTransform

	      return d3.geoPath(p);
	    } // projection

	  },
	  // draw
	  interactivity: {
	    // POTENTIALLY MOVE FOR ALL PLOTS?
	    refreshContainerSize: function refreshContainerSize(ctrl) {
	      // This method is declared in other plots too, so must remain in this one for global compatibility.
	      // There are 4 events that may prompt resisizing.
	      // 1: Moving plots
	      // 2: Resizing plots - cannot resize contour plot for now!!
	      // 3: Moving contours
	      // 4: Resizing contours
	      // Maybe I should create classes for data objects??
	      // Such as a pile object and a contour object?
	      // Differentiate between contour rescaling and plot rescaling??
	      if (ctrl.graphic == undefined) {
	        // Plot. These don't have a graphic attribute.
	        cfD3Contour2d.resizing.plotOnExternalChange(ctrl);
	      } else {
	        // Contour
	        var contourPlot = d3.select(ctrl.graphic.format.parent);
	        var contourPlotCtrl = contourPlot.datum();
	        cfD3Contour2d.resizing.plotOnInternalChange(contourPlotCtrl);
	      } // if

	    },
	    // refreshContainerSize
	    // Colorbar group
	    rightControls: {
	      // Move everything related to the right controls here!!
	      update: function update(ctrl) {
	        var c = ctrl.format.rightControls.colorbar;
	        var s = ctrl.tools.scales; // Needs to primarily update teh colorbar.

	        var gBarAxis = c.svg.select("g.gBarAxis");
	        gBarAxis.call(d3.axisLeft(s.val2px)); // Update the threshold indicator positions.

	        c.svg.select("g.gBarLevels").selectAll("rect").data(ctrl.data.domain.thresholds).attr("y", function (d) {
	          return s.val2px(d);
	        }); // Update the contour data. For this the levels need to be recalculated.

	        ctrl.data.plotted.forEach(function (dataobj) {
	          dataobj.graphic.levels = cfD3Contour2d.draw.json2contour(dataobj.file.content.surface, ctrl.data.domain.thresholds);
	        }); // Update teh contour graphics.

	        cfD3Contour2d.draw.cards(ctrl); // Also update the statistical plots if there are any.

	        ctrl.figure.selectAll(".pileWrapper").each(function (pileCtrl) {
	          var stats = cfD3Contour2d.interactivity.statistics;
	          stats.mean(pileCtrl);
	          stats.standardDeviation(pileCtrl); // Update the required plot:

	          switch (pileCtrl.statistics.plotted) {
	            case "mu":
	              stats.drawMu(pileCtrl);
	              break;

	            case "sigma":
	              stats.drawSigma(pileCtrl);
	              break;
	          } // switch

	        });
	      },
	      // update
	      histogramBrushMove: function histogramBrushMove(ctrl) {
	        var s = ctrl.tools.scales;
	        var extent = d3.event.selection.map(s.val2px_.invert, s.val2px_); // Change the colorbar appearance by changing the scale.
	        // This needs to figure out the new thresholds, and then update all the contours.

	        cfD3Contour2d.setupPlot.setupThresholds(ctrl, extent);
	        cfD3Contour2d.setupPlot.setupColorbarTools(ctrl); // Now update the right control group

	        cfD3Contour2d.interactivity.rightControls.update(ctrl);
	      },
	      // histogramBrushMove
	      interactivity: {
	        refreshContainerSize: function refreshContainerSize(rightControlCtrl) {
	          // Has to take the right controls object, and resize the plot. First extract the ctrl for the whole plot, and then resize.
	          var plotCtrl = rightControlCtrl.format.wrapper.data()[0]; // Resize the plot.

	          cfD3Contour2d.resizing.plotOnInternalChange(plotCtrl); // Resize the plot row.

	          var plotRowBody = d3.select(plotCtrl.format.parent);
	          builder.refreshPlotRowHeight(plotRowBody);
	        } // refreshContainerSize

	      } // interactivity

	    },
	    // rightControls
	    // Lasso
	    lassoing: function lassoing(ctrl) {
	      var svgOverlay = ctrl.format.wrapper.select("svg.overlay");
	      var lassoInstance = {
	        element: {
	          // 'owner': element to attach the lasso to.
	          // 'svg'  : where to draw the lasso to
	          // 'ref'  : reference for position retrieval
	          owner: svgOverlay,
	          svg: svgOverlay,
	          ref: ctrl.figure
	        },
	        data: {
	          boundary: [],
	          getBasisData: function getBasisData() {
	            return ctrl.data.plotted;
	          }
	        },
	        accessor: {
	          // Here the data that is searched after is the position of the card on the screen.
	          x: function x(d) {
	            var el = d.graphic.format.wrapper.node();
	            return el.offsetLeft + el.offsetWidth / 2;
	          },
	          y: function y(d) {
	            var el = d.graphic.format.wrapper.node();
	            return el.offsetTop + el.offsetHeight / 2;
	          }
	        },
	        scales: {
	          x: function x(_x) {
	            return _x;
	          },
	          y: function y(_y) {
	            return _y;
	          }
	        },
	        preemptive: function preemptive() {
	          cfD3Contour2d.interactivity.tooltip.tipOff(ctrl);
	        },
	        response: function response(allDataPoints) {
	          // Highlight the selection
	          cfD3Contour2d.helpers.highlight(ctrl, allDataPoints.map(function (d) {
	            return d.task;
	          })); // Display the tooltip.

	          cfD3Contour2d.interactivity.tooltip.tipOn(ctrl);
	        }
	      }; // lassoInstance

	      ctrl.tools.lasso = lassoInstance;
	      lasso.add(lassoInstance);
	    },
	    // lassoing
	    // Use selection
	    tooltip: {
	      add: function add(ctrl) {
	        // Needs to know where to place the tooltip, and where to store the reference. How should the tooltip be triggered? Only on lasso selection! In that case just tipOn and tipOff must be presented, and should run given a selection of data. The data can them be used to calculate the appropriate position of hte tooltip.
	        var f = cfD3Contour2d.interactivity.tooltip.functionality;
	        var tooltip = ctrl.figure.append("div").attr("class", "contourTooltip").style("display", "none").style("cursor", "pointer");
	        addButton("stack-overflow", function (d) {
	          return f.pileAndSummarise(ctrl);
	        });
	        addButton("tags", function (d) {
	          return f.tag(ctrl);
	        });
	        addButton("close", function (d) {
	          return cfD3Contour2d.interactivity.tooltip.tipOff(ctrl);
	        });
	        ctrl.tools.tooltip = tooltip;
	        tooltip.datum({
	          position: {
	            x0: undefined,
	            y0: undefined
	          }
	        }); // Add dragging as well!

	        var drag = d3.drag().on("start", function (d) {
	          var delta = d3.mouse(tooltip.node());
	          d.position.x0 = delta[0];
	          d.position.y0 = delta[1];
	        }).on("drag", function (d) {
	          tooltip.style("left", d3.event.x - d.position.x0 + "px").style("top", d3.event.y + d.position.y0 + "px");
	        }).on("end", function (d) {
	          d.position.x0 = undefined;
	          d.position.y0 = undefined;
	        });
	        tooltip.call(drag);

	        function addButton(icon, event) {
	          tooltip.append("button").attr("class", "btn").on("click", event).append("i").attr("class", "fa fa-" + icon).style("cursor", "pointer");
	        } // addButton

	      },
	      // add
	      tipOn: function tipOn(ctrl) {
	        // Position hte tooltip appropriately. Use the lasso boundary to calculate a mean. Crude, but ok.
	        var n = ctrl.tools.lasso.data.boundary.length;
	        var position = ctrl.tools.lasso.data.boundary.reduce(function (total, item) {
	          total.x += item.cx / n;
	          total.y += item.cy / n;
	          return total;
	        }, {
	          x: 0,
	          y: 0
	        }); // Offset by the expected tooltip size. How to calculate that when display:none?

	        ctrl.tools.tooltip.style("display", "").style("left", position.x - 100 + "px").style("top", position.y - 30 + "px");
	      },
	      // tipOn
	      tipOff: function tipOff(ctrl) {
	        ctrl.tools.tooltip.style("display", "none");
	      },
	      // tipOff
	      functionality: {
	        pileAndSummarise: function pileAndSummarise(ctrl) {
	          console.log("Pile and calculate standard deviation plot"); // Call to make the pile.

	          cfD3Contour2d.interactivity.piling.pile(ctrl); // Remove the tooltip? And add the functionality to highlight the members to the pile!

	          cfD3Contour2d.interactivity.tooltip.tipOff(ctrl);
	        },
	        // pileAndSummarise
	        tag: function tag(ctrl) {
	          console.log("Run tagging interface");
	        } // tag

	      } // functionality

	    },
	    // tooltip
	    // Introduce piling
	    piling: {
	      pile: function pile(ctrl) {
	        var p = cfD3Contour2d.interactivity.piling; // Collect the contour plots from hte lasso, pile them up, and draw the piler.

	        var selectedCards = ctrl.tools.lasso.data.selection; // These must be recognised by the lasso!

	        var selectedPiles = p.findPilesInLasso(ctrl);

	        if (selectedPiles.length > 1) {
	          // There are several piles in the selection.
	          // Well, in this case combine them all in a new pile, which contains all the constituent elements. And remove the old piles.
	          selectedPiles.remove();
	          p.makePile(ctrl.figure, selectedCards);
	        } else if (selectedPiles.length == 1) {
	          // Exactly one pile selected -> add all the members to it, and consolidate in the existing pile.
	          // The input to updatePile is a single d3.select(".pileWrapper")
	          p.updatePile(selectedPiles[0], selectedCards);
	        } else {
	          // No piles in the selection. If there is more than one card selected, then create a pile for it.
	          if (selectedCards.length > 1) {
	            p.makePile(ctrl.figure, selectedCards);
	          } // if

	        } // if		

	      },
	      // pile
	      unpile: function unpile(pileCtrl) {
	        // Return the contours to where they're supposed to be. Maybe this should be an external function? So that I can pass in a cutom positioning...
	        console.log("Reposition cards."); // Remove the pile

	        pileCtrl.wrapper.remove();
	      },
	      // unpile
	      makePile: function makePile(container, selectedCards) {
	        var i = cfD3Contour2d.interactivity; // Calculate the pile position.

	        var pileCtrl = i.piling.createPileObject(container, selectedCards); // Draw a pile over it.

	        i.piling.drawPile(pileCtrl); // Consolidate the constituent cards

	        i.piling.consolidatePile(pileCtrl); // Calculate the group statistics

	        i.piling.statisticsPlots(pileCtrl); // Draw the stat plots.

	        i.statistics.drawMu(pileCtrl);
	      },
	      // makePile
	      updatePile: function updatePile(selectedPile, selectedCards) {
	        var p = cfD3Contour2d.interactivity.piling;
	        var pileCtrl = selectedPile.datum(); // Assign all the cards to the pile

	        pileCtrl.members = selectedCards; // Move them all to a pile

	        p.consolidatePile(pileCtrl); // Raise the pile object.

	        pileCtrl.wrapper.raise();
	      },
	      // updatePile
	      createPileObject: function createPileObject(container, cardCtrls) {
	        var pileCtrl = {
	          x: 0,
	          y: 0,
	          sw: 0,
	          sh: 0,
	          delta: {
	            x: undefined,
	            y: undefined
	          },
	          container: container,
	          wrapper: undefined,
	          members: cardCtrls,
	          statistics: {
	            mu: undefined,
	            sigma: undefined
	          }
	        }; // Find the position of the pile, as well as it's width and height based on it's members. The position is the average of the memeber positions, and the size is determined by the largest member.

	        var n = pileCtrl.members.length;
	        var position = pileCtrl.members.reduce(function (ctrl, member) {
	          var el = member.graphic.format.wrapper.node();
	          ctrl.x += el.offsetLeft / n;
	          ctrl.y += el.offsetTop / n;
	          ctrl.sw = el.offsetWidth > ctrl.sw ? el.offsetWidth : ctrl.sw;
	          ctrl.sh = el.offsetHeight > ctrl.sh ? el.offsetHeight : ctrl.sh;
	          return ctrl;
	        }, pileCtrl);
	        return position;
	      },
	      // createPileObject
	      drawPile: function drawPile(ctrl) {
	        // Needs to have the position it draws to, and the cards it will contain.
	        var s = cfD3Contour2d.interactivity.statistics;
	        var p = cfD3Contour2d.interactivity.piling;
	        var width = 2 * ctrl.sw;
	        var height = ctrl.sh;
	        var dw = ctrl.sw / ctrl.members.length; // For now just draw a card and add dragging to it.

	        ctrl.wrapper = ctrl.container.append("div").datum(ctrl).attr("class", "pileCard pileWrapper").style("position", "absolute").style("left", function (d) {
	          return d.x + "px";
	        }).style("top", function (d) {
	          return d.y + "px";
	        });
	        var pileTitle = ctrl.wrapper.append("div").attr("class", "pileTitle");
	        p.addRoundButton(pileTitle, p.unpile, "times");
	        p.addRoundButton(pileTitle, p.maximise, "arrows-alt");
	        p.addRoundButton(pileTitle, p.highlight, "lightbulb-o");
	        p.addRoundButton(pileTitle, s.drawSigma, "&sigma;");
	        p.addRoundButton(pileTitle, s.drawMu, "&mu;");
	        var svg = ctrl.wrapper.append("div").attr("class", "pileBody").append("svg").attr("class", "plotArea").attr("width", width).attr("height", height); // This is the sigma/mu plot

	        p.drawCard(ctrl.members[0], ctrl); // Append a viewon element for each of the members. It should be 5px wide.

	        svg.selectAll("rect.preview").data(ctrl.members).enter().append("rect").attr("class", "preview").attr("width", dw).attr("height", height).attr("x", function (d, i) {
	          return width / 2 + i * dw;
	        }).attr("fill", "Gainsboro").on("mouseover", function (d) {
	          // Raise.
	          d.graphic.format.wrapper.raise();
	        }).on("mouseout", function (d) {
	          // Raise the wrapper.
	          ctrl.wrapper.raise();
	        }); // Position: absolute is somehow crucial to make thedragging smooth at the start!

	        var drag = d3.drag().on("start", function (d) {
	          var position = d3.mouse(d.container.node());
	          d.delta.x = position[0];
	          d.delta.y = position[1];
	        }).on("drag", function (d) {
	          var position = d3.mouse(d.container.node());
	          d.x += position[0] - d.delta.x;
	          d.y += position[1] - d.delta.y;
	          d.wrapper.style("left", d.x + "px").style("top", d.y + "px");
	          d.delta.x = position[0];
	          d.delta.y = position[1]; // Move also all the members.

	          p.movePile(d);
	        }).on("end", function (d) {// Fix into grid positions?
	        });
	        ctrl.wrapper.call(drag);
	      },
	      // drawPile
	      addRoundButton: function addRoundButton(container, event, icon) {
	        // Greek letters will contain a "&", so parse for it.
	        var class_ = "fa fa-" + icon;
	        var html_ = "";

	        if (icon.search("&") > -1) {
	          class_ = "text-greek-button";
	          html_ = icon;
	        } // if


	        container.append("button").attr("class", "btn btn-circle").on("click", event).append("i").attr("class", class_).html(html_);
	      },
	      // addRoundButton
	      drawCard: function drawCard(d, pileCtrl) {
	        // Draws a card that will hold the statistics plots.
	        var offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl);
	        var cards = pileCtrl.wrapper.select("div.pileBody").selectAll(".card").data([d]);
	        cards.join(function (enter) {
	          return enter.append("div").attr("class", "card summaryWrapper").style("position", "absolute").style("background-color", "white").style("left", "0px").style("top", offset.y + "px").each(function (d) {
	            var p = d.graphic.format.position;
	            var card = d3.select(this); // Set the width of the plot, and of the containing elements.

	            card.style("width", p.w + "px").style("max-width", p.w + "px").style("height", p.h + "px"); // Append the title div. Enforce a 24px height for this div.

	            var title = card.append("div").attr("class", "title").append("p").style("text-align", "center").style("margin-left", "5px").style("margin-right", "5px").style("margin-bottom", "8px").text("Sigma");
	            helpers.fitTextToBox(title, title, "height", 24); // Append the svg

	            card.append("svg").attr("class", "plotArea").attr("width", p.sw).attr("height", p.sh).style("fill", "smokewhite").style("display", "block").style("margin", "auto").append("g").attr("class", "contour").attr("fill", "none").attr("stroke", "#fff").attr("stroke-opacity", "0.5");
	          });
	        }, function (update) {
	          return update.each(function (d) {
	            return cfD3Contour2d.draw.contours(d);
	          });
	        }, function (exit) {
	          return exit.remove();
	        });
	      },
	      // drawCard
	      redrawPile: function redrawPile(ctrl) {
	        // Needs to have the position it draws to, and the cards it will contain.
	        var h = ctrl.sh;
	        var w = 2 * ctrl.sw;
	        var dw = ctrl.sw / ctrl.members.length;
	        var svg = ctrl.wrapper.select("svg.plotArea").attr("width", w).attr("height", h); // Append a viewon element for each of the members. It should be 5px wide.

	        svg.selectAll("rect.preview").data(ctrl.members, function (d) {
	          return d.task.taskId;
	        }).enter().append("rect").attr("class", "preview").attr("width", dw).attr("height", h).attr("x", function (d, i) {
	          return ctrl.sw + i * dw;
	        }).attr("fill", "Gainsboro").on("mouseover", function (d) {
	          // Raise.
	          d.graphic.format.wrapper.raise();
	        }).on("mouseout", function (d) {
	          // Raise the wrapper.
	          ctrl.wrapper.raise();
	        });
	        svg.selectAll("rect.preview").attr("x", function (d, i) {
	          return ctrl.sw + i * dw;
	        }); // Redo the statistics plot too.

	        var s = cfD3Contour2d.interactivity.statistics;

	        switch (ctrl.statistics.plotted) {
	          case "mu":
	            s.drawMu(ctrl);
	            break;

	          case "sigma":
	            s.drawSigma(ctrl);
	            break;
	        } // switch

	      },
	      // redrawPile
	      movePile: function movePile(pileCtrl) {
	        // The card hosts the pile title
	        var offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl); // Move the cards to the pile position.

	        pileCtrl.members.forEach(function (d, i) {
	          // When doing this they should also be resized, and redrawn if necessary.
	          var position = d.graphic.format.position; // Stagger them a bit?

	          position.x = pileCtrl.x + offset.x;
	          position.y = pileCtrl.y + offset.y; // Move the wrapper

	          d.graphic.format.wrapper.style("left", position.x + "px").style("top", position.y + "px").style("border-width", "").style("border-style", "").style("border-color", "").raise();
	        });
	        pileCtrl.wrapper.raise();
	      },
	      // movePile
	      consolidatePile: function consolidatePile(pileCtrl) {
	        // The card hosts the pile title
	        var offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl); // Move the cards to the pile position.

	        pileCtrl.members.forEach(function (d, i) {
	          // When doing this they should also be resized, and redrawn if necessary.
	          var position = d.graphic.format.position; // Stagger them a bit?

	          position.x = pileCtrl.x + offset.x;
	          position.y = pileCtrl.y + offset.y; // Move the wrapper

	          d.graphic.format.wrapper.style("left", position.x + "px").style("top", position.y + "px").style("border-width", "").style("border-style", "").style("border-color", "").raise(); // Resize the wrapper if needed.

	          if (position.sw != pileCtrl.sw || position.sh != pileCtrl.sh) {
	            var dx = positioning.dx(pileCtrl.container);
	            var dy = positioning.dy(pileCtrl.container);
	            position.iw = pileCtrl.sw / dx;
	            position.ih = pileCtrl.sh / dy;
	            var width = pileCtrl.sw;
	            var height = pileCtrl.sh;
	            d.graphic.format.wrapper.style("max-width", width + "px").style("width", width + "px").style("height", height + "px");
	            d.graphic.format.wrapper.select("div.card").style("max-width", width + "px").style("width", width + "px").style("height", height + "px"); // UPDATE THE PLOT

	            cfD3Contour2d.resizing.contourCard(d);
	            cfD3Contour2d.draw.contours(d);
	          } // if

	        });
	        pileCtrl.wrapper.raise();
	      },
	      // consolidatePile
	      calculateOffset: function calculateOffset(pileCtrl) {
	        var titleDom = pileCtrl.wrapper.select(".pileTitle").node();
	        var bodyDom = pileCtrl.wrapper.select(".pileBody").node();
	        var titleHeight = titleDom.offsetHeight;
	        var titleMargin = parseInt(window.getComputedStyle(titleDom).marginBottom) + parseInt(window.getComputedStyle(titleDom).marginTop);
	        var bodyMargin = parseInt(window.getComputedStyle(bodyDom).padding);
	        return {
	          x: bodyMargin,
	          y: titleHeight + titleMargin + bodyMargin
	        };
	      },
	      // calculateOffset
	      addCardToPile: function addCardToPile(cardCtrl, pileCtrl) {
	        var p = cfD3Contour2d.interactivity.piling;
	        pileCtrl.members.push(cardCtrl);
	        p.consolidatePile(pileCtrl);
	        p.statisticsPlots(pileCtrl);
	        p.redrawPile(pileCtrl);
	      },
	      // addCardToPile
	      isCardOverPile: function isCardOverPile(cardCtrl, pileCtrl) {
	        var height = pileCtrl.wrapper.node().offsetHeight;
	        var posy = cardCtrl.graphic.format.position.y - pileCtrl.y;
	        var width = pileCtrl.wrapper.node().offsetWidth;
	        var posx = cardCtrl.graphic.format.position.x - pileCtrl.x;
	        var isInsideWidth = posx > 0 && posx < width;
	        var isInsideHeight = posy > 0 && posy < height;
	        return isInsideWidth && isInsideHeight ? posx : false;
	      },
	      // isCardOverPile
	      findAppropriatePile: function findAppropriatePile(cardCtrl, pileCtrls) {
	        var p = cfD3Contour2d.interactivity.piling;
	        var pileCtrl = undefined;
	        var dst = Infinity;
	        pileCtrls.forEach(function (pileCtrl_) {
	          var dst_ = p.isCardOverPile(cardCtrl, pileCtrl_);

	          if (dst_ != false && dst_ < dst) {
	            pileCtrl = pileCtrl_;
	            dst = dst_;
	          } // if

	        }); // each

	        if (pileCtrl != undefined) {
	          p.addCardToPile(cardCtrl, pileCtrl);
	        } // if

	      },
	      // findAppropriatePile
	      findPilesInLasso: function findPilesInLasso(ctrl) {
	        var dx = positioning.dx(ctrl.figure);
	        var dy = positioning.dy(ctrl.figure);
	        var pileCtrls = ctrl.figure.selectAll(".pileWrapper").data();
	        var selectedPiles = pileCtrls.filter(function (pileCtrl) {
	          var pileMidpoint = {
	            x: pileCtrl.x + pileCtrl.iw * dx,
	            y: pileCtrl.y + pileCtrl.ih * dy
	          };
	          return lasso.isPointInside(pileMidpoint, ctrl.tools.lasso.data.boundary);
	        }); // forEach

	        return selectedPiles;
	      },
	      // findPileInLasso
	      statisticsPlots: function statisticsPlots(pileCtrl) {
	        var i = cfD3Contour2d.interactivity; // Calculate the statistics.

	        i.statistics.mean(pileCtrl);
	        i.statistics.standardDeviation(pileCtrl);
	      },
	      // statisticsPlots
	      highlight: function highlight(pileCtrl) {
	        crossPlotHighlighting.on(pileCtrl.members.map(function (d) {
	          return d.task;
	        }), "cfD3Contour2d");
	      },
	      // highlight
	      maximise: function maximise(pileCtrl) {
	        // Assign the pile for trending
	        var ctrl = pileCtrl.container.datum();
	        ctrl.tools.trending = pileCtrl; // Make the trending tools visible.

	        var trendingCtrlGroup = d3.select(ctrl.format.wrapper.node()).select("div.plotTitle").select("div.trendingCtrlGroup");
	        trendingCtrlGroup.selectAll("select").each(function () {
	          this.value = -1;
	        });
	        trendingCtrlGroup.style("display", "inline-block"); // The buttons also need access to the right pile

	        trendingCtrlGroup.selectAll("button").datum(pileCtrl); // Hide the piles

	        pileCtrl.container.selectAll("div.pileWrapper").style("display", "none"); // Hide / Re-position the contours

	        var contourCtrls = pileCtrl.container.selectAll("div.contourWrapper").data();
	        contourCtrls.forEach(function (d) {
	          if (pileCtrl.members.includes(d)) ; else {
	            d.graphic.format.wrapper.style("display", "none");
	          } // if

	        }); // forEach
	      },
	      // maximise
	      minimise: function minimise(pileCtrl) {
	        // Make the trending tools visible.
	        var trendingCtrlGroup = d3.select(pileCtrl.container.datum().format.wrapper.node()).select("div.plotTitle").select("div.trendingCtrlGroup");
	        trendingCtrlGroup.style("display", "none");
	        pileCtrl.container.selectAll("div.contourWrapper").style("display", "");
	        pileCtrl.container.selectAll("div.pileWrapper").style("display", "");
	        pileCtrl.wrapper.style("display", "");
	        cfD3Contour2d.interactivity.piling.consolidatePile(pileCtrl); // Adjust the plot size.

	        cfD3Contour2d.resizing.plotOnInternalChange(pileCtrl.container.datum());
	      } // minimise

	    },
	    // piling
	    dragging: {
	      smooth: {
	        make: function make(ctrl) {
	          var dragctrl = {
	            onstart: function onstart(d) {
	              d.graphic.format.wrapper.raise();
	            },
	            onmove: function onmove(d) {
	              // Check if the container needs to be resized.
	              cfD3Contour2d.resizing.plotOnInternalChange(ctrl);
	            },
	            onend: function onend(d) {
	              var i = cfD3Contour2d.interactivity; // Check if the card should be added to a pile.

	              i.piling.findAppropriatePile(d, ctrl.figure.selectAll(".pileWrapper").data()); // Update the correlations if trending tools are  active.

	              var trendingCtrlGroup = ctrl.format.wrapper.select("div.plotTitle").select("div.trendingCtrlGroup");

	              if (trendingCtrlGroup.style("display") != "none") {
	                // Here we can actually pass the pileCtrl in!
	                i.statistics.drawCorrelation(trendingCtrlGroup); // Update the selects also.

	                trendingCtrlGroup.selectAll("select").each(function () {
	                  this.value = -1;
	                });
	              } // if

	            }
	          };
	          var h = cfD3Contour2d.interactivity.dragging.smooth; // Position: absolute is somehow crucial to make thedragging smooth at the start!

	          var drag = d3.drag().on("start", function (d) {
	            // Store the starting position of hte mouse.
	            d.graphic.format.position.mouse = h.getMousePosition(d);
	            dragctrl.onstart(d);
	          }).on("drag", function (d) {
	            var position = h.calculateNewPosition(d); // Move the wrapper.

	            d.graphic.format.wrapper.style("left", position.x + "px").style("top", position.y + "px"); // Store the new position internally.

	            d.graphic.format.position.x = position.x;
	            d.graphic.format.position.y = position.y; // Perform any additional on move tasks.

	            dragctrl.onmove(d);
	          }).on("end", function (d) {
	            dragctrl.onend(d);
	          });
	          return drag;
	        },
	        // add
	        calculateNewPosition: function calculateNewPosition(d) {
	          var h = cfD3Contour2d.interactivity.dragging.smooth; // Get the current wrapper position and the mouse movement on increment.

	          var wrapper = h.getWrapperPosition(d);
	          var movement = h.calculateMouseMovement(d);
	          var parent = d.graphic.format.parent; // Apply boundaries to movement

	          movement = h.applyMovementBoundaries(movement, wrapper, parent);
	          return {
	            x: wrapper.x + movement.x,
	            y: wrapper.y + movement.y
	          };
	        },
	        // calculateNewPosition
	        getMousePosition: function getMousePosition(d) {
	          var mousePosition = d3.mouse(d.graphic.format.parent);
	          return {
	            x: mousePosition[0],
	            y: mousePosition[1]
	          };
	        },
	        // getMousePosition
	        getWrapperPosition: function getWrapperPosition(d) {
	          // Calculate the position of the wrapper relative to it's parent
	          var el = d.graphic.format.wrapper.node();
	          return {
	            x: el.offsetLeft,
	            y: el.offsetTop,
	            w: el.offsetWidth,
	            h: el.offsetHeight
	          };
	        },
	        // getWrapperPosition
	        calculateMouseMovement: function calculateMouseMovement(d) {
	          var h = cfD3Contour2d.interactivity.dragging.smooth;
	          var position = d.graphic.format.position;
	          var mp0 = position.mouse;
	          var mp1 = h.getMousePosition(d);
	          var movement = {
	            x: mp1.x - mp0.x,
	            y: mp1.y - mp0.y
	          };
	          position.mouse = mp1;
	          return movement;
	        },
	        // calculateMouseMovement
	        applyMovementBoundaries: function applyMovementBoundaries(movement, wrapper, parent) {
	          // Stop the movement exceeding the container bounds.
	          var rightBreach = wrapper.w + wrapper.x + movement.x > parent.offsetWidth;
	          var leftBreach = wrapper.x + movement.x < 0;

	          if (rightBreach || leftBreach) {
	            movement.x = 0;
	          } // if
	          // Bottom breach should extend the plot!


	          if (wrapper.y + movement.y < 0) {
	            movement.y = 0;
	          } // if


	          return movement;
	        } // applyMovementBoundaries

	      },
	      // smooth
	      gridded: {
	        resizeStart: function resizeStart(d) {
	          // Bring hte plot to front.
	          d.graphic.format.wrapper.raise();
	        },
	        // resizeStart
	        resizeMove: function resizeMove(d) {
	          // Calculate the cursor position on the grid. When resizing the d3.event.x/y are returned as relative to the top left corner of the svg containing the resize circle. The cue to resize is when the cursor drags half way across a grid cell.
	          // this < svg < bottom div < plot body < card < plotWrapper
	          var f = d.graphic.format;
	          var parent = d.graphic.format.parent;
	          var container = d3.select(parent);
	          var p = d.graphic.format.position;
	          var nx = positioning.nx(container);
	          var dx = positioning.dx(container);
	          var dy = positioning.dy(container); // clientX/Y is on-screen position of the pointer, but the width/height is relative to the position of the plotWrapper, which can be partially off-screen. getBoundingClientRect retrieves teh plotRowBody position relative to the screen.

	          var x = d3.event.sourceEvent.clientX - parent.getBoundingClientRect().left - p.ix * dx;
	          var y = d3.event.sourceEvent.clientY - parent.getBoundingClientRect().top - p.iy * dy;
	          var ix = p.ix;
	          var iw = Math.round(x / dx);
	          var ih = Math.round(y / dy); // Calculate if a resize is needed

	          var increaseWidth = iw > p.iw;
	          var decreaseWidth = iw < p.iw;
	          var increaseHeight = ih > p.ih;
	          var decreaseHeight = ih < p.ih; // Update the container size if needed

	          if ([increaseWidth, decreaseWidth, increaseHeight, decreaseHeight].some(function (d) {
	            return d;
	          })) {
	            // Corrections to force some size. The minimum is an index width/height of 1, and in px. The px requirement is to make sure that the plot does not squash its internal menus etc. In practice 190/290px seems to be a good value. This finctionality handles the contours as well, therefore the minimum limits are in the format.position attribute.
	            iw = iw * dx < p.minW ? Math.ceil(p.minW / dx) : iw;
	            ih = ih * dy < p.minH ? Math.ceil(p.minH / dy) : ih; // RETHINK THIS LIMIT!! FOR CONTOUR PLOTS THE PX LIMIT IS NOT NEEDED!!
	            // Correction to ensure it doesn't exceed limits.

	            iw = ix + iw > nx ? nx - ix : iw; // Width must simultaneously not be 1, and not exceed the limit of the container.

	            p.ih = ih;
	            p.iw = iw; // this < svg < bottom div < plot body < card < plotWrapper

	            f.wrapper.style("max-width", iw * dx + "px").style("width", iw * dx + "px").style("height", ih * dy + "px");
	            f.wrapper.select("div.card").style("max-width", iw * dx + "px").style("width", iw * dx + "px").style("height", ih * dy + "px"); // UPDATE THE PLOT

	            cfD3Contour2d.rescale(d); // Resize the containers accordingly

	            cfD3Contour2d.interactivity.refreshContainerSize(d); // Redo the graphics.
	          } // if

	        },
	        // resizeMove
	        resizeEnd: function resizeEnd(d) {
	          // After teh resize is finished update teh contour.
	          var container = d3.select(d.graphic.format.parent);
	          builder.refreshPlotRowHeight(container);
	          builder.refreshPlotRowWidth(container);
	        } // resizeEnd

	      } // gridded

	    },
	    // dragging
	    statistics: {
	      draw: function draw(pileCtrl, statContour) {
	        pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").each(function (d) {
	          // Has to be designed to ensure units are kept.
	          var svg = d.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg"); // The svg defineds the range, so change the domain.

	          cfD3Contour2d.interactivity.statistics.design(svg, statContour);
	          var projection = cfD3Contour2d.draw.projection(statContour);
	          svg.select("g.contour").selectAll("path").data(statContour.graphic.levels).join(function (enter) {
	            return enter.append("path").attr("fill", statContour.graphic.format.color).attr("d", projection);
	          }, function (update) {
	            return update.attr("fill", statContour.graphic.format.color).attr("d", projection);
	          }, function (exit) {
	            return exit.remove();
	          });
	        });
	      },
	      // draw
	      design: function design(svg, statContour) {
	        var f = statContour.graphic.format;
	        var xdiff = f.domain.x[1] - f.domain.x[0];
	        var ydiff = f.domain.y[1] - f.domain.y[0];
	        var arX = xdiff / f.position.sw;
	        var arY = ydiff / f.position.sh; // Larges AR must prevail - otherwise the plot will overflow.

	        if (arX > arY) {
	          var padding = arX * f.position.sh - ydiff;
	          f.domain.y = [f.domain.y[0] - padding / 2, f.domain.y[1] + padding / 2];
	        } else {
	          var _padding = arY * f.position.sw - xdiff;

	          f.domain.x = [f.domain.x[0] - _padding / 2, f.domain.x[1] + _padding / 2];
	        } // if

	      },
	      // design
	      drawMu: function drawMu(pileCtrl) {
	        pileCtrl.statistics.plotted = "mu"; // Change the title

	        pileCtrl.wrapper.select("div.summaryWrapper").select("div.title").select("p").html("μ"); // Change the contours

	        cfD3Contour2d.interactivity.statistics.draw(pileCtrl, pileCtrl.statistics.mu);
	      },
	      // drawMu
	      drawSigma: function drawSigma(pileCtrl) {
	        pileCtrl.statistics.plotted = "sigma";
	        pileCtrl.wrapper.select("div.summaryWrapper").select("div.title").select("p").html("σ");
	        cfD3Contour2d.interactivity.statistics.draw(pileCtrl, pileCtrl.statistics.sigma);
	      },
	      // drawSigma
	      drawCorrelation: function drawCorrelation(trendingCtrlGroup) {
	        var i = cfD3Contour2d.interactivity; // Get the scores

	        var scores = i.statistics.correlation(trendingCtrlGroup.datum().tools.trending); // Get a palette

	        var score2clr = d3.scaleLinear().domain([0, 1]).range([0, 0.75]);
	        trendingCtrlGroup.selectAll("select").each(function () {
	          // Determine if it's x or y select
	          var axis = d3.select(this).attr("axis");

	          var color = function color(d) {
	            return d3.interpolateGreens(score2clr(Math.abs(d.score[axis])));
	          };

	          d3.select(this).selectAll("option").data(scores).join(function (enter) {
	            return enter.append("option").attr("value", function (d) {
	              return d.name;
	            }).html(function (d) {
	              return d.label[axis];
	            }).style("background-color", color);
	          }, function (update) {
	            return update.attr("value", function (d) {
	              return d.name;
	            }).html(function (d) {
	              return d.label[axis];
	            }).style("background-color", color);
	          }, function (exit) {
	            return exit.remove();
	          });
	        });
	      },
	      // drawCorrelation
	      makeDataObj: function makeDataObj(wrapper, surface, thresholds, name, taskId) {
	        var s = surface;
	        var colorScheme = d3.scaleSequential(d3.interpolateViridis).domain(d3.extent(thresholds));
	        return {
	          file: {
	            filename: name,
	            content: {
	              surface: s
	            }
	          },
	          task: {
	            taskId: taskId
	          },
	          graphic: {
	            levels: cfD3Contour2d.draw.json2contour(s, thresholds),
	            format: {
	              wrapper: wrapper,
	              position: {
	                sh: parseFloat(wrapper.attr("height")),
	                sw: parseFloat(wrapper.attr("width"))
	              },
	              domain: {
	                x: [d3.min(s.x), d3.max(s.x)],
	                y: [d3.min(s.y), d3.max(s.y)],
	                v: [d3.min(s.v), d3.max(s.v)]
	              },
	              color: function color(d) {
	                return colorScheme(d.value);
	              }
	            }
	          }
	        };
	      },
	      // makeDataObj
	      mean: function mean(pileCtrl) {
	        var dataobjs = pileCtrl.members;
	        var mu;
	        var n = dataobjs.length; // calculate mean

	        dataobjs.forEach(function (dataobj) {
	          var d = dataobj.file.content.surface;

	          if (mu == undefined) {
	            mu = {
	              x: d.x.map(function (x) {
	                return x / n;
	              }),
	              y: d.y.map(function (y) {
	                return y / n;
	              }),
	              v: d.v.map(function (v) {
	                return v / n;
	              }),
	              size: d.size
	            };
	          } else {
	            d.x.forEach(function (d_, i) {
	              return mu.x[i] += d_ / n;
	            });
	            d.y.forEach(function (d_, i) {
	              return mu.y[i] += d_ / n;
	            });
	            d.v.forEach(function (d_, i) {
	              return mu.v[i] += d_ / n;
	            });
	          } // if

	        }); // forEach

	        var plotCtrl = d3.select(pileCtrl.wrapper.node().parentElement).datum();
	        var svg = pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg"); // Create a statistics output:

	        pileCtrl.statistics.mu = cfD3Contour2d.interactivity.statistics.makeDataObj(svg, mu, plotCtrl.data.domain.thresholds, "mean@obs", "μ");
	      },
	      // mean
	      standardDeviation: function standardDeviation(pileCtrl) {
	        var tasks = pileCtrl.members;
	        var mean = pileCtrl.statistics.mu;
	        var mu = mean.file.content.surface;
	        var sigma;
	        var n = tasks.length; // calculate standard deviation based on the mean.

	        tasks.forEach(function (task) {
	          var t = task.file.content.surface;

	          if (sigma == undefined) {
	            sigma = {
	              x: mu.x,
	              y: mu.y,
	              v: t.v.map(function (d, i) {
	                return 1 / (n - 1) * Math.pow(d - mu.v[i], 2);
	              }),
	              size: mu.size
	            };
	          } else {
	            t.v.forEach(function (d, i) {
	              return sigma.v[i] += 1 / (n - 1) * Math.pow(d - mu.v[i], 2);
	            });
	          } // if

	        }); // forEach

	        var svg = pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg"); // Use another way to calculate

	        var domain = d3.extent(sigma.v);
	        var thresholds = d3.range(domain[0], domain[1], (domain[1] - domain[0]) / 7); // Create a statistics output:

	        pileCtrl.statistics.sigma = cfD3Contour2d.interactivity.statistics.makeDataObj(svg, sigma, thresholds, "stdev@obs", "σ");
	      },
	      // standardDeviation
	      correlation: function correlation(pileCtrl) {
	        // Given some on-screen order show the user which variables are most correlated with it.
	        var s = cfD3Contour2d.interactivity.statistics; // Order is based given the left edge of the contour. The order on the screen is coordinated with the sequential order in contours.tasks in 'dragMove', and in 'ordering'.

	        var scores = dbsliceData.data.ordinalProperties.map(function (variable) {
	          // For each of the data variables calculate a correlation.
	          // Collect the data to calculate the correlation.
	          var d = pileCtrl.members.map(function (dataobj) {
	            var el = dataobj.graphic.format.wrapper.node();
	            return {
	              x: el.offsetLeft,
	              y: el.offsetTop,
	              "var": dataobj.task[variable]
	            };
	          }); // map
	          // Get Spearman's rank correlation scores for the order in the x direction.
	          // (https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient)
	          // The coefficient is
	          // covariance (x_rank, y_rank ) / ( sigma(rank_x) sigma(rank_y) )

	          var cov = s.covariance(d);
	          var sigma_x = d3.deviation(d, function (d) {
	            return d.x;
	          });
	          var sigma_y = d3.deviation(d, function (d) {
	            return d.y;
	          });
	          var sigma_var = d3.deviation(d, function (d) {
	            return d["var"];
	          });
	          sigma_x = sigma_x == 0 ? Infinity : sigma_x;
	          sigma_y = sigma_y == 0 ? Infinity : sigma_y;
	          sigma_var = sigma_var == 0 ? Infinity : sigma_var;
	          var score = {
	            x: cov.x / (sigma_x * sigma_var),
	            y: cov.y / (sigma_y * sigma_var)
	          };
	          var label = {
	            x: score.x < 0 ? "- " + variable : "+ " + variable,
	            y: score.y < 0 ? "- " + variable : "+ " + variable
	          };
	          return {
	            name: variable,
	            label: label,
	            score: score
	          };
	        }); // map
	        // Before returning the scores, order them.

	        scores.sort(function (a, b) {
	          return a.score - b.score;
	        });
	        return scores;
	      },
	      // correlation
	      covariance: function covariance(d) {
	        // 'd' is an array of observations. Calculate the covariance between x and the metadata variable.
	        var N = d.length;
	        var mu_x = d3.sum(d, function (d) {
	          return d.x;
	        }) / N;
	        var mu_y = d3.sum(d, function (d) {
	          return d.y;
	        }) / N;
	        var mu_var = d3.sum(d, function (d) {
	          return d["var"];
	        }) / N;
	        var sumx = 0;
	        var sumy = 0;

	        for (var i = 0; i < N; i++) {
	          sumx += (d[i].x - mu_x) * (d[i]["var"] - mu_var);
	          sumy += (d[i].y - mu_y) * (d[i]["var"] - mu_var);
	        }

	        return {
	          x: 1 / (N - 1) * sumx,
	          y: 1 / (N - 1) * sumy
	        };
	      } // covariance

	    },
	    // statistics
	    sorting: {
	      x: function x(ctrl, variable) {
	        var dx = positioning.dx(ctrl.figure);
	        var dy = positioning.dy(ctrl.figure); // Find the appropriate metadata, and the range to plot it to.

	        var vals = ctrl.tools.trending.members.map(function (d) {
	          return d.task[variable];
	        });
	        var range = cfD3Contour2d.interactivity.sorting.getRange(ctrl); // Create a scale

	        var scale = d3.scaleLinear().domain(d3.extent(vals)).range(range.x); // Position the contours.

	        ctrl.tools.trending.members.forEach(function (d) {
	          var x = scale(d.task[variable]);
	          d.graphic.format.position.x = x;
	          d.graphic.format.position.ix = Math.floor(x / dx);
	          d.graphic.format.wrapper.style("left", x + "px");
	        });
	      },
	      // x
	      y: function y(ctrl, variable) {
	        var dx = positioning.dx(ctrl.figure);
	        var dy = positioning.dy(ctrl.figure); // Find the appropriate metadata, and the range to plot it to.

	        var vals = ctrl.tools.trending.members.map(function (d) {
	          return d.task[variable];
	        });
	        var range = cfD3Contour2d.interactivity.sorting.getRange(ctrl); // Create a scale

	        var scale = d3.scaleLinear().domain(d3.extent(vals)).range(range.y); // Position the contours.

	        ctrl.tools.trending.members.forEach(function (d) {
	          var y = scale(d.task[variable]);
	          d.graphic.format.position.y = y;
	          d.graphic.format.position.iy = Math.floor(y / dy);
	          d.graphic.format.wrapper.style("top", y + "px");
	        });
	      },
	      // y
	      getRange: function getRange(ctrl) {
	        var height = ctrl.figure.node().offsetHeight;
	        var width = ctrl.figure.node().offsetWidth;
	        var maxCardHeight = d3.max(ctrl.tools.trending.members.map(function (d) {
	          return d.graphic.format.position.h;
	        }));
	        var maxCardWidth = d3.max(ctrl.tools.trending.members.map(function (d) {
	          return d.graphic.format.position.w;
	        }));
	        return {
	          x: [0, width - maxCardWidth],
	          y: [0, height - maxCardHeight]
	        };
	      } // getRange

	    } // sorting

	  },
	  // interactivity
	  helpers: {
	    // Initialisation
	    createDefaultControl: function createDefaultControl() {
	      // data:
	      // • .promises are promises completed before drawing the graphics.
	      // • .requested is an array of urls whose data are requested by the plotting tool. These need not be the same as the data in promises as those are loaded on user prompt!
	      // • .available is an array of urls which were found in the central booking,
	      // • .missing                              NOT found
	      // • .ordinalProperties is a string array of properties found in the data.
	      // • .data is an array of n-data arrays of the n-task slice files.
	      var ctrl = {
	        plotFunc: cfD3Contour2d,
	        fileClass: contour2dFile,
	        figure: undefined,
	        svg: undefined,
	        grid: {
	          nx: 12
	        },
	        data: {
	          plotted: [],
	          available: [],
	          missing: [],
	          intersect: [],
	          domain: {
	            x: undefined,
	            y: undefined,
	            v: undefined,
	            ar: undefined,
	            thresholds: undefined,
	            nLevels: undefined
	          }
	        },
	        view: {
	          sliceId: undefined,
	          options: [],
	          viewAR: NaN,
	          dataAR: NaN,
	          xVarOption: undefined,
	          yVarOption: undefined,
	          cVarOption: undefined,
	          transitions: {
	            duration: 500,
	            updateDelay: 0,
	            enterDelay: 0
	          },
	          t: undefined
	        },
	        tools: {
	          scales: {
	            px2clr: undefined,
	            val2clr: undefined,
	            val2px: undefined,
	            val2px_: undefined,
	            bin2px: undefined
	          },
	          lasso: {
	            points: [],
	            tasks: []
	          },
	          tooltip: undefined,
	          trending: undefined
	        },
	        format: {
	          title: "Edit title",
	          parent: undefined,
	          wrapper: undefined,
	          position: {
	            ix: 0,
	            iy: 0,
	            iw: 12,
	            ih: 4,
	            minH: 290,
	            minW: 340,
	            titleHeight: undefined,
	            plotHeight: undefined,
	            plotWidth: undefined,
	            rightControlWidth: 170
	          },
	          rightControls: {
	            plotFunc: cfD3Contour2d.interactivity.rightControls,
	            grid: {
	              nx: 1
	            },
	            format: {
	              parent: undefined,
	              wrapper: undefined,
	              position: {
	                ix: 0,
	                iy: 0,
	                iw: 12,
	                ih: undefined
	              }
	            },
	            colorbar: {
	              margin: {
	                top: 20,
	                bottom: 20,
	                left: 10,
	                right: 5
	              },
	              svg: undefined,
	              height: undefined,
	              width: undefined,
	              x: undefined,
	              y: undefined
	            },
	            // colorbar
	            histogram: {
	              margin: {
	                top: 20,
	                bottom: 20,
	                left: 5,
	                right: 10
	              },
	              svg: undefined,
	              height: undefined,
	              width: undefined,
	              x: undefined,
	              y: undefined,
	              bins: undefined
	            } // histogram

	          }
	        }
	      }; // ctrl

	      return ctrl;
	    },
	    // createDefaultControl
	    createLoadedControl: function createLoadedControl(plotData) {
	      var ctrl = cfD3Contour2d.helpers.createDefaultControl(); // If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.

	      if (plotData.sliceId != undefined) {
	        // Needs to check the slice properties that this plot cal draw. 
	        if (dbsliceData.data.contour2dProperties.includes(plotData.sliceId)) {
	          ctrl.view.sliceId = plotData.sliceId;
	        } // if

	      } // if


	      ctrl.format.title = plotData.title; // When the session is loaded all previously existing plots would have been removed, and with them all on demand loaded data. Therefore the variables for this plot cannot be loaded, as they will depend on the data.

	      return ctrl;
	    },
	    // createLoadedControl
	    writeControl: function writeControl(ctrl) {
	      var s = "";
	      s = s + '{';
	      s = s + '"type": "' + ctrl.plotFunc.name + '", ';
	      s = s + '"title": "' + ctrl.format.title + '"'; // For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
	      // Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.

	      var sliceId = accessProperty(ctrl.view, "sliceId");
	      s = s + writeOptionalVal("sliceId", sliceId);
	      s = s + '}';
	      return s;

	      function writeOptionalVal(name, val) {
	        var s_ = "";

	        if (val !== undefined) {
	          s_ = s_ + ', ';
	          s_ = s_ + '"' + name + '": "' + val + '"';
	        } // if


	        return s_;
	      } // writeOptionalVal


	      function accessProperty(o, p) {
	        // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
	        // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
	        return o == undefined ? undefined : o[p];
	      } // accessProperty

	    },
	    // writeControl
	    // Interactivity
	    transitions: {
	      instantaneous: function instantaneous() {
	        return {
	          duration: 0,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      },
	      // instantaneous
	      animated: function animated() {
	        return {
	          duration: 500,
	          updateDelay: 0,
	          enterDelay: 0
	        };
	      } // animated

	    },
	    // transitions
	    // Functions supporting cross plot highlighting
	    unhighlight: function unhighlight(ctrl) {
	      ctrl.figure.selectAll("div.contourWrapper").style("border-width", "").style("border-style", "").style("border-color", "");
	    },
	    // unhighlight
	    highlight: function highlight(ctrl, allDataPoints) {
	      // Only highlight those points that are not in piles.
	      // Udate the boundary.
	      var allCards = ctrl.figure.selectAll("div.contourWrapper");
	      var selectedCards = allCards.filter(function (d) {
	        return allDataPoints.includes(d.task);
	      });
	      var others = allCards.filter(function (d) {
	        return !allDataPoints.includes(d.task);
	      });
	      selectedCards.style("border-width", "4px").style("border-style", "dashed").style("border-color", "black");
	      others.style("border-width", "").style("border-style", "").style("border-color", "");
	    },
	    // highlight
	    defaultStyle: function defaultStyle(ctrl) {
	      ctrl.figure.selectAll("div.contourWrapper").style("border-width", "").style("border-style", "").style("border-color", "");
	    } // defaultStyle

	  } // helpers

	}; // cfD3Contour2d

	var plotRow = /*#__PURE__*/function () {
	  function plotRow(config) {
	    _classCallCheck(this, plotRow);

	    this.title = typeof config.title == "string" ? config.title : "New Plot Row!";
	    this.type = ["plotter", "metadata"].includes(config.type) ? config.type : "metadata";
	    this.addPlotButton = {
	      label: "Add plot"
	    };
	    this.grid = {
	      nx: 12,
	      ny: undefined
	    }; // Handle any specified plots.

	    if (config.plots) {
	      this.plots = config.plots.reduce(function (acc, ctrl) {
	        // Try to instantiate all the plots.
	        var plot = plotRow.instantiatePlot(ctrl);

	        if (plot) {
	          acc.push(plot);
	        } // if


	        return acc;
	      }, []);
	    } else {
	      this.plots = [];
	    } // if

	  } // constructor


	  _createClass(plotRow, null, [{
	    key: "instantiatePlot",
	    value: function instantiatePlot(ctrl) {
	      var plotCtrl = undefined;

	      switch (ctrl.plottype) {
	        case "cfD3BarChart":
	          plotCtrl = cfD3BarChart.helpers.createDefaultControl();
	          plotCtrl.view.yVarOption.val = ctrl.yProperty;
	          plotCtrl.view.gVar = ctrl.yProperty;
	          break;

	        case "cfD3Histogram":
	          plotCtrl = cfD3Histogram.helpers.createDefaultControl();
	          plotCtrl.view.xVarOption.val = ctrl.xProperty;
	          break;

	        case "cfD3Scatter":
	          plotCtrl = cfD3Scatter.helpers.createDefaultControl();
	          plotCtrl.view.xVarOption.val = ctrl.xProperty;
	          plotCtrl.view.yVarOption.val = ctrl.yProperty;
	          break;

	        case "cfD3Line":
	          plotCtrl = cfD3Line.helpers.createDefaultControl();
	          plotCtrl.view.sliceId = ctrl.sliceId;
	          break;

	        case "cfD3Contour2d":
	          plotCtrl = cfD3Contour2d.helpers.createDefaultControl();
	          plotCtrl.view.sliceId = ctrl.sliceId;
	          break;
	      }

	      return plotCtrl;
	    } // instantiatePlot

	  }]);

	  return plotRow;
	}(); // plotRow

	var addMenu = {
	  addPlotControls: {
	    elementOptionsArray: function elementOptionsArray(plotRowType) {
	      var d = dbsliceData.data;
	      var options = [{
	        val: "undefined",
	        text: " "
	      }];

	      switch (plotRowType) {
	        case "metadata":
	          if (existsAndHasElements(d.categoricalProperties)) {
	            options.push({
	              val: "cfD3BarChart",
	              text: "Bar Chart"
	            });
	          }

	          if (existsAndHasElements(d.ordinalProperties)) {
	            options.push({
	              val: "cfD3Scatter",
	              text: "Scatter"
	            });
	            options.push({
	              val: "cfD3Histogram",
	              text: "Histogram"
	            });
	          }

	          break;

	        case "plotter":
	          if (existsAndHasElements(d.line2dProperties)) {
	            options.push({
	              val: "cfD3Line",
	              text: "Line"
	            });
	          }

	          if (existsAndHasElements(d.contour2dProperties)) {
	            options.push({
	              val: "cfD3Contour2d",
	              text: "2D Contour"
	            });
	          }

	          break;
	      }

	      return options;

	      function existsAndHasElements(A) {
	        var response = false;

	        if (A) {
	          response = A.length > 0;
	        }

	        return response;
	      }
	    },
	    make: function make(ownerButton, containerCtrl) {
	      // Container ctrl is required bcause the plot needs to be pushed into it!!
	      // Create the config element with all required data.
	      var config = addMenu.addPlotControls.createConfig(ownerButton, containerCtrl); // Make the corresponding dialog.

	      addMenu.helpers.makeDialog(config); // Update the menus with appropriate options

	      addMenu.helpers.updateMenus(config); // Add the buttons

	      addMenu.helpers.addDialogButtons(config); // Add the on click event to the dialog owner button

	      config.ownerButton.on("click", function () {
	        addMenu.helpers.showDialog(config);
	      }); // on
	    },
	    // make
	    // Config handling
	    createConfig: function createConfig(ownerButton, containerCtrl) {
	      // ownerButton    - the button that prompts the menu
	      // ownerContainer - container to add the menu and button to
	      // ownerCtrl      - plot row ctrl to update with user selection
	      var config = {
	        f: addMenu.addPlotControls,
	        position: {
	          left: undefined,
	          top: undefined,
	          delta: undefined
	        },
	        buttons: [{
	          text: "ok",
	          onclick: ok,
	          "class": "btn btn-success"
	        }, {
	          text: "cancel",
	          onclick: cancel,
	          "class": "btn btn-danger"
	        }],
	        userSelectedVariables: ["xProperty", "yProperty", "slice"],
	        menuItems: [{
	          variable: "plottype",
	          options: addMenu.addPlotControls.elementOptionsArray(containerCtrl.type),
	          label: "Select plot type",
	          event: addMenu.addPlotControls.onPlotTypeChangeEvent
	        }],
	        newCtrl: {
	          plottype: undefined,
	          xProperty: undefined,
	          yProperty: undefined,
	          slice: undefined
	        },
	        ownerButton: ownerButton,
	        ownerCtrl: containerCtrl
	      }; // MOVE THESE OUTSIDE

	      function ok(dialogConfig) {
	        // Hide the dialog
	        addMenu.helpers.hideDialog(dialogConfig); // Add the plot row.

	        addMenu.addPlotControls.submitNewPlot(dialogConfig); // Clear the dialog selection

	        addMenu.addPlotControls.clearNewPlot(dialogConfig); // Clear newPlot to be ready for the next addition.

	        addMenu.addPlotControls.clearMenu(config); // Redraw the screen.

	        sessionManager.render();
	      } // ok


	      function cancel(dialogConfig) {
	        addMenu.addPlotControls.clearNewPlot(dialogConfig);
	        addMenu.helpers.hideDialog(dialogConfig); // Clear newPlot to be ready for the next addition.

	        addMenu.addPlotControls.clearMenu(config);
	      } // ok


	      return config;
	    },
	    // createConfig
	    clearNewPlot: function clearNewPlot(config) {
	      config.newCtrl.plottype = undefined;
	      config.newCtrl.xProperty = undefined;
	      config.newCtrl.yProperty = undefined;
	      config.newCtrl.sliceId = undefined;
	    },
	    // clearNewPlot
	    submitNewPlot: function submitNewPlot(config) {
	      // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
	      var plotToPush = plotRow.instantiatePlot(config.newCtrl);
	      var plotRowObj = dbsliceData.session.plotRows.filter(function (plotRowCtrl) {
	        return plotRowCtrl == config.ownerCtrl;
	      })[0]; // Position the new plot row in hte plot container.

	      positioning.newPlot(plotRowObj, plotToPush);
	      plotRowObj.plots.push(plotToPush);
	    },
	    // submitNewPlot
	    // Menu functionality
	    onPlotTypeChangeEvent: function onPlotTypeChangeEvent(config, selectDOM, variable) {
	      // Update the config.
	      config.newCtrl.plottype = selectDOM.value; // Based on the selection control the other required inputs.

	      var a = addMenu.addPlotControls;
	      var h = addMenu.helpers;

	      switch (config.newCtrl.plottype) {
	        case "undefined":
	          // Remove all variable options.
	          h.removeMenuItemObject(config, "xProperty");
	          h.removeMenuItemObject(config, "yProperty");
	          h.removeMenuItemObject(config, "sliceId");
	          break;
	        // METADATA PLOTS

	        case "cfD3BarChart":
	          // yProperty required.
	          h.addUpdateMenuItemObject(config, 'yProperty', dbsliceData.data.categoricalProperties, "Select y variable"); // xProperty must not be present.

	          h.removeMenuItemObject(config, "xProperty");
	          break;

	        case "cfD3Histogram":
	          // xProperty required.
	          h.addUpdateMenuItemObject(config, "xProperty", dbsliceData.data.ordinalProperties, "Select x variable"); // yProperty must not be present.

	          h.removeMenuItemObject(config, "yProperty");
	          break;

	        case "cfD3Scatter":
	          // xProperty and yProperty required.
	          h.addUpdateMenuItemObject(config, "xProperty", dbsliceData.data.ordinalProperties, "Select x variable");
	          h.addUpdateMenuItemObject(config, "yProperty", dbsliceData.data.ordinalProperties, "Select y variable");
	          break;
	        // 2D/3D PLOTS

	        case "cfD3Line":
	          // sliceId is required.
	          h.addUpdateMenuItemObject(config, "sliceId", dbsliceData.data.line2dProperties, "Select slice");
	          break;

	        case "cfD3Contour2d":
	          // slice is required.
	          h.addUpdateMenuItemObject(config, "sliceId", dbsliceData.data.contour2dProperties, "Select 2d contour");
	          break;

	        default:
	          // Remove all variable options.
	          h.removeMenuItemObject(config, "xProperty");
	          h.removeMenuItemObject(config, "yProperty");
	          h.removeMenuItemObject(config, "sliceId");
	          console.log("Unexpected plot type selected:", config.newCtrl.plottype);
	          break;
	      }
	      // Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.

	      a.clearOptionalMenus(config); // Update.

	      h.updateMenus(config);
	    },
	    // onPlotTypeChangeEvent
	    onVariableChangeEvent: function onVariableChangeEvent(config, selectDOM, variable) {
	      // Selected value is updated in the corresponding config.
	      config.newCtrl[variable] = selectDOM.value; // Check if menu buttons need to be active.

	      addMenu.addPlotControls.enableDisableSubmitButton(config);
	    },
	    // onVariableChangeEvent
	    enableDisableSubmitButton: function enableDisableSubmitButton(config) {
	      var disabledFlag = true;

	      switch (config.newCtrl.plottype) {
	        case "undefined":
	          // Disable
	          disabledFlag = true;
	          break;

	        case "cfD3BarChart":
	          // xProperty enabled, yProperty disabled.
	          var isConfigValid = config.newCtrl.xProperty === undefined && config.newCtrl.yProperty !== undefined;

	          if (isConfigValid) {
	            disabledFlag = false;
	          } else {
	            disabledFlag = true;
	          }
	          break;

	        case "cfD3Histogram":
	          // xProperty enabled, yProperty disabled.
	          var isConfigValid = config.newCtrl.xProperty !== undefined && config.newCtrl.yProperty === undefined;

	          if (isConfigValid) {
	            disabledFlag = false;
	          } else {
	            disabledFlag = true;
	          }
	          break;

	        case "cfD3Scatter":
	          // xProperty enabled, yProperty  enabled.
	          var isConfigValid = config.newCtrl.xProperty !== undefined && config.newCtrl.yProperty !== undefined;

	          if (isConfigValid) {
	            disabledFlag = false;
	          } else {
	            disabledFlag = true;
	          }
	          break;

	        case "cfD3Line":
	          // Nothing else is needed, just enable the submit button.
	          disabledFlag = false;
	          break;

	        case "cfD3Contour2d":
	          // Nothing else is needed, just enable the submit button.
	          disabledFlag = false;
	          break;

	        default:
	          // Disable
	          disabledFlag = true;
	          break;
	      }
	      // Set button enabled or disabled. Note that from the menu container we need to go one step up to reach the button, as the custom menu container is simply docked into the dialog.

	      config.dialogWrapper.select("button.btn-success").each(function () {
	        this.disabled = disabledFlag;
	      });
	    },
	    // enableDisableSubmitButton
	    // Shorthands
	    clearOptionalMenus: function clearOptionalMenus(config) {
	      var h = addMenu.helpers;
	      h.resetVariableMenuSelections(config, "xProperty");
	      h.resetVariableMenuSelections(config, "yProperty");
	      h.resetVariableMenuSelections(config, "sliceId");
	      config.newCtrl.xProperty = undefined;
	      config.newCtrl.yProperty = undefined;
	      config.newCtrl.sliceId = undefined;
	    },
	    // clearOptionalMenus
	    clearMenu: function clearMenu(config) {
	      addMenu.addPlotControls.clearNewPlot(config); // Reset the menu selection!

	      addMenu.helpers.resetVariableMenuSelections(config, "plottype");
	      addMenu.helpers.resetVariableMenuSelections(config, "xProperty");
	      addMenu.helpers.resetVariableMenuSelections(config, "yProperty");
	      addMenu.helpers.resetVariableMenuSelections(config, "sliceId"); // Remove the select menus from the view.

	      addMenu.helpers.removeMenuItemObject(config, "xProperty");
	      addMenu.helpers.removeMenuItemObject(config, "yProperty");
	      addMenu.helpers.removeMenuItemObject(config, "sliceId"); // Update the menus so that the view reflects the state of the config.

	      addMenu.helpers.updateMenus(config);
	    },
	    // clearMenu
	    makeMenuItem: function makeMenuItem(config, variable, options, label) {
	      // 'makeMenuItem' creates the menu item option in order to allow different functionalities to add their own events to the menus without having to declare them specifically in otehr functions.
	      return {
	        variable: variable,
	        options: options,
	        label: label,
	        event: config.f.onVariableChangeEvent
	      };
	    } // makeMenuItem

	  },
	  // addPlotControls
	  removePlotControls: function removePlotControls(clickedPlotCtrl) {
	    // Find the ctrl of this plot. 
	    // this = button -> ctrlGrp -> plotTitle -> card.
	    var plotWrapperDOM = this.parentElement.parentElement.parentElement.parentElement; // plotWrapperDOM -> plotRowBody

	    var thisPlotRowBody = d3.select(plotWrapperDOM.parentElement); // Remove the plot from the object.

	    thisPlotRowBody.each(function (plotRowCtrl) {
	      plotRowCtrl.plots = plotRowCtrl.plots.filter(function (plotCtrl) {
	        // Only return the plots that are not this one.
	        return plotCtrl != clickedPlotCtrl;
	      }); // filter
	    }); // each
	    // Remove from DOM

	    plotWrapperDOM.remove(); // Remove any filters that have been removed.

	    filter.remove();
	    filter.apply(); // Re-render the view

	    sessionManager.render();
	  },
	  // removePlotRowControls
	  addPlotRowControls: {
	    elementOptionsArray: [{
	      val: "undefined",
	      text: " "
	    }, {
	      val: "metadata",
	      text: 'Metadata overview'
	    }, {
	      val: "plotter",
	      text: 'Flow field plots'
	    }],
	    make: function make(ownerButton) {
	      // Create the config element with all required data.
	      var config = addMenu.addPlotRowControls.createConfig(ownerButton); // First create the ids of the required inputs

	      addMenu.helpers.makeDialog(config); // Update the menus with appropriate options

	      addMenu.helpers.updateMenus(config); // Add the buttons

	      addMenu.helpers.addDialogButtons(config); // Add the on click event to the dialog owner button

	      config.ownerButton.on("click", function () {
	        addMenu.helpers.showDialog(config);
	      }); // on
	    },
	    // make
	    createConfig: function createConfig(ownerButton) {
	      var config = {
	        f: addMenu.addPlotRowControls,
	        position: {
	          left: undefined,
	          top: undefined,
	          delta: undefined
	        },
	        buttons: [{
	          text: "ok",
	          onclick: ok,
	          "class": "btn btn-success"
	        }, {
	          text: "cancel",
	          onclick: cancel,
	          "class": "btn btn-danger"
	        }],
	        menuItems: [{
	          variable: "type",
	          options: addMenu.addPlotRowControls.elementOptionsArray,
	          label: "Select plot row type",
	          event: addMenu.addPlotRowControls.onPlotRowTypeChangeEvent
	        }],
	        newCtrl: {
	          type: "undefined"
	        },
	        ownerButton: ownerButton,
	        ownerCtrl: {
	          addPlotButton: {}
	        }
	      };

	      function ok(dialogConfig) {
	        // Hide the dialog
	        addMenu.helpers.hideDialog(dialogConfig); // Add the plot row.

	        addMenu.addPlotRowControls.submitNewPlotRow(dialogConfig); // Reset the menu DOM elements.

	        addMenu.helpers.resetVariableMenuSelections(config, "type"); // Redraw to show changes.

	        sessionManager.render();
	      } // ok


	      function cancel(dialogConfig) {
	        addMenu.addPlotRowControls.clearNewPlotRow(dialogConfig);
	        addMenu.helpers.hideDialog(dialogConfig); // ALSO READJUST THE MENUS!!

	        console.log("Cancel");
	      } // ok
	      // The addPlotButton id needs to be updated when the row is submitted!


	      return config;
	    },
	    // createConfig
	    clearNewPlotRow: function clearNewPlotRow(config) {
	      config.newCtrl.title = "New row";
	      config.newCtrl.plots = [];
	      config.newCtrl.type = "undefined";
	      config.newCtrl.addPlotButton = {
	        label: "Add plot"
	      }; // Here also readjust the menu.

	      config.dialogWrapper.selectAll("select").each(function () {
	        this.value = "undefined";
	      });
	    },
	    // clearNewPlotRow
	    submitNewPlotRow: function submitNewPlotRow(config) {
	      // Submits the dialog selections to dbsliceData, and clears the dialog object selections.
	      var plotRowToPush = new plotRow(config.newCtrl); // Push and plot the new row.

	      dbsliceData.session.plotRows.push(plotRowToPush); // Clear the config

	      addMenu.addPlotRowControls.clearNewPlotRow(config);
	    },
	    // submitNewPlotRow
	    enableDisableSubmitButton: function enableDisableSubmitButton(config) {
	      // If either 'metadata' or 'plotter' were chosen then enable the button.
	      var disabledFlag = true;

	      switch (config.newCtrl.type) {
	        case "metadata":
	        case "plotter":
	          disabledFlag = false;
	          break;
	      }
	      // Why would thi sremove the data??

	      config.dialogWrapper.select(".btn-success").each(function (d) {
	        this.disabled = disabledFlag;
	      });
	    },
	    // enableDisableSubmitButton
	    onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config, selectDOM, variable) {
	      // When the plot row type is changed just check if the button should be enabled.
	      config.newCtrl.type = selectDOM.value;
	      addMenu.addPlotRowControls.enableDisableSubmitButton(config);
	    } // onPlotRowTypeChangeEvent

	  },
	  // addPlotRowControls
	  helpers: {
	    makeDialog: function makeDialog(config) {
	      var drag = d3.drag().on("start", function (d) {
	        var mousePos = d3.mouse(this);
	        d.position.delta = {
	          x: mousePos[0],
	          y: mousePos[1]
	        };
	      }).on("drag", function (d) {
	        d3.select(this).style("left", d3.event.sourceEvent.clientX - d.position.delta.x + "px").style("top", d3.event.sourceEvent.clientY - d.position.delta.y + "px");
	      }).on("end", function (d) {
	        d.position.delta = undefined;
	      }); // Place the dialog directly into the body! Position it off screen
	      // position: fixed is used to position the dialog relative to the view as opposed to absolute which positions relative to the document.

	      config.dialogWrapper = d3.select("body").append("div").datum(config).style("position", "fixed").style("height", "auto").style("width", "auto").style("top", -window.innerWidth + "px").style("left", -window.innerHeight + "px").style("display", "none").call(drag);
	      config.dialogCard = config.dialogWrapper.append("div").attr("class", "card border-dark").style("width", "auto").style("height", "auto").style("min-height", 94 + "px");
	      config.gMenu = config.dialogCard.append("g"); // Assign the dialog wrapper to the container config too.

	      config.ownerCtrl.addPlotButton.dialogWrapper = config.dialogWrapper;
	    },
	    // makeDialog
	    addDialogButtons: function addDialogButtons(config) {
	      var buttonsDiv = config.dialogCard.append("div").style("margin-left", "10px").style("margin-bottom", "10px");
	      config.buttons.forEach(function (b) {
	        buttonsDiv.append("button").html(b.text).attr("class", b["class"]).on("click", b.onclick);
	      });
	    },
	    // addDialogButtons
	    hideDialog: function hideDialog(config) {
	      // By default the dialog is not visible, and is completely off screen.
	      // 1 - make it visible
	      // 2 - move it to the right position
	      var dialogDOM = config.dialogWrapper.node();
	      dialogDOM.style.display = "none"; // Move it to the middle of the screen

	      dialogDOM.style.left = -window.innerWidth + "px";
	      dialogDOM.style.top = -window.innerHeight + "px";
	    },
	    // hideDialog
	    showDialog: function showDialog(config) {
	      // By default the dialog is not visible, and is completely off screen.
	      // 1 - make it visible
	      // 2 - move it to the right position
	      var dialogDOM = config.dialogWrapper.node(); // Make dialoge visible

	      dialogDOM.style.display = ""; // To get the appropriate position first get the size:

	      var dialogRect = dialogDOM.getBoundingClientRect(); // Move it to the middle of the screen

	      dialogDOM.style.left = (window.innerWidth - dialogRect.width) / 2 + "px";
	      dialogDOM.style.top = (window.innerHeight - dialogRect.height) / 2 + "px"; // Check which buttons should be on.

	      config.f.enableDisableSubmitButton(config);
	    },
	    // showDialog
	    updateMenus: function updateMenus(config) {
	      // Handles all selection menus, including the plot selection!
	      // A 'label' acts as a wrapper and contains html text, and the 'select'.
	      // This function updates the menu of the pop-up window.
	      var menus = config.gMenu.selectAll("g").data(config.menuItems); // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.

	      menus.enter().append("g").each(function (d) {
	        d3.select(this).append("label").attr("class", "dialogContent unselectable").text(d.label).append("select").attr("type", d.variable).style("margin-left", "10px");
	        d3.select(this).append("br");
	      }); // Remove exiting menus.

	      menus.exit().remove(); // Update all the menu elements.

	      config.gMenu.selectAll("label").each(function (menuItem) {
	        // This function handles the updating of the menu options for each 'select' element.
	        // Update the label text as well.
	        this.childNodes[0].value = menuItem.label; // Update the menu and it's functionality.

	        var menu = d3.select(this).select("select");
	        var options = menu.selectAll("option").data(menuItem.options);
	        options.enter().append("option").text(function (d) {
	          return d.text;
	        }).attr("value", function (d) {
	          return d.val;
	        });
	        options.attr("value", function (d) {
	          return d.val;
	        }).text(function (d) {
	          return d.text;
	        });
	        options.exit().remove(); // Add the functionality to update dependent properties of the new element we're adding to the view. E.g. x and y variable names. THIS HAS TO BE HERE, AS THE MENUS ENTER AND EXIT THE VIEW UPON UPDATE, AND THEIR ON CHANGE EVENTS NEED TO BE UPDATED. An 'on("change")' is used instead of addEventListener as it will replace instead of add functionality.

	        menu.on("change", function () {
	          // This is a special function to allow the appropriate inputs to be piped into the desired event.
	          menuItem.event(config, this, menuItem.variable);
	        });
	      }); // d3.select ... each
	    },
	    // updateMenus
	    resetVariableMenuSelections: function resetVariableMenuSelections(config, variable) {
	      // Needs to only reset the appropriate select!!
	      config.dialogWrapper.selectAll("select[type='" + variable + "']").each(function () {
	        this.value = "undefined";
	      });
	    },
	    // resetVariableMenuSelections
	    addUpdateMenuItemObject: function addUpdateMenuItemObject(config, variable, options, label) {
	      // Transform the options into a form expected by the select updating functionality. Also introduce an empty option.
	      options = options.map(function (d) {
	        return {
	          val: d,
	          text: d
	        };
	      });
	      options.unshift({
	        val: "undefined",
	        text: " "
	      }); // First remove any warnings. If they are needed they are added later on.

	      config.dialogWrapper.selectAll(".warning").remove(); // Only add or update the menu item if some selection variables exist.
	      // >1 is used as the default option "undefined" is added to all menus.

	      if (options.length > 1) {
	        var menuItems = config.menuItems; // Check if the config object already has a comparable option.

	        var requiredItem = menuItems.filter(function (menuItem) {
	          return menuItem.variable == variable;
	        })[0];

	        if (requiredItem !== undefined) {
	          // If the item exists, just update it.
	          requiredItem.options = options;
	          requiredItem.label = label;
	        } else {
	          // If it doesn't, create a new one.
	          requiredItem = config.f.makeMenuItem(config, variable, options, label);
	          config.menuItems.push(requiredItem);
	        }
	      } else {
	        // There are no variables. No point in having an empty menu.
	        addMenu.helpers.removeMenuItemObject(config, variable);
	      }
	    },
	    // addUpdateMenuItemObject
	    removeMenuItemObject: function removeMenuItemObject(config, variable) {
	      // Removes the menu item with that controls <variable>.
	      config.menuItems = config.menuItems.filter(function (menuItem) {
	        return menuItem.variable != variable;
	      });
	    } // removeMenuItemObject

	  } // helpers

	}; // addMenu

	var builder = {
	  update: {
	    sessionHeader: function sessionHeader() {
	      var all = dbsliceData.data.cf.all();
	      var filtered = dbsliceData.data.taskDim.top(Infinity);
	      var msg = "Number of Tasks in Filter = ";
	      msg += filtered && filtered.length != all.length ? filtered.length + " / " + all.length : "All (" + all.length + ")";
	      d3.select("#" + dbsliceData.session.elementId).select("#filteredTaskCount").html(msg); // Update the session title.

	      d3.select("#sessionTitle").html(dbsliceData.session.title);
	    },
	    // sessionHeader
	    sessionBody: function sessionBody() {
	      var plotRows = d3.select("#" + dbsliceData.session.elementId).select("#sessionBody").selectAll(".plotRow").data(dbsliceData.session.plotRows); // HANDLE ENTERING PLOT ROWS!

	      var newPlotRows = builder.makePlotRowContainers(plotRows); // Make this an input box so that it can be change on te go!

	      builder.makePlotRowHeaders(newPlotRows); // Give all entering plot rows a body to hold the plots.

	      builder.makePlotRowBodies(newPlotRows); // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.

	      builder.makeUpdatePlotRowPlots(newPlotRows); // UPDATE EXISTING PLOT ROWS!!

	      builder.makeUpdatePlotRowPlots(plotRows);
	    } // sessionBody

	  },
	  // update
	  makeSessionHeader: function makeSessionHeader() {
	    // Check if there was a previous session header already existing. 
	    var element = d3.select("#" + dbsliceData.session.elementId);
	    var sessionHeader = element.select("#sessionHeader"); // Add interactivity to the title. MOVE TO INIT??

	    element.select("#sessionTitle").html(dbsliceData.session.title).each(function () {
	      this.addEventListener("input", function () {
	        dbsliceData.session.title = this.innerHTML;
	      });
	    }); // each
	    // Plot all tasks interactivity

	    element.select("#refreshTasksButton").on("click", function () {
	      sessionManager.refreshTasksInPlotRows();
	    }); // on

	    if (dbsliceData.session.subtitle !== undefined) {
	      element.select("#sessionSubtitle").html(dbsliceData.session.subtitle);
	    } // if
	    // Add some options.


	    var sessionMenu = d3.select("#sessionOptionsMenu"); // Downloading a session file

	    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "saveSession").html("Save session").on("click", fileManager.exporting.session.download); // Bring up teh metadata creation.

	    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "metadataMerging").html("Metadata").on("click", dbsliceDataCreation.show); // Clicking anywhere else should close it.

	    window.addEventListener("click", function (clickevent) {
	      var button = d3.select("#sessionOptionsButton").node();
	      var menu = d3.select("#sessionOptionsMenu").node();

	      if (clickevent.srcElement == button) {
	        // Toggle the button.
	        var displayvalue = menu.style.display == "block" ? "" : "block";
	        menu.style.display = displayvalue;
	      } else {
	        menu.style.display = "";
	      } // if

	    }); // addEventListener	
	  },
	  // makeSessionHeader
	  updateSessionHeader: function updateSessionHeader(element) {
	    var metadata = dbsliceData.data.taskDim.top(Infinity);

	    if (metadata !== undefined) {
	      element.select("#filteredTaskCount").html("Number of Tasks in Filter = " + metadata.length);
	    } else {
	      element.select("#filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
	    }
	    // Update the session title.

	    element.select("#sessionTitle").html(dbsliceData.session.title);
	  },
	  // updateSessionHeader
	  makePlotRowContainers: function makePlotRowContainers(plotRows) {
	    // This creates all the new plot rows.
	    var width = d3.select("#" + dbsliceData.session.elementId).node().offsetWidth - 45; // HANDLE ENTERING PLOT ROWS!

	    var newPlotRows = plotRows.enter().append("div").attr("class", "card bg-light plotRow").style("margin-bottom", "20px").style("width", width + "px").attr("plot-row-index", function (d, i) {
	      return i;
	    }).each(function (d) {
	      d.element = this;
	    });
	    return newPlotRows;
	  },
	  // makePlotRowContainers
	  makePlotRowHeaders: function makePlotRowHeaders(newPlotRows) {
	    var newPlotRowsHeader = newPlotRows.append("div").attr("class", "card-header plotRowTitle").attr("type", function (d) {
	      return d.type;
	    }); // Text

	    newPlotRowsHeader.append("h3").attr("style", "display:inline").html(function (data) {
	      return data.title;
	    }).attr("spellcheck", "false").attr("contenteditable", true).each(function () {
	      // Store the typed in text in the central object.
	      this.addEventListener("input", function () {
	        var newTitle = this.innerText;
	        d3.select(this).each(function (obj) {
	          obj.title = newTitle;
	        });
	      }, false);
	    }); // each
	    // Buttons

	    newPlotRowsHeader.each(function (plotRowCtrl) {
	      var removePlotRowButton = d3.select(this).append("button").attr("class", "btn btn-danger float-right removePlotButton").html("x").on("click", builder.interactivity.removePlotRow); // Make the 'add plot' button

	      var addPlotButton = d3.select(this).append("button").attr("style", "display:inline").attr("class", "btn btn-success float-right").html("Add plot");
	      addMenu.addPlotControls.make(addPlotButton, plotRowCtrl);
	    }); // each
	  },
	  // makePlotRowHeaders
	  makePlotRowBodies: function makePlotRowBodies(newPlotRows) {
	    var newPlotRowsBody = newPlotRows.append("div").attr("class", "row no-gutters plotRowBody").attr("plot-row-index", function (d, i) {
	      return i;
	    }).attr("type", function (d) {
	      return d.type;
	    });
	    return newPlotRowsBody;
	  },
	  // makePlotRowBodies
	  makeUpdatePlotRowPlots: function makeUpdatePlotRowPlots(plotRows) {
	    var plots = plotRows.selectAll(".plotRowBody").selectAll(".plot").data(function (d) {
	      return d.plots;
	    }); // Create any new plots

	    plots.enter().each(plotHelpers.setupPlot.general.makeNewPlot); // Update any new plots

	    plots.each(function (plotCtrl) {
	      plotCtrl.view.transitions = plotCtrl.plotFunc.helpers.transitions.animated();
	      plotCtrl.plotFunc.update(plotCtrl);
	    }); // Adjust the plot row height

	    plotRows.selectAll(".plotRowBody").each(function () {
	      builder.refreshPlotRowHeight(d3.select(this));
	    });
	  },
	  // makeUpdatePlotRowPlots
	  refreshPlotRowHeight: function refreshPlotRowHeight(plotRowBody) {
	    var plotRowHeight = positioning.helpers.findContainerSize(plotRowBody, ".plotWrapper"); // Adjust the actual height.

	    if (plotRowHeight != plotRowBody.node().offsetHeight) {
	      plotRowBody.style("height", plotRowHeight + "px");
	    }
	  },
	  // refreshPlotRowHeight
	  refreshPlotRowWidth: function refreshPlotRowWidth(plotRowBody) {
	    // Adjust all plots to the new grid.
	    var dy = positioning.dy(plotRowBody);
	    var dx = positioning.dx(plotRowBody);
	    plotRowBody.selectAll(".plotWrapper").style("left", function (d) {
	      return d.graphic.format.parent.offsetLeft + d.graphic.format.position.ix * dx + "px";
	    }).style("top", function (d) {
	      return d.graphic.format.parent.offsetTop + d.graphic.format.position.iy * dy + "px";
	    }).style("width", function (d) {
	      return d.graphic.format.position.iw * dx + "px";
	    }).style("height", function (d) {
	      return d.graphic.format.position.ih * dy + "px";
	    });
	  },
	  // refreshPlotRowWidth
	  // The basic APP interactivity.
	  interactivity: {
	    removePlotRow: function removePlotRow(clickedobj) {
	      // Remove the plot row from view.
	      // button -> plotrowTitle -> plotRow
	      var plotRowDOM = this.parentElement.parentElement;
	      plotRowDOM.remove(); // Remove row from object

	      dbsliceData.session.plotRows = dbsliceData.session.plotRows.filter(function (rowobj) {
	        return rowobj != clickedobj;
	      }); // filter  
	      // Remove any filters that have been removed.

	      filter.remove();
	      filter.apply(); // Re-render the to update the filter

	      sessionManager.render();
	    } // removePlotRow

	  } // interactivity

	}; // builder

	var sessionManager = {
	  initialise: function initialise(session) {
	    dbsliceData.session = session; // Add in a reference to the element for ease of use.

	    dbsliceData.session.element = d3.select("#" + dbsliceData.session.elementId); // Build adds the functionality, update updates

	    builder.build.sessionHeader();
	    builder.update.sessionHeader(); // Build the body too.

	    builder.update.sessionBody();
	  },
	  // initialise
	  render: function render() {
	    var element = d3.select("#" + dbsliceData.session.elementId); // Update and build elements in particular plot rows.

	    builder.update.sessionHeader(element);
	    builder.update.sessionBody(); // Control all button and menu activity;

	    sessionManager.enableDisableAllButtons();
	  },
	  // render
	  refreshTasksInPlotRows: function refreshTasksInPlotRows() {
	    // Every file can demand it's own files, therefore we can just update them as we go, and then update the library at the end.
	    var filteredTasks = dbsliceData.data.taskDim.top(Infinity);
	    dbsliceData.session.plotRows.forEach(function (plotRowCtrl) {
	      plotRowCtrl.plots.forEach(function (plotCtrl) {
	        if (plotCtrl.view.sliceId) {
	          // If the sliceId is defined the plot is expecting on demand data.
	          var files = filteredTasks.map(function (task) {
	            return {
	              url: task[plotCtrl.view.sliceId],
	              filename: task[plotCtrl.view.sliceId]
	            };
	          }); // Import the files

	          var requestPromises = fileManager.importing.batch(plotCtrl.fileClass, files); // Launch a task upon loading completion.

	          Promise.allSettled(requestPromises).then(function (fileobjs) {
	            plotCtrl.plotFunc.updateData(plotCtrl);
	          }); // then
	        } // if

	      }); // forEach
	    }); // forEach
	  },
	  // refreshTasksInPlotRows
	  enableDisableAllButtons: function enableDisableAllButtons() {
	    // This functionality decides which buttons should be enabled.
	    var metadata = dbsliceData.data.taskDim.top(Infinity);
	    var isDataInFilter = metadata.length !== undefined && metadata.length > 0; // For the data to be loaded some records should have been assigned to the crossfilter.

	    var isDataLoaded = false;

	    if (dbsliceData.data !== undefined) {
	      isDataLoaded = dbsliceData.data.cf.size() > 0;
	    } // if
	    // GROUP 1: SESSION OPTIONS
	    // Button controlling the session options is always available!


	    document.getElementById("sessionOptionsButton").disabled = false; // "Load session" only available after some data has been loaded.
	    // Data: Replace, add, remove, Session: save, load
	    // These have to have their class changed, and the on/click event suspended!!

	    listItemEnableDisable("saveSession", true);
	    listItemEnableDisable("metadataMerging", isDataInFilter); // GROUP 2: ON DEMAND FUNCTIONALITY
	    // "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.

	    var refreshTasksButton = d3.select("#refreshTasksButton");
	    arrayEnableDisable(refreshTasksButton, isDataInFilter); // GROUP 3: ADDING/REMOVING PLOTS/ROWS
	    // "Add plot row" should be available when the data is loaded. Otherwise errors will occur while creating the apropriate menus.

	    document.getElementById("addPlotRowButton").disabled = !isDataLoaded; // "Remove plot row" should always be available.

	    var removePlotRowButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-danger");
	    arrayEnableDisable(removePlotRowButtons, true); // "Add plot" should only be available if the data is loaded.

	    var addPlotButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-success");
	    arrayEnableDisable(addPlotButtons, isDataInFilter); // "Remove plot" should always be available.

	    var removePlotButtons = d3.selectAll(".plotTitle").selectAll(".btn-danger");
	    arrayEnableDisable(removePlotButtons, true); // GROUP 4: Plot interactive controls.

	    var plotInteractionButtons = d3.selectAll(".plot").selectAll(".btn");
	    arrayEnableDisable(plotInteractionButtons, true);

	    function arrayEnableDisable(d3ButtonSelection, conditionToEnable) {
	      if (conditionToEnable) {
	        // Enable the button
	        d3ButtonSelection.each(function () {
	          this.disabled = false;
	        });
	      } else {
	        // Disable the button
	        d3ButtonSelection.each(function () {
	          this.disabled = true;
	        });
	      }
	    } // arrayEnableDisable


	    function listItemEnableDisable(elementId, conditionToEnable) {
	      var el = document.getElementById(elementId);

	      if (el) {
	        if (conditionToEnable) {
	          // Enable the button
	          el.classList.remove("disabled");
	          el.style.pointerEvents = 'auto';
	        } else {
	          // Disable the button
	          el.classList.add("disabled");
	          el.style.pointerEvents = 'none';
	        }
	      } // if

	    } // listItemEnableDisable

	  },
	  // enableDisableAllButtons
	  onSessionFileLoad: function onSessionFileLoad(fileobj) {
	    Object.assign(dbsliceData.merging, fileobj.content.merging); // The session should be applied and resolved straight away. But only if the session is defined!

	    if (fileobj.content.session) {
	      dbsliceData.session.title = fileobj.content.session.title; // Instantiate the plot rows

	      dbsliceData.session.plotRows = fileobj.content.session.plotRows.map(function (ctrl) {
	        return new plotRow(ctrl);
	      });
	    } // if


	    sessionManager.resolve.ui.dataAndSessionChange();
	  },
	  // onSessionFileLoad
	  resolve: {
	    ui: {
	      dataAndSessionChange: function dataAndSessionChange() {
	        // Update the merging.
	        dbsliceDataCreation.make(); // Update the UI

	        sessionManager.render();
	      } // dataAndSessionChange

	    } // ui

	  },
	  // resolve
	  write: function write() {
	    var contentobj = {
	      mergingInfo: dbsliceData.merging,
	      sessionInfo: {
	        title: dbsliceData.session.title,
	        plotRows: dbsliceData.session.plotRows.map(function (plotrow) {
	          return {
	            title: plotrow.title,
	            type: plotrow.type,
	            plots: plotrow.plots.map(prunePlot)
	          };
	        }) // map

	      }
	    };

	    function prunePlot(plotCtrl) {
	      // Only a few things need to be retained: yProperty, xProperty and sliceId
	      var saveCtrl = {
	        plottype: plotCtrl.plotFunc.name
	      };

	      if (plotCtrl.view.xVarOption) {
	        saveCtrl.xProperty = plotCtrl.view.xVarOption.val;
	      } // if


	      if (plotCtrl.view.yVarOption) {
	        saveCtrl.yProperty = plotCtrl.view.yVarOption.val;
	      } // if


	      if (plotCtrl.view.sliceId) {
	        saveCtrl.sliceId = plotCtrl.view.sliceId;
	      } // if


	      return saveCtrl;
	    } // prunePlot


	    return JSON.stringify(contentobj); // Write together.
	  } // write

	}; // sessionManager

	var cfDataManager = {
	  cfInit: function cfInit() {
	    // Initialise the internal data as empty. So this just gives the general structure of the internal data. The structure of 'dbsliceData' gives the general separation between files, internal data, and session.
	    var cfData = {
	      categoricalProperties: [],
	      ordinalProperties: [],
	      line2dProperties: [],
	      contour2dProperties: [],
	      cf: crossfilter([]),
	      categoricalDims: [],
	      ordinalDims: [],
	      taskDim: undefined,
	      fileDim: undefined,
	      filterSelected: [],
	      histogramSelectedRanges: [],
	      manuallySelectedTasks: [],
	      categoricalUniqueValues: {}
	    }; // cfData

	    cfData.fileDim = cfData.cf.dimension(function (d) {
	      return d.filenameId;
	    });
	    cfData.taskDim = cfData.cf.dimension(function (d) {
	      return d.taskId;
	    });
	    dbsliceData.data = cfData;
	  },
	  // cfInit
	  cfChange: function cfChange(metadata) {
	    // Handle the change to the metadata. Simply exchange all the internal data. But, I may need to retain the filter settings?
	    // Exchange the data.
	    dbsliceData.data.cf.remove();
	    dbsliceData.data.cf.add(metadata.data); // Resolve the differences between the old variables and the new variables.

	    cfDataManager.resolve.cfData.headerChange(metadata.header); // Update the color options.

	    color.settings.options = dbsliceData.data.categoricalProperties; // Push the UI to adjust to the internal change too.

	    sessionManager.resolve.ui.dataAndSessionChange();
	  },
	  // cfChange
	  resolve: {
	    // cfdata
	    cfData: {
	      headerChange: function headerChange(newHeader) {
	        var resolve = cfDataManager.resolve;
	        var cfData = dbsliceData.data; // Maybe just list them, instead of going through the switch??
	        // Go through the new header. The changes require also the crossfilter dimensions to be adjusted.

	        Object.keys(newHeader).forEach(function (key) {
	          // Find the differences for this category that need to be resolved. 'diff' has items aMinusB (in current, but not in new) and bMinusA ( in new, but not in current)
	          var diff = helpers.setDifference(cfData[key], newHeader[key]);

	          switch (key) {
	            case "categoricalProperties":
	              // Dimensions first
	              resolve.cfData.dimensions(cfData.categoricalDims, diff); // Metadata dimensions have precomputed unique values. Create these ones for new variables, and delete any unnecessary ones.

	              resolve.cfData.uniqueValues(cfData.categoricalUniqueValues, diff);
	              break;

	            case "ordinalProperties":
	              // Dimensions first
	              resolve.cfData.dimensions(cfData.ordinalDims, diff); // Data dimensions have corresponding histogram ranges. Delete unnecessary ones, and create necessary ones.

	              resolve.cfData.histogramRanges(cfData.histogramSelectedRanges, diff);
	              break;
	          } // switch
	          // Resolve the header.


	          cfData[key] = newHeader[key];
	        }); // forEach
	      },
	      // headerChange
	      dimensions: function dimensions(dims, diff) {
	        // Those in A, but not in B, must have their cf dimensions removed.
	        diff.aMinusB.forEach(function (varName) {
	          delete dims[varName];
	        }); // Those in B, but not in A, must have cf dimensions created.

	        diff.bMinusA.forEach(function (varName) {
	          var newDim = dbsliceData.data.cf.dimension(function (d) {
	            return d[varName];
	          });
	          dims[varName] = newDim;
	        });
	      },
	      // dimensions
	      uniqueValues: function uniqueValues(vals, diff) {
	        cfDataManager.resolve.cfData.attributes(vals, diff, function (varName) {
	          // Find all the unique values for a particular variable.
	          return helpers.unique(dbsliceData.data.cf.all().map(function (d) {
	            return d[varName];
	          }));
	        });
	      },
	      // uniqueValues
	      histogramRanges: function histogramRanges(vals, diff) {
	        cfDataManager.resolve.cfData.attributes(vals, diff, function (varName) {
	          // Find the max range for the histogram.
	          var tasks = dbsliceData.data.cf.all();
	          return d3.extent(tasks, function (d) {
	            return d[varName];
	          });
	        });
	      },
	      // histogramRanges
	      attributes: function attributes(vals, diff, populate) {
	        // Vals is an object of attributes that  needs to be resolved. The resolution of the attributes is given by diff. Populate is a function that states how that attribute should be populated if it's being created.
	        // Delete
	        diff.aMinusB.forEach(function (varName) {
	          delete vals[varName];
	        }); // Variables that are in 'new', but not in 'old'.

	        diff.bMinusA.forEach(function (varName) {
	          // If a populate function is defined, then create an entry, otherwise create an empty one.
	          if (populate) {
	            vals[varName] = populate(varName);
	          } else {
	            vals[varName] = [];
	          } // if

	        });
	      } // attributes

	    } // cfData

	  } // resolve

	}; // cfDataManager

	function initialise(session) {
	  // Initialise the crossfilter.
	  cfDataManager.cfInit(); // Store the app configuration and anchor.

	  dbsliceData.session = session; // Draw the rest of the app.

	  sessionManager.render(); // Add the functionality to the buttons in the header.

	  builder.makeSessionHeader();
	  addMenu.addPlotRowControls.make(d3.select("#addPlotRowButton")); // Dragging and dropping

	  var target = document.getElementById("target");
	  var merging = document.getElementById("merging-container");
	  target.ondrop = dropHandler;
	  target.ondragover = dragOverHandler;
	  merging.ondrop = dropHandler;
	  merging.ondragover = dragOverHandler;

	  function dropHandler(ev) {
	    // Prevent default behavior (Prevent file from being opened)
	    ev.preventDefault();
	    var files = [];

	    if (ev.dataTransfer.items) {
	      // Use DataTransferItemList interface to access the file(s)
	      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
	        // If dropped items aren't files, reject them
	        if (ev.dataTransfer.items[i].kind === 'file') {
	          files.push(ev.dataTransfer.items[i].getAsFile());
	        } // if

	      } // for

	    } else {
	      // Use DataTransfer interface to access the file(s)
	      files = ev.dataTransfer.files;
	    } // if


	    fileManager.importing.dragdropped(files);
	  } // dropHandler


	  function dragOverHandler(ev) {
	    // Prevent default behavior (Prevent file from being opened)
	    ev.preventDefault();
	  } // dragOverHandler

	} // initialise

	exports.initialise = initialise;

	return exports;

}({}));
