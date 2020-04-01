var dbslice = (function (exports) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  var DbsliceData = function DbsliceData() {
    _classCallCheck(this, DbsliceData);
  };

  var dbsliceData = new DbsliceData();

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

      for (var i = 0; i < dbsliceData.session.plotRows.length; i++) {
        var plotRow = dbsliceData.session.plotRows[i];
        var plotRowDOM = $(".plotRow")[i]; // If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.

        d3.select(plotRowDOM).selectAll(".plotArea").each(function (plot, i) {
          var plotDOM = this; // First all the elements need to be unhiglighted.

          crossPlotHighlighting.helpers.unHighlightAll(plotDOM, plot); // Now highlight the needed datapoints.
          allDataPoints.forEach(function (d) {
            crossPlotHighlighting.helpers.highlightDataPoint(plotDOM, plot, d);
          }); // forEach
        }); // each
      }
    },
    // on
    off: function off(d, sourcePlotName) {
      for (var i = 0; i < dbsliceData.session.plotRows.length; i++) {
        var plotRow = dbsliceData.session.plotRows[i];
        var plotRowDOM = $(".plotRow")[i]; // If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.

        d3.select(plotRowDOM).selectAll(".plotArea").each(function (plot, i) {
          crossPlotHighlighting.helpers.setDefaultStyle(this, plot);
        }); // each
      }
    },
    // off
    helpers: {
      unHighlightAll: function unHighlightAll(element, plot) {
        // This function highlights all elments in the plot corresponding to the 'plot' data object.
        switch (plot.plotFunc.name) {
          case "cfD3Scatter":
            // Collect the appropriate circles, and change their style.
            // Find all the circles, and set them to appropriate values.
            d3.select(element).selectAll("circle").style("opacity", 0.2);
            break;

          case "cfD3BarChart":
            // Find the appropriate rects, and change their border stroke.
            d3.select(element).selectAll("rect").attr("stroke", "none").attr("stroke-width", 3);
            break;

          case "cfD3Histogram":
            // Set opacity of bars to 0.2.
            d3.select(element).selectAll("rect").attr("opacity", 0.2);
            break;

          case "d3LineSeriesRrd":
            // Find all the lines, and set them to appropriate values.
            d3.select(element).selectAll(".line").style("opacity", 0.2);
            break;

          case "d3LineRadialRrd":
            // Find all the lines, and set them to appropriate values.
            d3.select(element).selectAll(".line").style("opacity", 0.2);
            break;
        } // switch

      },
      // unHighlightAll
      highlightDataPoint: function highlightDataPoint(element, plot, d) {
        // This function distributes the functionality. It has access to the plot information, data information, and the handle to the corresponding DOM plotArea element.
        // This handlercan be invoked for all data d that are found.
        switch (plot.plotFunc.name) {
          case "cfD3Scatter":
            // Find the circle corresponding to the data point. Look for it by taskId.
            d3.select(element).selectAll("circle[task-id='" + d.taskId + "']").style("opacity", 1.0).attr("r", 7); // Also highlight any manually selected points.

            cfD3Scatter.helpers.updateManualSelections();
            break;

          case "cfD3BarChart":
            // Find the appropriate rects, and change their border stroke.						  
            // Instead of the border turn the text to bold??
            var labels = d3.select(element).selectAll('.keyLabel')._groups[0];

            labels.forEach(function (labelDOM) {
              if (labelDOM.innerHTML == d[plot.data.xProperty]) {
                // Turn the text bold.
                labelDOM.style.fontWeight = 'bold';
              } // if

            }); // forEach

            break;

          case "cfD3Histogram":
            // NOTE THAT THE TRANSITION EFFECTS CAUSE SLIGHT BUGS - THE MARKERS ARE CREATED BEFORE THE TRANSITION COMPLETES!
            // Find within which bar the point falls.
            var property = plot.data.xProperty;
            var bars = d3.select(element).selectAll("rect");
            bars.each(function (barData, barInd) {
              // d3 connects each of the bars with its data! here 'barData' is an array containing all the data points relating to it, as well as the range of values it represents.
              // Pick the corresponding marker.
              var marker = d3.select(element).selectAll('.tempMarker[ind="' + barInd + '"]'); // If there is any data connected to this bar check if it needs to be highlighted.

              for (var i = 0; i < barData.length; i++) {
                // Check if the datapoint with the taskId is in this array. In this case check with a for loop (as opposed to forEach), as otherwise the x0 and x1 properties are interpreted as array elements too.
                if (d.taskId == barData[i].taskId) {
                  // Find the height corresponding to 1 task.
                  var h = this.height.baseVal.value / barData.length; // Get the marker rectangle, and update its attributes.

                  if (marker.empty()) {
                    // There is none, so append one.
                    var n = 1;
                    marker = d3.select(element).append("rect").attr("class", "tempMarker").attr("height", n * h).attr("transform", getTranslate(this, n, h)).attr("n", n).attr("ind", barInd).attr("width", this.width.baseVal.value).attr("opacity", 1).style("fill", "cornflowerblue");
                  } else {
                    // Add to the height.
                    var n = Number(marker.attr("n")) + 1;
                    marker.attr("height", n * h).attr("transform", getTranslate(this, n, h)).attr("n", n);
                  } // if

                }
              }

              function getTranslate(barDOM, n, h) {
                var plotHeight = d3.select(barDOM.parentElement.parentElement).attr("plotHeight");
                var leftEdgeX = barDOM.transform.baseVal[0].matrix.e + 1;
                var topEdgeY = plotHeight - n * h;
                var t = "translate(" + leftEdgeX + "," + topEdgeY + ")";
                return t;
              } // getTranslate

            }); // each

            break;

          case "d3LineSeriesRrd":
            // Find the line corresponding to the data point. Look for it by taskId.
			
            d3.select(element).selectAll('.plotSeries[task-id="' + d.taskId + '"]').selectAll(".line").style("opacity", 1.0).style("stroke-width", "4px");
            break;

          case "d3LineRadialRrd":
            // Find the line corresponding to the data point. Look for it by taskId.
            d3.select(element).selectAll('.plotSeries[task-id="' + d.taskId + '"]').selectAll(".line").style("opacity", 1.0).style("stroke-width", "4px");
            break;
        } // switch

      },
      // highlightDataPoint
      setDefaultStyle: function setDefaultStyle(element, plot) {
        // This function returns all expected elements on the plots back to their default styles.
        switch (plot.plotFunc.name) {
          case "cfD3Scatter":
            // Find all the circles, style them appropriately.
            d3.select(element).selectAll("circle").style("opacity", 1).attr("r", 5);
            break;

          case "cfD3BarChart":
            // Remove the text bolding.
            d3.select(element).selectAll('.keyLabel').style("font-weight", "");
            break;

          case "cfD3Histogram":
            // Find within which bar the point falls.
            d3.select(element).selectAll(".tempMarker").remove();
            d3.select(element).selectAll("rect").attr("opacity", 1);
            break;

          case "d3LineSeriesRrd":
            // Revert the opacity and width.
            d3.select(element).selectAll(".line").style("opacity", 1.0).style("stroke-width", "2.5px");
            break;

          case "d3LineRadialRrd":
            // Revert the opacity and width.
            d3.select(element).selectAll(".line").style("opacity", 1.0).style("stroke-width", "2.5px");
            break;
        } // switch

      },
      // setDefaultStyle
      findAllData: function findAllData(d, sourcePlotName) {
        var allDataPoints;

        switch (sourcePlotName) {
          case "cfD3Scatter":
            allDataPoints = [d];
            break;

          case "cfD3BarChart":
            // Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE FILTER - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
            var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity);
            allDataPoints = cfDataPoints.filter(function (p) {
              return p[d.keyProperty] == d.key;
            });
            break;

          case "d3LineSeriesRrd":
            // Collect all the relevant data points by tskId.
            var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity);
            allDataPoints = cfDataPoints.filter(function (p) {
              return p.taskId == d.taskId;
            }); // console.log(allDataPoints);

            break;

          case "d3LineRadialRrd":
            // Collect all the relevant data points by tskId.
            var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity);
            allDataPoints = cfDataPoints.filter(function (p) {
              return p.taskId == d.taskId;
            }); // console.log(allDataPoints);

            break;
        } // switch
        // ow the reults
        // console.log(allDataPoints)


        return allDataPoints;
      } // findAllData

    } // helpers

  }; // crossPlotHighlighting

  var plotHelpers = {
    getDomain: function getDomain(series, accessor) {
      // This function expects an array of objects 'series', that contains all the information about the data, as well as the data itself. 'series' is expected to have the data itself stored in a lover level [dataWrapper]. It expects that the 'variable' data can be accessed using series[n][plotWrapper][variable]  
      // Finding the axis limits.
      var minVal = d3.min(accessor(series[0]));
      var maxVal = d3.max(accessor(series[0]));

      for (var n = 1; n < series.length; ++n) {
        var minVal_ = d3.min(accessor(series[n]));
        var maxVal_ = d3.max(accessor(series[n]));
        minVal = minVal_ < minVal ? minVal_ : minVal;
        maxVal = maxVal_ > maxVal ? maxVal_ : maxVal;
      }

      return [minVal, maxVal];
    },
    // getDomain
    collectAllPropertyNames: function collectAllPropertyNames(series, accessor) {
      // This function collects all the property names in an array of objects.
      var allPropertyNames = [];

      for (var i = 0; i < series.length; i++) {
        allPropertyNames.push(Object.getOwnPropertyNames(accessor(series[i])));
      }

      return allPropertyNames;
    },
    // collectAllPropertyNames
    findCommonElements: function findCommonElements(arrs) {
      // This function goes through all the arrays and finds only the common elements. // Adapted from "https://codereview.stackexchange.com/questions/96096/find-common-elements-in-a-list-of-arrays".
      // It expects an array of arrays as an input.
      var resArr = []; // Loop over elements in the first array.

      for (var i = 0; i < arrs[0].length; i++) {
        // Check if all subsequent arrays have this. If they don't, break the loop and try again. 
        for (var j = arrs.length - 1; j > 0; j--) {
          if (arrs[j].indexOf(arrs[0][i]) == -1) {
            break;
          } // if

        } // for
        // If the loop executed to the end store this property.


        if (j === 0) {
          resArr.push(arrs[0][i]);
        }
      }

      return resArr;
    },
    // findCommonElements
    removePlotTitleControls: function removePlotTitleControls(element) {
      var controlGroup = d3.select(element.parentElement).select(".plotTitle").select(".ctrlGrp"); // Remove everything.

      controlGroup.selectAll("*").remove();
    } // removePlotTitleControls

  }; // plotHelpers

  var cfDataManagement = {
    cfInit: function cfInit(metadata) {
      var cfData = {};
      cfData.metaDataProperties = metadata.header.metaDataProperties;
      cfData.dataProperties = metadata.header.dataProperties;
      cfData.sliceProperties = metadata.header.sliceProperties;
      cfData.contourProperties = metadata.header.contourProperties;
      cfData.cf = crossfilter(metadata.data);
      cfData.metaDims = [];
      cfData.metaDataUniqueValues = {};
      cfData.dataDims = [];
      cfData.taskDim = [];
      cfData.fileDim = [];
      cfData.filterSelected = [];
      cfData.histogramSelectedRanges = [];
      cfData.scatterManualSelectedTasks = []; // Populate the metaDims and metaDataUniqueValues.

      cfData.metaDataProperties.forEach(function (property, i) {
        cfData.metaDims.push(cfData.cf.dimension(function (d) {
          return d[property];
        }));
        cfData.metaDataUniqueValues[property] = Array.from(new Set(metadata.data.map(function (d) {
          return d[property];
        })));
      }); // forEach
      // Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.

      cfData.dataProperties.forEach(function (property, i) {
        cfData.dataDims.push(cfData.cf.dimension(function (d) {
          return d[property];
        }));
      }); // forEach

      cfData.fileDim = cfData.cf.dimension(function (d) {
        return d.file;
      });
      cfData.taskDim = cfData.cf.dimension(function (d) {
        return d.taskId;
      }); // Create a standalone array of taskIds

      dbsliceData.filteredTaskIds = cfDataManagement.helpers.getTaskIds(metadata); // Check if any histogram selected ranges have already been set up. This is important when the data is being replaced.

      if (dbsliceData.data !== undefined) {
        if (dbsliceData.data.histogramSelectedRanges !== undefined) {
          cfData.histogramSelectedRanges = dbsliceData.data.histogramSelectedRanges;
        } // if

      } // if
      // Store data internally


      dbsliceData.data = cfData;
    },
    // cfInit
    cfAdd: function cfAdd(metadata) {
      // This function attempts to add data to the already existing dataset. It allows a compromise between searching for all available data and loading it in, and personally creating additional combinations of the metadata in csv files.
      // The ideal solution would be for each individual task to have it's own small metadata file, which could then by parsed by a search engine. This is unpractical for a localised application - this functionality is usable however.
      // If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
      if (dbsliceData.data !== undefined) {
        // If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
        if (dbsliceData.data.cf.all().length < 1) {
          cfDataManagement.cfInit(metadata);
        } else {
          // Here the compatibility of data needs to be assessed. If the new dataset has the same variables as the existing datasets, then add those in. If it does not do nothing.
          var canMerge = cfDataManagement.helpers.crossCheckProperties(dbsliceData.data, metadata);

          if (canMerge) {
            // Add these records into the dataset.
            dbsliceData.data.cf.add(metadata.data); // Update the filtered taskIds - note that these could fall into some filters, and therefore not be active straight away...

            var currentMetaData = dbsliceData.data.metaDims[0].top(Infinity);
            dbsliceData.filteredTaskIds = currentMetaData.map(function (d) {
              return d.taskId;
            });
          } // if

        } // if

      } else {
        cfDataManagement.cfInit(metadata);
      } // if

    },
    // cfAdd
    cfRemove: function cfRemove(dataFilesToRemove) {
      // This function will remove the data from the crossfilter.
      // Loop though all the dimensions and remove the filters.
      dbsliceData.data.metaDims.forEach(function (metaDim) {
        metaDim.filterAll();
      }); // forEach

      dbsliceData.data.dataDims.forEach(function (dataDim) {
        dataDim.filterAll();
      }); // forEach
      // Apply the new filter. - I think this isn't working.

      dbsliceData.data.fileDim.filter(function (d) {
        return dataFilesToRemove.indexOf(d) > -1;
      }); // Remove the data.

      dbsliceData.data.cf.remove(); // Remove the filter.

      dbsliceData.data.fileDim.filterAll(); // Reinstate other data filters.

      cfUpdateFilters(dbsliceData.data);
    },
    // cfRemove
    helpers: {
      getTaskIds: function getTaskIds(metadata) {
        var taskIds = [];
        metadata.data.forEach(function (task, i) {
          taskIds.push(task.taskId);
        });
        return taskIds;
      },
      // getTaskIds
      crossCheckProperties: function crossCheckProperties(existingData, newData) {
        // oldData.header.dataProperties.filter(function(d){  return !newData.includes(d) })
        var missingDataProperties = existingData.dataProperties.filter(function (d) {
          return !newData.header.dataProperties.includes(d);
        });
        var missingMetadataProperties = existingData.metaDataProperties.filter(function (d) {
          return !newData.header.metaDataProperties.includes(d);
        });
        var missingSliceProperties = existingData.sliceProperties.filter(function (d) {
          return !newData.header.sliceProperties.includes(d);
        });
        var missingContourProperties = existingData.contourProperties.filter(function (d) {
          return !newData.header.contourProperties.includes(d);
        });
        var allPropertiesIncluded = missingDataProperties.length == 0 && missingMetadataProperties.length == 0 && missingSliceProperties.length == 0 && missingContourProperties.length == 0;

        if (allPropertiesIncluded) {
          return true;
        } else {
          // Which ones are not included?
          var warningText = "Selected data has been rejected. It requires additional variables:\n" + "Data variables:     " + missingDataProperties.join(", ") + "\n" + "Metadata variables: " + missingMetadataProperties.join(", ") + "\n" + "Slice variables:    " + missingSliceProperties.join(", ") + "\n" + "Contour variables:  " + missingContourProperties.join(", ") + "\n";
          window.alert(warningText);
          return false;
        } // if

      } // checkProperties

    } // helpers

  }; // cfDataManagement

  var cfD3Histogram = {
    name: "cfD3Histogram",
    margin: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    colour: [],
    make: function make(element, data, layout) {
      // Update the controls as required
      cfD3Histogram.addInteractivity.updatePlotTitleControls(element); // Update the view

      cfD3Histogram.update(element, data, layout);
    },
    update: function update(element, data, layout) {
      cfD3Histogram.setupSvg(element, data, layout);
      var svg = d3.select(element).select("svg"); // Get the required data.

      var items = dbsliceData.data.dataDims[0].top(Infinity); // Get the scale. All properties requried are in the svg.

      var x = cfD3Histogram.helpers.getXScale(svg); // Get the bins to plot

      var bins = cfD3Histogram.helpers.getBins(x, data.xProperty, items); // Make either a fixed scale or reactive scale (false/true)

      var y = cfD3Histogram.helpers.getYScale(svg, bins, false); // Handle entering/updating/removing the bars.

      var bars = svg.select(".plotArea").selectAll("rect").data(bins);
      bars.enter().append("rect").attr("transform", function (d) {
        return "translate(" + x(d.x0) + "," + y(d.length) + ")";
      }).attr("x", 1).attr("width", calculateWidth).attr("height", function (d) {
        return svg.attr("plotHeight") - y(d.length);
      }).style("fill", cfD3Histogram.colour).attr("opacity", 1);
      bars.transition().attr("transform", function (d) {
        return "translate(" + x(d.x0) + "," + y(d.length) + ")";
      }).attr("x", 1).attr("width", calculateWidth).attr("height", function (d) {
        return svg.attr("plotHeight") - y(d.length);
      });
      bars.exit().remove(); // Make some axes

      cfD3Histogram.helpers.createAxes(svg, x, y, data.xProperty, "Number of tasks");

      function calculateWidth(d_) {
        var width = x(d_.x1) - x(d_.x0) - 1;
        width = width < 0 ? 0 : width;
        return width;
      } // calculateWidth

    },
    // update
    setupSvg: function setupSvg(element, data, layout) {
      // Add the setupSvg function!!
      var container = d3.select(element); // If layout has a margin specified store it as the internal property.

      cfD3Histogram.margin = layout.margin === undefined ? cfD3Histogram.margin : layout.margin;
      cfD3Histogram.colour = layout.colour === undefined ? "cornflowerblue" : layout.colour;
      var svg = container.select("svg");

      if (svg.empty()) {
        // Append new svg
        svg = container.append("svg"); // Update its dimensions.

        curateSvg(); // Add functionality.

        cfD3Histogram.addInteractivity.addBrush(svg);
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

          cfD3Histogram.addInteractivity.addBrush(svg);
          plotHelpers.removePlotTitleControls(element);
        } else {
          // Axes might need to be updated, thus the svg element needs to be refreshed.
          curateSvg(); // Only update the brush if the window is resized - otherwise the functionality should remain the same

          if (layout.isWindowResized) {
            cfD3Histogram.addInteractivity.addBrush(svg);
          } // if


          if (layout.isPlotBeingRemoved) {
            cfD3Histogram.addInteractivity.addBrush(svg);
          } // if

        }
      }

      function curateSvg() {
        // Get plot dimensions
        var svgWidth = container.node().offsetWidth;
        var svgHeight = layout.height;
        var width = svgWidth - cfD3Histogram.margin.left - cfD3Histogram.margin.right;
        var height = svgHeight - cfD3Histogram.margin.top - cfD3Histogram.margin.bottom; // Calculation the min and max values - based on all the data, otherwise crossfilter will remove some, and the x-axis will be rescaled every time the brush adds or removes data.

        var items = dbsliceData.data.cf.all();
        var xDomMin = d3.min(items, function (d) {
          return d[data.xProperty];
        }) * 0.9;
        var xDomMax = d3.max(items, function (d) {
          return d[data.xProperty];
        }) * 1.1; // The dimId needs to be assigned here, otherwise there is confusion between the brush and the data if a hitogram plot inherits a histogram plot.

        var dimId = dbsliceData.data.dataProperties.indexOf(data.xProperty); // Curating the svg.                

        var svg = container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height).attr("xDomMin", xDomMin).attr("xDomMax", xDomMax).attr("dimId", dimId); // Create original bins to compare against during exploration.

        var x = cfD3Histogram.helpers.getXScale(svg);
        var bins = cfD3Histogram.helpers.getBins(x, data.xProperty, items);
        var yDomMax = d3.max(bins, function (d) {
          return d.length;
        });
        svg.attr("yDomMax", yDomMax);
        var plotArea = svg.select(".plotArea");

        if (plotArea.empty()) {
          // If there's nonoe, add it.
          svg.append("g").attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")").attr("class", "plotArea");
        }
      }
    },
    // setupSvg
    addInteractivity: {
      addBrush: function addBrush(svg) {
        // The hardcoded values need to be declared upfront, and abstracted.
        // Get the scale. All properties requried are in the svg.
        var x = cfD3Histogram.helpers.getXScale(svg); // There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
        // Why is there no brush here on redraw??

        var brush = svg.select(".brush");

        if (brush.empty()) {
          brush = svg.append("g").attr("class", "brush").attr("xDomMin", svg.attr("xDomMin")).attr("xDomMax", svg.attr("xDomMax")).attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")");
          var xMin = svg.attr("xDomMin");
          var xMax = svg.attr("xDomMax"); // Initialise the filter if it isn't already.

          var filter = dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")];

          if (filter !== undefined) {
            xMin = filter[0];
            xMax = filter[1];
          } else {
            dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")] = [xMin, xMax];
          } // if

        } else {
          // Setup th efilter bounds in the cfInit??
          var filter = dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")];
          var xMin = filter[0];
          var xMax = filter[1];
          brush.selectAll("*").remove();
        } // if


        var rect = brush.append("rect").attr("class", "selection").attr("cursor", "move").attr("width", x(xMax) - x(xMin)).attr("height", svg.attr("plotHeight")).attr("x", x(xMin)).attr("y", 0).attr("opacity", 0.2).attr("xMin", xMin).attr("xMax", xMax); // Make the rect draggable

        rect.call(d3.drag().on("drag", dragmove)); // Make the rect scalable, and add rects to the left and right, and use them to resize the rect.

        brush.append("rect").attr("class", "handle handle--e").attr("cursor", "ew-resize").attr("x", Number(rect.attr("x")) + Number(rect.attr("width"))).attr("y", Number(rect.attr("y")) + Number(rect.attr("height")) / 4).attr("width", 10).attr("height", Number(rect.attr("height")) / 2).attr("opacity", 0).call(d3.drag().on("drag", dragsize));
        brush.append("rect").attr("class", "handle handle--w").attr("cursor", "ew-resize").attr("x", Number(rect.attr("x")) - 10).attr("y", Number(rect.attr("y")) + Number(rect.attr("height")) / 4).attr("width", 10).attr("height", Number(rect.attr("height")) / 2).attr("opacity", 0).call(d3.drag().on("drag", dragsize)); // Decorative handles.

        var handleData = [{
          x0: [Number(rect.attr("x")) + Number(rect.attr("width")), Number(rect.attr("y")) + Number(rect.attr("height")) / 4],
          height: Number(rect.attr("height")) / 2,
          side: "e"
        }, {
          x0: [Number(rect.attr("x")), Number(rect.attr("y")) + Number(rect.attr("height")) / 4],
          height: Number(rect.attr("height")) / 2,
          side: "w"
        }];
        brush.selectAll("path").data(handleData).enter().append("path").attr("d", drawHandle).attr("stroke", "#000").attr("fill", "none").attr("class", function (d) {
          return "handle handle--decoration-" + d.side;
        });

        function drawHandle(d) {
          // Figure out if the west or east handle is needed.
          var flipConcave = d.side == "e" ? 1 : 0;
          var flipDir = d.side == "e" ? 1 : -1;
          var lambda = 30 / 300;
          var r = lambda * d.height;
          var start = "M" + d.x0[0] + " " + d.x0[1];
          var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir * r, r].join(" ");
          var leftLine = "h0 v" + (d.height - 2 * r);
          var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir * r, r].join(" ");
          var closure = "Z";
          var innerLine = "M" + [d.x0[0] + flipDir * r / 2, d.x0[1] + r].join(" ") + leftLine;
          return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ");
        } // drawHandle


        function dragmove() {
          var x = cfD3Histogram.helpers.getXScale(svg);
          var rect = d3.select(this);
          var brush = d3.select(this.parentNode); // Update teh position of the left edge by the difference of the pointers movement.

          var oldWest = Number(rect.attr("x"));
          var oldEast = Number(rect.attr("x")) + Number(rect.attr("width"));
          var newWest = oldWest + d3.event.dx;
          var newEast = oldEast + d3.event.dx; // Check to make sure the boundaries are within the axis limits.

          if (x.invert(newWest) < svg.attr("xDomMin")) {
            newWest = x(svg.attr("xDomMin"));
          } else if (x.invert(newEast) > svg.attr("xDomMax")) {
            newEast = x(svg.attr("xDomMax"));
          } // if
          // Update the xMin and xMax values.


          rect.attr("xMin", x.invert(newWest));
          rect.attr("xMax", x.invert(newEast)); // Update the selection rect.

          cfD3Histogram.addInteractivity.updateBrush(svg); // Update the data selection

          updateSelection(brush); // Rerender to allow other elements to respond.

          render(dbsliceData.elementId, dbsliceData.session);
        } // dragmove


        function dragsize() {
          // Update teh position of the left edge by the difference of the pointers movement.
          var x = cfD3Histogram.helpers.getXScale(svg);
          var handle = d3.select(this);
          var brush = d3.select(this.parentNode);
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

          if (x.invert(newWest) < svg.attr("xDomMin")) {
            newWest = x(svg.attr("xDomMin"));
          } else if (x.invert(newEast) > svg.attr("xDomMax")) {
            newEast = x(svg.attr("xDomMax"));
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

          cfD3Histogram.addInteractivity.updateBrush(svg); // Update the data selection

          updateSelection(brush); // Rerender to allow other elements to respond.

          render(dbsliceData.elementId, dbsliceData.session);
        } // dragsize


        function updateSelection(brush) {
          var rect = brush.select(".selection");
          var lowerBound = Number(rect.attr("x"));
          var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"));
          var selectedRange = [x.invert(lowerBound), x.invert(upperBound)];
          dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")] = selectedRange; // Update the filter

          cfUpdateFilters(dbsliceData.data);
        } // updateSelection

      },
      // addBrush
      updateBrush: function updateBrush(svg) {
        // First get the scale
        var x = cfD3Histogram.helpers.getXScale(svg); // Now get the values that are supposed to be selected.

        var xMin = Number(svg.select(".selection").attr("xMin"));
        var xMax = Number(svg.select(".selection").attr("xMax")); // Update teh rect.

        svg.select(".selection").attr("x", x(xMin)).attr("width", x(xMax) - x(xMin)); // Update the handles				

        svg.select(".brush").select(".handle--e").attr("x", x(xMax));
        svg.select(".brush").select(".handle--w").attr("x", x(xMin) - 10); // CLEAN THIS UP:
        // Update the handle decorations

        var rect = svg.select(".selection");
        var de = {
          x0: [Number(rect.attr("x")) + Number(rect.attr("width")), Number(rect.attr("y")) + Number(rect.attr("height")) / 4],
          height: Number(rect.attr("height")) / 2,
          side: "e"
        };
        var dw = {
          x0: [Number(rect.attr("x")), Number(rect.attr("y")) + Number(rect.attr("height")) / 4],
          height: Number(rect.attr("height")) / 2,
          side: "w"
        };
        svg.select(".brush").select(".handle--decoration-e").attr("d", drawHandle(de));
        svg.select(".brush").select(".handle--decoration-w").attr("d", drawHandle(dw));

        function drawHandle(d) {
          // Figure out if the west or east handle is needed.
          var flipConcave = d.side == "e" ? 1 : 0;
          var flipDir = d.side == "e" ? 1 : -1;
          var lambda = 30 / 300;
          var r = lambda * d.height;
          var start = "M" + d.x0[0] + " " + d.x0[1];
          var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir * r, r].join(" ");
          var leftLine = "h0 v" + (d.height - 2 * r);
          var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir * r, r].join(" ");
          var closure = "Z";
          var innerLine = "M" + [d.x0[0] + flipDir * r / 2, d.x0[1] + r].join(" ") + leftLine;
          return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ");
        } // drawHandle

      },
      // updateBrush
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        plotHelpers.removePlotTitleControls(element);
      } // updatePlotTitleControls

    },
    // setupInteractivity
    helpers: {
      getXScale: function getXScale(svg) {
        var x = d3.scaleLinear().domain([svg.attr("xDomMin"), svg.attr("xDomMax")]).rangeRound([0, svg.attr("plotWidth")]);
        return x;
      },
      // getXScale
      getYScale: function getYScale(svg, bins, reactive) {
        if (reactive) {
          var y = d3.scaleLinear().domain([0, d3.max(bins, function (d) {
            return d.length;
          })]).range([svg.attr("plotHeight"), 0]);
        } else {
          var y = d3.scaleLinear().domain([0, svg.attr("yDomMax")]).range([svg.attr("plotHeight"), 0]);
        } // if


        return y;
      },
      // getYScale
      getBins: function getBins(x, property, items) {
        // The function in the histogram ensures that only a specific property is extracted from the data input to the function on the 'histogram(data)' call.
        var histogram = d3.histogram().value(function (d) {
          return d[property];
        }).domain(x.domain()).thresholds(x.ticks(20));
        var bins = histogram(items);
        return bins;
      },
      // getBins
      createAxes: function createAxes(svg, x, y, xLabel, yLabel) {
        // Handle the axes.
        var xAxis = svg.select(".plotArea").select(".xAxis");

        if (xAxis.empty()) {
          xAxis = svg.select(".plotArea").append("g").attr("class", "xAxis").attr("transform", "translate(0," + svg.attr("plotHeight") + ")").call(d3.axisBottom(x));
          xAxis.append("text").attr("class", "xAxisLabel").attr("fill", "#000").attr("x", svg.attr("plotWidth")).attr("y", cfD3Histogram.margin.bottom).attr("text-anchor", "end").text(xLabel);
        } else {
          // If the axis is already there it might just need updating.
          svg.select(".plotArea").select(".xAxis").call(d3.axisBottom(x));
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
          svg.select(".plotArea").select(".axes").append("text").attr("class", "yAxisLabel").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -25).attr("text-anchor", "end").text(yLabel);
        } // if

      } // createAxes

    } // helpers

  }; // cfD3Histogram

  var importExportFunctionality = {
    // This object controls all the behaviour exhibited when loading in data or session layouts, as well as all behaviour when saving the layout.
    // The loading of sessions and data must be available separately, and loading the session should include an option to load in a predefined dataset too.
    // It is possible that the session configuration and data will have incompatible variable names. In these cases the user should resolve the incompatibility, but the incompatibility should be presented to them!
    // Saving the session is done by downloading a created object. Therefore a session object should be written everytime the view is refreshed.
    // The views depending on "Plot Selected Tasks" to be pressed should be loaded in merely as configs in their plotrows, and the corresponding filtering values need to be loaded into their corresponding plots.
    importData: {
      // WIP: This has to be able to load in data from anywhere on the client computer, not just the server root.
      // WIP: It must be able to load in additional data. The user must be prompted to identify variables that are different in loaded, and to be loaded data.
      // DONE: It must be able to load both csv and json fle formats.
      // DONE/WIP: Must prompt the user if the variables don't include those in existing plots. Solution: does not prompt the user, but for now just removed any incompatible plots. The prompt for the user to resolve the incompatibility is the next step.
      load: function load(file, dataAction) {
        // Create convenient handles.
        var ld = importExportFunctionality.importData; // Split the name by the '.', then select the last part.

        var extension = file.name.split(".").pop(); // Create a url link to allow files to be loaded fromanywhere on the local machine.

        var url = window.URL.createObjectURL(file); // Determine if the input adds new data, or if it replaces the data.

        switch (dataAction) {
          case "add":
            var actionOnInternalStorage = cfDataManagement.cfAdd;
            break;

          case "replace":
            var actionOnInternalStorage = cfDataManagement.cfInit;
            break;

          default:
            var actionOnInternalStorage = cfDataManagement.cfInit;
            break;
        } // switch


        switch (extension) {
          case "csv":
            d3.csv(url).then(function (metadata) {
              data = [];
              metadata.forEach(function (d) {
                data.push(ld.helpers.convertNumbers(d));
              }); // Add the source file to tha data

              data.forEach(function (d) {
                d.file = file.name;
              });
              ld.csv(data, actionOnInternalStorage);
            }); // d3.csv

            break;

          case "json":
            d3.json(url, function (metadata) {
              metadata.data.forEach(function (d) {
                d.file = file.name;
              });
              ld.json(metadata, actionOnInternalStorage);
            }); // d3.json

            break;

          default:
            window.alert("Selected file must be either .csv or .json");
            break;
        }
      },
      // load
      csv: function csv(metadata, actionOnInternalStorage) {
        // Process the metadata read in the csv format.
        var d = importExportFunctionality.importData.helpers.csv2json(metadata); // Perform the requested internal storage assignment.

        actionOnInternalStorage(d); // cfDataManagement.cfInit(d)

        render(dbsliceData.elementId, dbsliceData.session);
      },
      // csv
      json: function json(metadata, actionOnInternalStorage) {
        // Change any backslashes with forward slashes
        metadata.data.forEach(function (d) {
          importExportFunctionality.importData.helpers.replaceSlashes(d, "taskId");
        }); // forEach
        // Initialise the crossfilter

        actionOnInternalStorage(metadata); // cfDataManagement.cfInit(metadata)

        render(dbsliceData.elementId, dbsliceData.session);
      },
      // json
      helpers: {
        renameVariables: function renameVariables(data, oldVar, newVar) {
          // This function renames the variable of a dataset.
          for (var j = 0; j < data.length; j++) {
            // Have to change the names individually.
            data[j][newVar] = data[j][oldVar];
            delete data[j][oldVar];
          }
        },
        // renameVariable
        convertNumbers: function convertNumbers(row) {
          // Convert the values from strings to numbers.
          var r = {};

          for (var k in row) {
            r[k] = +row[k];

            if (isNaN(r[k])) {
              r[k] = row[k];
            } // if

          } // for


          return r;
        },
        // convertNumbers
        replaceSlashes: function replaceSlashes(d, variable) {
          // Replace all the slashes in the variable for ease of handling in the rest of the code.
          var variable_ = d[variable];
          d[variable] = variable_.replace(/\\/g, "/");
        },
        // replaceSlashes
        csv2json: function csv2json(metadata) {
          // Create a short handle to the helpers
          var h = importExportFunctionality.importData.helpers; // Change this into the appropriate internal data format.

          var headerNames = d3.keys(metadata[0]); // Assemble dataProperties, and metadataProperties.

          var dataProperties = [];
          var metadataProperties = [];
          var sliceProperties = [];
          var contourProperties = [];

          for (var i = 0; i < headerNames.length; i++) {
            // Look for a designator. This is either "o_" or "c_" prefix.
            var variable = headerNames[i];
            var prefix = variable.split("_")[0];
            var variableNew = variable.split("_").slice(1).join(" ");

            switch (prefix) {
              case "o":
                // Ordinal variables.
                dataProperties.push(variableNew);
                h.renameVariables(metadata, variable, variableNew);
                break;

              case "c":
                // Categorical variables
                metadataProperties.push(variableNew);
                h.renameVariables(metadata, variable, variableNew);
                break;

              case "s":
                // Slices
                sliceProperties.push(variableNew);
                h.renameVariables(metadata, variable, variableNew);
                break;

              case "c2d":
                // Contours
                contourProperties.push(variableNew);
                h.renameVariables(metadata, variable, variableNew);
                break;

              case "taskId":
                // This is a special case, as it is advantageous that any '\' in the value of taskId be changed into '/'. It is intended that the taskId is the url to the location ofthe data, thus this can prove important.						
                metadata.forEach(function (d) {
                  h.replaceSlashes(d, "taskId");
                }); // forEach

                break;
            }
          }
          // Combine in an overall object.

          var d = {
            data: metadata,
            header: {
              dataProperties: dataProperties,
              metaDataProperties: metadataProperties,
              sliceProperties: sliceProperties,
              contourProperties: contourProperties
            }
          };
          return d;
        },
        // csv2json
        rrdPlcp2json: {
          uniqueByPartName: function uniqueByPartName(nameArray, partName) {
            var h = importExportFunctionality.importData.helpers.rrdPlcp2json;
            var u = [];
            nameArray.forEach(function (variable) {
              var parts = h.rrdPlcpVariableNameSplit(variable);

              if (u.indexOf(parts[partName]) == -1) {
                u.push(parts[partName]);
              } // if

            });
            return u;
          },
          // uniqueByPartName
          rrdPlcpRestructure: function rrdPlcpRestructure(data) {
            // Cycle through all the variables, and merge them together. Do this by creating a new row element corresponding with the data with the desired structure.
            var h = importExportFunctionality.importData.helpers.rrdPlcp2json; // What I want is an object that will hold all the metadata of the file (height, options, ...). One of the properties will be data. Data will be an object with proprties corresponding to te unique heights. Each of these heights will be an array of objects. Each of these objects will have an x and y property.
            // The idea is that things are drawn primarily for the same height. The surface is included as a separate property of the point.
            // Go through all of the variables, and convert them all to individual data points, with the options in the name as properties.

            var allOriginalVariables = Object.getOwnPropertyNames(data[0]); // Get the parts of all of these.

            var allVariableNamesSplit = [];
            allOriginalVariables.forEach(function (variable) {
              allVariableNamesSplit.push(h.rrdPlcpVariableNameSplit(variable));
            }); // Get all available heights

            var allAvailableHeights = h.uniqueByPartName(allOriginalVariables, 'height'); // Instantiate the structure.

            var structuredData = {
              taskId: data.taskId,
              heights: allAvailableHeights
            }; // Loop over the heights and collect all variables corresponding to them.

            allAvailableHeights.forEach(function (height) {
              var allHeightVariables = allOriginalVariables.filter(function (variable) {
                var parts = h.rrdPlcpVariableNameSplit(variable);
                return parts.height == height;
              });
              structuredData[height] = {}; // Among these find the eunique physical variables.

              var uniquePhysicalVariables = h.uniqueByPartName(allHeightVariables, 'variable'); // Find the subgroup with this particular physical variable.

              uniquePhysicalVariables.forEach(function (variable) {
                // Combine the quadruple together.
                var ps = [];
                var ss = [];
                var ps_x = [height, 'Height', 'ps', variable, 'x'].join('_');
                var ps_y = [height, 'Height', 'ps', variable, 'y'].join('_');
                var ss_x = [height, 'Height', 'ss', variable, 'x'].join('_');
                var ss_y = [height, 'Height', 'ss', variable, 'y'].join('_'); // Join all of these together.

                data.forEach(function (d) {
                  ps.push({
                    x: d[ps_x],
                    y: d[ps_y],
                    side: 'ps'
                  });
                  ss.push({
                    x: d[ss_x],
                    y: d[ss_y],
                    side: 'ss'
                  });
                }); // Join the ps and ss together into one series

                structuredData[height][variable] = ps.concat(ss.reverse());
              });
            });
            return structuredData;
          },
          // rrdPlcpRestructure
          rrdPlcpVariableNameSplit: function rrdPlcpVariableNameSplit(variable) {
            // Split the variable names by '_'.
            var parts = variable.split("_"); // First two parts are the height identifiers to within one decimal place.
            // Third part is 'Height', an dcan be skipped.
            // Fourth part is suction/pressure side id, ss/ps
            // Fifth part through to the before last part belong to the variable name
            // Last part is the axis for the value to be plotted on.

            var excess = parts.splice(2, 1);
            return {
              height: parts.splice(0, 2).join('_'),
              surface: parts.splice(0, 1).join(),
              axis: parts.pop(),
              variable: parts.join()
            };
          } // rrdPlcpVariableNameSplit

        } // rrdPlcp2json

      } // helpers

    },
    // loadData
    loadSession: {
      // WIP: Must be able to load a session file from anywhere.
      // DONE: Must load in metadata plots
      // WIP: Must be able to load in data automatically. If the data is already loaded the loading of additional data must be ignored. Or the user should be asked if they want to add it on top.
      // WIP: Must be able to load without data.
      // DONE: Must only load json files.
      // WIP: Must prompt the user if the variables don't include those in loaded data.
      handler: function handler(file) {
        var ls = importExportFunctionality.loadSession; // Split the name by the '.', then select the last part.

        var extension = file.name.split(".").pop(); // Create a url link to allow files to be loaded fromanywhere on the local machine.

        var url = window.URL.createObjectURL(file);

        switch (extension) {
          case "json":
            d3.json(url).then(function (sessionData) {
              ls.json(sessionData);
            }); // d3.json

            break;

          default:
            window.alert("Selected file must be either .csv or .json");
            break;
        }
      },
      // handler
      json: function json(sessionData) {
        var h = importExportFunctionality.loadSession.helpers; // Check if it is a session file!

        if (sessionData.isSessionObject === "true") {
          // To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. NOT THE MOST ELEGANT, OR NICE TO SEE IN ACTION, BUT IT GETS THE JOB DONE.
          // This is done here in case a file that is not a json is selected.
          d3.selectAll(".plotRow").remove();
          var plotRows = h.assemblePlotRows(sessionData.plotRows); // Finalise the session object.

          var session = {
            title: sessionData.title,
            plotRows: plotRows
          }; // Store into internal object

          dbsliceData.session = session; // Render!

          render(dbsliceData.elementId, dbsliceData.session);
        } else {
          window.alert("Selected file is not a valid session object.");
        }
      },
      // json
      helpers: {
        string2function: function string2function(string) {
          var func;

          switch (string) {
            case "cfD3BarChart":
              func = cfD3BarChart;
              break;

            case "cfD3Histogram":
              func = cfD3Histogram;
              break;

            case "cfD3Scatter":
              func = cfD3Scatter;
              break;

            default:
              func = undefined;
              break;
          }

          return func;
        },
        // string2function
        assemblePlots: function assemblePlots(plotsData) {
          var h = importExportFunctionality.loadSession.helpers; // Assemble the plots.

          var plots = [];

          for (var j = 0; j < plotsData.length; j++) {
            var plotToPush = {
              plotFunc: h.string2function(plotsData[j].type),
              layout: {
                title: plotsData[j].title,
                colWidth: 4,
                height: 300
              },
              data: {
                cfData: dbsliceData.data,
                xProperty: plotsData[j].xProperty,
                yProperty: plotsData[j].yProperty,
                cProperty: plotsData[j].cProperty
              }
            }; // scatter plots need the additional ctrl in layout.

            if (plotsData[j].type == 'cfD3Scatter') {
              plotToPush.layout.ctrl = {
                data: dbsliceData.data,
                svg: undefined,
                view: {
                  xVar: plotsData[j].xProperty,
                  yVar: plotsData[j].yProperty,
                  cVar: undefined,
                  gVar: undefined,
                  dataAR: undefined,
                  viewAR: undefined,
                  t: undefined
                },
                tools: {
                  xscale: undefined,
                  yscale: undefined,
                  cscale: undefined
                },
                format: {
                  margin: {
                    top: 17,
                    right: 25,
                    bottom: 20,
                    left: 20
                  },
                  axesMargin: {
                    left: 25,
                    bottom: 20
                  },
                  width: undefined,
                  height: 300,
                  transitionTime: 500
                }
              };
            } // if


            plots.push(plotToPush);
          }

          return plots;
        },
        // assemblePlots
        assemblePlotRows: function assemblePlotRows(plotRowsData) {
          var h = importExportFunctionality.loadSession.helpers; // Loop over all the plotRows.

          var plotRows = [];

          for (var i = 0; i < plotRowsData.length; i++) {
            var plotRowToPush = {
              title: plotRowsData[i].title,
              plots: h.assemblePlots(plotRowsData[i].plots),
              type: plotRowsData[i].type,
              addPlotButton: true
            };
            plotRows.push(plotRowToPush);
          }

          return plotRows;
        } // assemblePlotRows

      } // helpers

    },
    // loadSession
    saveSession: {
      json: function json() {
        // This function should write a session file.
        // It should write which data is used, plotRows, and plots.
        // Should it also write the filter selections made?
        var sessionJson = '';
        write('{"isSessionObject": "true", ');
        write(' "title": "' + dbsliceData.session.title + '", ');
        write(' "plotRows": [');
        var metadataPlotRows = dbsliceData.session.plotRows.filter(function (plotRow) {
          return plotRow.type == "metadata";
        });
        metadataPlotRows.forEach(function (plotRow, i) {
          writePlotRow(plotRow);

          if (i < metadataPlotRows.length - 1) {
            write(', ');
          } // if

        }); // forEach

        write("]");
        write('}');

        function write(s) {
          sessionJson = sessionJson + s;
        } // write


        function writePlotRow(plotRow) {
          var s = "{";
          s = s + '"title": "' + plotRow.title + '", ';
          s = s + '"type": "' + plotRow.type + '", ';
          s = s + '"plots": [';
          plotRow.plots.forEach(function (plot, i) {
            // AK: HACK!!
            if (plot.plotFunc.name == "cfD3Scatter") {
              plot.data.xProperty = plot.layout.ctrl.view.xVar;
              plot.data.yProperty = plot.layout.ctrl.view.yVar;
            } // if


            s = s + '{';
            s = s + '"type": "' + plot.plotFunc.name + '", ';
            s = s + '"title": "' + plot.layout.title + '", ';
            s = s + '"xProperty": "' + plot.data.xProperty + '"';

            if (plot.data.yProperty !== undefined) {
              s = s + ', ';
              s = s + '"yProperty": "' + plot.data.yProperty + '"';
            } // if


            s = s + '}';

            if (i < plotRow.plots.length - 1) {
              s = s + ', ';
            } // if

          }); // forEach

          s = s + ']';
          s = s + '}';
          sessionJson = sessionJson + s;
        } // writePlotRow


        return sessionJson;
      },
      // json
      createSessionFileForSaving: function createSessionFileForSaving() {
        var textFile = null;

        var makeTextFile = function makeTextFile(text) {
          var data = new Blob([text], {
            type: 'text/plain'
          }); // If we are replacing a previously generated file we need to
          // manually revoke the object URL to avoid memory leaks.

          if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
          } // if


          textFile = window.URL.createObjectURL(data);
          return textFile;
        }; // makeTextFile


        var lnk = document.getElementById('saveSession');
        lnk.href = makeTextFile(importExportFunctionality.saveSession.json());
        lnk.style.display = 'block';
      } // createSessionFileForSaving

    },
    // saveSession
    helpers: {
      variableMatching: function variableMatching() {// Functionality that allows the user to resolve any issues between datasets with different names that hold th esame quantities.
      },
      // variableMatching
      collectPlotProperties: function collectPlotProperties() {
        // Collect all the variables in the current plots (by type!), the variables in the current data, and return them.
        // If there is a variable in th eplot, but not in hthe new data it must either be given, or the plot needs to be removed.
        // First go through all the metadata plots and getthe variables. This is probably more conveniently done through the dbsliceData object.
        var metadataPlotRows = dbsliceData.session.plotRows.filter(function (plotRow) {
          return plotRow.type == "metadata";
        }); // filter

        var plotProperties = [];
        metadataPlotRows.forEach(function (metadataPlotRow) {
          metadataPlotRow.plots.forEach(function (metadataPlot) {
            plotProperties.push(metadataPlot.data.xProperty);

            if (metadataPlot.data.yProperty !== undefined) {
              plotProperties.push(metadataPlot.data.yProperty);
            } // if

          }); // forEach
        }); // forEach
        // Remove any duplicates: 

        plotProperties = unique(plotProperties);
        return plotProperties;

        function unique(d) {
          // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
          function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
          } // unique


          return d.filter(onlyUnique);
        } // unique

        /*
        // CURRENTLY THE FLOW FIELD PLOTS DO NOT FEATURE SEPARATE PROPERTIES, THEREFORE IT's NOT REALLY POSSIBLE TO CAPTURE THIS FOR NOW.
        
        // Now go through the flow field plots and get the variables. These will either be plots with data from multiple plots on them (slice), or a single case (contour).
        var plotterPlotRows = dbsliceData.session.plotRows.filter(function(plotRow){
        	return plotRow.type == "plotter"
        }) // filter
        
        var plotProperties = []
        plotterPlotRows.forEach(function(plotterPlotRow){
        	
        	plotterPlotRow.plots.forEach(function(plotterPlot){
        		plotProperties.push( plotterPlot.d )
        	}) // forEach
        }) // forEach
        */
        // console.log(metadataPlotRow)
        // console.log(d)
        // console.log(dbsliceData)

      },
      // collectPlotProperties
      onDataAndSessionChangeResolve: function onDataAndSessionChangeResolve() {
        // The data dominates what can be plotted. Perform a check between the session and data to see which properties are available, and if the plots want properties that are not in the data they are removed.
        // Resolve any issues between existing plots and data by removing any plots with variables that are not in the data.
        var plotProperties = importExportFunctionality.helpers.collectPlotProperties(); // Find the variables that are on hte plots, but not in the data.

        var incompatibleProperties = plotProperties.filter(function (property) {
          var isInMetadata = dbsliceData.data.metaDataProperties.includes(property);
          var isInData = dbsliceData.data.dataProperties.includes(property);
          return !(isInMetadata || isInData);
        }); // filter
        // Furthermore it is possible that the user has removed all data. In this case just remove all the plots, by specifying all plot properties as incompatible.

        if (dbsliceData.data !== undefined) {
          if (dbsliceData.data.fileDim.top(Infinity).length < 1) {
            incompatibleProperties = plotProperties;
          } // if					

        } // if
        // Loop through all incompatible properties, and remove the plots that are not needed.


        dbsliceData.session.plotRows.forEach(function (plotRow) {
          if (plotRow.type == "metadata") {
            var removeIndex = plotRow.plots.map(function (plot) {
              // If the plot features an incompatible metadata or data property return true.	
              return incompatibleProperties.includes(plot.data.xProperty) || incompatibleProperties.includes(plot.data.yProperty);
            }); // map

            for (var i = removeIndex.length - 1; i >= 0; i--) {
              // Negative loop facilitates the use of splice. Otherwise the indexes get messed up by splice as it reindexes the array upon removal.
              if (removeIndex[i]) {
                plotRow.plots.splice(i, 1);
              } // if

            } // for

          } // if

        }); // forEach
      } // onDataChangeResolve

    } // helpers

  }; // importExportFunctionality

  var cfD3Scatter = {
    name: "cfD3Scatter",
    make: function make(element, data, layout) {
      // Major differences from the standalone example to the implemented one:
      // 1.) The input arguments to the make have been changed to (element, data, layout)
      // 2.) The data is now an object containing the selected inputs by the user, as well as the crossfilter object governing the data. Therefore the internal access to the data has to be changed. This is done on point of access to the data to ensure that the crossfilter selections are correctly applied.
      // 3.) Some actions are performed from outside of the object, therefore the ctrl has to be passed in. That is why the ctrl is hidden in layout now.
      // Setup the object that will internally handle all parts of the chart.

      /*
      var ctrl = {
      	data: data.cfData,
      	svg: undefined,
      	view: {xVar: data.xProperty,
      		   yVar: data.yProperty,
      		   cVar: "speed",
      		   gVar: "speed",
      		   dataAR: undefined,
      		   viewAR: undefined,
      		   t: undefined},
      	tools: {xscale: undefined,
      			yscale: undefined,
      			cscale: undefined},
      	format: {
      		margin: {top: 17, right: 25, bottom: 20, left: 20},
      		axesMargin: {left: 25, bottom: 20},
      		width: undefined,
      		height: layout.height,
      		transitionTime: 500
      	}
      } // ctrl
      */
      var ctrl = layout.ctrl;
      var b = cfD3Scatter;
      var s = cfD3Scatter.setupPlot;
      var i = cfD3Scatter.addInteractivity;
      var figure = d3.select(element); // Add the manual selection toggle to its title.

      i.updatePlotTitleControls(element); // Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.

      s.setupPlotWithInteractiveAxes(ctrl, figure); // Create the svg with all required children container groups and append it to the appropriate backbone div.

      s.curateSvg(figure, ctrl); // Add in the controls for the y axis.

      s.appendVerticalSelection(figure.select(".leftAxisControlGroup"), ctrl); // Add in the controls for the x axis.

      s.appendHorizonalSelection(figure.select(".bottomAxisControlGroup"), ctrl); // Setup the scales for plotting

      s.setupPlotTools(ctrl); // Scatter plot specific interactivity.

      i.addButtonDropdownTools.make(figure.select(".bottomLeftControlGroup"), ctrl);
      i.addAxisScaling(ctrl); // General interactivity

      i.addZooming(ctrl); // Draw the actual plot. The first two inputs are dummies.

      b.render(element, data, layout);
    },
    // make
    render: function render(element, data, layout) {
      // The first two inputs are dummies.
      var ctrl = layout.ctrl;
      var h = cfD3Scatter.helpers;
      var i = cfD3Scatter.addInteractivity; // Check to adjust the width of the plot in case of a redraw.

      cfD3Scatter.setupPlot.rescaleSvg(ctrl); // Get the data to draw.

      var pointData = h.getPointData(ctrl); // Accessor functions

      var accessor = h.getAccessors(ctrl); // Deal with the points

      var points = ctrl.svg.select(".data").selectAll("circle").data(pointData);
      points.enter().append("circle").attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", accessor.c).style("opacity", 1).attr("clip-path", "url(#" + ctrl.svg.select("clipPath").attr("id") + ")").attr("task-id", accessor.id);
      points.transition().attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", accessor.c).attr("task-id", accessor.id);
      points.exit().remove(); // Deal with the lines markup. Note that in case the data in the plot changes these might have to increase in size. Maybe just redo the lines in that case?

      i.addButtonDropdownTools.options.groupLine.updateLines(ctrl, ctrl.format.transitionTime); // Add in the axes

      h.axes.update(ctrl); // Highlight any manually selected tasks.

      i.addSelection(ctrl);
      h.updateManualSelections(); // Add in the interactivity of the tooltips

      i.addPointTooltip(ctrl);
      i.addLineTooltip(ctrl); // AK: HACK
      // New session file needs to be written in case the variables changed..

      importExportFunctionality.saveSession.createSessionFileForSaving();
    },
    // render
    update: function update(element, data, layout) {
      // Needs to accept element, data, layout... Make an imposter function for now?? Or write a function that rebuilds the control?? Or both... The first two are dummy inputs.
      var ctrl = layout.ctrl; // Do the update maually (outside of render) in order to remove the transition

      var h = cfD3Scatter.helpers;
      var i = cfD3Scatter.addInteractivity; // Check to adjust the width of the plot in case of a redraw.

      cfD3Scatter.setupPlot.rescaleSvg(ctrl); // Accessor functions

      var accessor = h.getAccessors(ctrl); // Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.

      /*
      ctrl.svg
        .select(".data")
        .selectAll( "circle" )
      	.attr("r", 5)
      	.attr("cx", accessor.x )
      	.attr("cy", accessor.y )
      	.attr("task-id", accessor.id )
      	.style("fill", accessor.c )
      */
      /////////////////////////////////////////////////////////////////
      // Get the data to draw.

      var pointData = h.getPointData(ctrl); // Deal with the points

      var points = ctrl.svg.select(".data").selectAll("circle").data(pointData);
      points.enter().append("circle").attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", accessor.c).style("opacity", 1).attr("clip-path", "url(#" + ctrl.svg.select("clipPath").attr("id") + ")").attr("task-id", accessor.id);
      points.attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", accessor.c).attr("task-id", accessor.id);
      points.exit().remove(); /////////////////////////////////////////////////////////////////
      // Update the markup lines

      i.addButtonDropdownTools.options.groupLine.updateLines(ctrl, 0); // Update the axes

      h.axes.update(ctrl); // Highlight any manually selected tasks.

      i.addSelection(ctrl);
      h.updateManualSelections(); // Add in the interactivity of the tooltips

      i.addPointTooltip(ctrl);
      i.addLineTooltip(ctrl); // AK: HACK
      // New session file needs to be written in case the variables changed..

      importExportFunctionality.saveSession.createSessionFileForSaving();
    },
    // update
    setupPlot: {
      // This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
      setupPlotWithInteractiveAxes: function setupPlotWithInteractiveAxes(ctrl, plot) {

        var leftControls = plot.append("div").attr("class", "leftAxisControlGroup").attr("style", "width: " + ctrl.format.margin.left + "px; height: 100%; float: left"); // Main plot with its svg.

        plot.append("div").attr("class", "plotContainer").attr("style", "margin-left: " + ctrl.format.margin.left + "px"); // Bottom left corner div

        plot.append("div").attr("class", "bottomLeftControlGroup").attr("style", "width: " + ctrl.format.margin.left + "px; height: " + ctrl.format.margin.right + "px; float:left"); // Bottom controls

        plot.append("div").attr("class", "bottomAxisControlGroup").attr("style", "margin-left: " + ctrl.format.margin.left + "px; height: " + ctrl.format.margin.right + "px;");
      },
      // setupPlotWithInteractiveAxes
      appendVerticalSelection: function appendVerticalSelection(container, ctrl) {
        var s = container.append("select").attr("class", "select-vertical custom-select");
        ctrl.data.dataProperties.forEach(function (d) {
          s.append("option").html(d);
        });
        container.append("text").text(ctrl.view.yVar).attr("class", "txt-vertical");
        s.on("change", function () {
          var selectedVar = this.value; // Change the text.

          d3.select(this.parentElement).select(".txt-vertical").text(selectedVar); // Update the y-variable for the plot.

          ctrl.view.yVar = selectedVar; // Reset the AR values.

          ctrl.view.dataAR = undefined;
          ctrl.view.viewAR = undefined;
          cfD3Scatter.setupPlot.setupPlotTools(ctrl); // Create dummies.

          var dummyElement = '';
          var dummyData = '';
          var dummyLayout = {
            ctrl: ctrl
          };
          cfD3Scatter.render(dummyElement, dummyData, dummyLayout);
        });
      },
      // appendVerticalSelection
      appendHorizonalSelection: function appendHorizonalSelection(container, ctrl) {
        var s = container.append("select").attr("class", "custom-select").attr("dir", "rtl").attr("style", 'float:right;');
        ctrl.data.dataProperties.forEach(function (d) {
          s.append("option").attr("dir", "ltr").html(d);
        });
        s.on("change", function () {
          var selectedVar = this.value; // Update the y-variable for the plot.

          ctrl.view.xVar = selectedVar; // Reset the AR values.

          ctrl.view.dataAR = undefined;
          ctrl.view.viewAR = undefined;
          cfD3Scatter.setupPlot.setupPlotTools(ctrl); // Create dummies.

          var dummyElement = '';
          var dummyData = '';
          var dummyLayout = {
            ctrl: ctrl
          };
          cfD3Scatter.render(dummyElement, dummyData, dummyLayout);
        });
      },
      // appendHorizonalSelection
      curateSvg: function curateSvg(figure, ctrl) {
        var plotContainer = figure.select(".plotContainer"); // These are margins of the entire drawing area including axes.

        var margin = ctrl.format.margin;
        var axesMargin = ctrl.format.axesMargin; // Width of the plotting area is the width of the div intended to hold the plot (.plotContainer).

        var width = ctrl.format.width;

        if (width == undefined) {
          width = plotContainer.node().offsetWidth - margin.left - margin.right;
        } // If undefined the height is the same as width


        var height = ctrl.format.height;

        if (height == undefined) {
          height = width;
        } // The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.


        var plotWidth = width - axesMargin.left - 20;
        var plotHeight = height - axesMargin.bottom - margin.top; // Outer svg. This is required to separate the plot from the axes. The axes need to be plotted onto an svg, but if the zoom is applied to the same svg then the zoom controls work over the axes. If rescaling of individual axes is needed the zoom must therefore be applied to a separate, inner svg.
        // This svg needs to be translated to give some space to the controls on the y-axes.

        var svg = plotContainer.append("svg").attr("width", width).attr("height", height).attr("plotWidth", plotWidth).attr("plotHeight", plotHeight).attr("transform", makeTranslate(margin.left, 0)); // Inner svg. This will now hold several groups, such as g.axis--x, g.axis--y, g.markup, g.data, clipPath,...

        var plotArea = svg.append("svg").attr("class", "plotArea"); // 25, 20 are margins for the axes. If too small the ticks will be obscured. This translation needs to be applied to all elements in hte inner svg. The grouping of graphic primitives in "g" is useful, as any transformation applied to a g is applied to its children automatically.

        var axesTranslate = makeTranslate(axesMargin.left, axesMargin.bottom); // Make a group that will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. This group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.

        plotArea.append("g").attr("class", "markup").attr("transform", axesTranslate).append("rect").attr("width", plotWidth).attr("height", plotHeight).style("fill", "rgb(255,255,255)"); // Group holding the primary data representations. Needs to be after g.markup, otherwise the white rectangle hides all the elements.

        plotArea.append("g").attr("class", "data").attr("transform", axesTranslate); // The zoom needs some restrictions on where it can draw, which is why the clipPath is added. Not sure why this one doesn't need to be translated - if it is the clipping is done wrong.

        svg.append("clipPath").attr("id", "zoomClip").append("rect").attr("width", plotWidth).attr("height", plotHeight); // Group for the x axis

        svg.append("g").attr("class", "axis--x").attr("transform", makeTranslate(axesMargin.left, axesMargin.bottom + plotHeight)); // Group for the y axis

        svg.append("g").attr("class", "axis--y").attr("transform", axesTranslate); // Update the control object.

        ctrl.svg = svg;

        function makeTranslate(x, y) {
          return "translate(" + [x, y].join() + ")";
        } // makeTranslate	

      },
      // curateSvg
      rescaleSvg: function rescaleSvg(ctrl) {
        // These are margins of the entire drawing area including axes.
        var margin = ctrl.format.margin;
        var axesMargin = ctrl.format.axesMargin; // Width of the plotting area is the width of the div intended to hold the plot (.plotContainer).

        var width = ctrl.format.width;

        if (width == undefined) {
          width = ctrl.svg.node().parentElement.parentElement.offsetWidth - margin.left - margin.right;
        } // If undefined the height is the same as width


        var height = ctrl.format.height;

        if (height == undefined) {
          height = width;
        } // The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.


        var plotWidth = width - axesMargin.left - 20;
        var plotHeight = height - axesMargin.bottom - margin.top; // Outer svg. This is required to separate the plot from the axes. The axes need to be plotted onto an svg, but if the zoom is applied to the same svg then the zoom controls work over the axes. If rescaling of individual axes is needed the zoom must therefore be applied to a separate, inner svg.
        // This svg needs to be translated to give some space to the controls on the y-axes.

        var svg = ctrl.svg.attr("width", width).attr("height", height).attr("plotWidth", plotWidth).attr("plotHeight", plotHeight).attr("transform", makeTranslate(margin.left, 0)); // Inner svg. This will now hold several groups, such as g.axis--x, g.axis--y, g.markup, g.data, clipPath,...

        var plotArea = svg.select(".plotArea"); // 25, 20 are margins for the axes. If too small the ticks will be obscured. This translation needs to be applied to all elements in hte inner svg. The grouping of graphic primitives in "g" is useful, as any transformation applied to a g is applied to its children automatically.

        var axesTranslate = makeTranslate(axesMargin.left, axesMargin.bottom); // Make a group that will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. This group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.

        plotArea.select("g.markup").attr("transform", axesTranslate).select("rect").attr("width", plotWidth).attr("height", plotHeight).style("fill", "rgb(255,255,255)"); // Group holding the primary data representations. Needs to be after g.markup, otherwise the white rectangle hides all the elements.

        plotArea.select("g.data").attr("transform", axesTranslate); // The zoom needs some restrictions on where it can draw, which is why the clipPath is added. Not sure why this one doesn't need to be translated - if it is the clipping is done wrong.

        svg.select("clipPath").attr("id", "zoomClip").select("rect").attr("width", plotWidth).attr("height", plotHeight); // Update the scale domains.

        var ranges = cfD3Scatter.setupPlot.findPlotDimensions(svg);
        ctrl.tools.xscale.range(ranges.x);
        ctrl.tools.yscale.range(ranges.y);

        function makeTranslate(x, y) {
          return "translate(" + [x, y].join() + ")";
        } // makeTranslate	

      },
      // rescaleSvg
      setupPlotTools: function setupPlotTools(ctrl) {
        // The plot tools are either setup based on data (e.g. upon initialisation), or on where the user has navigated to.
        var bounds = cfD3Scatter.setupPlot.getPlotBounds(ctrl); // Create the required scales.

        ctrl.tools.xscale = d3.scaleLinear().range(bounds.range.x).domain(bounds.domain.x);
        ctrl.tools.yscale = d3.scaleLinear().range(bounds.range.y).domain(bounds.domain.y); // The internal color scale might change due to the user changing hte data, but this should not reset the color scale.

        if (ctrl.tools.cscale == undefined) {
          ctrl.tools.cscale = function () {
            return "cornflowerblue";
          };
        } // if

      },
      // setupPlotTools
      getPlotBounds: function getPlotBounds(ctrl) {
        // This function should determine the domain of the plot and use it to control the plots aspect ratio.
        var h = cfD3Scatter.setupPlot; // Get the data to draw.

        var pointData = cfD3Scatter.helpers.getPointData(ctrl); // Get the bounds based on the data.

        var domain = h.findSeriesMinMax(pointData, ctrl.view.xVar, ctrl.view.yVar);
        var range = h.findPlotDimensions(ctrl.svg);

        if (ctrl.view.viewAR !== undefined) {
          // Adjust the plot domain to preserve an aspect ratio of 1, but try to use up as much of the drawing area as possible.
          h.adjustAR(range, domain, ctrl.view.viewAR);
        } else {
          // The aspect ratio is the ratio between pixels per unit of y axis to the pixels per unit of the x axis. As AR = 2 is expected to mean that the n pixels cover 2 units on y axis, and 1 unit on x axis teh actual ration needs to be ppdx/ppdy.
          ctrl.view.dataAR = h.calculateAR(range, domain);
          ctrl.view.viewAR = h.calculateAR(range, domain);
        } // switch
        // Finally, adjust the plot so that there is some padding on the sides of the plot.


        h.adjustPadding(range, domain);
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

      },
      // 
      findPlotDimensions: function findPlotDimensions(svg) {
        return {
          x: [0, Number(svg.attr("plotWidth"))],
          y: [Number(svg.attr("plotHeight")), 0]
        };
      },
      // findPlotDimensions
      findSeriesMinMax: function findSeriesMinMax(data, xVar, yVar) {
        // Dealing with single array.
        var xMinVal = d3.min(data, xAccessor);
        var yMinVal = d3.min(data, yAccessor);
        var xMaxVal = d3.max(data, xAccessor);
        var yMaxVal = d3.max(data, yAccessor);
        return {
          x: [xMinVal, xMaxVal],
          y: [yMinVal, yMaxVal]
        };

        function xAccessor(d) {
          return d[xVar];
        }

        function yAccessor(d) {
          return d[yVar];
        }
      } // findSeriesMinMax

    },
    // setupPlot
    addInteractivity: {
      addButtonDropdownTools: {
        make: function make(container, ctrl) {
          // Shorthand handles.
          var h = cfD3Scatter.addInteractivity.addButtonDropdownTools;
          var o = h.options;
          var makeOptions = h.helpers.getMetadataOptions; // Make the control for the menu

          var plotOptionGroups = [{
            name: "Color",
            options: makeOptions(ctrl, o.groupColor)
          }, {
            name: "Group",
            options: makeOptions(ctrl, o.groupLine.make)
          }, {
            name: "AR",
            options: [],
            event: function event() {
              o.toggleAR(ctrl);
            }
          }]; // Makethe menu

          h.addAccordionDropdownMenu(container, plotOptionGroups);
        },
        // make
        addAccordionDropdownMenu: function addAccordionDropdownMenu(container, optionGroups) {
          // Add in the container for the whole group.
          var menuWrapper = container.append("div").attr("class", "dropup dropdown-accordion"); // Add in the toggle button

          menuWrapper.append("button").attr("class", "btn dropdown-toggle").attr("data-toggle", "dropdown").html("O").append("span").attr("class", "glyphicon glyphicon-option-vertical"); // Add in the actual menu

          var menu = menuWrapper.append("ul").attr("class", "dropdown-menu dropup"); // Add in the groups

          var groups = menu.selectAll("div").data(optionGroups).enter().append("div").attr("class", "dropup");
          var s = "panel-collapse collapse";
          groups.each(function (d) {
            var div = d3.select(this);
            var style = "list-group-item";
            var type = d.options.length < 1 ? "option" : "collapse"; // Append the group items
            // list-group-item | menu-item

            div.append("p").attr("class", style).attr("type", type).html(d.name); // Append the group options

            var submenu = div.append("ul").attr("class", s);
            submenu.selectAll("li").data(d.options).enter().append("li").attr("class", style).html(function (option) {
              return option.name;
            }).on("click", function (option) {
              var isAlreadyActive = d3.select(this).attr("class") == style + " active"; // Set the active status.

              submenu.selectAll("li").attr("class", style);

              if (!isAlreadyActive) {
                d3.select(this).attr("class", style + " active");
              } // Fire the option event


              option.event();
            }); // Functionality for empty groups. Note that if all the group headers should have on click events this needs to be coordinated with the prevention of default functionality.

            if (d.event != undefined) {
              div.select("p").on("click", d.event);
            } // if

          }); // each
          // Add the functionality

          container.select('.dropdown-toggle').on('click', function (event) {
            // Collapse accordion every time dropdown is shown
            d3.select(this.parentElement).selectAll(".panel-collapse").attr("class", s + " hide");
          });
          container.select('.dropdown-menu').selectAll("p[type='collapse']").on('click', function () {
            // Stop the default behaviour.
            d3.event.preventDefault();
            d3.event.stopPropagation(); // Determine the action that should be performed.

            var panel = d3.select(this.parentElement).select(".panel-collapse");
            var action = s + " show";

            if (panel.attr("class") == action) {
              action = s + " hide";
            } // if
            // Hide all the collapsible elements.


            d3.select(this.parentElement.parentElement).selectAll(".panel-collapse").attr("class", s + " hide"); // Toggle the collapse

            panel.attr("class", action);
          });
        },
        // addAccordionDropdownMenu
        options: {
          groupLine: {
            make: function make(ctrl, varName) {
              // Shorthand handle
              var h = cfD3Scatter.addInteractivity.addButtonDropdownTools.options.groupLine; // Options to cover

              var noLines = ctrl.svg.select(".markup").selectAll("path").empty();
              var linesVarSame = ctrl.view.gVar == varName; // Update the control object.

              ctrl.view.gVar = varName;

              if (noLines) {
                // 1: no existing lines - draw new lines
                h.drawLines(ctrl);
              } else if (linesVarSame) {
                // 2: existing lines - same var -> remove lines
                h.removeLines(ctrl); // The lines were toggled off. Reflect in the control object.

                ctrl.view.gVar = undefined;
              } else {
                // 2: existing lines - diff var -> remove and add
                h.replaceLines(ctrl);
              } // if

            },
            // make
            drawLines: function drawLines(ctrl) {
              // Shorthand handles.
              var h = cfD3Scatter.addInteractivity.addButtonDropdownTools; // Get the data to draw.

              var pointData = cfD3Scatter.helpers.getPointData(ctrl); // Retrieve all the series that are needed.

              var s = h.helpers.getUniqueArraySeries(pointData, ctrl.view.gVar); // Now draw a line for each of them.

              var paths = ctrl.svg.select(".markup").selectAll("path").data(s).enter().append("path").attr("stroke", "black").attr("stroke-width", "2").attr("fill", "none").attr("clip-path", "url(#" + ctrl.svg.select("clipPath").attr("id") + ")"); // Do the actual drawing of it in the update part.

              h.options.groupLine.updateLines(ctrl, ctrl.format.transitionTime); // Update the tooltips. These can be missing if new data is added.

              cfD3Scatter.addInteractivity.addLineTooltip(ctrl);
            },
            // drawLines
            removeLines: function removeLines(ctrl) {
              ctrl.svg.select(".markup").selectAll("path").each(function () {
                var totalLength = this.getTotalLength();
                d3.select(this).transition().duration(ctrl.format.transitionTime).ease(d3.easeLinear).attr("stroke-dashoffset", totalLength).on("end", function () {
                  d3.select(this).remove();
                });
              });
            },
            // removeLines
            replaceLines: function replaceLines(ctrl) {
              var h = cfD3Scatter.addInteractivity.addButtonDropdownTools.options.groupLine; // n is a coutner to allow tracking of when all the transitions have finished. This is required as the drawLines should only execute once at teh end.

              var n = 0;
              ctrl.svg.select(".markup").selectAll("path").each(function () {
                n++;
                var totalLength = this.getTotalLength();
                d3.select(this).transition().duration(ctrl.format.transitionTime).ease(d3.easeLinear).attr("stroke-dashoffset", totalLength).on("end", function () {
                  n--;
                  d3.select(this).remove();

                  if (n == 0) {
                    h.drawLines(ctrl); // The lines were removed, therefore new tooltips are needed.

                    cfD3Scatter.addInteractivity.addLineTooltip(ctrl);
                  } // if

                }); // on
              }); // each
            },
            // replaceLines
            updateLines: function updateLines(ctrl, t) {
              // Accessor functions
              var accessor = cfD3Scatter.helpers.getAccessors(ctrl);
              var line = d3.line().curve(d3.curveCatmullRom).x(accessor.x).y(accessor.y);
              var paths = ctrl.svg.select(".markup").selectAll("path"); // The whole animation uses the framework of dashed lines. The total length of the desired line is set for the length of the dash and the blank space. Then the transition starts offsetting the start point of the dash to make the 'movement'.	

              paths.each(function () {
                var path = d3.select(this).attr("d", line);
                var totalLength = path.node().getTotalLength();
                path.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(t).ease(d3.easeLinear).attr("stroke-dashoffset", 0);
              });
            } // updateLines

          },
          // groupLine
          groupColor: function groupColor(ctrl, varName) {
            // This functionality relies on the update to perform the actual change, and only configures the tools for the update to have the desired effect.
            // Setup the color function.
            if (ctrl.tools.cscale() == "cornflowerblue") {
              // The default behaviour of d3 color scales is that they extend the domain as new items are passed to it. Even if the domain is fixed upfront, the scale will extend its domain when new elements are presented to it.
              ctrl.tools.cscale = d3.scaleOrdinal(d3.schemeCategory10);
            } else if (ctrl.view.cVar != varName) {
              ctrl.tools.cscale = d3.scaleOrdinal(d3.schemeCategory10);
            } else {
              ctrl.tools.cscale = function () {
                return "cornflowerblue";
              };
            } // if


            ctrl.view.cVar = varName; // Create dummies.

            var dummyElement = '';
            var dummyData = '';
            var dummyLayout = {
              ctrl: ctrl
            };
            cfD3Scatter.update(dummyElement, dummyData, dummyLayout);
          },
          // groupColor
          toggleAR: function toggleAR(ctrl) {
            // This should stick to the ange specified by the user.
            if (ctrl.view.viewAR == 1) {
              ctrl.view.viewAR = ctrl.view.dataAR;
            } else {
              ctrl.view.viewAR = 1;
            } // if
            // When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
            // How many pixels per dx=1


            var xRange = ctrl.tools.xscale.range();
            var yRange = ctrl.tools.yscale.range();
            var xDomain = ctrl.tools.xscale.domain();
            var yDomain = ctrl.tools.yscale.domain();
            var xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0]);
            var yAR = xAR / ctrl.view.viewAR;
            var yDomainRange = [yRange[0] - yRange[1]] / yAR;
            var yDomain_ = [yDomain[0], yDomain[0] + yDomainRange];
            ctrl.tools.yscale.domain(yDomain_); // Create dummies.

            var dummyElement = '';
            var dummyData = '';
            var dummyLayout = {
              ctrl: ctrl
            };
            cfD3Scatter.render(dummyElement, dummyData, dummyLayout); // t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.

            ctrl.view.t = -1;
          } // toggleAR

        },
        // options
        helpers: {
          getMetadataOptions: function getMetadataOptions(ctrl, _event) {
            var options = [];
            ctrl.data.metaDataProperties.forEach(function (d) {
              options.push({
                name: d,
                event: function event() {
                  // this is the option object being created here.
                  _event(ctrl, this.name);
                }
              });
            }); // forEach

            return options;
          },
          // getMetadataOptions
          getUniqueArrayValues: function getUniqueArrayValues(array, varName) {
            // This function returns all the unique values of property 'varName' from an array of objects 'array'.
            var u = [];
            array.forEach(function (d) {
              if (u.indexOf(d[varName]) == -1) {
                u.push(d[varName]);
              } // if

            });
            return u;
          },
          // getUniqueArrayValues
          getUniqueArraySeries: function getUniqueSeries(array, varName) {
            // Shorthand handles.
            var h = cfD3Scatter.addInteractivity.addButtonDropdownTools.helpers; // First get the unique values of the variable used for grouping.

            var u = h.getUniqueArrayValues(array, varName);
            var s = [];
            u.forEach(function (groupName) {
              var groupData = array.filter(function (d) {
                return d[varName] == groupName;
              });
              s.push(groupData);
            });
            return s;
          } // getUniqueSeries

        } // helpers

      },
      // addButtonDropdownTools
      addAxisScaling: function addAxisScaling(ctrl) {
        var svg = ctrl.svg;
        var mw = Number(svg.attr("plotWidth"));
        var downx = Math.NaN;
        var downscalex;
        var mh = Number(svg.attr("plotHeight"));
        var downy = Math.NaN;
        var downscaley;
        svg.select(".axis--x").on("mousedown", function (d) {
          var p = d3.event.x;
          downx = ctrl.tools.xscale.invert(p);
          downscalex = ctrl.tools.xscale;
        });
        svg.select(".axis--y").on("mousedown", function (d) {
          var p = d3.event.y;
          downy = ctrl.tools.yscale.invert(p);
          downscaley = ctrl.tools.yscale;
        }); // attach the mousemove and mouseup to the body
        // in case one wonders off the axis line

        svg.on("mousemove", function (d) {
          if (!isNaN(downx)) {
            var px = d3.event.x;
            var dpx = d3.event.dx;

            if (dpx != 0) {
              ctrl.tools.xscale.domain([downscalex.domain()[0], mw * (downx - downscalex.domain()[0]) / px + downscalex.domain()[0]]);
            } // Create dummies.


            var dummyElement = '';
            var dummyData = '';
            var dummyLayout = {
              ctrl: ctrl
            };
            cfD3Scatter.update(dummyElement, dummyData, dummyLayout);
          }

          if (!isNaN(downy)) {
            var py = d3.event.y;
            var dpy = d3.event.dy;

            if (dpy != 0) {
              ctrl.tools.yscale.domain([downscaley.domain()[0], mh * (downy - downscaley.domain()[0]) / (mh - py) + downscaley.domain()[0]]);
            } // Create dummies.


            var dummyElement = '';
            var dummyData = '';
            var dummyLayout = {
              ctrl: ctrl
            };
            cfD3Scatter.update(dummyElement, dummyData, dummyLayout);
          }
        }).on("mouseup", function (d) {
          downx = Math.NaN;
          downy = Math.NaN;
          ctrl.view.t = -1;
        }); // The aspect ratio still needs to be recalculated
      },
      // addAxisScaling
      addZooming: function addZooming(ctrl) {
        // The current layout will keep adding on zoom. Rethink this for more responsiveness of the website.
        var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
        ctrl.svg.select(".plotArea").call(zoom);
        ctrl.svg.select(".plotArea").on("dblclick.zoom", null); // As of now (23/03/2020) the default zoom behaviour (https://d3js.org/d3.v5.min.js) does not support independantly scalable y and x axis. If these are implemented then on first zoom action (panning or scaling) will have a movement as the internal transform vector (d3.event.transform) won't corespond to the image. 
        // The transformation vector is based on the domain of the image, therefore any manual scaling of the domain should also change it. The easiest way to overcome this is to apply the transformation as a delta to the existing state.
        // ctrl.view.t is where the current state is stored. If it is set to -1, then the given zoom action is not performed to allow any difference between d3.event.transform and ctrl.view.t due to manual rescaling of the domain to be resolved.

        ctrl.view.t = d3.zoomIdentity;

        function zoomed() {
          d3.selectAll(".d3-tip").remove(); // Get the current scales, and reshape them back to the origin.

          var t = d3.event.transform;
          var t0 = ctrl.view.t; // Check if there was a manual change of the domain

          if (t0 == -1) {
            t0 = t;
          } // Hack to get the delta transformation.


          var dt = d3.zoomIdentity;
          dt.k = t.k / t0.k;
          dt.x = t.x - t0.x;
          dt.y = t.y - t0.y; // Simply rescale the axis to incorporate the delta event.  

          ctrl.tools.xscale = dt.rescaleX(ctrl.tools.xscale);
          ctrl.tools.yscale = dt.rescaleY(ctrl.tools.yscale); // Update the plot
          // Create dummies.

          var dummyElement = '';
          var dummyData = '';
          var dummyLayout = {
            ctrl: ctrl
          };
          cfD3Scatter.update(dummyElement, dummyData, dummyLayout);
          ctrl.view.t = t;
        } // zoomed

      },
      // addZooming
      addLineTooltip: function addLineTooltip(ctrl) {
        // This controls al the tooltip functionality.
        var lines = ctrl.svg.select(".markup").selectAll("path");
        lines.on("mouseover", tipOn).on("mouseout", tipOff);
        var tip_ = d3.selectAll(".d3-tip[type=lineTooltip]");

        if (!tip_.empty()) {
          tip_.remove();
        } // if


        var tip = createTip();

        function createTip() {
          // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
          var tip = d3.tip().attr('class', 'd3-tip').attr("type", "lineTooltip").offset([-15, 0]).html(function (d) {
            return "<span>" + [ctrl.view.gVar, '=', d[0][ctrl.view.gVar]].join(' ') + "</span>";
          }); // To control tip location another element must be added onto the svg. This can then be used as an anchor for the tooltip.

          var anchorPoint = ctrl.svg.select(".markup").append("g").style("display", "none").append("circle").attr("class", "anchorPoint").attr("r", 1);
          ctrl.svg.call(tip);
          return tip;
        } // createTip


        function tipOn(d) {
          lines.style("opacity", 0.2);
          d3.select(this).style("opacity", 1.0).style("stroke-width", "4px");
          var anchorPoint = ctrl.svg.select(".markup").select(".anchorPoint").attr("cx", d3.mouse(this)[0]).attr("cy", d3.mouse(this)[1]);
          tip.show(d, anchorPoint.node());
        }

        function tipOff(d) {
          lines.style("opacity", 1.0);
          d3.select(this).style("stroke-width", "2.5px");
          tip.hide();
        }
      },
      // addLineTooltip
      addPointTooltip: function addPointTooltip(ctrl) {
        // This controls al the tooltip functionality.
        var points = ctrl.svg.selectAll("circle");
        points.on("mouseover", tipOn).on("mouseout", tipOff); // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.

        var tip = d3.tip().attr('class', 'd3-tip').attr("type", "pointTooltip").offset([-10, 0]).html(function (d) {
          return "<span>" + d.taskId + "</span>";
        });
        ctrl.svg.call(tip);

        function tipOn(d) {
          points.style("opacity", 0.2);
		  
          d3.select(this).style("opacity", 1.0).attr("r", 7);
          tip.show(d);
          crossPlotHighlighting.on(d, "cfD3Scatter");
        }

        function tipOff(d) {
          points.style("opacity", 1);
          d3.select(this).attr("r", 5);
          tip.hide();
          crossPlotHighlighting.off(d, "cfD3Scatter");
        }
      },
      // addPointTooltip
      // Legacy
      addSelection: function addSelection(ctrl) {
        // This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
        var points = ctrl.svg.select("g.data").selectAll("circle");
        points.on("click", selectPoint);

        function selectPoint(d) {
          // Toggle the selection
          var p = dbsliceData.data.scatterManualSelectedTasks; // Is this point in the array of manually selected tasks?

          var isAlreadySelected = p.indexOf(d.taskId) > -1;

          if (isAlreadySelected) {
            // The poinhas currently been selected, but must now be removed
            p.splice(p.indexOf(d.taskId), 1);
          } else {
            p.push(d.taskId);
          } // if
          // Highlight the manually selected options.


          cfD3Scatter.helpers.updateManualSelections();
        } // selectPoint

      },
      // addSelecton
      addToggle: function addToggle(element) {
        // THIS IS THE TOGGLE.
        // Additional styling was added to dbslice.css to control the appearance of the toggle.
        var controlGroup = d3.select(element.parentElement).select(".plotTitle").select(".ctrlGrp");
        var toggleGroup = controlGroup.append("label").attr("class", "switch float-right");
        var toggle = toggleGroup.append("input").attr("type", "checkbox");
        toggleGroup.append("span").attr("class", "slider round"); // Add it's functionality.

        toggle.on("change", function () {
          var currentVal = this.checked; // All such switches need to be activated.

          var allToggleSwitches = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']").selectAll("input[type='checkbox']");
          allToggleSwitches.each(function () {
            this.checked = currentVal; // console.log("checking")
          }); // Update filters

          cfUpdateFilters(dbsliceData.data);
          render(dbsliceData.elementId, dbsliceData.session);
        });
      },
      // addToggle
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        // Remove any controls in the plot title.
        plotHelpers.removePlotTitleControls(element); // Add the toggle to switch manual selection filter on/off

        cfD3Scatter.addInteractivity.addToggle(element);
      } // updatePlotTitleControls

    },
    // addInteractivity
    helpers: {
      axes: {
        update: function update(ctrl) {
          var xAxis = d3.axisBottom(ctrl.tools.xscale).ticks(5);
          var yAxis = d3.axisLeft(ctrl.tools.yscale);
          ctrl.svg.select(".axis--x").call(xAxis);
          ctrl.svg.select(".axis--y").call(yAxis);
          cfD3Scatter.helpers.axes.updateTicks(ctrl);
        },
        // update
        updateTicks: function updateTicks(ctrl) {
          // Update all the axis ticks.
          ctrl.svg.select(".axis--x").selectAll(".tick").selectAll("text").style("cursor", "ew-resize");
          ctrl.svg.select(".axis--y").selectAll(".tick").selectAll("text").style("cursor", "ns-resize");
          ctrl.svg.selectAll(".tick").selectAll("text").on("mouseover", function () {
            d3.select(this).style("font-weight", "bold");
          }).on("mouseout", function () {
            d3.select(this).style("font-weight", "normal");
          });
        } // updateTicks

      },
      // axes
      getAccessors: function getAccessors(ctrl) {
        return {
          x: function xAccessor(d) {
            return ctrl.tools.xscale(d[ctrl.view.xVar]);
          },
          y: function yAccessor(d) {
            return ctrl.tools.yscale(d[ctrl.view.yVar]);
          },
          c: function cAccessor(d) {
            return ctrl.tools.cscale(d[ctrl.view.cVar]);
          },
          id: function idAccessor(d) {
            return d.taskId;
          }
        };
      },
      // getAccessors
      getPointData: function getPointData(ctrl) {
        var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVar);
        var dim = dbsliceData.data.dataDims[dimId];
        var pointData = dim.top(Infinity);
        return pointData;
      },
      // getPointData
      updateManualSelections: function updateManualSelections() {
        // Loop through all scatter plots.
        var allScatterPlots = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']");
        allScatterPlots.each(function () {
          var svg = d3.select(this).select("svg"); // Instead of color change the border??
          // Default style

          svg.selectAll("circle").style("stroke", "none"); // Color in selected circles.

          dbsliceData.data.scatterManualSelectedTasks.forEach(function (d) {
            svg.selectAll("circle[task-id='" + d + "']").style("stroke", "rgb(255, 127, 14)").style("stroke-width", 4);
          }); //forEach
        }); // each
      } // updateManualSelections

    } // helpers

  }; // cfD3Scatter

  function makeNewPlot(plotData, index) {
    var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
    var plot = d3.select(this).append("div").attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper").attr("plottype", plotData.plotFunc.name).append("div").attr("class", "card");
    var plotHeader = plot.append("div").attr("class", "card-header plotTitle");
    plotHeader.append("div").attr("style", "display:inline").html(plotData.layout.title).attr("spellcheck", "false").attr("contenteditable", true); // Add a div to hold all the control elements.

    var controlGroup = plotHeader.append("div").attr("class", "ctrlGrp float-right").attr("style", "display:inline-block");
    var plotBody = plot.append("div").attr("class", "plot").attr("plot-row-index", plotRowIndex).attr("plot-index", index);
    plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout); // Redraw the plot on window resize!

    $(window).resize(function () {
      // Check if the element containing the plot to be resized is still in the visible dom (document). If not, then do not resize anything, as that will cause errors.
      if (document.body.contains(plotBody.node())) {
        // Use the data assigned to the node to execute the redraw.
        d3.select(plotBody.node()).each(function (d) {
          d.layout.isWindowResized = true;
          d.plotFunc.update(plotBody.node(), d.data, d.layout);
          d.layout.isWindowResized = false;
        }); // each
      } // if

    });
  } // makeNewPlot

  function updatePlot(plotData, index) {
    var plot = d3.select(this); // this is the plotBody selection

    plotData.plotFunc.update(plot.node(), plotData.data, plotData.layout);
  } // updatePlot

  var d3LineSeriesRrd = {
    name: "d3LineSeriesRrd",
    margin: {
      top: 20,
      right: 10,
      bottom: 30,
      left: 25
    },
    layout: {
      colWidth: 4,
      height: 400
    },
    colour: [],
    make: function make(element, data, layout) {
      // Remove any controls in the plot title.
      d3LineSeriesRrd.addInteractivity.updatePlotTitleControls(element);
      d3LineSeriesRrd.update(element, data, layout);
      d3LineSeriesRrd.setupSvg(element, data, layout); // Some convenient handles.

      var svg = d3.select(element).select("svg");
      d3LineSeriesRrd.addInteractivity.addZooming(svg, data);
    },
    // make
    update: function update(element, data, layout) {
      // This functions the data in a RRD configuration. This can be clarified out more.
      // Setup the svg.
      d3LineSeriesRrd.setupSvg(element, data, layout); // Some convenient handles.

      var svg = d3.select(element).select("svg"); // Specify the options selected. Figure out a way to change these by the user later on. Don't move them into object properties though!

      var selectedOption = svg.attr("selectedOption");
      var selectedVariable = svg.attr("selectedVariable");

      function labelCreator(d) {
        var label = [d.taskId, selectedOption, selectedVariable].join(' ');
        return label;
      } // labelCreator
      // Create the required scales.


      var xscale = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain(d3LineSeriesRrd.helpers.getDomain(data, selectedOption, selectedVariable, 'x'));
      var yscale = d3.scaleLinear().range([svg.attr("plotHeight"), 0]).domain(d3LineSeriesRrd.helpers.getDomain(data, selectedOption, selectedVariable, 'y')); // Create a plotting function

      var line = d3.line().x(function (d) {
        return xscale(d.x);
      }).y(function (d) {
        return yscale(d.y);
      }); // Create the axes first, as the plot depends on the controls chosen.

      createAxes(); // Assign the data

      var allSeries = svg.select(".plotArea").selectAll(".plotSeries").data(data.series); // Enter/update/exit

      allSeries.enter().each(function () {
        var series = d3.select(this);
        var seriesLine = series.append("g").attr("class", "plotSeries").attr("series-name", labelCreator).attr("task-id", function (d) {
          return d.taskId;
        }).attr("clip-path", "url(#" + svg.select("clipPath").attr("id") + ")").append("path").attr("class", "line").attr("d", function (d) {
          return line(d[selectedOption][selectedVariable]);
        }).style("stroke", function (d) {
          return d3LineSeriesRrd.colour(d.cKey);
        }).style("fill", "none").style("stroke-width", "2.5px");
      }); // update

      allSeries.each(function () {
        var series = d3.select(this).attr("series-name", labelCreator).attr("task-id", function (d) {
          return d.taskId;
        });
      });
      allSeries.selectAll("path.line").transition().duration(1000).attr("d", function (d) {
        return line(d[selectedOption][selectedVariable]);
      });
      allSeries.exit().remove(); // It seems like it woks fine coming out to here. But why does it thn revert to other option?
      // ADD SOME INTERACTIVITY

      d3LineSeriesRrd.addInteractivity.addTooltip(svg); // Update marker.

      data.newData = false; // HELPER FUNCTIONS

      function createAxes() {
        // Create the axes objects
        var xAxis = d3.axisBottom(xscale).ticks(5);
        var yAxis = d3.axisLeft(yscale);
        var gX = svg.select(".plotArea").select(".axis--x");

        if (gX.empty()) {
          gX = svg.select(".plotArea").append("g").attr("transform", "translate(0," + svg.attr("plotHeight") + ")").attr("class", "axis--x").call(xAxis);
          gX.append("text").attr("fill", "#000").attr("x", svg.attr("plotWidth")).attr("y", d3LineSeriesRrd.margin.bottom).attr("text-anchor", "end").text(layout.xAxisLabel);
        } else {
          gX.transition().call(xAxis);
        } // if


        var gY = svg.select(".plotArea").select(".axis--y");

        if (gY.empty()) {
          gY = svg.select(".plotArea").append("g").attr("class", "axis--y").call(yAxis);
          d3LineSeriesRrd.addInteractivity.addInteractiveYAxisControls(element, data, layout);
        } else {
          gY.transition().call(yAxis);
        } // if

      } // createAxes

    },
    // update
    setupSvg: function setupSvg(element, data, layout) {
      d3LineSeriesRrd.margin = layout.margin === undefined ? d3LineSeriesRrd.margin : layout.margin;
      d3LineSeriesRrd.colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);
      var container_ = d3.select(element).select(".separatorContainer"); // An additional div structure must be present here, to accomodate the functionality of the y-axis.

      if (container_.empty()) {
        container_ = d3.select(element).append("div").attr("class", "separatorContainer").attr("style", "width: 100%");
        container_.append("div").attr("class", "yAxisControlDiv").attr("style", "width: " + d3LineSeriesRrd.margin.left + "px; height: " + d3LineSeriesRrd.layout.height + "; float: left");
        var container = container_.append("div").attr("class", "plotDiv").attr("style", "margin-left: 40px");
      } else {
        var container = container_.select(".plotDiv");
      } // if
      // Check if there is a svg first.


      var svg = container.select("svg");

      if (svg.empty()) {
        // Append new svg
        svg = container.append("svg"); // Update its dimensions.

        curateSvg();
        assignDefaultInteractiveValues();
      } else {
        // Differentiate between changing plot types, or just changing the data!!
        // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
        var plotWrapper = container.select(function () {
          return this.parentElement.parentElement;
        });
        var expectedPlotType = plotWrapper.attr("plottype");

        if (expectedPlotType !== "d3LineSeriesRrd") {
          // If the plot type has changed, then the svg contents need to be removed completely.
          plotWrapper.attr("plottype", "d3LineSeriesRrd");
          svg.selectAll("*").remove();
          curateSvg(); // Add the selected variable and height optionto the svg. It cannot be in make, as the data passed in at update won't pass through it. The selection needs to be made here.

          assignDefaultInteractiveValues();
        } else {
          // Axes might need to be updated, thus the svg element needs to be refreshed.
          curateSvg();
        }
      }

      function curateSvg() {
        // Also try to resize the plot to fit the data nicer.
        // d3.select(element.parentNode.parentNode).attr("class", "col-md-" + d3LineSeriesRrd.layout.colWidth);
        // For some reason this causes a bug which leaves redundant plots in the plot rows.
        var svgWidth = container.node().offsetWidth - d3LineSeriesRrd.margin.left;
        var svgHeight = d3LineSeriesRrd.layout.height;
        var width = svgWidth - d3LineSeriesRrd.margin.left - d3LineSeriesRrd.margin.right;
        var height = svgHeight - d3LineSeriesRrd.margin.top - d3LineSeriesRrd.margin.bottom; // Curating the svg.                

        container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height);
        var plotArea = container.select("svg").select(".plotArea");

        if (plotArea.empty()) {
          // If there's none, add it.
          container.select("svg").append("g").attr("transform", "translate(" + d3LineSeriesRrd.margin.left + "," + d3LineSeriesRrd.margin.top + ")").attr("class", "plotArea");
        }
        // The same with the clip path for zooming.

        var p = d3.select(container.node().parentElement.parentElement);
        var clipId = "clip-" + p.attr("plot-row-index") + "-" + p.attr("plot-index");
        var clip = container.select("svg").select("clipPath");

        if (clip.empty()) {
          container.select("svg").append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
        } else {
          clip.select("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
        }
      }

      function assignDefaultInteractiveValues() {
        // Select some default height and option to initialise the plot.
        var defaultSeries = data.series[0];
        svg.attr('selectedOption', defaultSeries.heights[0]);
        svg.attr('selectedVariable', Object.getOwnPropertyNames(defaultSeries[defaultSeries.heights[0]])[0]);
      } // assignDefaultInteractiveValues

    },
    // setupSvg
    addInteractivity: {
      addTooltip: function addTooltip(svg) {
        // This controls al the tooltip functionality.
        var lines = svg.selectAll("path.line");
        lines.on("mouseover", tipOn).on("mouseout", tipOff); // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.

        var tip = d3.tip().attr('class', 'd3-tip').offset([-12, 0]).html(function (d) {
          return "<span>" + [d.taskId, svg.attr("selectedOption"), svg.attr("selectedVariable")].join(' ') + "</span>";
        }); // Add an anchorPoint for the tooltip.

        var anchorPoint = svg.select(".plotArea").append("g").style("display", "none").append("circle").attr("r", 1);
        svg.call(tip);

        function tipOn(d) {
          lines.style("opacity", 0.2);
          d3.select(this).style("opacity", 1.0).style("stroke-width", "4px"); // To control tip location another element must be added onto the svg. This can then be used as an anchor for the tooltip.

          anchorPoint.attr("cx", d3.mouse(this)[0]).attr("cy", d3.mouse(this)[1]);
          tip.show(d, anchorPoint.node());
          crossPlotHighlighting.on(d, "d3LineSeriesRrd");
        }

        function tipOff(d) {
          lines.style("opacity", 1.0);
          d3.select(this).style("stroke-width", "2.5px");
          tip.hide();
          crossPlotHighlighting.off(d, "d3LineSeriesRrd");
        }
      },
      // addTooltip
      addZooming: function addZooming(svg, data) {
        var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        function zoomed() {
          var t = d3.event.transform;
          var optn = svg.attr("selectedOption");
          var variable = svg.attr("selectedVariable"); // Get the domains:

          var xRange = d3LineSeriesRrd.helpers.getDomain(data, optn, variable, "x");
          var yRange = d3LineSeriesRrd.helpers.getDomain(data, optn, variable, "y"); // Recreate original scales.

          var xscale = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain(xRange);
          var yscale = d3.scaleLinear().range([svg.attr("plotHeight"), 0]).domain(yRange); // In scales the range is the target, and the domain the source.
          // Create new axes based on the zoom, which altered the domain.
          // d3.event.transform.rescaleX(xScale2).domain() to get the exact input of the location showing in the zooming aera and brush area.

          var newXRange = t.rescaleX(xscale).domain();
          var newYRange = t.rescaleY(yscale).domain(); // Create new scales in the zoomed area.

          xscale.domain(newXRange);
          yscale.domain(newYRange); // Redo the axes.

          svg.select(".plotArea").select(".axis--x").call(d3.axisBottom(xscale));
          svg.select(".plotArea").select(".axis--y").call(d3.axisLeft(yscale)); // Reposition all lines

          var line = d3.line().x(function (d) {
            return xscale(d.x);
          }).y(function (d) {
            return yscale(d.y);
          });
          svg.select(".plotArea").selectAll(".line").attr("d", function (d) {
            return line(d[optn][variable]);
          });
        }
      },
      // addZooming
      addInteractiveYAxisControls: function addInteractiveYAxisControls(element, data, layout) {
        var heights = data.series[0].heights;
        var options = Object.getOwnPropertyNames(data.series[0][heights[0]]);
        var ctrlContainer = d3.select(element).select(".yAxisControlDiv");
        var s = ctrlContainer.select(".custom-select");

        if (s.empty()) {
          s = ctrlContainer.append("select").attr("class", "select-vertical custom-select");
          s.selectAll("option").data(options).enter().append("option").attr("value", function (d) {
            return d;
          }).html(function (d) {
            return d;
          });
          ctrlContainer.append("text").text(s.node().value).attr("class", "txt-vertical");
          s.on("change", function () {
            d3.select(this.parentElement).select(".txt-vertical").text(this.value);
            d3.select(element).select("svg").attr("selectedVariable", this.value);
            d3LineSeriesRrd.update(element, data, layout);
          });
        } // if
        // Also add the heights button


        var h = ctrlContainer.select(".dropup");

        if (h.empty()) {
          h = ctrlContainer.append("div").attr("class", "dropup").attr("style", "position:absolute; bottom:0; left:0");
          h.append("button").attr("class", "btn").attr("data-toggle", "dropdown").html("H");
          var m = h.append("ul").attr("class", "dropdown-menu");
          m.selectAll("a").data(heights).enter().append("a").attr("class", "dropdown-item").html(function (d) {
            return d;
          });
          m.selectAll(".dropdown-item").on("click", function () {
            d3.select(element).select("svg").attr("selectedOption", this.__data__);
            d3LineSeriesRrd.update(element, data, layout);
          });
        } // if

      },
      // addInteractiveYAxisControls
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        // Remove any controls in the plot title.
        plotHelpers.removePlotTitleControls(element);
      } // updatePlotTitleControls

    },
    // addInteractivity
    helpers: {
      getDomain: function getDomain(data, optn, variable, axis) {
        // d3.min and .max operate on arrays, not on objects. The 'line' is an array of objects, and therefor an accessor function is required.
        var options = data.series[0].heights;
        var line = data.series[0][options[0]][variable];
        var minVal = d3.min(line, accessor);
        var maxVal = d3.max(line, accessor);

        for (var n = 1; n < data.series.length; ++n) {
          var line = data.series[n][optn][variable];
          var minVal_ = d3.min(line, accessor);
          minVal = minVal_ < minVal ? minVal_ : minVal;
          var maxVal_ = d3.max(line, accessor);
          maxVal = maxVal_ > maxVal ? maxVal_ : maxVal;
        }
        // Add some padding.

        var valDiff = maxVal - minVal;
        minVal = Number(minVal) - 0.1 * valDiff;
        maxVal = Number(maxVal) + 0.1 * valDiff;
        return [minVal, maxVal];

        function accessor(d) {
          return Number(d[axis]);
        } // accessor

      } // getDomain

    } // helpers

  }; // d3LineSeriesRrd

  var d3LineRadialRrd = {
    name: "d3LineRadialRrd",
    margin: {
      top: 20,
      right: 10,
      bottom: 20,
      left: 50
    },
    layout: {
      colWidth: 4,
      height: 400
    },
    colour: [],
    make: function make(element, data, layout) {
      // Remove any controls in the plot title.
      d3LineRadialRrd.addInteractivity.updatePlotTitleControls(element); // Setup the svg.

      d3LineRadialRrd.setupSvg(element, data, layout);
      var svg = d3.select(element).select("svg"); // ADD SOME INTERACTIVITY

      d3LineRadialRrd.addInteractivity.addZooming(svg, data);
      d3LineRadialRrd.update(element, data, layout);
    },
    // make
    update: function update(element, data, layout) {
      // The transition don't work as there are 2 transformations applied on every update. The main data transformation, and the zooming transformation. These need to be separated out for smooth effects.
      // Setup the svg.
      d3LineRadialRrd.setupSvg(element, data, layout); // Some convenient handles.

      var svg = d3.select(element).select("svg"); // Specify the options selected. Figure out a way to change these by the user later on. Don't move them into object properties though!

      var xVarName = svg.attr("selectedVariableX");
      var yVarName = svg.attr("selectedVariableY");

      function labelCreator(d) {
        var label = d.taskId;
        return label;
      } // labelCreator
      // Create the required scales.


      var xscale = d3.scaleLinear().range([0, Number(svg.attr("plotWidth"))]).domain(d3LineRadialRrd.helpers.getDomain(data, xVarName));
      var yscale = d3.scaleLinear().range([Number(svg.attr("plotHeight")), 0]).domain(d3LineRadialRrd.helpers.getDomain(data, yVarName)); // Create a plotting function

      var line = d3.line().x(function (d) {
        return xscale(d[xVarName]);
      }).y(function (d) {
        return yscale(d[yVarName]);
      }); // Create the axes first, as the plot depends on the controls chosen.

      createAxes(); // Assign the data

      var allSeries = svg.select(".plotArea").selectAll(".plotSeries").data(data.series); // Enter/update/exit

      allSeries.enter().each(function () {
        var series = d3.select(this);
        var seriesLine = series.append("g").attr("class", "plotSeries").attr("series-name", labelCreator).attr("task-id", function (d) {
          return d.taskId;
        }).attr("clip-path", "url(#" + svg.select("clipPath").attr("id") + ")").append("path").attr("class", "line").attr("d", function (d) {
          return line(d);
        }).style("stroke", function (d) {
          return d3LineRadialRrd.colour(d.cKey);
        }).style("fill", "none").style("stroke-width", "2.5px");
      }); // update

      allSeries.each(function () {
        var series = d3.select(this).attr("series-name", labelCreator).attr("task-id", function (d) {
          return d.taskId;
        });
      });
      allSeries.selectAll("path.line").transition().duration(1000).attr("d", function (d) {
        return line(d);
      });
      allSeries.exit().remove(); // It seems like it woks fine coming out to here. But why does it thn revert to other option?

      d3LineRadialRrd.addInteractivity.addTooltip(svg); // Update marker.

      data.newData = false; // HELPER FUNCTIONS

      function createAxes() {
        // Create the axes objects
        var xAxis = d3.axisBottom(xscale).ticks(5);
        var yAxis = d3.axisLeft(yscale);
        var gX = svg.select(".plotArea").select(".axis--x");

        if (gX.empty()) {
          gX = svg.select(".plotArea").append("g").attr("transform", "translate(0," + svg.attr("plotHeight") + ")").attr("class", "axis--x").call(xAxis);
          d3LineRadialRrd.addInteractivity.addInteractiveXAxisControls(element, data, layout);
        } else {
          gX.transition().call(xAxis);
        } // if


        var gY = svg.select(".plotArea").select(".axis--y");

        if (gY.empty()) {
          gY = svg.select(".plotArea").append("g").attr("class", "axis--y").call(yAxis);
          gY.append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -20 - 15).attr("text-anchor", "end").text(yVarName);
        } else {
          gY.transition().call(yAxis);
        } // if

      } // createAxes

    },
    // update
    setupSvg: function setupSvg(element, data, layout) {
      d3LineRadialRrd.margin = layout.margin === undefined ? d3LineRadialRrd.margin : layout.margin;
      d3LineRadialRrd.colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);
      var container_ = d3.select(element).select(".separatorContainer"); // An additional div structure must be present here, to accomodate the functionality of the y-axis.

      if (container_.empty()) {
        container_ = d3.select(element).append("div").attr("class", "separatorContainer").attr("style", "width: 100%");
        var container = container_.append("div").attr("class", "plotDiv").attr("style", "margin-left: 0px");
        container_.append("div").attr("class", "xAxisControlDiv").attr("style", "width: 100%; float: right");
      } else {
        var container = container_.select(".plotDiv");
      } // if
      // Check if there is a svg first.


      var svg = container.select("svg");

      if (svg.empty()) {
        // Append new svg
        svg = container.append("svg"); // Update its dimensions.

        curateSvg();
        assignDefaultInteractiveValues();
      } else {
        // Differentiate between changing plot types, or just changing the data!!
        // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
        var plotWrapper = container.select(function () {
          return this.parentElement.parentElement;
        });
        var expectedPlotType = plotWrapper.attr("plottype");

        if (expectedPlotType !== "d3LineRadialRrd") {
          // If the plot type has changed, then the svg contents need to be removed completely.
          plotWrapper.attr("plottype", "d3LineRadialRrd");
          svg.selectAll("*").remove();
          curateSvg();
          assignDefaultInteractiveValues();
        } else {
          // Axes might need to be updated, thus the svg element needs to be refreshed.
          curateSvg();
        }
      }

      function curateSvg() {
        // Also try to resize the plot to fit the data nicer.
        // d3.select(element.parentNode.parentNode).attr("class", "col-md-" + d3LineRadialRrd.layout.colWidth);
        // For some reason this causes a bug which leaves redundant plots in the plot rows.
        var svgWidth = container.node().offsetWidth;
        var svgHeight = d3LineRadialRrd.layout.height;
        var width = svgWidth - d3LineRadialRrd.margin.left - d3LineRadialRrd.margin.right;
        var height = svgHeight - d3LineRadialRrd.margin.top - d3LineRadialRrd.margin.bottom; // Curating the svg.                

        container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height);
        var plotArea = container.select("svg").select(".plotArea");

        if (plotArea.empty()) {
          // If there's none, add it.
          container.select("svg").append("g").attr("transform", "translate(" + d3LineRadialRrd.margin.left + "," + d3LineRadialRrd.margin.top + ")").attr("class", "plotArea");
        }
        // The same with the clip path for zooming.

        var p = d3.select(container.node().parentElement.parentElement);
        var clipId = "clip-" + p.attr("plot-row-index") + "-" + p.attr("plot-index");
        var clip = container.select("svg").select("clipPath");

        if (clip.empty()) {
          container.select("svg").append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
        } else {
          clip.select("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
        }
      }

      function assignDefaultInteractiveValues() {
        // Select some default height and option to initialise the plot.
        var defaultSeries = data.series[0];
        svg.attr('selectedVariableX', Object.getOwnPropertyNames(defaultSeries[0])[0]);
        svg.attr('selectedVariableY', 'Radius_(m)');
      } // assignDefaultInteractiveValues

    },
    // setupSvg
    addInteractivity: {
      addTooltip: function addTooltip(svg) {
        // This controls al the tooltip functionality.
        var lines = svg.selectAll(".line");
        lines.on("mouseover", tipOn).on("mouseout", tipOff); // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.

        var tip = d3.tip().attr('class', 'd3-tip').offset([-12, 0]).html(function (d) {
          return "<span>" + [d.taskId, svg.attr("selectedOption"), svg.attr("selectedVariable")].join(' ') + "</span>";
        }); // Add an anchorPoint for the tooltip.

        var anchorPoint = svg.select(".plotArea").append("g").style("display", "none").append("circle").attr("r", 1);
        svg.call(tip);

        function tipOn(d) {
          lines.style("opacity", 0.2);
          d3.select(this).style("opacity", 1.0).style("stroke-width", "4px"); // To control tip location another element must be added onto the svg. This can then be used as an anchor for the tooltip.

          anchorPoint.attr("cx", d3.mouse(this)[0]).attr("cy", d3.mouse(this)[1]);
          tip.show(d, anchorPoint.node());
          crossPlotHighlighting.on(d, "d3LineRadialRrd");
        }

        function tipOff(d) {
          lines.style("opacity", 1.0);
          d3.select(this).style("stroke-width", "2.5px");
          tip.hide();
          crossPlotHighlighting.off(d, "d3LineRadialRrd");
        }
      },
      // addTooltip
      addZooming: function addZooming(svg, data) {
        var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        function zoomed() {
          var t = d3.event.transform;
          var xVarName = svg.attr("selectedVariableX");
          var yVarName = svg.attr("selectedVariableY"); // Get the domains:

          var xRange = d3LineRadialRrd.helpers.getDomain(data, xVarName);
          var yRange = d3LineRadialRrd.helpers.getDomain(data, yVarName); // Recreate original scales.

          var xscale = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain(xRange);
          var yscale = d3.scaleLinear().range([svg.attr("plotHeight"), 0]).domain(yRange); // In scales the range is the target, and the domain the source.
          // Create new axes based on the zoom, which altered the domain.
          // d3.event.transform.rescaleX(xScale2).domain() to get the exact input of the location showing in the zooming aera and brush area.

          var newXRange = t.rescaleX(xscale).domain();
          var newYRange = t.rescaleY(yscale).domain(); // Create new scales in the zoomed area.

          xscale.domain(newXRange);
          yscale.domain(newYRange); // Redo the axes.

          svg.select(".plotArea").select(".axis--x").call(d3.axisBottom(xscale));
          svg.select(".plotArea").select(".axis--y").call(d3.axisLeft(yscale)); // Reposition all lines

          var line = d3.line().x(function (d) {
            return xscale(d[xVarName]);
          }).y(function (d) {
            return yscale(d[yVarName]);
          });
          svg.select(".plotArea").selectAll(".line").attr("d", function (d) {
            return line(d);
          });
        }
      },
      // addZooming
      addInteractiveXAxisControls: function addInteractiveXAxisControls(element, data, layout) {
        var options = Object.getOwnPropertyNames(data.series[0][0]);
        var ctrlContainer = d3.select(element).select(".xAxisControlDiv");
        var s = ctrlContainer.select(".custom-select");

        if (s.empty()) {
          s = ctrlContainer.append("select").attr("class", "custom-select").attr("dir", "rtl").style("float", "right");
          s.selectAll("option").data(options).enter().append("option").attr("value", function (d) {
            return d;
          }).html(function (d) {
            return d;
          }).attr("dir", "ltr");
          s.on("change", function () {
            d3.select(this.parentElement).select(".txt-horizontal").text(this.value);
            d3.select(element).select("svg").attr("selectedVariableX", this.value);
            d3LineRadialRrd.update(element, data, layout);
          });
        } // if

      },
      // addInteractiveXAxisControls
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        // Remove any controls in the plot title.
        plotHelpers.removePlotTitleControls(element);
      } // updatePlotTitleControls

    },
    // addInteractivity
    helpers: {
      getDomain: function getDomain(data, variable) {
        // d3.min and .max operate on arrays, not on objects. The 'line' is an array of objects, and therefor an accessor function is required.
        var line = data.series[0];
        var minVal = d3.min(line, accessor);
        var maxVal = d3.max(line, accessor);

        for (var n = 1; n < data.series.length; ++n) {
          var line = data.series[n];
          var minVal_ = d3.min(line, accessor);
          minVal = minVal_ < minVal ? minVal_ : minVal;
          var maxVal_ = d3.max(line, accessor);
          maxVal = maxVal_ > maxVal ? maxVal_ : maxVal;
        }
        // Add some padding.

        var valDiff = maxVal - minVal;
        minVal = Number(minVal) - 0.1 * valDiff;
        maxVal = Number(maxVal) + 0.1 * valDiff;
        return [minVal, maxVal];

        function accessor(d) {
          return Number(d[variable]);
        }
      } // getDomain

    } // helpers

  }; // d3LineRadialRrd

  var d3Contour2d = {
    name: "d3Contour2d",
    margin: {
      top: 20,
      right: 65,
      bottom: 20,
      left: 10
    },
    colour: [],
    make: function make(element, data, layout) {
      // Remove any controls in the plot title.
      d3Contour2d.addInteractivity.updatePlotTitleControls(element);
      d3Contour2d.update(element, data, layout);
    },
    // make
    update: function update(element, data, layout) {
      var container = d3.select(element);
      d3Contour2d.setupSvg(container, data, layout);
      var svg = container.select("svg"); // Make a projection for the points

      var projection = d3Contour2d.helpers.createProjection(data, svg); // Claculate threshold values

      var vMinAll = data.limits.v[0];
      var vMaxAll = data.limits.v[1];
      var thresholds = d3.range(vMinAll, vMaxAll, (vMaxAll - vMinAll) / 21); // Setup colour scale

      var colourScale = d3Contour2d.colour;
      colourScale.domain(d3.extent(thresholds)); // Initialise contours

      var contours = d3.contours().size(data.surfaces.size).smooth(true).thresholds(thresholds); // make and project the contours

      svg.select(".plotArea").selectAll("path").data(contours(data.surfaces.v)).enter().append("path").attr("d", d3.geoPath(projection)).attr("fill", function (d) {
        return colourScale(d.value);
      }).attr("transform", "translate(5,20)"); // Create a colourbar

      var scaleHeight = svg.attr("height") / 2;
      colourScale.domain([0, scaleHeight]);
      var scaleBars = svg.select(".scaleArea").selectAll(".scaleBar").data(d3.range(scaleHeight), function (d) {
        return d;
      }).enter().append("rect").attr("class", "scaleBar").attr("x", 0).attr("y", function (d, i) {
        return scaleHeight - i;
      }).attr("height", 1).attr("width", 20).style("fill", function (d, i) {
        return colourScale(d);
      });
      var cscale = d3.scaleLinear().domain(d3.extent(thresholds)).range([scaleHeight, 0]);
      var cAxis = d3.axisRight(cscale).ticks(5);
      var colorAxisDOM = svg.select(".scaleArea").select("g");

      if (colorAxisDOM.empty()) {
        svg.select(".scaleArea").append("g").attr("transform", "translate(20,0)").call(cAxis);
      } else {
        colorAxisDOM.call(cAxis);
      } // if
      // ADD INTERACTIVITY


      d3Contour2d.addInteractivity.addZooming(svg);
      d3Contour2d.addInteractivity.addOnMouseOver(svg); // Mark the data flag

      data.newData = false;
    },
    // update
    setupSvg: function setupSvg(container, data, layout) {
      // DON'T MOVE THIS TO MAKE!
      d3Contour2d.margin = layout.margin === undefined ? d3Contour2d.margin : layout.margin;
      d3Contour2d.colour = layout.colourMap === undefined ? d3.scaleSequential(d3.interpolateSpectral) : d3.scaleSequential(layout.colourMap); // Check if there is a svg first.

      var svg = container.select("svg");

      if (svg.empty()) {
        // Append new svg
        svg = container.append("svg"); // Update its dimensions.

        curateSvg();
      } else {
        // Differentiate between changing plot types, or just changing the data!!
        // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
        var plotWrapper = container.select(function () {
          return this.parentElement.parentElement;
        });
        var expectedPlotType = plotWrapper.attr("plottype");

        if (expectedPlotType !== "d3Contour2d") {
          // If the plot type has changed, then the svg contents need to be removed completely.
          plotWrapper.attr("plottype", "d3Contour2d");
          svg.selectAll("*").remove();
          curateSvg(); // ADD FUNCTIONALITY.
          // cfD3Histogram.addInteractivity(container, data);
        } else {
          // Axes might need to be updated, thus the svg element needs to be refreshed.
          curateSvg();
        }
      }

      function curateSvg() {
        var svgWidth = container.node().offsetWidth;
        var svgHeight = layout.height;
        var width = svgWidth - d3Contour2d.margin.left - d3Contour2d.margin.right;
        var height = svgHeight - d3Contour2d.margin.top - d3Contour2d.margin.bottom; // Curating the svg.                

        container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height);
        var plotArea = container.select("svg").select(".plotArea");

        if (plotArea.empty()) {
          // If there's none, add it.
          container.select("svg").append("g").attr("transform", "translate(" + d3Contour2d.margin.left + "," + d3Contour2d.margin.top + ")").attr("class", "plotArea").attr("task-id", data.taskId);
        }
        // The same with the clip path for zooming.

        var clipId = "clip-" + container.attr("plot-row-index") + "-" + container.attr("plot-index");
        var clip = container.select("svg").select("clipPath");

        if (clip.empty()) {
          container.select("svg").append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
        } else {
          clip.select("rect").attr("width", svg.attr("plotWidth")).attr("height", svg.attr("plotHeight"));
        }
        // Create a 'g' for the colorbar.

        var colorbar = container.select("svg").select(".scaleArea");

        if (colorbar.empty()) {
          container.select("svg").append("g").attr("class", "scaleArea").attr("transform", "translate(" + (svgWidth - 60) + "," + d3Contour2d.margin.top + ")");
        }
      }
    },
    // setupSvg
    addInteractivity: {
      addZooming: function addZooming(svg) {
        var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);
        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        function zoomed() {
          var t = d3.event.transform;
          svg.select(".plotArea").attr("transform", t);
        }
      },
      // addZooming
      addOnMouseOver: function addOnMouseOver(svg) {
        // Select the whole card for mouseover, but what needs to be returned is the data of the plot.
        var contour = svg.selectAll(".plotArea");
        contour.on("mouseover", crossHighlightOn).on("mouseout", crossHighlightOff);

        function crossHighlightOn(d) {
          crossPlotHighlighting.on(d, "d3Contour2d");
        }

        function crossHighlightOff(d) {
          crossPlotHighlighting.off(d, "d3Contour2d");
        }
      },
      // addOnMouseOver
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        // Remove any controls in the plot title.
        plotHelpers.removePlotTitleControls(element);
      } // updatePlotTitleControls

    },
    // addInteractivity
    helpers: {
      getScaleRange: function getScaleRange(data, svg) {
        var width = svg.attr("plotWidth");
        var height = svg.attr("plotHeight"); // set x and y scale to maintain 1:1 aspect ratio  

        var domainAspectRatio = d3Contour2d.helpers.calculateDataAspectRatio(data);
        var rangeAspectRatio = d3Contour2d.helpers.calculateSvgAspectRatio(svg);

        if (rangeAspectRatio > domainAspectRatio) {
          var xScaleRange = [0, width];
          var yScaleRange = [domainAspectRatio * width, 0];
        } else {
          var xScaleRange = [0, height / domainAspectRatio];
          var yScaleRange = [height, 0];
        } // if


        return {
          x: xScaleRange,
          y: yScaleRange
        };
      },
      // getScaleRange
      calculateDataAspectRatio: function calculateDataAspectRatio(data) {
        var xMinAll = data.limits.x[0];
        var yMinAll = data.limits.y[0];
        var xMaxAll = data.limits.x[1];
        var yMaxAll = data.limits.y[1];
        var xRange = xMaxAll - xMinAll;
        var yRange = yMaxAll - yMinAll; // set x and y scale to maintain 1:1 aspect ratio  

        return yRange / xRange;
      },
      // calculateDataAspectRatio
      calculateSvgAspectRatio: function calculateSvgAspectRatio(svg) {
        var width = svg.attr("plotWidth");
        var height = svg.attr("plotHeight");
        return height / width;
      },
      // calculateSvgAspectRatio
      createProjection: function createProjection(data, svg) {
        // Create the scale ranges, and ensure that a 1:1 aspect ratio is kept.
        var scaleRanges = d3Contour2d.helpers.getScaleRange(data, svg);
        var xscale = d3.scaleLinear().domain(data.limits.x).range(scaleRanges.x);
        var yscale = d3.scaleLinear().domain(data.limits.y).range(scaleRanges.y);
        var x = data.surfaces.x;
        var y = data.surfaces.y;
        var v = data.surfaces.v;
        var m = data.surfaces.size[0];
        var n = data.surfaces.size[1]; // configure a projection to map the contour coordinates returned by
        // d3.contours (px,py) to the input data (xgrid,ygrid)

        var projection = d3.geoTransform({
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

        return projection;
      } // createProjection

    } // helpers

  }; // d3Contour2d

  var addMenu = {
    addPlotControls: {
      elementOptionsArray: function elementOptionsArray(plotRowType) {
        var options;

        switch (plotRowType) {
          case "metadata":
            options = [{
              val: "undefined",
              text: " "
            }, {
              val: "cfD3BarChart",
              text: "Bar Chart"
            }, {
              val: "cfD3Scatter",
              text: "Scatter"
            }, {
              val: "cfD3Histogram",
              text: "Histogram"
            }];
            break;

          case "plotter":
            options = [{
              val: "undefined",
              text: " "
            }, {
              val: "d3LineSeriesRrd",
              text: "Surface distribution"
            }, {
              val: "d3LineRadialRrd",
              text: "Radial profile"
            }];
            break;
        }

        return options;
      },
      make: function make(plotRowElement) {
        var plotRowIndex = d3.select($(plotRowElement)[0].parentNode).attr("plot-row-index");
        var plotRowType = d3.select(plotRowElement).attr("type");

        switch (plotRowType) {
          case "metadata":
            var buttonLabel = "Add plot";
            break;

          case "plotter":
            var buttonLabel = "Configure plot";
        }
        // Append a button to each plot row title, if it does not exist already.

        if (d3.select(plotRowElement).selectAll(".btn-success").empty()) {
          // If a button does not exist,make it.
          var buttonId = "addPlotButton" + plotRowIndex;
          d3.select(plotRowElement).append("button").attr("style", "display:inline").attr("id", buttonId).attr("class", "btn btn-success float-right").html(buttonLabel);
        }
        // FUNCTIONALITY!!
        // Create the config element with all required data.

        var config = addMenu.addPlotControls.createConfig(buttonId); // First create the ids of the required inputs

        addMenu.helpers.makeMenuContainer(config); // Update the menus with appropriate options

        addMenu.helpers.updateMenus(config); // Add the on click event: show menu

        addMenu.helpers.addButtonClickEvent(config); // Add listening to on plot type selection change

        addMenu.addPlotControls.onPlotTypeChangeEvent(config);
      },
      // make
      createConfig: function createConfig(buttonId) {
        // The config depends on the plot row type.
        var plotRowType = $("#" + buttonId)[0].parentElement.getAttribute('type');
        var a = addMenu.addPlotControls;
        var config = {
          title: "undefined",
          buttonId: buttonId,
          containerId: buttonId + 'MenuContainer',
          plotSelectionMenuId: buttonId + 'MenuContainer' + "PlotSelectionMenu",
          xPropertyMenuId: buttonId + 'MenuContainer' + "xPropertyMenu",
          yPropertyMenuId: buttonId + 'MenuContainer' + "yPropertyMenu",
          sliceMenuId: buttonId + 'MenuContainer' + "sliceMenu",
          menuOkButtonId: buttonId + 'MenuContainer' + "DialogButtonOk",
          menuCancelButtonId: buttonId + 'MenuContainer' + "DialogButtonCancel",
          ok: a.submitNewPlot,
          cancel: a.cancelNewPlot,
          userSelectedVariables: ["xProperty", "yProperty", "slice"],
          categoricalVariables: [],
          continuousVariables: [],
          sliceVariables: [],
          contourVariables: [],
          menuItems: [{
            options: a.elementOptionsArray(plotRowType),
            label: "Select plot type",
            id: buttonId + 'MenuContainer' + "PlotSelectionMenu"
          }],
          newPlot: [],
          ownerPlotRowIndex: $("#" + buttonId)[0].parentElement.parentElement.getAttribute("plot-row-index"),
          ownerPlotRowType: plotRowType,
          buttonActivationFunction: a.enableDisableSubmitButton
        }; // Check and add the available data variables.

        addMenu.helpers.updateDataVariables(config); // Create the appropriate newPlot object in the config.

        addMenu.addPlotControls.createNewPlot(config);
        return config;
      },
      // createConfig
      createNewPlot: function createNewPlot(config) {
        switch (config.ownerPlotRowType) {
          case "metadata":
            config.newPlot = {
              plotFunc: undefined,
              layout: {
                title: undefined,
                colWidth: 4,
                height: 300
              },
              data: {
                xProperty: undefined,
                yProperty: undefined,
                cProperty: undefined
              }
            }; // new plot config

            break;

          case "plotter":
            // axis labels should come from the data!
            // slices contains any previously added slices.
            config.newPlot = {
              plotFunc: undefined,
              layout: {
                title: undefined,
                colWidth: 4,
                height: 300
              },
              data: {
                slice: undefined
              },
              slices: []
            }; // new plot config
            // FORMATDATAFUNC IS DIFFERENT FOR EACH PLOT TYPE!

            break;
        }
      },
      // createNewPlot
      copyNewPlot: function copyNewPlot(config) {
        // Based on the type of plot selected a config ready to be submitted to the plotting functions is assembled.
        var selectedPlotType = $("#" + config.plotSelectionMenuId).val();
        var plotCtrl = {};

        switch (selectedPlotType) {
          case "cfD3BarChart":
          case "cfD3Histogram":
            plotCtrl = {
              plotFunc: config.newPlot.plotFunc,
              layout: {
                title: config.newPlot.layout.title,
                colWidth: config.newPlot.layout.colWidth,
                height: config.newPlot.layout.height
              },
              data: {
                cfData: dbsliceData.data,
                xProperty: config.newPlot.data.xProperty,
                cProperty: config.newPlot.data.cProperty
              }
            };
            break;

          case "cfD3Scatter":
            /*
                              plotCtrl = {
                                  plotFunc : config.newPlot.plotFunc,
                                  layout : { title : config.newPlot.layout.title, 
                                          colWidth : config.newPlot.layout.colWidth, 
                                            height : config.newPlot.layout.height }, 
                                  data : {  cfData : dbsliceData.data, 
                                         xProperty : config.newPlot.data.xProperty,
                                         yProperty : config.newPlot.data.yProperty,
                                         cProperty : config.newPlot.data.cProperty}
                              };
            */
            // Custom functionality for the d3interactive2axes imposter function is here. The idea is that the ctrl is hidden in 'layout'.
            plotCtrl = {
              plotFunc: config.newPlot.plotFunc,
              data: {
                cfData: dbsliceData.data,
                xProperty: config.newPlot.data.xProperty,
                yProperty: config.newPlot.data.yProperty,
                cProperty: config.newPlot.data.cProperty
              },
              layout: {
                title: config.newPlot.layout.title,
                colWidth: config.newPlot.layout.colWidth,
                height: config.newPlot.layout.height,
                ctrl: {
                  data: dbsliceData.data,
                  svg: undefined,
                  view: {
                    xVar: config.newPlot.data.xProperty,
                    yVar: config.newPlot.data.yProperty,
                    cVar: undefined,
                    gVar: undefined,
                    dataAR: undefined,
                    viewAR: undefined,
                    t: undefined
                  },
                  tools: {
                    xscale: undefined,
                    yscale: undefined,
                    cscale: undefined
                  },
                  format: {
                    margin: {
                      top: 17,
                      right: 25,
                      bottom: 20,
                      left: 20
                    },
                    axesMargin: {
                      left: 25,
                      bottom: 20
                    },
                    width: undefined,
                    height: config.newPlot.layout.height,
                    transitionTime: 500
                  }
                }
              }
            }; // ctrl

            break;

          case "d3LineSeriesRrd":
            // The user selected variable to plot is stored in config.newPlot.data, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
            // Store the currently selected slice, then push everything forward.
            config.newPlot.slices.push(config.newPlot.data.slice); // Set the other options.

            plotCtrl = {
              plotType: "d3LineSeriesRrd",
              layout: {
                colWidth: 4,
                xAxisLabel: "Axial distance",
                yAxisLabel: ""
              },
              data: dbsliceData.data,
              plotFunc: config.newPlot.plotFunc,
              taskIds: null,
              sliceIds: config.newPlot.slices,
              tasksByFilter: true,
              formatDataFunc: function formatDataFunc(data) {
                var series = [];
                data.forEach(function (line) {
                  series.push(line);
                });
                return {
                  series: series
                };
              }
            };
            break;

          case "d3LineRadialRrd":
            // The user selected variable to plot is stored in config.newPlot.data, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
            // Store the currently selected slice, then push everything forward.
            config.newPlot.slices.push(config.newPlot.data.slice); // Set the other options.

            plotCtrl = {
              plotType: "d3LineRadialRrd",
              layout: {
                colWidth: 4,
                xAxisLabel: "Axial distance",
                yAxisLabel: ""
              },
              data: dbsliceData.data,
              plotFunc: config.newPlot.plotFunc,
              taskIds: null,
              sliceIds: config.newPlot.slices,
              tasksByFilter: true,
              formatDataFunc: function formatDataFunc(data) {
                var series = [];
                data.forEach(function (line) {
                  series.push(line);
                });
                return {
                  series: series
                };
              }
            };
            break;
        }

        return plotCtrl;
      },
      // copyNewPlot
      clearNewPlot: function clearNewPlot(config) {
        switch (config.ownerPlotRowType) {
          case "metadata":
            config.newPlot.plotFunc = undefined;
            config.newPlot.layout.title = undefined;
            config.newPlot.data.xProperty = undefined;
            config.newPlot.data.yProperty = undefined;
            break;

          case "plotter":
            config.newPlot.plotFunc = undefined;
            config.newPlot.data = {};
            break;
        }
      },
      // clearNewPlot
      enableDisableSubmitButton: function enableDisableSubmitButton(config) {
        var submitButton = $("#" + config.menuOkButtonId);
        var selectedPlotType = $("#" + config.plotSelectionMenuId).val();

        switch (selectedPlotType) {
          case "undefined":
            // Disable
            submitButton.prop("disabled", true);
            break;

          case "cfD3BarChart":
            // xProperty enabled, yProperty disabled.
            var isConfigValid = config.newPlot.data.xProperty !== undefined && config.newPlot.data.yProperty === undefined;

            if (isConfigValid) {
              submitButton.prop("disabled", false);
            } else {
              submitButton.prop("disabled", true);
            }
            break;

          case "cfD3Histogram":
            // xProperty enabled, yProperty disabled.
            var isConfigValid = config.newPlot.data.xProperty !== undefined && config.newPlot.data.yProperty === undefined;

            if (isConfigValid) {
              submitButton.prop("disabled", false);
            } else {
              submitButton.prop("disabled", true);
            }
            break;

          case "cfD3Scatter":
            // xProperty enabled, yProperty  enabled.
            var isConfigValid = config.newPlot.data.xProperty !== undefined && config.newPlot.data.yProperty !== undefined;

            if (isConfigValid) {
              submitButton.prop("disabled", false);
            } else {
              submitButton.prop("disabled", true);
            }
            break;

          case "d3LineSeriesRrd":
            // Nothing else is needed, just enable the submit button.
            submitButton.prop("disabled", false);
            break;

          case "d3LineRadialRrd":
            // Nothing else is needed, just enable the submit button.
            submitButton.prop("disabled", false);
            break;

          default:
            // Disable
            submitButton.prop("disabled", true);
            break;
        }
      },
      // enableDisableSubmitButton
      onPlotTypeChangeEvent: function onPlotTypeChangeEvent(config) {
        var a = addMenu.addPlotControls;
        var h = addMenu.helpers;
        d3.select("#" + config.plotSelectionMenuId).on("change", function () {
          // Check if the data variables have changed.
          h.updateDataVariables(config); // Use the same switch to populate the appropriate properties in the 'newPlot' object, and to allow further selections.

          var selectedPlotType = $(this).val();

          switch (selectedPlotType) {
            case "undefined":
              // Remove all variable options.
              h.removeMenuItemObject(config, config.xPropertyMenuId);
              h.removeMenuItemObject(config, config.yPropertyMenuId);
              h.removeMenuItemObject(config, config.sliceMenuId); // Update plot type selection.

              a.clearNewPlot(config);
              break;
            // METADATA PLOTS

            case "cfD3BarChart":
              // One variable menu - categorical
              config.newPlot.plotFunc = cfD3BarChart; // xProperty required.

              h.addUpdateMenuItemObject(config, config.xPropertyMenuId, config.categoricalVariables); // yProperty must not be present.

              h.removeMenuItemObject(config, config.yPropertyMenuId);
              break;

            case "cfD3Histogram":
              // One variable menu - ordinal
              config.newPlot.plotFunc = cfD3Histogram; // xProperty required.

              h.addUpdateMenuItemObject(config, config.xPropertyMenuId, config.continuousVariables); // yProperty must not be present.

              h.removeMenuItemObject(config, config.yPropertyMenuId);
              break;

            case "cfD3Scatter":
              // Two variables menu - ordinal
              config.newPlot.plotFunc = cfD3Scatter; // xProperty and yProperty required.

              h.addUpdateMenuItemObject(config, config.xPropertyMenuId, config.continuousVariables);
              h.addUpdateMenuItemObject(config, config.yPropertyMenuId, config.continuousVariables);
              break;
            // 2D/3D PLOTS

            case "d3LineSeriesRrd":
              // Menu offering different slices.
              config.newPlot.plotFunc = d3LineSeriesRrd; // HACK: AK
              // Only the plcp files should be served as choices, otherwise it will result in error down the line.

              var allSlices = config.sliceVariables;
              var lineSeriesSlices = allSlices.filter(function (d) {
                return d.val.split(" ")[0] == "plcp" | d.val.split(" ")[0] == "undefined";
              }); // slice is required.

              h.addUpdateMenuItemObject(config, config.sliceMenuId, lineSeriesSlices);
              break;
            // 2D/3D PLOTS

            case "d3LineRadialRrd":
              // Menu offering different slices.
              config.newPlot.plotFunc = d3LineRadialRrd;
              var allSlices = config.sliceVariables;
              var lineRadialSlices = allSlices.filter(function (d) {
                return d.val.split(" ")[0] == "rad" | d.val.split(" ")[0] == "undefined";
              }); // slice is required.

              h.addUpdateMenuItemObject(config, config.sliceMenuId, lineRadialSlices);
              break;

            default:
              // Update plot type selection.
              a.clearNewPlot(config); // Remove all variable options.

              h.removeMenuItemObject(config, config.xPropertyMenuId);
              h.removeMenuItemObject(config, config.yPropertyMenuId);
              h.removeMenuItemObject(config, config.sliceMenuId);
              console.log("Unexpected plot type selected:", selectedPlotType);
              break;
          }
          // Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.

          h.resetVariableMenuSelections(config.xPropertyMenuId);
          h.resetVariableMenuSelections(config.yPropertyMenuId);
          h.resetVariableMenuSelections(config.sliceMenuId);

          switch (config.ownerPlotRwoType) {
            case "metadata":
              config.newPlot.data.yProperty = undefined;
              config.newPlot.data.xProperty = undefined;
              break;

            case "plotter":
              config.newPlot.data.slice = undefined;
          }
          // Update.

          h.updateMenus(config);
        }); // on change
      },
      // onPlotTypeChangeEvent
      submitNewPlot: function submitNewPlot(config) {
        // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
        switch (config.ownerPlotRowType) {
          case "metadata":
            // Make a pysical copy of the object.
            var plotToPush = addMenu.addPlotControls.copyNewPlot(config);
            dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots.push(plotToPush);
            break;

          case "plotter":
            // Here plots are not pushed, but rather a config is passed to the plotRow.    The number of slices then defines how many plots appear. The slices are contained in 'plotCtrl.sliceIds'.
            // The keys are the variable names in 'metadata', which are prefixed with 's_' for splice. This allows the user to select which data to compare when setting up the metadata. More flexibility is gained this way, as no hardcoded templating needs to be introduced, and no clumsy user interfaces.
            // Make a pysical copy of the object. This function also includes the functionality in which the 'line' plot
            var newPlotCtrl = addMenu.addPlotControls.copyNewPlot(config); // If the plot type is changing remove all the plots first.

            var oldPlotCtrl = dbsliceData.session.plotRows[config.ownerPlotRowIndex].ctrl;

            if (oldPlotCtrl !== undefined) {
              if (oldPlotCtrl.plotType !== newPlotCtrl.plotType) {
                dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots = [];
                newPlotCtrl.sliceIds = [config.newPlot.data.slice];
                config.newPlot.slices = [config.newPlot.data.slice];
              }
            } // if
            // Assign the new control.


            dbsliceData.session.plotRows[config.ownerPlotRowIndex].ctrl = newPlotCtrl;
            break;
        }
        // Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
        // var plotRowIndex = d3.select(this).attr("plot-row-index")
        // console.log(element)
        // Redraw the screen.

        dbslice.render(dbsliceData.elementId, dbsliceData.session); // Clear newPlot to be ready for the next addition.

        addMenu.addPlotControls.clearNewPlot(config); // Reset the variable menu selections!

        addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
        addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
        addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
        addMenu.helpers.resetVariableMenuSelections(config.sliceMenuId); // Reset the plot type menu selection.

        document.getElementById(config.plotSelectionMenuId).value = "undefined"; // Remove all variable options.

        addMenu.helpers.removeMenuItemObject(config, config.xPropertyMenuId);
        addMenu.helpers.removeMenuItemObject(config, config.yPropertyMenuId);
        addMenu.helpers.removeMenuItemObject(config, config.sliceMenuId); // Update the menus so that the view reflects the state of the config.

        addMenu.helpers.updateMenus(config);
      },
      // submitNewPlot
      cancelNewPlot: function cancelNewPlot(config) {
        addMenu.addPlotControls.clearNewPlot(config); // Reset the menu selection!

        addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
        addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
        addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
        addMenu.helpers.resetVariableMenuSelections(config.sliceMenuId); // Remove the select menus from the view.

        addMenu.helpers.removeMenuItemObject(config, config.xPropertyMenuId);
        addMenu.helpers.removeMenuItemObject(config, config.yPropertyMenuId);
        addMenu.helpers.removeMenuItemObject(config, config.sliceMenuId); // Update the menus so that the view reflects the state of the config.

        addMenu.helpers.updateMenus(config);
      } // cancelNewPlot

    },
    // addPlotControls
    removePlotControls: function removePlotControls() {
      var allPlotRows = d3.select("#" + dbsliceData.elementId).selectAll(".plotRowBody");
      allPlotRows.each(function (d, plotRowIndex) {
        // This function operates on a plot row instance. It selects all the plots, and adds a button and its functionality to it. This is only done if the plot row is a metadata row.
        var plotRowType = d3.select(this).attr("type");
        var allPlotTitles = d3.select(this).selectAll(".plotTitle");
        allPlotTitles.each(function (d, plotIndex) {
          // Append the button, and its functionality, but only if it does no talready exist!
          var removePlotButton = d3.select(this).select(".btn-danger");

          if (removePlotButton.empty()) {
            // If it dosn't exist, add it. It should be the last element!
            var ctrlGroup = d3.select(this).select(".ctrlGrp");
            var otherControls = $(ctrlGroup.node()).children().detach();
            ctrlGroup.append("button").attr("class", "btn btn-danger float-right").html("x");
            otherControls.appendTo($(ctrlGroup.node()));
          }
          // Add/update the functionality.

          d3.select(this).select(".btn-danger").on("click", function () {
            // This function recalls the position of the data it corresponds to, and subsequently deletes that entry.
            // Remove the plot from viewv
            dbsliceData.session.plotRows[plotRowIndex].plots.splice(plotIndex, 1);
            // console.log(dbsliceData.session.plotRows[plotRowIndex].plots.length); // If necesary also remove the corresponding ctrl from the plotter rows.

            if ('ctrl' in dbsliceData.session.plotRows[plotRowIndex]) {
              dbsliceData.session.plotRows[plotRowIndex].ctrl.sliceIds.splice(plotIndex, 1);
            }
            // Remove also the htmls element accordingly.

            this.parentElement.parentElement.parentElement.parentElement.remove();
            render(dbsliceData.elementId, dbsliceData.session);
          }); // on
        }); // each 
      }); // each
    },
    // removePlotControls
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
      make: function make(buttonId) {
        // Create the config element with all required data.
        var config = addMenu.addPlotRowControls.createConfig(buttonId); // First create the ids of the required inputs

        addMenu.helpers.makeMenuContainer(config); // Update the menus with appropriate options

        addMenu.helpers.updateMenus(config); // Show the menu on button click

        addMenu.helpers.addButtonClickEvent(config); // Add listeners for plot row type changes

        addMenu.addPlotRowControls.onPlotRowTypeChangeEvent(config);
      },
      // make
      createConfig: function createConfig(buttonId) {
        var a = addMenu.addPlotRowControls;
        var config = {
          buttonId: buttonId,
          containerId: buttonId + 'MenuContainer',
          plotRowSelectionMenuId: buttonId + 'MenuContainer' + "PlotRowSelectionMenu",
          menuItems: [{
            options: a.elementOptionsArray,
            label: "Select plot row type",
            id: buttonId + 'MenuContainer' + "PlotRowSelectionMenu"
          }],
          menuOkButtonId: buttonId + 'MenuContainer' + "DialogButtonOk",
          menuCancelButtonId: buttonId + 'MenuContainer' + "DialogButtonCancel",
          userSelectedVariables: [],
          newPlotRow: {
            title: "New row",
            plots: [],
            type: "undefined",
            addPlotButton: {
              id: "undefined",
              label: "Add plot"
            }
          },
          ok: a.submitNewPlotRow,
          cancel: a.cancelNewPlotRow,
          buttonActivationFunction: a.enableDisableSubmitButton
        }; // The addPlotButton id needs to be updated when the row is submitted!

        return config;
      },
      // createConfig
      clearNewPlotRow: function clearNewPlotRow(config) {
        config.newPlotRow.title = "New row";
        config.newPlotRow.plots = [];
        config.newPlotRow.type = "undefined";
        config.newPlotRow.addPlotButton = {
          id: "undefined",
          label: "Add plot"
        };
      },
      // clearNewPlotRow
      submitNewPlotRow: function submitNewPlotRow(config) {
        var plotRowToPush = {
          title: config.newPlotRow.title,
          plots: config.newPlotRow.plots,
          type: config.newPlotRow.type,
          addPlotButton: config.newPlotRow.addPlotButton
        }; // If this is a 'plotter' plot row it also requires a 'ctrl' field. This is filled out later by users actions.

        if (plotRowToPush.type === "plotter") {
          plotRowToPush.ctrl = undefined;
        }
        // Find the latest plot row index. Initiate with 0 to try allow for initialisation without any plot rows!

        var newRowInd = addMenu.helpers.findLatestPlotRowInd();
        plotRowToPush.addPlotButton.id = "addPlotButton" + newRowInd; // Push and plot the new row.

        dbsliceData.session.plotRows.push(plotRowToPush);
        dbslice.render(dbsliceData.elementId, dbsliceData.session); // Reset the plot row type menu selection.

        document.getElementById(config.plotRowSelectionMenuId).value = "undefined"; // Clearthe config

        addMenu.addPlotRowControls.clearNewPlotRow(config);
      },
      // submitNewPlotRow
      cancelNewPlotRow: function cancelNewPlotRow(config) {
        addMenu.addPlotRowControls.clearNewPlotRow(config);
      },
      // cancelNewPlotRow
      enableDisableSubmitButton: function enableDisableSubmitButton(config) {
        var submitButton = $("#" + config.menuOkButtonId);
        var selectedPlotRowType = $("#" + config.plotRowSelectionMenuId).val(); // If either 'metadata' or 'plotter' were chosen then enable the button.

        switch (selectedPlotRowType) {
          case "metadata":
          case "plotter":
            submitButton.prop("disabled", false);
            break;

          case "undefined":
            submitButton.prop("disabled", true);
            break;

          default:
            submitButton.prop("disabled", true);
            break;
        }
      },
      // enableDisableSubmitButton
      onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config) {
        // When the plot row type is changed just check if the button should be enabled.
        d3.select("#" + config.plotRowSelectionMenuId).on("change", function () {
          config.newPlotRow.type = $(this).val();
          addMenu.addPlotRowControls.enableDisableSubmitButton(config);
        });
      } // onPlotRowTypeChangeEvent

    },
    // addPlotRowControls
    removeDataControls: {
      make: function make(elementId) {
        // Create the container required
        addMenu.removeDataControls.createRemoveDataContainer(elementId); // Add teh functonaliy to the option in the "sesson options" menu.

        d3.select("#" + elementId).on("click", function () {
          // Get the options required
          var options = dbsliceData.data.fileDim.group().all(); // Create the appropriate checkboxes.

          addMenu.removeDataControls.addCheckboxesToTheForm(elementId, options); // Bring up the prompt

          addMenu.removeDataControls.createDialog(elementId);
        });
      },
      // make
      createRemoveDataContainer: function createRemoveDataContainer(elementId) {
        var removeDataMenuId = elementId + "Menu";
        var removeDataMenu = d3.select("#" + removeDataMenuId);

        if (removeDataMenu.empty()) {
          removeDataMenu = d3.select(".sessionHeader").append("div").attr("id", removeDataMenuId).attr("class", "card ui-draggable-handle").append("form").attr("id", removeDataMenuId + "Form");
          $("#" + removeDataMenuId).hide();
        } // if

      },
      // createRemoveDataContainer
      addCheckboxesToTheForm: function addCheckboxesToTheForm(elementId, options) {
        // Create teh expected target for the checkboxes.
        var checkboxFormId = elementId + "MenuForm"; // Create the checkboxes

        var checkboxes = d3.select("#" + checkboxFormId).selectAll(".checkbox").data(options);
        checkboxes.enter().append("div").attr("class", "checkbox").append("input").attr("type", "checkbox").attr("name", function (d, i) {
          return "dataset" + i;
        }).attr("value", function (d) {
          return d.key;
        }).attr("checked", true); // Append the labels after it

        checkboxes = d3.select("#" + checkboxFormId).selectAll(".checkbox");
        checkboxes.selectAll("label").remove();
        checkboxes.append("label").html(function (d) {
          return d.key;
        });
      },
      // addCheckboxesToTheForm
      createDialog: function createDialog(elementId) {
        // Create the dialog box, and it's functionality.
        $("#" + elementId + "Menu").dialog({
          draggable: false,
          autoOpen: true,
          modal: true,
          show: {
            effect: "fade",
            duration: 50
          },
          hide: {
            effect: "fade",
            duration: 50
          },
          buttons: {
            "Ok": {
              text: "Submit",
              id: "submitRemoveData",
              disabled: false,
              click: onSubmitClick
            },
            // ok
            "Cancel": {
              text: "Cancel",
              id: "cancelRemoveData",
              disabled: false,
              click: onCancelClick
            } // cancel

          }
        }).parent().draggable();
        $(".ui-dialog-titlebar").remove();
        $(".ui-dialog-buttonpane").attr("class", "card");

        function onSubmitClick() {
          // Figure out which options are unchecked.
          var checkboxInputs = d3.select(this).selectAll(".checkbox").selectAll("input");
          var uncheckedInputs = checkboxInputs.nodes().filter(function (d) {
            return !d.checked;
          });
          var uncheckedDataFiles = uncheckedInputs.map(function (d) {
            return d.value;
          }); // Pass these to the data remover.

          cfDataManagement.cfRemove(uncheckedDataFiles); // Close the dialog.

          $(this).dialog("close"); // Redraw the view.

          render(dbsliceData.elementId, dbsliceData.session);
        } // onSubmitClick


        function onCancelClick() {
          // Just close the dialog.
          $(this).dialog("close");
        } // onSubmitClick

      } // createDialog

    },
    // removeDataControls
    helpers: {
      updateDataVariables: function updateDataVariables(config) {
        // Categorical variables must have a val and text.
        var categoricalVariables = [{
          val: "undefined",
          text: " "
        }];

        for (var i = 0; i < dbsliceData.data.metaDataProperties.length; i++) {
          categoricalVariables.push({
            val: dbsliceData.data.metaDataProperties[i],
            text: dbsliceData.data.metaDataProperties[i]
          });
        }

        var continuousVariables = [{
          val: "undefined",
          text: " "
        }];

        for (var i = 0; i < dbsliceData.data.dataProperties.length; i++) {
          continuousVariables.push({
            val: dbsliceData.data.dataProperties[i],
            text: dbsliceData.data.dataProperties[i]
          });
        }

        var sliceVariables = [{
          val: "undefined",
          text: " "
        }];

        for (var i = 0; i < dbsliceData.data.sliceProperties.length; i++) {
          sliceVariables.push({
            val: dbsliceData.data.sliceProperties[i],
            text: dbsliceData.data.sliceProperties[i]
          });
        }

        var contourVariables = [{
          val: "undefined",
          text: " "
        }];

        for (var i = 0; i < dbsliceData.data.contourProperties.length; i++) {
          contourVariables.push({
            val: dbsliceData.data.contourProperties[i],
            text: dbsliceData.data.contourProperties[i]
          });
        }

        config.categoricalVariables = categoricalVariables;
        config.continuousVariables = continuousVariables;
        config.sliceVariables = sliceVariables;
        config.contourVariables = contourVariables;
      },
      // updateDataVariables
      makeMenuContainer: function makeMenuContainer(config) {
        // CREATE THE CONTAINER FOR THE MENU IN THE BUTTONS CONTAINER.
        // But do this only if it does not already exist.
        if (d3.select("#" + config.containerId).empty()) {
          var buttonElement = d3.select("#" + config.buttonId);
          var menuContainer = d3.select(buttonElement.node().parentNode).append("div").attr("id", config.containerId).attr("ownerButton", config.buttonId).attr("class", "card ui-draggable-handle");
          $("#" + config.containerId).hide();
        } //

      },
      // makeMenuContainer
      updateMenus: function updateMenus(config) {
        // This function updates the menu of the pop-up window.
        var menus = d3.select("#" + config.containerId).selectAll(".selectmenu").data(config.menuItems); // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.

        menus.enter().append("label").attr("class", "selectmenuLabel").text(function (d) {
          return d.label;
        }).append("select").attr("class", "selectmenu").attr("id", function (d) {
          return d.id;
        }); // Update all the menu elements.

        d3.select("#" + config.containerId).selectAll(".selectmenu").each(function (d) {
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

        var labels = d3.select("#" + config.containerId).selectAll(".selectmenuLabel").data(config.menuItems);
        labels.exit().remove(); // Add the functionality to update dependent properties of the new element we're adding to the view. E.g. x and y variable names. THIS HAS TO BE HERE, AS THE MENUS ENTER AND EXIT THE VIEW UPON UPDATE, AND THEIR ON CHANGE EVENTS NEED TO BE UPDATED.

        var variables = config.userSelectedVariables;

        for (var i = 0; i < variables.length; i++) {
          addMenu.helpers.addVariableChangeEvent(config, variables[i]);
        }
        config.buttonActivationFunction(config);
      },
      // updateMenus
      addUpdateMenuItemObject: function addUpdateMenuItemObject(config, menuItemId, variables) {
        // First remove any warnings. If they are needed they are added later on.
        d3.select("#" + config.containerId).selectAll(".warning").remove(); // Only add or update the menu item if some selection variables exist.
        // >1 is used as the default option "undefined" is added to all menus.

        if (variables.length > 1) {
          var menuItems = config.menuItems; // Check if the config object already has an item with the 'xPropertyMenu' id.

          var requiredItem = menuItems.find(function (x) {
            return x.id === menuItemId;
          });
          var doesItemExist = requiredItem !== undefined;

          if (doesItemExist) {
            // If the item exists, just update it.
            var index = menuItems.map(function (d) {
              return d.id;
            }).indexOf(menuItemId);
            config.menuItems[index].options = variables;
          } else {
            // If it doesn't, create a new one.
            requiredItem = {
              options: variables,
              label: "Select variable",
              id: menuItemId
            };
            config.menuItems.push(requiredItem);
          }
        } else {
          // There are no variables. No point in having an empty menu.
          addMenu.helpers.removeMenuItemObject(config, menuItemId); // Tell the user that the data is empty.

          var warning = d3.select("#" + config.containerId).selectAll(".warning");

          if (warning.empty()) {
            d3.select("#" + config.containerId).append("div").attr("class", "warning").html("No data has been loaded!").attr("style", "background-color:pink;font-size:25px;color:white");
          }
        }
      },
      // addUpdateMenuItemObject
      removeMenuItemObject: function removeMenuItemObject(config, menuItemId) {
        var menuItems = config.menuItems;
        var index = config.menuItems.map(function (d) {
          return d.id;
        }).indexOf(menuItemId);

        if (index > -1) {
          menuItems.splice(index, 1);
        }
        config.menuItems = menuItems;
      },
      // removeMenuItemObject
      resetVariableMenuSelections: function resetVariableMenuSelections(menuId) {
        var propertyMenuHandle = document.getElementById(menuId);

        if (propertyMenuHandle !== null) {
          propertyMenuHandle.value = undefined;
        }
      },
      // resetVariableMenuSelections
      addButtonClickEvent: function addButtonClickEvent(config) {
        // First
        $("#" + config.buttonId).click(function () {
          // Disable all buttons:
          d3.selectAll("button").each(function () {
            $(this).prop("disabled", true);
          }); // Make the dialog

          $("#" + config.containerId).dialog({
            draggable: false,
            autoOpen: true,
            modal: true,
            buttons: {
              "Ok": {
                text: "Ok",
                id: config.menuOkButtonId,
                disabled: true,
                click: function click() {
                  // Add the plot row to the session.
                  config.ok(config); // Close the dialogue.

                  $(this).dialog("close"); // Enable all relevant buttons.

                  addMenu.helpers.enableDisableAllButtons(); // Delete the warning if present.

                  d3.select(this).selectAll(".warning").remove();
                } // click

              },
              // ok
              "Cancel": {
                text: "Cancel",
                id: config.menuCancelButtonId,
                disabled: false,
                click: function click() {
                  // Clearup the internal config objects
                  config.cancel(config);
                  $(this).dialog("close"); // Enable all buttons.

                  addMenu.helpers.enableDisableAllButtons(); // Delete the warning if present.

                  d3.select(this).selectAll(".warning").remove();
                } // click

              } // cancel

            },
            // buttons
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
        }); // on click
      },
      // addButtonClickEvent
      addVariableChangeEvent: function addVariableChangeEvent(config, variable) {
        var idOfMenuToListenTo = config.containerId + variable + "Menu";
        d3.select("#" + idOfMenuToListenTo).on("change", function () {
          // Populate the 'newPlot' object.
          var selectedVariable = $(this).val();
          config.newPlot.data[variable] = selectedVariable;
          config.newPlot.layout.title = selectedVariable;
          config.buttonActivationFunction(config);
        });
      },
      //addVariableChangeEent
      enableDisableAllButtons: function enableDisableAllButtons() {
        // This functionality decides which buttons should be enabled.
        var isDataInFilter = dbsliceData.filteredTaskIds.length !== undefined && dbsliceData.filteredTaskIds.length > 0;
        var isPlotterPlotRowCtrlDefined = addMenu.helpers.checkIfArrayKeyIsDefined(dbsliceData.session.plotRows, 'ctrl'); // For the data to be loaded some records should have been assigned to the crossfilter.

        var isDataLoaded = false;

        if (dbsliceData.data !== undefined) {
          isDataLoaded = dbsliceData.data.cf.size() > 0;
        } // if
        // GROUP 1: SESSION OPTIONS
        // Button controlling the session options is always available!


        $("#sessionOptions").prop("disabled", false); // "Load session" only available after some data has been loaded.
        // Data: Replace, add, remove, Session: save, load
        // These have to have their class changed, and the on/click event suspended!!

        listItemEnableDisable("replaceData", true);
        listItemEnableDisable("addData", true);
        listItemEnableDisable("removeData", isDataLoaded);
        listItemEnableDisable("saveSession", true);
        listItemEnableDisable("loadSession", isDataLoaded); // GROUP 2: ON DEMAND FUNCTIONALITY
        // "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.

        var refreshTasksButton = d3.select("#refreshTasksButton");
        var enableRefreshTasksButton = isDataInFilter && isPlotterPlotRowCtrlDefined;
        arrayEnableDisable(refreshTasksButton, enableRefreshTasksButton); // GROUP 3: ADDING/REMOVING PLOTS/ROWS
        // "Add plot row" should be available when the data is loaded. Otherwise errors will occur while creating the apropriate menus.

        $("#addPlotRowButton").prop("disabled", !isDataLoaded); // "Remove plot row" should always be available.

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
              $(this).prop("disabled", false);
            });
          } else {
            // Disable the button
            d3ButtonSelection.each(function () {
              $(this).prop("disabled", true);
            });
          }
        } // arrayEnableDisable


        function listItemEnableDisable(elementId, conditionToEnable) {
          if (conditionToEnable) {
            // Enable the button
            d3.select("#" + elementId).attr("class", "dropdown-item");
            document.getElementById(elementId).style.pointerEvents = 'auto';
          } else {
            // Disable the button
            d3.select("#" + elementId).attr("class", "dropdown-item disabled");
            document.getElementById(elementId).style.pointerEvents = 'none';
          }
        } // listItemEnableDisable

      },
      // enableDisableAllButtons
      findLatestPlotRowInd: function findLatestPlotRowInd() {
        var latestRowInd = [];
        d3.selectAll(".plotRow").each(function () {
          latestRowInd.push(d3.select(this).attr("plot-row-index"));
        });

        if (latestRowInd.length > 0) {
          latestRowInd = latestRowInd.map(Number);
          var newRowInd = Math.max.apply(Math, _toConsumableArray(latestRowInd)) + 1; // 'spread' operator used!
        } else {
          var newRowInd = 0;
        }

        return newRowInd;
      },
      // findLatestPlotRowInd
      checkIfArrayKeyIsDefined: function checkIfArrayKeyIsDefined(array, key) {
        // This function checks if any objects in the array <array> have a property called <key>, and if that property is not undefined. If there are no objects with the required property the function returns false. If the object has the property, but it isn't defined it returns false. Only if there are some objects with the required property, and it is defined does the function return true.
        var isKeyDefined = true; // First check if there are any objects in the arra. Otherwise return false.

        if (array.length > 0) {
          // Now check if there are any plot rows with 'ctrl'
          var compliantObjects = [];

          for (var i = 0; i < array.length; i++) {
            if (key in array[i]) {
              compliantObjects.push(array[i]);
            }
          }
          // If there are some, then check if their controls are defined.

          if (compliantObjects.length > 0) {
            isKeyDefined = true;

            for (var j = 0; j < compliantObjects.length; j++) {
              if (compliantObjects[j][key] !== undefined) {
                isKeyDefined = isKeyDefined && true;
              } else {
                isKeyDefined = isKeyDefined && false;
              }
            }
          } else {
            isKeyDefined = false;
          }
        } else {
          isKeyDefined = false;
        }

        return isKeyDefined;
      } // checkIfArrayKeyIsDefined

    } // helpers

  }; // addMenu

  function render(elementId, session) {
    var element = d3.select("#" + elementId);

    if (dbsliceData.filteredTaskIds !== undefined) {
      element.select(".filteredTaskCount").select("p").html("Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length);
    } else {
      element.select(".filteredTaskCount").select("p").html("<p> Number of Tasks in Filter = All </p>");
    }
    // Remove all d3-tip elements because they end up cluttering the DOM.
    // d3.selectAll(".d3-tip").remove();
    // THIS CAN CURRENTLY RESOLVE PROBLEMS F THE DATA IS INCOMPATIBLE.
    // This should work both when new data is loaded and when a new session is loaded.

    importExportFunctionality.helpers.onDataAndSessionChangeResolve();
    var plotRows = element.selectAll(".plotRow").data(session.plotRows); // HANDLE ENTERING PLOT ROWS!

    var newPlotRows = plotRows.enter().append("div").attr("class", "card bg-light plotRow").attr("style", "margin-bottom:20px").attr("plot-row-index", function (d, i) {
      return i;
    }); // Add in the container for the title of the plotting section.
    // Make this an input box so that it can be change on te go!

    var newPlotRowsHeader = newPlotRows.append("div").attr("class", "card-header plotRowTitle").attr("type", function (d) {
      return d.type;
    });
    newPlotRowsHeader.append("h3").attr("style", "display:inline").html(function (data) {
      return data.title;
    }).attr("spellcheck", "false").attr("contenteditable", true); // Give all entering plot rows a body to hold the plots.

    var newPlotRowsBody = newPlotRows.append("div").attr("class", "row no-gutters plotRowBody").attr("plot-row-index", function (d, i) {
      return i;
    }).attr("type", function (d) {
      return d.type;
    }); // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.

    var newPlots = newPlotRowsBody.selectAll(".plot").data(function (d) {
      return d.plots;
    }).enter().each(makeNewPlot); // UPDATE EXISTING PLOT ROWS!!
    // Based on the existing plotRowBodies, select all the plots in them, retrieve all the plotting data associated with this particular plot row, and assign it to the plots in the row. Then make any entering ones.

    var plots = plotRows.selectAll(".plotRowBody").selectAll(".plot").data(function (d) {
      return d.plots;
    });
    plots.enter().each(makeNewPlot); // Handle exiting plots before updating the existing ones.

    plots.exit().remove(); // Update the previously existing plots.

    var plotRowPlots = plotRows.selectAll(".plot").each(updatePlot); // This updates the headers of the plots because the titles might have changed.

    var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper").data(function (d) {
      return d.plots;
    }).each(function (plotData, index) {
      var plotWrapper = d3.select(this);
      var plotTitle = plotWrapper.select(".plotTitle").select("div").html(plotData.layout.title);
    }); // each
    // HANDLE EXITING PLOT ROWS!!

    plotRows.exit().remove();
    plotRowPlotWrappers.exit().remove(); // FUNCTIONALITY
    // ADD PLOT ROW BUTTON.

    var addPlotRowButtonId = "addPlotRowButton";
    createAddPlotRowButton(addPlotRowButtonId); // REMOVE PLOT ROW

    createRemovePlotRowButtons(newPlotRowsHeader); // ADD PLOT BUTTONS

    newPlotRowsHeader.each(function () {
      addMenu.addPlotControls.make(this);
    }); // each
    // REMOVE PLOT BUTTONS

    addMenu.removePlotControls(); // DROPDOWN MENU FUNCTIONALITY - MOVE TO SEPARATE FUNCTION??
    // REPLACE CURRENT DATA OPTION:

    var dataReplace = createFileInputElement(importExportFunctionality.importData.load, "replace");
    d3.select("#replaceData").on("click", function () {
      dataReplace.click();
    }); // ADD TO CURRENT DATA OPTION:

    var dataInput = createFileInputElement(importExportFunctionality.importData.load, "add");
    d3.select("#addData").on("click", function () {
      dataInput.click();
    }); // REMOVE SOME CURRENT DATA OPTION:
    // This requires a popup. The popup needs to be opened on clicking the option. Upon submitting a form the underlying functionality is then called.

    addMenu.removeDataControls.make("removeData"); // LOAD SESSION Button

    var sessionInput = createFileInputElement(importExportFunctionality.loadSession.handler);
    d3.select("#loadSession").on("click", function () {
      sessionInput.click();
    }); // SAVE SESSION Button
    // The save session functonality should run everytime render is called. The button needs to become the download bu

    importExportFunctionality.saveSession.createSessionFileForSaving(); // Control all button and menu activity;

    addMenu.helpers.enableDisableAllButtons(); // HELPER FUNCTIONS:

    function createFileInputElement(loadFunction, dataAction) {
      // This button is already created. Just add the functionaity.
      var dataInput = document.createElement('input');
      dataInput.type = 'file'; // When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.

      dataInput.onchange = function (e) {
        // BE CAREFULT HERE: file.name IS JUST THE local name without any path!
        var file = e.target.files[0]; // importExportFunctionality.importData.handler(file);

        loadFunction(file, dataAction);
      }; // onchange


      return dataInput;
    } // createGetDataFunctionality


    function createAddPlotRowButton(addPlotRowButtonId) {
      var addPlotRowButton = d3.select("#" + addPlotRowButtonId);

      if (addPlotRowButton.empty()) {
        // Add the button.
        d3.select("#" + dbsliceData.elementId).append("button").attr("id", addPlotRowButtonId).attr("class", "btn btn-info btn-block").html("+");
        addMenu.addPlotRowControls.make(addPlotRowButtonId);
      } else {
        // Move the button down
        var b = document.getElementById(addPlotRowButtonId);
        b.parentNode.appendChild(b);
      }
    } // createAddPlotRowButton


    function createRemovePlotRowButtons(newPlotRowsHeader) {
      newPlotRowsHeader.each(function (data) {
        // Give each of the plot rows a delete button.
        d3.select(this).append("button").attr("id", function (d, i) {
          return "removePlotRowButton" + i;
        }).attr("class", "btn btn-danger float-right").html("x").on("click", function () {
          // Select the parent plot row, and get its index.
          var ownerPlotRowInd = d3.select(this.parentNode.parentNode).attr("plot-row-index");
          dbsliceData.session.plotRows.splice(ownerPlotRowInd, 1);
          render(dbsliceData.elementId, dbsliceData.session);
        }); // on
      }); // each
    } // createRemovePlotRowButtons

  } // render

  function cfUpdateFilters(crossfilter) {
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
    // Bar charts
    crossfilter.filterSelected.forEach(function (filters, i) {
      // if the filters array is empty: ie. all values are selected, then reset the dimension
      if (filters.length === 0) {
        //Reset all filters
        crossfilter.metaDims[i].filterAll();
      } else {
        crossfilter.metaDims[i].filter(function (d) {
          return filters.indexOf(d) > -1;
        }); // filter
      }
    }); // forEach
    // Histograms

    crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
      // Reset all filters
      crossfilter.dataDims[i].filterAll();

      if (selectedRange.length !== 0) {
        crossfilter.dataDims[i].filter(function (d) {
          return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
        }); // filter
      }
    }); // forEach
    // Manual selections - but this should happen only if the manual switch is on!! 

    var isManualFilterApplied = checkIfManualFilterIsApplied();

    if (isManualFilterApplied) {
      var filters = crossfilter.scatterManualSelectedTasks;

      if (filters.length === 0) {
        // if the filters array is empty: ie. all values are selected, then reset the dimension
        crossfilter.taskDim.filterAll();
      } else {
        crossfilter.taskDim.filter(function (d) {
          return filters.indexOf(d) > -1;
        }); // filter
      }
    } else {
      crossfilter.taskDim.filterAll();
    } // if
    // HERE THE SELECTED TASKIDS ARE UPDATED


    var currentMetaData = crossfilter.metaDims[0].top(Infinity);
    dbsliceData.filteredTaskIds = currentMetaData.map(function (d) {
      return d.taskId;
    });

    if (currentMetaData.length > 0) {
      if (currentMetaData[0].label !== undefined) {
        dbsliceData.filteredTaskLabels = currentMetaData.map(function (d) {
          return d.label;
        });
      } else {
        dbsliceData.filteredTaskLabels = currentMetaData.map(function (d) {
          return d.taskId;
        });
      } // if

    } else {
      dbsliceData.filteredTaskLabels = [];
    } // if


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
      // Remove any controls in the plot title.
      cfD3BarChart.addInteractivity.updatePlotTitleControls(element);
      cfD3BarChart.update(element, data, layout);
    },
    // make
    update: function update(element, data, layout) {
      var container = d3.select(element); // Setup the svg

      cfD3BarChart.setupSvg(container, data, layout); // Create some common handles.

      var svg = container.select("svg"); // Get the items to plot.

      var items = cfD3BarChart.helpers.getItems(data.xProperty); // Create the x and y plotting scales.

      var x = cfD3BarChart.helpers.getScaleX(svg, items);
      var y = cfD3BarChart.helpers.getScaleY(svg, items); // Color scale

      var colour = d3.scaleOrdinal().range(["cornflowerblue"]);
      colour.domain(dbsliceData.data.metaDataUniqueValues[data.xProperty]); // Handle the entering/updating/exiting of bars.

      var bars = svg.select(".plotArea").selectAll("rect").data(items, function (v) {
        return v.key;
      });
      bars.enter().append("rect").attr("keyVal", function (v) {
        return v.key;
      }).attr("height", y.bandwidth()).attr("y", function (v) {
        return y(v.key);
      }).style("fill", function (v) {
        return colour(v.key);
      }).transition().attr("width", function (v) {
        return x(v.value);
      }).attr("opacity", 1); // updating the bar chart bars

      bars.exit().remove(); // Handle the axes.

      createAxes(); // Add interactivity:

      cfD3BarChart.addInteractivity.addOnMouseOver(svg);
      cfD3BarChart.addInteractivity.addOnMouseClick(svg, data.xProperty); // Helper functions

      function createAxes() {
        var plotArea = svg.select(".plotArea");
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
      } // createAxes

    },
    // update
    setupSvg: function setupSvg(container, data, layout) {
      // Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
      // If layout has a margin specified store it as the internal property.
      var margin = layout.margin === undefined ? cfD3BarChart.margin : layout.margin;
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
        container.select("svg").attr("width", svgWidth).attr("height", svgHeight).attr("plotWidth", width).attr("plotHeight", height);
        var plotArea = container.select("svg").select(".plotArea");

        if (plotArea.empty()) {
          // If there's nonoe, add it.
          container.select("svg").append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");
        }
      }
    },
    // setupSvg
    addInteractivity: {
      addOnMouseClick: function addOnMouseClick(svg, property) {
        // Add the mouse click event
        svg.selectAll("rect").on("click", onClick); // Add the associated transition effects.

        svg.selectAll("rect").transition().attr("width", transitionWidthEffects).attr("y", transitionYEffects).attr("height", transitionHeightEffects).attr("opacity", transitionOpacityEffects);

        function onClick(d) {
          var dimId = dbsliceData.data.metaDataProperties.indexOf(property); // check if current filter is already active

          if (dbsliceData.data.filterSelected[dimId] === undefined) {
            dbsliceData.data.filterSelected[dimId] = [];
          } // if


          if (dbsliceData.data.filterSelected[dimId].indexOf(d.key) !== -1) {
            // Already active filter, let it remove this item from view.
            var ind = dbsliceData.data.filterSelected[dimId].indexOf(d.key);
            dbsliceData.data.filterSelected[dimId].splice(ind, 1);
          } else {
            // Filter not active, add the item to view.
            dbsliceData.data.filterSelected[dimId].push(d.key);
          } // if


          cfUpdateFilters(dbsliceData.data); // Everything needs to b rerendered as the plots change depending on one another according to the data selection.

          render(dbsliceData.elementId, dbsliceData.session); // Adjust the styling: first revert back to default, then apply the mouseover.

          crossPlotHighlighting.off(d, "cfD3BarChart");
          crossPlotHighlighting.on(d, "cfD3BarChart");
        } // onClick


        function transitionOpacityEffects(v) {
          // Change color if the filter has been selected.
          // if no filters then all are selected
          var dimId = dbsliceData.data.metaDataProperties.indexOf(property);

          if (dbsliceData.data.filterSelected[dimId] === undefined || dbsliceData.data.filterSelected[dimId].length === 0) {
            return 1;
          } else {
            return dbsliceData.data.filterSelected[dimId].indexOf(v.key) === -1 ? 0.2 : 1;
          } // if

        } // transitionEffects


        function transitionWidthEffects(v) {
          // Get the items.
          var items = cfD3BarChart.helpers.getItems(property); // Get th eappropriate scale.

          var xscale = cfD3BarChart.helpers.getScaleX(svg, items); // Get the new width;

          return xscale(v.value);
        } // transitionWidthEffects


        function transitionHeightEffects() {
          // Get the items.
          var items = cfD3BarChart.helpers.getItems(property); // Get th eappropriate scale.

          var yscale = cfD3BarChart.helpers.getScaleY(svg, items);
          return yscale.bandwidth();
        } // transitionHeightEffects


        function transitionYEffects(v) {
          // Get the items.
          var items = cfD3BarChart.helpers.getItems(property); // Get th eappropriate scale.

          var yscale = cfD3BarChart.helpers.getScaleY(svg, items); // Get the new width;

          return yscale(v.key);
        } // transitionYEffects

      },
      // addOnMouseClick
      addOnMouseOver: function addOnMouseOver(svg) {
        var rects = svg.selectAll("rect");
        rects.on("mouseover", crossHighlightOn).on("mouseout", crossHighlightOff);

        function crossHighlightOn(d) {
          // Here 'd' is just an object with properties 'key', and 'value'. The first denotes the value of the plotting property belonging to the bar, and the second how many items with that property value are currently selected.
          crossPlotHighlighting.on(d, "cfD3BarChart");
        }

        function crossHighlightOff(d) {
          crossPlotHighlighting.off(d, "cfD3BarChart");
        }
      },
      // addOnMouseOver
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        // Remove any controls in the plot title.
        plotHelpers.removePlotTitleControls(element);
      } // updatePlotTitleControls

    },
    // addInteractivity
    helpers: {
      getItems: function getItems(property) {
        // Get the data through crossfilters dimension functionality.
        var dimId = dbsliceData.data.metaDataProperties.indexOf(property);
        var group = dbsliceData.data.metaDims[dimId].group();
        var items = group.all(); // Remove any bars with no entries.

        items = items.filter(function (item) {
          return item.value > 0;
        }); // Add the property to it for convenience.

        items.forEach(function (d) {
          d.keyProperty = property;
        });
        return items;
      },
      // getItems
      getScaleX: function getScaleX(svg, items) {
        var scale = d3.scaleLinear().range([0, svg.attr("plotWidth")]).domain([0, d3.max(items, function (v) {
          return v.value;
        })]);
        return scale;
      },
      // getScaleX
      getScaleY: function getScaleY(svg, items) {
        var scale = d3.scaleBand().range([0, svg.attr("plotHeight")]).domain(items.map(function (d) {
          return d.key;
        })).padding([0.2]).align([0.5]);
        return scale;
      } // getScaleY

    } // helpers

  }; // cfD3BarChart

  function makePlotsFromPlotRowCtrl(ctrl) {
    var plotPromises = []; // A decision is made whether the ctrl dictates a 'slice' or 'task' plot should be made. 'Task' creates an individual plot for each task, and 'slice' ummaries many on the same plot.

    switch (ctrl.plotType) {
      case "d3LineSeries":
        // Summary plot of all the selected task line plots.
        // The sliceIds are also variable names!
        ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {
          var plotPromise = makePromiseSlicePlot(ctrl, sliceId, sliceIndex);
          plotPromises.push(plotPromise);
        }); // forEach

        break;

      case "d3Contour2d":
        // Individual task plot. Loop through the tasks and create a promise for each.
        var d = ctrl.data.dataDims[0].top(Infinity);

        for (var index = 0; index < ctrl.taskIds.length; ++index) {
          var url = d[index][ctrl.sliceIds];
          var title = d[index].label;
          var plotPromise = makePromiseTaskPlot(ctrl, url, title, ctrl.taskIds[index]);
          plotPromises.push(plotPromise);
        } // for
        // Calculate the data limits. Here it is known what the properties are since this branch only executes for 'd3Contour2d'.


        Promise.all(plotPromises).then(function (plots) {
          // The input 'plots' is an array of objects, which all include their relevant data in the .data.surfaces property. In the case of a 2d contour there will only be one surface.
          // Find all the properties that are in all the loaded files. First collect the properties of all the files in an array of arrays.
          var allPropertyNames = plotHelpers.collectAllPropertyNames(plots, function (d) {
            return d.data.surfaces;
          }); // Check which ones are in all of them.

          var commonPropertyNames = plotHelpers.findCommonElements(allPropertyNames); // Loop over all the common properties and calculate their ranges.

          for (var i = 0; i < commonPropertyNames.length; i++) {
            var property = commonPropertyNames[i];
            ctrl.limits[property] = plotHelpers.getDomain(plots, function (d) {
              return d.data.surfaces[property];
            });
          }
          // ctrl is from dbsliceData.session.plotRows.ctrl.
        }); // Promise.all().then

        break;
      // Do nothing.
    }
    // Bundle all the promises together again?

    return Promise.all(plotPromises);
  } // makePlotsFromPlotRowCtrl


  function makePromiseTaskPlot(ctrl, url, title, taskId) {
    var promise = fetch(url).then(function (response) {
      if (ctrl.csv === undefined) {
        return response.json();
      } // if


      if (ctrl.csv == true) {
        return response.text();
      } // if 

    }).then(function (responseJson) {
      if (ctrl.csv == true) {
        responseJson = d3.csvParse(responseJson);
      } // if


      var plot = {};

      if (ctrl.formatDataFunc !== undefined) {
        plot.data = ctrl.formatDataFunc(responseJson, taskId);
      } else {
        plot.data = responseJson;
      } // if
      // Add the taskId for identification purposes.


      plot.data.taskId = taskId;
      plot.layout = Object.assign({}, ctrl.layout);
      plot.plotFunc = ctrl.plotFunc;
      plot.layout.title = title;
      plot.data.newData = true;
      return plot;
    }); // then

    return promise;
  } // makePromiseTaskPlot


  function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
    // This creates all the data retrieval promises required to make a 'slice' plot. 'Slice' plots summarise data of multiple tasks, as opposed to 'task' plots which produce an individual plot for each of the tasks.
    var slicePromisesPerPlot = []; // Determine the maximum number of plots if a limit is imposed.

    ctrl.maxTasks = ctrl.maxTasks !== undefined ? Math.min(ctrl.taskIds.length, ctrl.maxTasks) : undefined; // The data is selected here. As the filtering has already been applied in 'cfUpdateFilters' all of the data can be selected here, and will respect the filters.

    var d = ctrl.data.dataDims[0].top(Infinity); // Make all the promises required for a single plot.

    for (var index = 0; index < d.length; index++) {
      // The URL must be given in the data. The sliceId comes from the variable name in the data. The task Id is added to track the loaded data.
      var taskData = d[index];
      var url = taskData[sliceId];
      var slicePromise = makeSlicePromise(url, taskData.taskId);
      slicePromisesPerPlot.push(slicePromise);
    } // for
    // Bundle together all the promises required for the plot.


    return Promise.all(slicePromisesPerPlot).then(function (responseJson) {
      if (ctrl.csv == true) {
        var responseCsv = [];
        responseJson.forEach(function (d) {
          responseCsv.push(d3.csvParse(d));
        });
        responseJson = responseCsv;
      } // if


      var plot = {};

      if (ctrl.formatDataFunc !== undefined) {
        plot.data = ctrl.formatDataFunc(responseJson);
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
    }); // then

    function makeSlicePromise(url, taskId) {
      // This is done in the following manner to allow the correct taskId to be added to each of hte loaded data sets. This allows the data in the files to not need the appropriate task id in order to be tracked on the plots.
      var slicePromise = fetch(url).then(function (response) {
        var dataPromise = response.json();
        dataPromise.then(function (data) {
          data.taskId = taskId;
          return data;
        });
        return dataPromise;
      }); // fetch().then()

      return slicePromise;
    } // makeSlicePromise

  } // makePromiseSlicePlot

  var onDemandDataLoading = {
    makePlotsFromPlotRowCtrl: function makePlotsFromPlotRowCtrl(plotRowCtrl) {
      // This reads the orders from the plot row control object, and executes them.
      //
      // Two basic options are possible - there could be a single file for each plot, or tehre could be multiple files for each plot. The first is intended for side-by-side comparisons (e.g. contour plots), whereas the second is intended for one-on-top-of-the-other comparisons (e.g. line plots.)
      //
      // More advanced functionality to group side-by-side plots can be developed later. This can be in terms of satistical plots, or a sliding window as in direct photo comparisons.
      var plotPromises = []; // A decision is made whether the ctrl dictates a 'slice' or 'task' plot should be made. 'Task' creates an individual plot for each task, and 'slice' ummaries many on the same plot.

      switch (plotRowCtrl.plotType) {
        case "d3LineSeriesRrd":
          // Summary plot of all the selected task line plots.
          // The sliceIds are also variable names!
          plotRowCtrl.sliceIds.forEach(function (sliceId, sliceIndex) {
            var plotPromise = onDemandDataLoading.makePromiseSlicePlot(plotRowCtrl, sliceId, sliceIndex);
            plotPromise.then(function (plot) {
              // plotPromise should retun a plot. At this point it's data can be restructured, as the plot has been recognised as loading in rrd files, whil eat the same time keeping the lower level code abstract.
              var h = importExportFunctionality.importData.helpers.rrdPlcp2json;
              plot.data.series.forEach(function (series, index) {
                plot.data.series[index] = h.rrdPlcpRestructure(series);
              });
              return plot;
            });
            plotPromises.push(plotPromise);
          }); // forEach

          break;

        case "d3LineRadialRrd":
          // Summary plot of all the selected task line plots.
          // The sliceIds are also variable names!
          plotRowCtrl.sliceIds.forEach(function (sliceId, sliceIndex) {
            var plotPromise = onDemandDataLoading.makePromiseSlicePlot(plotRowCtrl, sliceId, sliceIndex);
            plotPromise.then(function (plot) {
              // plotPromise should retun a plot. At this point it's data can be restructured, as the plot has been recognised as loading in rrd files, whil eat the same time keeping the lower level code abstract.
              return plot;
            });
            plotPromises.push(plotPromise);
          }); // forEach

          break;
        // Do nothing.
      }
      // Bundle all the promises together again?

      return Promise.all(plotPromises);
    },
    // makePlotsFromPlotRowCtrl
    makePromiseSlicePlot: function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
      // This creates all the data retrieval promises required to make a 'slice' plot. 'Slice' plots summarise data of multiple tasks, as opposed to 'task' plots which produce an individual plot for each of the tasks.
      var slicePromisesPerPlot = []; // Determine the maximum number of plots if a limit is imposed.

      ctrl.maxTasks = ctrl.maxTasks !== undefined ? Math.min(ctrl.taskIds.length, ctrl.maxTasks) : undefined; // The data is selected here. As the filtering has already been applied in 'cfUpdateFilters' all of the data can be selected here, and will respect the filters.

      var d = ctrl.data.dataDims[0].top(Infinity); // Make all the promises required for a single plot.

      var slicePromisesPerPlot = [];

      for (var index = 0; index < d.length; index++) {
        // Make the promise to load the data.
        var taskData = d[index];
        var url = taskData[sliceId];
        var slicePromise = makeSlicePromise(url, taskData.taskId);
        slicePromisesPerPlot.push(slicePromise);
      } // for


      return Promise.all(slicePromisesPerPlot).then(function (response) {
        // Now I can start plotting something.
        // console.log(response)
        var plot = {};
        plot.data = {
          series: response
        };
        plot.layout = {
          colWidth: ctrl.layout.colWidth,
          xAxisLabel: ctrl.layout.xAxisLabel,
          yAxisLabel: ctrl.layout.yAxisLabel,
          title: sliceId
        };
        plot.plotFunc = ctrl.plotFunc;
        plot.data.newData = true;
        return plot;
      });

      function makeSlicePromise(url, taskId) {
        // This is done in the following manner to allow the correct taskId to be added to each of hte loaded data sets. This allows the data in the files to not need the appropriate task id in order to be tracked on the plots.
        var slicePromise = d3.csv(url).then(function (data) {
          data.taskId = taskId;
          return data;
        });
        return slicePromise;
      } // makeSlicePromise

    } // makePromiseSlicePlot

  }; // onDemandDataLoading

  function refreshTasksInPlotRows() {
    var plotRows = dbsliceData.session.plotRows;
    var plotRowPromises = [];
    plotRows.forEach(function (plotRow) {
      // For now nothing happens as there are no plotRow.ctrl
      if (plotRow.ctrl !== undefined) {
        var ctrl = plotRow.ctrl;

        if (ctrl.plotFunc !== undefined) {
			// Remove all the plots in all plotrows first. This should be ok as all plots are redrawn anyway.
			d3.selectAll(".plotRowBody[type='plotter']").selectAll(".plotWrapper").remove()
          // Get 
          if (ctrl.tasksByFilter) {
            ctrl.taskIds = dbsliceData.filteredTaskIds;
            ctrl.taskLabels = dbsliceData.filteredTaskLabels;
          } // if
          // Create all the promises, and when they're met push the plots.


          var plotRowPromise = onDemandDataLoading.makePlotsFromPlotRowCtrl(ctrl).then(function (plots) {
            plotRow.plots = plots;
          }); // then

          plotRowPromises.push(plotRowPromise);
        } // if

      } // if

    }); // forEach

    Promise.all(plotRowPromises).then(function () {
      // Render when all the data for all the plots in all plot rows has been loaded.
      // console.log(dbsliceData)
      render(dbsliceData.elementId, dbsliceData.session);
    }); // Promise
  } // refreshTasksInPlotRows

  function makeSessionHeader(element, title, subtitle, config) {
    var sessionTitle = element.append("div").attr("class", "row sessionHeader").append("div").attr("class", "col-md-12 sessionTitle");
    sessionTitle.append("br");
    sessionTitle.append("h1").attr("style", "display:inline").attr("spellcheck", "false").html(title).attr("contenteditable", true);

    if (config.plotTasksButton) {
      sessionTitle.append("button").attr("class", "btn btn-success float-right").attr("id", "refreshTasksButton").html("Plot Selected Tasks");
    } // if


    if (subtitle !== undefined) {
      sessionTitle.append("p").html(subtitle);
    } // if


    sessionTitle.append("br");
    sessionTitle.append("br");
    sessionTitle.append("div").attr("class", "filteredTaskCount").append("p").attr("style", "display:inline"); // CREATE THE MENU WITH SESSION OPTIONS

    var sessionGroup = sessionTitle.append("div").attr("class", "btn-group float-right").attr("style", "display:inline");
    sessionGroup.append("button").attr("id", "sessionOptions").attr("type", "button").attr("class", "btn btn-info dropdown-toggle").attr("data-toggle", "dropdown").attr("aria-haspopup", true).attr("aria-expanded", false).html("Session options");
    var sessionMenu = sessionGroup.append("div").attr("class", "dropdown-menu");
    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "replaceData").html("Replace data");
    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "addData").html("Add data");
    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "removeData").html("Remove data");
    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "loadSession").html("Load session");
    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "saveSession").attr("download", "session.json").html("Save session");
    sessionTitle.append("br");
    sessionTitle.append("br");
    $("#refreshTasksButton").on("click", function () {
      refreshTasksInPlotRows();
    });
  } // makeSessionHeader

  function initialise(elementId, session, data) {
    var config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
      plotTasksButton: false
    };
    dbsliceData.data = cfDataManagement.cfInit(data);
    dbsliceData.session = session;
    dbsliceData.elementId = elementId;
    dbsliceData.config = config;
    var element = d3.select("#" + elementId);
    var sessionHeader = element.select(".sessionHeader");

    if (sessionHeader.empty()) {
      makeSessionHeader(element, session.title, session.subtitle, config);
    } // if


    render(elementId, session);
  } // initialise

  exports.addMenu = addMenu;
  exports.cfD3BarChart = cfD3BarChart;
  exports.cfD3Histogram = cfD3Histogram;
  exports.cfD3Scatter = cfD3Scatter;
  exports.cfDataManagement = cfDataManagement;
  exports.cfUpdateFilters = cfUpdateFilters;
  exports.crossPlotHighlighting = crossPlotHighlighting;
  exports.d3Contour2d = d3Contour2d;
  exports.d3LineRadialRrd = d3LineRadialRrd;
  exports.d3LineSeriesRrd = d3LineSeriesRrd;
  exports.importExportFunctionality = importExportFunctionality;
  exports.initialise = initialise;
  exports.makeNewPlot = makeNewPlot;
  exports.makePlotsFromPlotRowCtrl = makePlotsFromPlotRowCtrl;
  exports.makeSessionHeader = makeSessionHeader;
  exports.onDemandDataLoading = onDemandDataLoading;
  exports.plotHelpers = plotHelpers;
  exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
  exports.render = render;
  exports.updatePlot = updatePlot;

  return exports;

}({}));
