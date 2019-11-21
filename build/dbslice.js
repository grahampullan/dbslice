var dbslice = (function (exports) {
	'use strict';

	function makeNewPlot(plotData, index) {
	  var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
	  var plot = d3.select(this).append("div").attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper").attr("plottype", plotData.plotFunc.name).append("div").attr("class", "card");
	  var plotHeader = plot.append("div").attr("class", "card-header plotTitle").html(plotData.layout.title);
	  var plotBody = plot.append("div").attr("class", "plot").attr("plot-row-index", plotRowIndex).attr("plot-index", index);
	  plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout); // Listen to the changes of the plot card, and update the plot

	  $(window).resize(function () {
	    // console.log( plot.node().offsetWidth )
	    var container = d3.select(plotBody.node());
	    plotData.plotFunc.update(plotBody.node(), plotData.data, plotData.layout);
	  });
	}

	function updatePlot(plotData, index) {
	  var plot = d3.select(this); // this is the plotBody selection
	  //var plotHeader = plot.append( "div" ).attr( "class", "card-header plotTitle")
	  //	 .html( `${plotData.layout.title}` );
	  //var plotBody = plot.append( "div" ).attr( "class", "plot");

	  plotData.plotFunc.update(plot.node(), plotData.data, plotData.layout);
	}

	function _classCallCheck(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	var DbsliceData = function DbsliceData() {
	  _classCallCheck(this, DbsliceData);
	};

	var dbsliceData = new DbsliceData();

	var cfD3Histogram = {
	  name: "cfD3Histogram",
	  margin: {
	    top: 20,
	    right: 20,
	    bottom: 30,
	    left: 20
	  },
	  colour: [],
	  make: function make(element, data, layout) {
	    // First decide where to plot to.
	    var container = d3.select(element); // Setup the svg.

	    cfD3Histogram.setupSvg(container, data, layout); // Setup the interactivity of the svg.

	    cfD3Histogram.setupInteractivity(container, data); // Update the view

	    cfD3Histogram.update(element, data, layout);
	  },
	  update: function update(element, data, layout) {
	    var container = d3.select(element);
	    cfD3Histogram.setupSvg(container, data, layout);
	    var svg = container.select("svg"); // Calculate the required data.

	    var dimId = data.cfData.dataProperties.indexOf(data.xProperty);
	    var dim = data.cfData.dataDims[dimId];
	    var items = dim.top(Infinity);
	    var x = d3.scaleLinear().domain([svg.attr("xDomMin"), svg.attr("xDomMax")]).rangeRound([0, svg.attr("plotWidth")]); // The function in the histogram ensures that only a specific property is extracted from the data input to the function on the 'histogram(data)' call.

	    var histogram = d3.histogram().value(function (d) {
	      return d[data.xProperty];
	    }).domain(x.domain()).thresholds(x.ticks(20));
	    var bins = histogram(items);
	    var y = d3.scaleLinear().domain([0, d3.max(bins, function (d) {
	      return d.length;
	    })]).range([svg.attr("plotHeight"), 0]); // Handle entering/updating/removing the bars.

	    var bars = svg.select(".plotArea").selectAll("rect").data(bins);
	    bars.enter().append("rect").attr("transform", function (d) {
	      return "translate(" + x(d.x0) + "," + y(d.length) + ")";
	    }).attr("x", 1).attr("width", function (d) {
	      return x(d.x1) - x(d.x0) - 1;
	    }).attr("height", function (d) {
	      return svg.attr("plotHeight") - y(d.length);
	    }).style("fill", cfD3Histogram.colour).attr("opacity", "1");
	    bars.transition().attr("transform", function (d) {
	      return "translate(" + x(d.x0) + "," + y(d.length) + ")";
	    }).attr("x", 1).attr("width", function (d) {
	      return x(d.x1) - x(d.x0) - 1;
	    }).attr("height", function (d) {
	      return svg.attr("plotHeight") - y(d.length);
	    });
	    bars.exit().remove(); // Handle the axes.

	    var xAxis = container.select(".plotArea").select(".xAxis");

	    if (xAxis.empty()) {
	      xAxis = container.select(".plotArea").append("g").attr("class", "xAxis").attr("transform", "translate(0," + svg.attr("plotHeight") + ")").call(d3.axisBottom(x));
	      xAxis.append("text").attr("class", "xAxisLabel").attr("fill", "#000").attr("x", svg.attr("plotWidth")).attr("y", cfD3Histogram.margin.bottom).attr("text-anchor", "end").text(data.xProperty);
	    } else {
	      // If the axis is already there it might just need updating.
	      container.select(".plotArea").select(".xAxis").call(d3.axisBottom(x));
	    }
	    // The axes class holds the axes labels

	    var axes = svg.select(".plotArea").select(".axes");

	    if (axes.empty()) {
	      svg.select(".plotArea").append("g").attr("class", "axes").call(d3.axisLeft(y));
	    } else {
	      axes.transition().call(d3.axisLeft(y));
	    } // if


	    var yAxisLabel = svg.select(".plotArea").select(".axes").select(".yAxisLabel");

	    if (yAxisLabel.empty()) {
	      svg.select(".plotArea").select(".axes").append("text").attr("class", "yAxisLabel").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -25).attr("text-anchor", "end").text("Number of tasks");
	    } // if

	  },
	  // update
	  setupSvg: function setupSvg(container, data, layout) {
	    // Add the setupSvg function!!
	    // If layout has a margin specified store it as the internal property.
	    cfD3Histogram.margin = layout.margin === undefined ? cfD3Histogram.margin : layout.margin;
	    cfD3Histogram.colour = layout.colour === undefined ? "cornflowerblue" : layout.colour;
	    var svg = container.select("svg");

	    if (svg.empty()) {
	      // Append new svg
	      svg = container.append("svg"); // Update its dimensions.

	      curateSvg();
	    } else {
	      // Differentiate between changing plot types, or just changing the data!!
	      // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, is attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
	      var plotWrapper = container.select(function () {
	        return this.parentElement.parentElement;
	      });
	      var expectedPlotType = plotWrapper.attr("plottype");

	      if (expectedPlotType !== "cfD3Histogram") {
	        // If the plot type has changed, then the svg contents need to be removed completely.
	        plotWrapper.attr("plottype", "cfD3Histogram");
	        svg.selectAll("*").remove();
	        curateSvg(); // Add functionality.

	        cfD3Histogram.setupInteractivity(container, data);
	      } else {
	        // Axes might need to be updated, thus the svg element needs to be refreshed.
	        curateSvg();
	      }
	    }

	    function curateSvg() {
	      // Get plot dimensions
	      var svgWidth = container.node().offsetWidth;
	      var svgHeight = layout.height;
	      var width = svgWidth - cfD3Histogram.margin.left - cfD3Histogram.margin.right;
	      var height = svgHeight - cfD3Histogram.margin.top - cfD3Histogram.margin.bottom; // Calculation the min and max values - based on all the data, otherwise crossfilter will remove some, and the x-axis will be rescaled every time the brush adds or removes data.

	      var items = data.cfData.cf.all();
	      var xDomMin = d3.min(items, function (d) {
	        return d[data.xProperty];
	      }) * 0.9;
	      var xDomMax = d3.max(items, function (d) {
	        return d[data.xProperty];
	      }) * 1.1; // The dimId needs to be assigned here, otherwise there is confusion between the brush and the data if a hitogram plot inherits a histogram plot.

	      var dimId = data.cfData.dataProperties.indexOf(data.xProperty); // Curating the svg.				

	      container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height).attr("xDomMin", xDomMin).attr("xDomMax", xDomMax).attr("dimId", dimId);
	      var plotArea = container.select("svg").select(".plotArea");

	      if (plotArea.empty()) {
	        // If there's nonoe, add it.
	        container.select("svg").append("g").attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")").attr("class", "plotArea");
	      }
	    }
	  },
	  // setupSvg
	  setupInteractivity: function setupInteractivity(container, data) {
	    var svg = container.select("svg"); // Specify and add brush

	    var brush = d3.brushX().extent([[0, 0], [svg.attr("plotWidth"), svg.attr("plotHeight")]]).on("start brush end", brushmoved);
	    var gBrush = svg.append("g").attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")").attr("class", "brush").call(brush); // style brush resize handle
	    // https://github.com/crossfilter/crossfilter/blob/gh-pages/index.html#L466

	    var brushResizePath = function brushResizePath(d) {
	      var e = +(d.type == "e"),
	          x = e ? 1 : -1,
	          y = svg.attr("plotHeight") / 2;
	      return "M" + .5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + .5 * x + "," + 2 * y + "Z" + "M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8);
	    }; // brushResizePath


	    var handle = gBrush.selectAll("handleCustom").data([{
	      type: "w"
	    }, {
	      type: "e"
	    }]).enter().append("path").attr("class", "handleCustom").attr("stroke", "#000").attr("cursor", "ewResize").attr("d", brushResizePath);
	    var brushInit = true;
	    gBrush.call(brush.move, [0, Number(svg.attr("plotWidth"))]);
	    brushInit = false;

	    function brushmoved() {
	      // Select the positions of the brush relative to the svg. Then convert it to th actual values. Then update the filters using these values.
	      var s = d3.event.selection;
	      var sx = [];

	      if (s == null) {
	        handle.attr("display", "none");
	      } else {
	        // This scale needs to be updated here!!
	        var x = d3.scaleLinear().domain([svg.attr("xDomMin"), svg.attr("xDomMax")]).rangeRound([0, svg.attr("plotWidth")]);
	        sx = s.map(x.invert);
	        handle.attr("display", null).attr("transform", function (d, i) {
	          return "translate(" + [s[i], -svg.attr("plotHeight") / 4] + ")";
	        }); // The number controls vertical position of the brush handles.
	      }
	      // sx is a pair the min/max values of the filter.

	      data.cfData.histogramSelectedRanges[svg.attr("dimId")] = sx;
	      cfUpdateFilters(data.cfData);

	      if (brushInit == false) {
	        render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	      }
	    } // brushMoved

	  } // setupInteractivity

	}; // cfD3Histogram

	var cfD3Scatter = {
	  name: "cfD3Scatter",
	  margin: {
	    top: 20,
	    right: 20,
	    bottom: 30,
	    left: 50
	  },
	  colour: [],
	  opacity: 1,
	  make: function make(element, data, layout) {
	    // Select where the plot should go.
	    var container = d3.select(element);
	    cfD3Scatter.setupSvg(container, data, layout); // Update the plot.

	    cfD3Scatter.update(element, data, layout);
	  },
	  update: function update(element, data, layout) {
	    cfD3Scatter.setupSvg(d3.select(element), data, layout); // Selections for plotting.

	    var svg = d3.select(element).select("svg"); // Get the points data, and calculate its range.

	    var pointData = cfD3Scatter.helpers.getPointData(data);
	    var xRange_ = cfD3Scatter.helpers.getRange(svg, "x");
	    var yRange_ = cfD3Scatter.helpers.getRange(svg, "y"); // Create the scales that position the points in the svg area.

	    var xscale = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain(xRange_);
	    var yscale = d3.scaleLinear().range([svg.attr("plotHeight"), 0]).domain(yRange_); // Handle entering/updating/removing points.

	    var points = svg.select(".plotArea").selectAll("circle").data(pointData);
	    points.enter().append("circle").attr("r", 5).attr("cx", function (d) {
	      return xscale(d[data.xProperty]);
	    }).attr("cy", function (d) {
	      return yscale(d[data.yProperty]);
	    }).style("fill", function (d) {
	      return returnPointColor(d, data.cProperty);
	    }).style("opacity", cfD3Scatter.opacity).attr("clip-path", "url(#" + svg.select("clipPath").attr("id") + ")").attr("task-id", function (d) {
	      return d.taskId;
	    });
	    points.attr("r", 5).attr("cx", function (d) {
	      return xscale(d[data.xProperty]);
	    }).attr("cy", function (d) {
	      return yscale(d[data.yProperty]);
	    }).style("fill", function (d) {
	      return returnPointColor(d, data.cProperty);
	    }).attr("task-id", function (d) {
	      return d.taskId;
	    });
	    points.exit().remove(); // Plot the axes

	    createAxes(); // ADD INTERACTIVITY
	    // Add the tooltip interactivity

	    cfD3Scatter.addInteractivity.addTooltip(svg); // Add zooming.

	    cfD3Scatter.addInteractivity.addZooming(svg, data); // HELPER FUNCTIONS

	    function returnPointColor(d, cProperty) {
	      var pointColor = [];

	      if (cProperty !== undefined) {
	        pointColor = cfD3Scatter.colour(d[cProperty]);
	      } else {
	        pointColor = cfD3Scatter.colour(1);
	      }
	      return pointColor;
	    }

	    function createAxes() {
	      // Something with the axis?
	      var xAxis = d3.axisBottom(xscale);
	      var yAxis = d3.axisLeft(yscale);
	      var xAxisContainer = svg.select(".plotArea").select(".axis--x");

	      if (xAxisContainer.empty()) {
	        xAxisContainer = svg.select(".plotArea").append("g").attr("transform", "translate(0," + svg.attr("plotHeight") + ")").attr("class", "axis--x").call(xAxis);
	        xAxisContainer.append("text").attr("fill", "#000").attr("x", svg.attr("plotWidth")).attr("y", cfD3Scatter.margin.bottom - 2).attr("text-anchor", "end").text(data.xProperty);
	      } else {
	        xAxisContainer.transition().call(xAxis);
	      }

	      var yAxisContainer = svg.select(".plotArea").select(".axis--y");

	      if (yAxisContainer.empty()) {
	        yAxisContainer = svg.select(".plotArea").append("g").attr("class", "axis--y").call(yAxis);
	        yAxisContainer.append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -cfD3Scatter.margin.left + 15).attr("text-anchor", "end").text(data.yProperty);
	      } else {
	        yAxisContainer.transition().call(yAxis);
	      }
	    }
	  },
	  // update
	  setupSvg: function setupSvg(container, data, layout) {
	    // Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
	    // If layout has a margin specified store it as the internal property.
	    var margin = cfD3Scatter.margin;
	    margin = layout.margin === undefined ? cfD3Scatter.margin : layout.margin; // Set either the default colour, or the user selected one

	    cfD3Scatter.colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap); // Here the color domain is defined. If a cProperty is specified this is ok,
	    // but if it isn't it can cause trouble!

	    if (data.cProperty !== undefined) {
	      cfD3Scatter.colour.domain(data.cfData.metaDataUniqueValues[data.cProperty]);
	    } else {
	      cfD3Scatter.colour.domain([1]);
	    }
	    // Same for opacity

	    var opacity = cfD3Scatter.opacity;
	    opacity = opacity = layout.opacity === undefined ? 1.0 : layout.opacity;
	    var svg = container.select("svg");

	    if (svg.empty()) {
	      // Append new svg
	      svg = container.append("svg"); // Update its dimensions.

	      curateSvg();
	    } else {
	      // Differentiate between changing plot types, or just changing the data!!
	      // If just the data is changing nothing needs to be done here, whereas if the plot type is changing this function needs to remove anything it does not need!
	      var plotWrapper = container.select(function () {
	        return this.parentElement.parentElement;
	      });
	      var expectedPlotType = plotWrapper.attr("plottype");

	      if (expectedPlotType !== "cfD3Scatter") {
	        // If the plot type has changed, then the svg contents need to be removed completely.
	        plotWrapper.attr("plottype", "cfD3Scatter");
	        svg.selectAll("*").remove();
	        curateSvg(); // The interactivity is added in the main update function!
	      } else {
	        // The plot is being inherited by another scatter plot. Just update the plot.
	        curateSvg();
	      }
	    }

	    function curateSvg() {
	      var svgWidth = container.node().offsetWidth;
	      var svgHeight = layout.height;
	      var width = svgWidth - margin.left - margin.right;
	      var height = svgHeight - margin.top - margin.bottom;
	      var pointData = cfD3Scatter.helpers.getPointData(data);
	      var xRange = layout.xRange === undefined ? cfD3Scatter.helpers.calculateRange(pointData, data.xProperty) : layout.xRange;
	      var yRange = layout.yRange === undefined ? cfD3Scatter.helpers.calculateRange(pointData, data.yProperty) : layout.yRange;
	      container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height).attr("xDomMin", xRange[0]).attr("xDomMax", xRange[1]).attr("yDomMin", yRange[0]).attr("yDomMax", yRange[1]);
	      var plotArea = container.select("svg").select(".plotArea");

	      if (plotArea.empty()) {
	        container.select("svg").append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");
	      }
	      // Add a clipPath: everything out of this area won't be drawn.

	      var clipId = "clip-" + container.attr("plot-row-index") + "-" + container.attr("plot-index");
	      var clip = container.select("svg").select("clipPath");

	      if (clip.empty()) {
	        container.select("svg").append("clipPath").attr("id", clipId).append("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
	      } else {
	        clip.select("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
	      }
	    }
	  },
	  // setupSvg
	  addInteractivity: {
	    addTooltip: function addTooltip(svg) {
	      // This controls al the tooltip functionality.
	      var points = svg.selectAll("circle");
	      points.on("mouseover", tipOn).on("mouseout", tipOff); // Do the tooltip

	      var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) {
	        return "<span>" + d.label + "</span>";
	      });
	      svg.call(tip);

	      function tipOn(d) {
	        points.style("opacity", 0.2);
	        d3.select(this).style("opacity", 1.0).attr("r", 7);
	        tip.show(d);
	      }

	      function tipOff() {
	        points.style("opacity", cfD3Scatter.opacity);
	        d3.select(this).attr("r", 5);
	        tip.hide();
	      }
	    },
	    // addTooltip
	    addZooming: function addZooming(svg, data) {
	      var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
	      svg.transition().call(zoom.transform, d3.zoomIdentity);
	      svg.call(zoom);

	      function zoomed() {
	        var t = d3.event.transform; // Get the domains:

	        var xRange = cfD3Scatter.helpers.getRange(svg, "x");
	        var yRange = cfD3Scatter.helpers.getRange(svg, "y"); // Recreate original scales.

	        var xscale = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain(xRange);
	        var yscale = d3.scaleLinear().range([svg.attr("plotHeight"), 0]).domain(yRange); // Create new axes based on the zoom, which altered the domain.
	        // d3.event.transform.rescaleX(xScale2).domain() to get the exact input of the location showing in the zooming aera and brush area.

	        var newXRange = t.rescaleX(xscale).domain();
	        var newYRange = t.rescaleY(yscale).domain(); // Create new scales in the zoomed area.

	        xscale.domain(newXRange);
	        yscale.domain(newYRange); // Redo the axes.

	        svg.select(".plotArea").select(".axis--x").call(d3.axisBottom(xscale));
	        svg.select(".plotArea").select(".axis--y").call(d3.axisLeft(yscale)); // Reposition all dots

	        svg.select(".plotArea").selectAll("circle").attr("cx", function (d) {
	          return xscale(d[data.xProperty]);
	        }).attr("cy", function (d) {
	          return yscale(d[data.yProperty]);
	        });
	      }
	    } // addZooming

	  },
	  // addInteractivity
	  helpers: {
	    getPointData: function getPointData(data) {
	      // "dim" is a crossfilter.dimension(). It is the functionality that allows the user to perform specific filtering and grouping operations, two of which are "top(n)", and "bottom(n)", which return n top and bottom most elements along the chosen dimension. The returned elements are full data rows!
	      // The functionality to select specific dimensions has been pushed to the plotting functions, as the data manipulation occurs here.
	      var dimId = data.cfData.dataProperties.indexOf(data.xProperty);
	      var dim = data.cfData.dataDims[dimId];
	      var pointData = dim.top(Infinity);
	      return pointData;
	    },
	    // getPointData
	    calculateRange: function calculateRange(p, property) {
	      var pMin = d3.min(p, function (d) {
	        return d[property];
	      });
	      var pMax = d3.max(p, function (d) {
	        return d[property];
	      });
	      var pDiff = pMax - pMin;
	      pMin -= 0.1 * pDiff;
	      pMax += 0.1 * pDiff;
	      var range = [pMin, pMax];
	      return range;
	    },
	    // calculateRange
	    getRange: function getRange(svg, dimName) {
	      var domMin = Number(svg.attr(dimName + "DomMin"));
	      var domMax = Number(svg.attr(dimName + "DomMax"));
	      return [domMin, domMax];
	    } // getRange

	  } // helpers

	}; // cfD3Scatter

	function createAddPlotControls(buttonId) {
	  // This function creates unique ids for the elements it creates based on the "buttonId" element they belong to.
	  var menuContainerId = buttonId + "MenuContainer";
	  var plotSelectionMenuId = menuContainerId + "PlotSelectionMenu";
	  var xPropertyMenuId = menuContainerId + "xPropertyMenu";
	  var yPropertyMenuId = menuContainerId + "yPropertyMenu"; // CREATE THE CONTAINER FOR THE MENU IN THE BUTTONS CONTAINER.

	  var buttonElement = d3.select("#" + buttonId);
	  var menuContainer = d3.select(buttonElement.node().parentNode).append("div").attr("id", menuContainerId).attr("ownerButton", buttonId).attr("class", "card ui-draggable-handle");
	  $("#" + menuContainerId).hide(); // First declare the available options.
	  // BAR: metaDataProperties
	  // HISTOGRAM: dataProperties
	  // SCATTER: dataProperties
	  // INTERNAL CONFIG OBJECTS:
	  // The config object needs to be created for the dbslice renderer. The 'colWidth' and 'height' are hardcoded to limit the amount of options.
	  // FOR NOW THE APP NEEDS TO BE INITIALISED WITH THE DATA IN A SESSION OBJECT!

	  var cfData = dbsliceData.session.plotRows[0].plots[0].data.cfData;
	  var newPlot = {
	    plotFunc: "undefined",
	    layout: {
	      title: undefined,
	      colWidth: 4,
	      height: 300
	    },
	    data: {
	      cfData: cfData,
	      xProperty: undefined,
	      yProperty: undefined,
	      cProperty: undefined
	    }
	  }; // This array is hard-coded as it depends on the code functionality available.

	  var plotFuncOptionsArray = [{
	    val: "undefined",
	    text: " "
	  }, {
	    val: "cfD3BarChart",
	    text: 'Bar Chart'
	  }, {
	    val: "cfD3Scatter",
	    text: 'Scatter'
	  }, {
	    val: "cfD3Histogram",
	    text: 'Histogram'
	  }]; // Categorical variables must have a val and text.

	  var categoricalVariables = [{
	    val: "undefined",
	    text: " "
	  }];

	  for (var i = 0; i < cfData.metaDataProperties.length; i++) {
	    categoricalVariables.push({
	      val: cfData.metaDataProperties[i],
	      text: cfData.metaDataProperties[i]
	    });
	  }

	  var continuousVariables = [{
	    val: "undefined",
	    text: " "
	  }];

	  for (var i = 0; i < cfData.dataProperties.length; i++) {
	    continuousVariables.push({
	      val: cfData.dataProperties[i],
	      text: cfData.dataProperties[i]
	    });
	  }
	  // The container for the menu is specified only here!!

	  var dropDownMenuData = {
	    title: "Add new plot menu",
	    containerId: menuContainerId,
	    menuItems: [{
	      options: plotFuncOptionsArray,
	      label: "Select plot type",
	      id: plotSelectionMenuId
	    }]
	  };

	  function updateMenus() {
	    // This function updates the menu of the pop-up window.
	    var d = dropDownMenuData; // MENUS
	    // Assign the data.

	    var menus = d3.select("#" + d.containerId).selectAll(".selectmenu").data(d.menuItems); // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.

	    menus.enter().append("label").attr("class", "selectmenuLabel").text(function (d) {
	      return d.label;
	    }).append("select").attr("class", "selectmenu").attr("id", function (d) {
	      return d.id;
	    }); // Update all the menu elements.

	    d3.select("#" + d.containerId).selectAll(".selectmenu").data(d.menuItems).each(function (d) {
	      // This function handles the updating of the menu options for each 'select' element.
	      // Select the 'option' elements and use d3 to update them.
	      var options = d3.select(this).selectAll("option").data(d.options);
	      options.enter().append("option").text(function (d) {
	        return d.text;
	      }).attr("value", function (d) {
	        return d.val;
	      });
	      options = d3.select(this).selectAll("option").data(d.options);
	      options.attr("value", function (d) {
	        return d.val;
	      }).text(function (d) {
	        return d.text;
	      }); // Remove redundant entries.

	      options.exit().remove();
	    }); // d3.select ... each
	    // Remove exiting menus.

	    menus.exit().remove(); // LABELS
	    // Label creation is handled in the creation of the menus. Removal takes place here.

	    var labels = d3.select("#" + d.containerId).selectAll(".selectmenuLabel").data(d.menuItems);
	    labels.exit().remove(); // Add the event assignment handling for variable menus. These do not have effects that ripple down, and can be implemented here.

	    d3.select("#" + xPropertyMenuId).on("change", function () {
	      // Merely populate the 'newPlot' object.
	      var selectedVariable = $(this).val();
	      newPlot.data.xProperty = selectedVariable;
	      newPlot.layout.title = selectedVariable;
	      enableDisableSubmitButton();
	    });
	    d3.select("#" + yPropertyMenuId).on("change", function () {
	      // Merely populate the 'newPlot' object.
	      var selectedVariable = $(this).val();
	      newPlot.data.yProperty = selectedVariable;
	      newPlot.layout.title = selectedVariable;
	      enableDisableSubmitButton();
	    });
	    enableDisableSubmitButton();
	  }
	  // Create the initial menu.

	  updateMenus(); // Event assignment needs to be done outside of the main menus update loop because they do other specific things. Although this could be included in the config?
	  // This one essentially monitors everything, and the others just update some properties of the config object?

	  function addUpdateMenuItemObject(menuItemId, variables) {
	    var menuItems = dropDownMenuData.menuItems; // Check if the config object already has an item with the 'xPropertyMenu' id.

	    var requiredItem = menuItems.find(function (x) {
	      return x.id === menuItemId;
	    });
	    var doesItemExist = requiredItem !== undefined;

	    if (doesItemExist) {
	      // If the item exists, just update it.
	      var index = menuItems.map(function (d) {
	        return d.id;
	      }).indexOf(menuItemId);
	      dropDownMenuData.menuItems[index].options = variables;
	    } else {
	      // If it doesn't, create a new one.
	      requiredItem = {
	        options: variables,
	        label: "Select variable",
	        id: menuItemId
	      };
	      dropDownMenuData.menuItems.push(requiredItem);
	    }
	  }

	  function removeMenuItemObject(menuItemId) {
	    var menuItems = dropDownMenuData.menuItems;
	    var index = dropDownMenuData.menuItems.map(function (d) {
	      return d.id;
	    }).indexOf(menuItemId);

	    if (index > -1) {
	      menuItems.splice(index, 1);
	    }
	    dropDownMenuData.menuItems = menuItems;
	  }

	  function clearNewPlot() {
	    newPlot.plotFunc = undefined;
	    newPlot.layout.title = undefined;
	    newPlot.data.xProperty = undefined;
	    newPlot.data.yProperty = undefined;
	  }

	  function resetVariableMenuSelections() {
	    var xPropertyMenuHandle = document.getElementById(xPropertyMenuId);

	    if (xPropertyMenuHandle !== null) {
	      xPropertyMenuHandle.value = undefined;
	    }
	    var yPropertyMenuHandle = document.getElementById(yPropertyMenuId);

	    if (yPropertyMenuHandle !== null) {
	      yPropertyMenuHandle.value = undefined;
	    }
	  }

	  function enableDisableSubmitButton() {
	    var selectedPlotType = $("#" + plotSelectionMenuId).val();

	    switch (selectedPlotType) {
	      case "undefined":
	        // Disable
	        $("#" + menuOkButtonId).prop("disabled", true);
	        break;

	      case "cfD3BarChart":
	        // xProperty enabled, yProperty disabled.
	        var isConfigValid = newPlot.data.xProperty !== undefined && newPlot.data.yProperty === undefined;

	        if (isConfigValid) {
	          $("#" + menuOkButtonId).prop("disabled", false);
	        }
	        break;

	      case "cfD3Histogram":
	        // xProperty enabled, yProperty disabled.
	        var isConfigValid = newPlot.data.xProperty !== undefined && newPlot.data.yProperty === undefined;

	        if (isConfigValid) {
	          $("#" + menuOkButtonId).prop("disabled", false);
	        }
	        break;

	      case "cfD3Scatter":
	        // xProperty enabled, yProperty  enabled.
	        var isConfigValid = newPlot.data.xProperty !== undefined && newPlot.data.yProperty !== undefined;

	        if (isConfigValid) {
	          $("#" + menuOkButtonId).prop("disabled", false);
	        }
	        break;

	      default:
	        // Disable
	        $("#" + menuOkButtonId).prop("disabled", true);
	        break;
	    }
	  }

	  d3.select("#" + plotSelectionMenuId).on("change", function () {
	    // Use the same switch to populate the appropriate properties in the 'newPlot' object, and to allow further selections.
	    var selectedPlotType = $(this).val();

	    switch (selectedPlotType) {
	      case "undefined":
	        // Update plot type selection.
	        clearNewPlot(); // Remove all variable options.

	        removeMenuItemObject(xPropertyMenuId);
	        removeMenuItemObject(yPropertyMenuId);
	        break;

	      case "cfD3BarChart":
	        // One variable menu - categorical
	        newPlot.plotFunc = cfD3BarChart; // xProperty required.

	        addUpdateMenuItemObject(xPropertyMenuId, categoricalVariables); // yProperty must not be present.

	        removeMenuItemObject(yPropertyMenuId);
	        break;

	      case "cfD3Histogram":
	        // One variable menu - normative
	        newPlot.plotFunc = cfD3Histogram; // xProperty required.

	        addUpdateMenuItemObject(xPropertyMenuId, continuousVariables); // yProperty must not be present.

	        removeMenuItemObject(yPropertyMenuId);
	        break;

	      case "cfD3Scatter":
	        // Two variables menu - normative
	        newPlot.plotFunc = cfD3Scatter; // xProperty and yProperty required.

	        addUpdateMenuItemObject(xPropertyMenuId, continuousVariables);
	        addUpdateMenuItemObject(yPropertyMenuId, continuousVariables);
	        break;

	      default:
	        // Update plot type selection.
	        clearNewPlot(); // Remove all variable options.

	        removeMenuItemObject(xPropertyMenuId);
	        removeMenuItemObject(yPropertyMenuId);
	        console.log("Unexpected plot type selected:", selectedPlotType);
	        break;
	    }
	    // Update.

	    updateMenus(); // Since there was a change in the plot type reset the variable selection menus.

	    resetVariableMenuSelections();
	  }); // d3.select("#" + plotSelectionMenuId).on("change"
	  // Functionality on OK. This should be disabled until the appropriate selections are made.

	  function submitNewPlot(ownerPlotRowIndex) {
	    // Reset the variable menu selections!
	    resetVariableMenuSelections(); // Reset the plot type menu selection.

	    document.getElementById(plotSelectionMenuId).value = "undefined"; // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.

	    var plotToPush = {
	      plotFunc: newPlot.plotFunc,
	      layout: {
	        title: newPlot.layout.title,
	        colWidth: newPlot.layout.colWidth,
	        height: newPlot.layout.height
	      },
	      data: {
	        cfData: newPlot.data.cfData,
	        xProperty: newPlot.data.xProperty,
	        yProperty: newPlot.data.yProperty,
	        cProperty: newPlot.data.cProperty
	      }
	    }; // Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
	    // var plotRowIndex = d3.select(this).attr("plot-row-index")
	    // console.log(element)

	    dbsliceData.session.plotRows[ownerPlotRowIndex].plots.push(plotToPush); // Redraw the screen.

	    update(dbsliceData.elementId, dbsliceData.session); // Clear newPlot to be ready for the next addition.

	    clearNewPlot();
	  }
	  // Functionality on cancel. This should clean up the config object.

	  function cancelNewPlot() {
	    clearNewPlot(); // console.log(newPlot);
	    // Reset the menu selection!

	    resetVariableMenuSelections();
	  }
	  // Add functionality for on button click: show the dialog.
	  // NOTE: "draggable: false", and the trailing parent().draggable() were added to make the whole dialog draggable, instead of just the titel.

	  var menuOkButtonId = menuContainerId + "DialogButtonOk";
	  var menuCancelButtonId = menuContainerId + "DialogButtonCancel";
	  $("#" + buttonId).click(function () {
	    $("#" + menuContainerId).dialog({
	      draggable: false,
	      autoOpen: true,
	      modal: true,
	      buttons: {
	        "Ok": {
	          text: "Ok",
	          id: menuOkButtonId,
	          click: function click() {
	            // Find which button this menu belongs to.
	            var ownerElement = this.getAttribute("ownerButton"); // Find the index of the plotRow the button belongs to.

	            var ownerPlotRowIndex = $("#" + ownerElement)[0].parentElement.parentElement.getAttribute("plot-row-index"); // Submit the new plot into the owner plot row.

	            submitNewPlot(ownerPlotRowIndex); // Close the dialogue.

	            $(this).dialog("close");
	          },
	          disabled: true
	        },
	        "Cancel": {
	          text: "Cancel",
	          id: menuCancelButtonId,
	          click: function click() {
	            cancelNewPlot();
	            $(this).dialog("close");
	          }
	        }
	      },
	      show: {
	        effect: "fade",
	        duration: 50
	      },
	      hide: {
	        effect: "fade",
	        duration: 50
	      }
	    }).parent().draggable();
	    $(".ui-dialog-titlebar").remove();
	    $(".ui-dialog-buttonpane").attr("class", "card");
	  }); // $("#" + buttonId).click(function()
	}

	function update(elementId, session) {
	  var element = d3.select("#" + elementId);

	  if (dbsliceData.filteredTaskIds !== undefined) {
	    element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>");
	  } else {
	    element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
	  }

	  var plotRows = element.selectAll(".plotRow").data(session.plotRows);
	  var newPlotRows = plotRows.enter().append("div").attr("class", "card bg-light plotRow").attr("style", "margin-bottom:20px").attr("plot-row-index", function (d, i) {
	    return i;
	  }); // Add in the container for the title of the plotting section.

	  var newPlotRowsHeader = newPlotRows.append("div").attr("class", "card-header plotRowTitle");
	  newPlotRowsHeader.append("h3").attr("style", "display:inline").html(function (data) {
	    return data.title;
	  }); // Add button.

	  newPlotRowsHeader.each(function (data) {
	    if (data.headerButton !== undefined) {
	      // If a button is defined, add it in.
	      d3.select(this).append("button").attr("id", data.headerButton.id).attr("class", "btn btn-success float-right").html(data.headerButton.label); // Add functionality

	      createAddPlotControls(data.headerButton.id);
	    }
	  }); // each
	  // Give all entering plot rows a body to hold the plots.

	  var newPlotRowsBody = newPlotRows.append("div").attr("class", "row no-gutters plotRowBody").attr("plot-row-index", function (d, i) {
	    return i;
	  }); // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.

	  var newPlots = newPlotRowsBody.selectAll(".plot").data(function (d) {
	    return d.plots;
	  }).enter().each(makeNewPlot); // Based on the existing plotRowBodies, select all the plots in them, retrieve all the plotting data associated with this particular plot row, and assign it to the plots in the row. Then make any entering ones.

	  plotRows.selectAll(".plotRowBody").selectAll(".plot").data(function (d) {
	    return d.plots;
	  }).enter().each(makeNewPlot); // Update the previously existing plots.

	  var plotRowPlots = plotRows.selectAll(".plot").data(function (d) {
	    return d.plots;
	  }).each(updatePlot); // This updates the headers of the plots because the titles might have changed.

	  var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper").data(function (d) {
	    return d.plots;
	  }).each(function (plotData, index) {
	    var plotWrapper = d3.select(this);
	    var plotTitle = plotWrapper.select(".plotTitle").html(plotData.layout.title);
	  }); // each
	  // Handle the button functionality completely separately!! Select all the plot rows. Move through them, and for each of them add the buttons in the plotTitle elements. Then add the functionality.

	  var allPlotRows = element.selectAll(".plotRow");
	  allPlotRows.each(function (d, i) {
	    // This function operates on a plot row instance. It selects all the plots, and adds a button and its functionality to it.
	    var plotRowIndex = i;
	    var allPlotTitles = d3.select(this).selectAll(".plotTitle");
	    allPlotTitles.each(function (d, i) {
	      // Append the button, and its functionality.
	      d3.select(this).append("button").attr("class", "btn btn-danger float-right").html("x").on("click", function () {
	        // This function recalls the position of the data it corresponds to, and subsequently deletes that entry.
	        var plotIndex = i;
	        dbsliceData.session.plotRows[plotRowIndex].plots.splice(plotIndex, 1);
	        update(dbsliceData.elementId, dbsliceData.session);
	      }); // on
	    }); // each 
	  }); // each

	  plotRows.exit().remove();
	  plotRowPlotWrappers.exit().remove();
	}

	function makePlotsFromPlotRowCtrl(ctrl) {
	  var plotPromises = [];

	  if (ctrl.sliceIds === undefined) {
	    var nTasks = ctrl.taskIds.length;
	    if (ctrl.maxTasks !== undefined) nTasks = Math.min(nTasks, ctrl.maxTasks);

	    for (var index = 0; index < nTasks; ++index) {
	      if (ctrl.urlTemplate == null) {
	        var url = ctrl.taskIds[index];
	      } else {
	        var url = ctrl.urlTemplate.replace("${taskId}", ctrl.taskIds[index]);
	      }

	      var title = ctrl.taskLabels[index];
	      var plotPromise = makePromiseTaskPlot(ctrl, url, title, ctrl.taskIds[index]);
	      plotPromises.push(plotPromise);
	    }
	  } else {
	    ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {
	      var plotPromise = makePromiseSlicePlot(ctrl, sliceId, sliceIndex);
	      plotPromises.push(plotPromise);
	    });
	  }

	  return Promise.all(plotPromises);
	}

	function makePromiseTaskPlot(ctrl, url, title, taskId) {
	  return fetch(url).then(function (response) {
	    if (ctrl.csv === undefined) {
	      return response.json();
	    }

	    if (ctrl.csv == true) {
	      return response.text();
	    }
	  }).then(function (responseJson) {
	    if (ctrl.csv == true) {
	      responseJson = d3.csvParse(responseJson);
	    }
	    var plot = {};

	    if (ctrl.formatDataFunc !== undefined) {
	      plot.data = ctrl.formatDataFunc(responseJson, taskId);
	    } else {
	      plot.data = responseJson;
	    }

	    plot.layout = Object.assign({}, ctrl.layout);
	    plot.plotFunc = ctrl.plotFunc;
	    plot.layout.title = title;
	    plot.data.newData = true;
	    return plot;
	  });
	} // makePromiseTaskPlot


	function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
	  var slicePromisesPerPlot = [];
	  var tasksOnPlot = [];
	  var nTasks = ctrl.taskIds.length;
	  if (ctrl.maxTasks !== undefined) Math.min(nTasks, ctrl.maxTasks);

	  for (var index = 0; index < nTasks; ++index) {
	    tasksOnPlot.push(ctrl.taskIds[index]);
	    var url = ctrl.urlTemplate.replace("${taskId}", ctrl.taskIds[index]).replace("${sliceId}", sliceId); //console.log(url);

	    var slicePromise = fetch(url).then(function (response) {
	      if (ctrl.csv === undefined) {
	        return response.json();
	      }

	      if (ctrl.csv == true) {
	        return response.text();
	      }
	    });
	    slicePromisesPerPlot.push(slicePromise);
	  } // for


	  return Promise.all(slicePromisesPerPlot).then(function (responseJson) {
	    if (ctrl.csv == true) {
	      var responseCsv = [];
	      responseJson.forEach(function (d) {
	        responseCsv.push(d3.csvParse(d));
	      });
	      responseJson = responseCsv;
	    }

	    var plot = {};

	    if (ctrl.formatDataFunc !== undefined) {
	      plot.data = ctrl.formatDataFunc(responseJson, tasksOnPlot);
	    } else {
	      plot.data = responseJson;
	    }

	    plot.layout = Object.assign({}, ctrl.layout);

	    if (ctrl.layout.xRange !== undefined) {
	      if (ctrl.layout.xRange[1].length !== undefined) {
	        plot.layout.xRange = ctrl.layout.xRange[sliceIndex];
	      }
	    }

	    if (ctrl.layout.yRange !== undefined) {
	      if (ctrl.layout.yRange[1].length !== undefined) {
	        plot.layout.yRange = ctrl.layout.yRange[sliceIndex];
	      }
	    }

	    plot.plotFunc = ctrl.plotFunc;
	    plot.layout.title = sliceId;
	    plot.data.newData = true;
	    return plot;
	  });
	}

	function refreshTasksInPlotRows() {
	  var plotRows = dbsliceData.session.plotRows;
	  var plotRowPromises = [];
	  plotRows.forEach(function (plotRow) {
	    if (plotRow.ctrl !== undefined) {
	      var ctrl = plotRow.ctrl;

	      if (ctrl.plotFunc !== undefined) {
	        if (ctrl.tasksByFilter) {
	          ctrl.taskIds = dbsliceData.filteredTaskIds;
	          ctrl.taskLabels = dbsliceData.filteredTaskLabels;
	        }

	        if (ctrl.tasksByList) {
	          ctrl.taskIds = dbsliceData.manualListTaskIds;
	        }

	        var plotRowPromise = makePlotsFromPlotRowCtrl(ctrl).then(function (plots) {
	          plotRow.plots = plots;
	        });
	        plotRowPromises.push(plotRowPromise);
	      }
	    }
	  });
	  Promise.all(plotRowPromises).then(function () {
	    //console.log("rendering....");
	    update(dbsliceData.elementId, dbsliceData.session);
	  });
	}

	function makeSessionHeader(element, title, subtitle, config) {
	  element.append("div").attr("class", "row sessionHeader").append("div").attr("class", "col-md-12 sessionTitle");
	  var titleHtml = "<br/><h1 style='display:inline'>" + title + "</h1>";

	  if (config.plotTasksButton) {
	    titleHtml += "<button class='btn btn-success float-right' id='refreshTasks'>Plot Selected Tasks</button><br/>";
	  } else {
	    titleHtml += "<br/>";
	  }

	  if (subtitle === undefined) {
	    titleHtml += "<br/>";
	  } else {
	    titleHtml += "<p>" + subtitle + "</p>";
	  }

	  element.select(".sessionTitle").html(titleHtml).append("div").attr("class", "filteredTaskCount");
	  $("#refreshTasks").on("click", function () {
	    refreshTasksInPlotRows();
	  });
	}

	function render(elementId, session) {
	  var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
	    plotTasksButton: false
	  };
	  dbsliceData.session = session;
	  dbsliceData.elementId = elementId;
	  dbsliceData.config = config;
	  var element = d3.select("#" + elementId);
	  var sessionHeader = element.select(".sessionHeader");

	  if (sessionHeader.empty()) {
	    makeSessionHeader(element, session.title, session.subtitle, config);
	  }
	  update(elementId, session);
	}

	function cfUpdateFilters(crossfilter) {
	  // update crossfilter with the filters selected at the bar charts
	  crossfilter.filterSelected.forEach(function (filters, i) {
	    // if the filters array is empty: ie. all are selected, then reset the dimension
	    if (filters.length === 0) {
	      //reset filter
	      crossfilter.metaDims[i].filterAll();
	    } else {
	      crossfilter.metaDims[i].filter(function (d) {
	        return filters.indexOf(d) > -1;
	      });
	    }
	  }); // forEach
	  // update crossfilter with the items selected at the histograms

	  crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
	    // first reset all filters
	    crossfilter.dataDims[i].filterAll();

	    if (selectedRange.length !== 0) {
	      crossfilter.dataDims[i].filter(function (d) {
	        return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
	      });
	    }
	  }); // forEach

	  var currentMetaData = crossfilter.metaDims[0].top(Infinity);
	  dbsliceData.filteredTaskIds = currentMetaData.map(function (d) {
	    return d.taskId;
	  });

	  if (currentMetaData[0].label !== undefined) {
	    dbsliceData.filteredTaskLabels = currentMetaData.map(function (d) {
	      return d.label;
	    });
	  } else {
	    dbsliceData.filteredTaskLabels = currentMetaData.map(function (d) {
	      return d.taskId;
	    });
	  }
	} // cfUpdateFilter

	var cfD3BarChart = {
	  name: "cfD3BarChart",
	  margin: {
	    top: 20,
	    right: 20,
	    bottom: 30,
	    left: 20
	  },
	  make: function make(element, data, layout) {
	    var container = d3.select(element);
	    cfD3BarChart.setupSvg(container, data, layout);
	    cfD3BarChart.update(element, data, layout);
	  },
	  // make
	  update: function update(element, data, layout) {
	    var container = d3.select(element); // Setup the svg

	    cfD3BarChart.setupSvg(container, data, layout); // Create some common handles.

	    var svg = container.select("svg");
	    var plotArea = svg.select(".plotArea"); // Get the data through crossfilters dimension functionality.

	    var dimId = data.cfData.metaDataProperties.indexOf(data.xProperty);
	    var group = data.cfData.metaDims[dimId].group();
	    var items = group.all(); // Remove any bars with no entries.

	    var removeZeroBar = layout.removeZeroBar === undefined ? false : layout.removeZeroBar;
	    if (removeZeroBar) items = items.filter(function (item) {
	      return item.value > 0;
	    }); // Create the x and y plotting scales.

	    var x = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain([0, d3.max(items, function (v) {
	      return v.value;
	    })]);
	    var y = d3.scaleBand().range([0, svg.attr("plotHeight")]).domain(items.map(function (d) {
	      return d.key;
	    })).padding([0.2]).align([0.5]);
	    var colour = layout.colourMap === undefined ? d3.scaleOrdinal().range(["cornflowerblue"]) : d3.scaleOrdinal(layout.colourMap);
	    colour.domain(data.cfData.metaDataUniqueValues[data.xProperty]); // Handle the entering/updating/exiting of bars.

	    var bars = plotArea.selectAll("rect").data(items, function (v) {
	      return v.key;
	    });
	    bars.enter().append("rect").on("click", function (selectedItem) {
	      // check if current filter is already active
	      if (data.cfData.filterSelected[dimId] === undefined) {
	        data.cfData.filterSelected[dimId] = [];
	      } // if


	      if (data.cfData.filterSelected[dimId].indexOf(selectedItem.key) !== -1) {
	        // Already active filter, let it remove this item from view.
	        var ind = data.cfData.filterSelected[dimId].indexOf(selectedItem.key);
	        data.cfData.filterSelected[dimId].splice(ind, 1);
	      } else {
	        // Filter not active, add the item to view.
	        data.cfData.filterSelected[dimId].push(selectedItem.key);
	      }

	      cfUpdateFilters(data.cfData); // Everything needs to b rerendered as the plots change depending on one another according to the data selection.

	      render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	    }).attr("height", y.bandwidth()).attr("y", function (v) {
	      return y(v.key);
	    }).style("fill", function (v) {
	      return colour(v.key);
	    }).transition().attr("width", function (v) {
	      return x(v.value);
	    }).attr("opacity", 1); // updating the bar chart bars

	    bars.transition().attr("width", function (v) {
	      return x(v.value);
	    }).attr("y", function (v) {
	      return y(v.key);
	    }).attr("height", y.bandwidth()).attr("opacity", function (v) {
	      // Change color if the filter has been selected.
	      // if no filters then all are selected
	      if (data.cfData.filterSelected[dimId] === undefined || data.cfData.filterSelected[dimId].length === 0) {
	        return 1;
	      } else {
	        return data.cfData.filterSelected[dimId].indexOf(v.key) === -1 ? 0.2 : 1;
	      } // if

	    });
	    bars.exit().transition().attr("width", 0).remove(); // Handle the axes.

	    var xAxis = plotArea.select(".xAxis");
	    var yAxis = plotArea.select(".yAxis");

	    if (xAxis.empty()) {
	      plotArea.append("g").attr("transform", "translate(0," + svg.attr("plotHeight") + ")").attr("class", "xAxis").call(d3.axisBottom(x)).append("text").attr("fill", "#000").attr("x", svg.attr("plotWidth")).attr("y", cfD3BarChart.margin.bottom).attr("text-anchor", "end").text("Number of Tasks");
	    } else {
	      xAxis.attr("transform", "translate(0," + svg.attr("plotHeight") + ")").transition().call(d3.axisBottom(x));
	    }

	    if (yAxis.empty()) {
	      plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(y).tickValues([]));
	    } else {
	      yAxis.transition().call(d3.axisLeft(y).tickValues([]));
	    }
	    // Add the labels to the bars

	    var keyLabels = plotArea.selectAll(".keyLabel").data(items, function (v) {
	      return v.key;
	    });
	    keyLabels.enter().append("text").attr("class", "keyLabel").attr("x", 0).attr("y", function (v) {
	      return y(v.key) + 0.5 * y.bandwidth();
	    }).attr("dx", 5).attr("dy", ".35em").attr("text-anchor", "start").text(function (v) {
	      return v.key;
	    }); // updating meta Labels

	    keyLabels.transition().attr("y", function (v) {
	      return y(v.key) + 0.5 * y.bandwidth();
	    }).text(function (v) {
	      return v.key;
	    });
	    keyLabels.exit().remove();
	  },
	  // update
	  setupSvg: function setupSvg(container, data, layout) {
	    // Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
	    // If layout has a margin specified store it as the internal property.
	    var margin = cfD3BarChart.margin;
	    margin = layout.margin === undefined ? cfD3BarChart.margin : layout.margin;
	    var svg = container.select("svg");

	    if (svg.empty()) {
	      // Append new svg.
	      svg = container.append("svg");
	      curateSvg();
	    } else {
	      // Differentiate between changing plot types, or just changing the data!!
	      // If just the data is changing nothing needs to be done here, whereas if the plot type is changing this function needs to remove anything it does not need!
	      var plotWrapper = container.select(function () {
	        return this.parentElement.parentElement;
	      });
	      var expectedPlotType = plotWrapper.attr("plottype");

	      if (expectedPlotType !== "cfD3BarChart") {
	        // If the plot type has changed, then the svg contents need to be removed completely.
	        plotWrapper.attr("plottype", "cfD3BarChart");
	        svg.selectAll("*").remove();
	        curateSvg();
	      } else {
	        curateSvg();
	      }
	    }

	    function curateSvg() {
	      var svgWidth = container.node().offsetWidth;
	      var svgHeight = layout.height;
	      var width = svgWidth - margin.left - margin.right;
	      var height = svgHeight - margin.top - margin.bottom;
	      container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");
	    }
	  } // setupSvg

	}; // cfD3BarChart

	function cfInit(metaData) {
	  // Gets called in the .html document!
	  var cfData = {};
	  cfData.metaDataProperties = metaData.header.metaDataProperties;
	  cfData.dataProperties = metaData.header.dataProperties;
	  cfData.cf = crossfilter(metaData.data);
	  cfData.metaDims = [];
	  cfData.metaDataUniqueValues = {};
	  cfData.dataDims = [];
	  cfData.filterSelected = [];
	  cfData.histogramSelectedRanges = []; // Populate the metaDims and metaDataUniqueValues.

	  cfData.metaDataProperties.forEach(function (property, i) {
	    cfData.metaDims.push(cfData.cf.dimension(function (d) {
	      return d[property];
	    }));
	    cfData.metaDataUniqueValues[property] = Array.from(new Set(metaData.data.map(function (d) {
	      return d[property];
	    })));
	  }); // forEach
	  // Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.

	  cfData.dataProperties.forEach(function (property, i) {
	    cfData.dataDims.push(cfData.cf.dimension(function (d) {
	      return d[property];
	    }));
	  }); // forEach
	  // Create a standalone array of taskIds

	  var taskIds = [];
	  metaData.data.forEach(function (task, i) {
	    taskIds.push(task.taskId);
	  });
	  dbsliceData.filteredTaskIds = taskIds; // Return the created cfData object to be assigned to individual plots.

	  return cfData;
	} // cfInit

	function getFilteredTaskIds() {
	  return dbsliceData.filteredTaskIds;
	}

	function getFilteredTaskLabels() {
	  return dbsliceData.session.filteredTaskLabels;
	}

	exports.cfD3BarChart = cfD3BarChart;
	exports.cfD3Histogram = cfD3Histogram;
	exports.cfD3Scatter = cfD3Scatter;
	exports.cfInit = cfInit;
	exports.cfUpdateFilters = cfUpdateFilters;
	exports.createAddPlotControls = createAddPlotControls;
	exports.getFilteredTaskIds = getFilteredTaskIds;
	exports.getFilteredTaskLabels = getFilteredTaskLabels;
	exports.makeNewPlot = makeNewPlot;
	exports.makePlotsFromPlotRowCtrl = makePlotsFromPlotRowCtrl;
	exports.makeSessionHeader = makeSessionHeader;
	exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
	exports.render = render;
	exports.update = update;
	exports.updatePlot = updatePlot;

	return exports;

}({}));
