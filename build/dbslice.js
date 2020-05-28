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

  // https://www.sitepoint.com/javascript-object-creation-patterns-best-practises/
  var DbsliceData = function DbsliceData() {
    _classCallCheck(this, DbsliceData);

    this.data = undefined;
    this.flowData = [];
    this.session = {};
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
      dbsliceData.session.plotRows.forEach(function (plotRow) {
        // If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
        plotRow.plots.forEach(function (plotCtrl) {
          // First all the elements need to be unhiglighted.
          // crossPlotHighlighting.helpers.unHighlightAll(plotDOM, plot);
          plotCtrl.plotFunc.helpers.unhighlight(plotCtrl); // Now highlight the needed datapoints.

          allDataPoints.forEach(function (d) {
            plotCtrl.plotFunc.helpers.highlight(plotCtrl, d);
          }); // forEach
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
            // Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE FILTER - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
            var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity);
            allDataPoints = cfDataPoints.filter(function (p) {
              return p[d.keyProperty] == d.key;
            });
            break;

          case "cfD3Line":
            // Collect all the relevant data points by tskId.
            var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity);
            allDataPoints = cfDataPoints.filter(function (p) {
              return p.taskId == d.task.taskId;
            }); // console.log(allDataPoints);

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

  var plotHelpers = {
    setupPlot: {
      general: {
        // Making the plot DOM
        makeNewPlot: function makeNewPlot(plotCtrl, index) {
          var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
          var plot = d3.select(this).append("div").attr("class", "col-md-" + plotCtrl.format.colWidth + " plotWrapper").attr("plottype", plotCtrl.plotFunc.name).append("div").attr("class", "card");
          var plotHeader = plot.append("div").attr("class", "card-header plotTitle");
          plotHeader.append("div").attr("style", "display:inline").html(plotCtrl.format.title).attr("spellcheck", "false").attr("contenteditable", true); // Add a div to hold all the control elements.

          var controlGroup = plotHeader.append("div").attr("class", "ctrlGrp float-right").attr("style", "display:inline-block");
          var plotBody = plot.append("div").attr("class", "plot").attr("plot-row-index", plotRowIndex).attr("plot-index", index); // Bind the DOM element to the control object.

          plotCtrl.figure = plotBody; // Draw the plot

          plotCtrl.plotFunc.make(plotCtrl); // Redraw the plot on window resize!

          $(window).resize(function () {
            // Check if the element containing the plot to be resized is still in the visible dom (document). If not, then do not resize anything, as that will cause errors.
            if (document.body.contains(plotBody.node())) {
              // Use the data assigned to the node to execute the redraw.
              d3.select(plotBody.node()).each(function (plotCtrl) {
                plotCtrl.plotFunc.rescale(plotCtrl);
              }); // each
            } // if

          });
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

          plot.append("div").attr("class", "leftAxisControlGroup").attr("style", "width: " + ctrl.format.margin.left + "px; height: 100%; float: left"); // Main plot with its svg.

          plot.append("div").attr("class", "plotContainer").attr("style", "margin-left: " + ctrl.format.margin.left + "px"); // Bottom left corner div
          // A height of 38px is prescribed, as that is the height of a bootstrap button.

          plot.append("div").attr("class", "bottomLeftControlGroup").attr("style", "width: " + ctrl.format.margin.left + "px; height:" + ctrl.format.margin.bottom + "px; float:left"); // Bottom controls

          plot.append("div").attr("class", "bottomAxisControlGroup").attr("style", "margin-left: " + ctrl.format.margin.left + "px;");
        },
        // setupPlotBackbone
        setupPlotContainerBackbone: function setupPlotContainerBackbone(ctrl) {
          // Fill in the plot container backbone.
          var plotContainer = ctrl.figure.select("div.plotContainer");
          var svg = plotContainer.append("svg").attr("class", "plotArea"); // Background group will hold any elements required for functionality in the background (e.g. zoom rectangle). 

          svg.append("g").attr("class", "background"); // Group holding the primary data representations.

          svg.append("g").attr("class", "data"); // Markup group will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. 

          svg.append("g").attr("class", "markup"); // Group for the x axis

          svg.append("g").attr("class", "axis--x"); // Group for the y axis

          svg.append("g").attr("class", "axis--y");
        },
        // setupPlotContainerBackbone
        // Svg scaling
        rescaleSvg: function rescaleSvg(ctrl) {
          var svg = ctrl.figure.select("svg.plotArea"); // These are margins of the entire drawing area including axes. The left and top margins are applied explicitly, whereas the right and bottom are applied implicitly through the plotWidth/Height parameters.

          var margin = ctrl.format.margin;
          var axesMargin = ctrl.format.axesMargin; // Width of the plotting area is the width of the div intended to hold the plot (.plotContainer).

          var width = ctrl.format.width;

          if (width == undefined) {
            width = svg.node().parentElement.parentElement.offsetWidth - margin.left - margin.right;
          } // If undefined the height is the same as width


          var height = ctrl.format.height;

          if (height == undefined) {
            height = width;
          } else {
            height = height - margin.bottom - margin.top;
          } // The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.


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

          svg.select("g.axis--x").attr("transform", makeTranslate(axesMargin.left, plotHeight + axesMargin.top)); // Group for the y axis

          svg.select("g.axis--y").attr("transform", axesTranslate);

          function makeTranslate(x, y) {
            return "translate(" + [x, y].join() + ")";
          } // makeTranslate	

        },
        // rescaleSvg
        // Select menus
        appendVerticalSelection: function appendVerticalSelection(container, onChangeFunction) {
          // var container = ctrl.figure.select(".leftAxisControlGroup")
          var s = container.append("select").attr("class", "select-vertical custom-select");
          container.append("text").text(s.node().value).attr("class", "txt-vertical-axis");
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
          });
          options.html(function (d) {
            return d;
          });
          options.exit().remove(); // Force the appropriate selection to be selected.

          s.node().value = ctrl.view.yVarOption.val; // Update the text to show the same.

          container.select("text").text(ctrl.view.yVarOption.val);
        },
        // updateVerticalSelection
        appendHorizontalSelection: function appendHorizonalSelection(container, onChangeFunction) {
          // var container = ctrl.figure.select(".bottomAxisControlGroup")
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

          var background = svg.select("g.background");
          background.append("clipPath").attr("id", "zoomClip").append("rect");
          background.append("rect").attr("class", "zoom-area").attr("fill", "rgb(255,25,255)");
          background.append("g").style("display", "none").attr("class", "tooltipAnchor").append("circle").attr("class", "anchorPoint").attr("r", 1);
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
                h.toggleSubmenuItemHighlight(this); // If a special event is specified, execute it here. This event might require to know the previous state, therefore execute it before updating the state.

                if (option.event != undefined) {
                  option.event(ctrl, d);
                } // if
                // Update the corresponding ctrl attribute.
                // 'option' is a reference to either a manually created option in 'update', or a reference to an actual option in 'ctrl.view.options'.


                option.val = d; // The data defined options, if they exist, must not be deselected however. Highlight the selected ones.

                if (ctrl.view.options != undefined) {
                  var userOptionNames = ctrl.view.options.map(function (o) {
                    return o.name;
                  });

                  if (userOptionNames.includes(option.name)) {
                    // This item belongs to an option defined by the data. It must remain selected.
                    this.classList.replace("deselected", "selected");
                  } // if

                } // if


                ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated();
                ctrl.plotFunc.refresh(ctrl);
              });
            } // appendGroup

          },
          // update
          options: {
            groupColor: function groupColor(ctrl, varName) {
              // This functionality relies on the update to perform the actual change, and only configures the tools for the update to have the desired effect.
              // Setup the color function.
              if (ctrl.tools.cscale() == "cornflowerblue") {
                // Color scale is set to the default. Initialise a color scale.
                // The default behaviour of d3 color scales is that they extend the domain as new items are passed to it. Even if the domain is fixed upfront, the scale will extend its domain when new elements are presented to it.
                ctrl.tools.cscale = d3.scaleOrdinal(d3.schemeCategory10);
              } else if (ctrl.view.cVarOption.val != varName) {
                // The color metadata option has changed. Create a new scale to be used with this parameter.
                ctrl.tools.cscale = d3.scaleOrdinal(d3.schemeCategory10);
              } else {
                // The same color option has been selected - return to the default color options.
                ctrl.tools.cscale = function () {
                  return "cornflowerblue";
                };
              } // if

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
              ctrl.tools.yscale.domain(yDomain_); // t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.

              ctrl.view.t = -1;
            } // toggleAR

          },
          // options
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

            cfUpdateFilters(dbsliceData.data);
            render();
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
            d3.select(this.parentElement).select(".txt-vertical-axis").text(selectedVar); // Update the y-variable for the plot.

            ctrl.view.yVarOption.val = selectedVar;
          },
          // vertical
          horizontal: function horizontal() {// Horizontal select change requires so little to update itself that this function here is not necessary as of now.
          },
          // horizontal
          common: function common(ctrl) {
            ctrl.plotFunc.setupPlot.setupPlotTools(ctrl);
            ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated();
            ctrl.plotFunc.update(ctrl);
          } // common

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
              var selectedVar = this.value; // Perform the regular task for y-select.

              plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar); // Perform tasks required on both vertical and horizontal select changes, but that are only valid for plots with 2 interactive axes.

              plotHelpers.setupInteractivity.twoInteractiveAxes.onSelectChange.common(ctrl);
            }; // return
          },
          // vertical
          horizontal: function horizontal(ctrl) {
            // 'horizontal' returns a function in order to be able to include a reference to the correct 'ctrl' object in it.
            return function () {
              var selectedVar = this.value; // Update the y-variable for the plot.

              ctrl.view.xVarOption.val = selectedVar; // Perform other needed tasks and refresh.

              plotHelpers.setupInteractivity.twoInteractiveAxes.onSelectChange.common(ctrl);
            }; // return
          },
          // horizontal
          common: function common(ctrl) {
            // Reset the AR values.
            ctrl.view.dataAR = undefined;
            ctrl.view.viewAR = undefined; // Update the plot tools

            plotHelpers.setupTools.go(ctrl); // Update transition timings

            ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated(); // Update plot itself

            ctrl.plotFunc.refresh(ctrl);
          } // common

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
            var p = d3.event.x;
            downx = ctrl.tools.xscale.invert(p);
            downscalex = ctrl.tools.xscale;
          });
          svg.select(".axis--y").on("mousedown", function (d) {
            mw = Number(svg.select("g.data").attr("width"));
            mh = Number(svg.select("g.data").attr("height"));
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
              } // if


              handleRedraw();
            } // if


            if (!isNaN(downy)) {
              var py = d3.event.y;
              var dpy = d3.event.dy;

              if (dpy != 0) {
                ctrl.tools.yscale.domain([downscaley.domain()[0], mh * (downy - downscaley.domain()[0]) / (mh - py) + downscaley.domain()[0]]);
              } // if


              handleRedraw();
            } // if

          }).on("mouseup", function (d) {
            downx = Math.NaN;
            downy = Math.NaN;
            ctrl.view.t = -1;
          }); // Helpers

          function handleRedraw() {
            // Transitions
            ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.instantaneous(); // Create dummies.

            ctrl.plotFunc.refresh(ctrl);
          } // handleRedraw

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
            var xScaleDefined = ctrl.tools.xscale != undefined;
            var yScaleDefined = ctrl.tools.yscale != undefined;

            if (xScaleDefined && yScaleDefined) {
              // Simply rescale the axis to incorporate the delta event.  
              ctrl.tools.xscale = dt.rescaleX(ctrl.tools.xscale);
              ctrl.tools.yscale = dt.rescaleY(ctrl.tools.yscale); // Assign appropriate transitions

              ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.instantaneous(); // Update the plot
              // Create dummies.

              ctrl.plotFunc.refresh(ctrl);
            } // if


            ctrl.view.t = t;
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
        ctrl.tools.yscale = d3.scaleLinear().range(bounds.range.y).domain(bounds.domain.y); // The internal color scale might change due to the user changing hte data, but this should not reset the color scale.

        if (ctrl.tools.cscale == undefined) {
          ctrl.tools.cscale = function () {
            return "cornflowerblue";
          };
        } // if

      },
      // go
      getPlotBounds: function getPlotBounds(ctrl) {
        // This function should determine the domain of the plot and use it to control the plots aspect ratio.
        var h = ctrl.plotFunc.setupPlot;
        var h_ = plotHelpers.setupTools; // Get the bounds based on the data.

        var domain = h.findDomainDimensions(ctrl);
        var range = h.findPlotDimensions(ctrl.figure.select("svg.plotArea"));

        if (ctrl.view.viewAR !== undefined) {
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

    } // setupTools

  }; // plotHelpers

  var cfD3Histogram = {
    name: "cfD3Histogram",
    make: function make(ctrl) {
      // Update the controls as required
      // MISSING FOR NOW. IN THE END PLOTHELPERS SHOULD HAVE A VERTEILER FUNCTION
      // cfD3Histogram.addInteractivity.updatePlotTitleControls(element)
      // Setup the object that will internally handle all parts of the chart.
      plotHelpers.setupPlot.general.setupPlotBackbone(ctrl);
      plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl);
      plotHelpers.setupPlot.general.rescaleSvg(ctrl); // cfD3Histogram.setupPlot.appendHorizonalSelection(ctrl.figure.select(".bottomAxisControlGroup"), ctrl)

      var i = cfD3Histogram.addInteractivity.onSelectChange;
      plotHelpers.setupPlot.general.appendHorizontalSelection(ctrl.figure.select(".bottomAxisControlGroup"), i.horizontal(ctrl));
      plotHelpers.setupPlot.general.updateHorizontalSelection(ctrl);
      cfD3Histogram.setupPlot.setupPlotTools(ctrl);
      cfD3Histogram.addInteractivity.addBrush.make(ctrl);
      cfD3Histogram.addInteractivity.addBinNumberControls.make(ctrl);
      cfD3Histogram.update(ctrl);
    },
    update: function update(ctrl) {
      // An idea was to introduce numbers onto the bars for increased readability. However, how should these numbers behave in case teh bins get very narrow? In that case the y axis will be required again.
      // For now the y-axis has been left on.
      var x = ctrl.tools.xscale;
      var y = ctrl.tools.yscale;
      var g = ctrl.figure.select("svg.plotArea").select("g.data");
      var items = dbsliceData.data.dataDims[0].top(Infinity);
      var bins = ctrl.tools.histogram(items); // Handle entering/updating/removing the bars.

      var bars = g.selectAll("rect").data(bins); // Finally append any new bars with 0 height, and then transition them to the appropriate height

      var newBars = bars.enter();
      newBars.append("rect").attr("transform", startState).attr("x", 1).attr("width", calculateWidth).attr("height", 0).style("fill", "cornflowerblue").attr("opacity", 1).transition().delay(ctrl.view.transitions.enterDelay).duration(ctrl.view.transitions.duration).attr("height", calculateHeight).attr("transform", finishState); // Now move the existing bars.

      bars.transition().delay(ctrl.view.transitions.updateDelay).duration(ctrl.view.transitions.duration).attr("transform", finishState).attr("x", 1).attr("width", calculateWidth).attr("height", calculateHeight); // Remove any unnecessary bars by reducing their height to 0 and then removing them.

      bars.exit().transition().duration(ctrl.view.transitions.duration).attr("transform", startState).attr("height", 0).remove(); // Make some axes

      cfD3Histogram.helpers.createAxes(ctrl); // Add on the tooltips.

      cfD3Histogram.addInteractivity.addMarkerTooltip(ctrl);

      function calculateHeight(d_) {
        return g.attr("height") - y(d_.length);
      } // calculateHeight


      function calculateWidth(d_) {
        var width = x(d_.x1) - x(d_.x0) - 1;
        width = width < 1 ? 1 : width;
        return width;
      } // calculateWidth


      function startState(d) {
        return makeTranslate(x(d.x0), g.attr("height"));
      } // startState


      function finishState(d) {
        return makeTranslate(x(d.x0), y(d.length));
      } // finishState


      function makeTranslate(x, y) {
        return "translate(" + [x, y].join() + ")";
      } // makeTranslate	

    },
    // update
    rescale: function rescale(ctrl) {
      // What should happen if the window is resized?
      // 1.) The svg should be resized appropriately
      plotHelpers.setupPlot.general.rescaleSvg(ctrl); // 2.) The plot tools need to be updated

      cfD3Histogram.setupPlot.setupPlotTools(ctrl); // 3.) The plot needs to be redrawn

      cfD3Histogram.update(ctrl); // UPDATE THE SELECT RECTANGLE TOO!!

      cfD3Histogram.addInteractivity.addBrush.updateBrush(ctrl);
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
        var width = g.attr("width");
        var height = g.attr("height");

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
      } // setupPlotTools

    },
    // setupPlot
    addInteractivity: {
      onSelectChange: {
        horizontal: function horizontal(ctrl) {
          // Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
          return function () {
            var selectedVar = this.value; // Update the y-variable for the plot, and re-intialise the number of bins.

            ctrl.view.xVarOption.val = selectedVar;
            ctrl.view.nBins = undefined; // Redo the plot tools

            cfD3Histogram.setupPlot.setupPlotTools(ctrl); // Update any bin controls.

            cfD3Histogram.addInteractivity.addBinNumberControls.updateMarkers(ctrl);
            ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated(); // Update the graphics

            cfD3Histogram.update(ctrl);
          }; // return
        } // vertical

      },
      // onSelectChange
      addMarkerTooltip: function addMarkerTooltip(ctrl) {
        // Firs remove any already existing tooltips.
        d3.selectAll(".d3-tip[type='bin']").remove();
        var svg = ctrl.figure.select("svg.plotArea");
        var markers = svg.select("g.markup").select("g.binControls").selectAll("polygon");
        markers.on("mouseover", tipOn).on("mouseout", tipOff); // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.

        var tip = d3.tip().attr('class', 'd3-tip').attr('type', 'bin').offset([10, 0]).direction("s").html(function (d) {
          return "<span>" + "x: " + d3.format("r")(d) + "</span>";
        }); // tip

        svg.call(tip);

        function tipOn(d) {
          tip.show(d);
        }

        function tipOff(d) {
          tip.hide();
        }
      },
      // addMarkerTooltip
      addBrush: {
        make: function make(ctrl) {
          var h = cfD3Histogram.addInteractivity.addBrush; // The hardcoded values need to be declared upfront, and abstracted.

          var svg = ctrl.figure.select("svg.plotArea"); // Get the scale. All properties requried are in the svg.

          var x = ctrl.tools.xscale; // There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
          // Why is there no brush here on redraw??

          var brush = svg.select(".brush");

          if (brush.empty()) {
            brush = svg.select("g.markup").append("g").attr("class", "brush").attr("xDomMin", x.domain()[0]).attr("xDomMax", x.domain()[1]);
            var xMin = x.domain()[0];
            var xMax = x.domain()[1]; // Initialise the filter if it isn't already.

            var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val);
            var filter = dbsliceData.data.histogramSelectedRanges[dimId];

            if (filter !== undefined) {
              xMin = filter[0];
              xMax = filter[1];
            } else {
              dbsliceData.data.histogramSelectedRanges[dimId] = [xMin, xMax];
            } // if

          } else {
            // Setup th efilter bounds in the cfInit??
            var filter = dbsliceData.data.histogramSelectedRanges[dimId];
            var xMin = filter[0];
            var xMax = filter[1];
            brush.selectAll("*").remove();
          } // if


          var height = svg.select("g.data").attr("height");
          var rect = brush.append("rect").attr("class", "selection").attr("cursor", "move").attr("width", x(xMax) - x(xMin)).attr("height", height).attr("x", x(xMin)).attr("y", 0).attr("opacity", 0.2).attr("xMin", xMin).attr("xMax", xMax); // Make the rect draggable

          rect.call(d3.drag().on("drag", function () {
            h.dragmove(this, ctrl);
          })); // Make the rect scalable, and add rects to the left and right, and use them to resize the rect.

          brush.append("rect").attr("class", "handle handle--e").attr("cursor", "ew-resize").attr("x", Number(rect.attr("x")) + Number(rect.attr("width"))).attr("y", Number(rect.attr("y")) + Number(rect.attr("height")) / 4).attr("width", 10).attr("height", Number(rect.attr("height")) / 2).attr("opacity", 0).call(d3.drag().on("drag", function () {
            h.dragsize(this, ctrl);
          }));
          brush.append("rect").attr("class", "handle handle--w").attr("cursor", "ew-resize").attr("x", Number(rect.attr("x")) - 10).attr("y", Number(rect.attr("y")) + Number(rect.attr("height")) / 4).attr("width", 10).attr("height", Number(rect.attr("height")) / 2).attr("opacity", 0).call(d3.drag().on("drag", function () {
            h.dragsize(this, ctrl);
          })); // Decorative handles.

          var handleData = h.assembleHandleData(rect);
          brush.selectAll("path").data(handleData).enter().append("path").attr("d", h.drawHandle).attr("stroke", "#000").attr("fill", "none").attr("class", function (d) {
            return "handle handle--decoration-" + d.side;
          });
        },
        // make
        drawHandle: function drawHandle(d) {
          // Figure out if the west or east handle is needed.
          var flipConcave = d.side == "e" ? 1 : 0;
          var flipDir = d.side == "e" ? 1 : -1;
          var lambda = 30 / 300;
          var r = lambda * d.height;
          r = r > 10 ? 10 : r;
          var start = "M" + d.x0[0] + " " + d.x0[1];
          var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir * r, r].join(" ");
          var leftLine = "h0 v" + (d.height - 2 * r);
          var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir * r, r].join(" ");
          var closure = "Z";
          var innerLine = "M" + [d.x0[0] + flipDir * r / 2, d.x0[1] + r].join(" ") + leftLine;
          return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ");
        },
        // drawHandle
        dragmove: function dragmove(rectDOM, ctrl) {
          var h = cfD3Histogram.addInteractivity.addBrush;
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

          h.updateSelection(ctrl); // Setup the appropriate transition

          ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous(); // Rerender to allow other elements to respond.

          render();
        },
        // dragmove
        dragsize: function dragsize(handleDOM, ctrl) {
          // Update teh position of the left edge by the difference of the pointers movement.
          var h = cfD3Histogram.addInteractivity.addBrush;
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

          h.updateSelection(ctrl); // Setup the appropriate transition

          ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous(); // Rerender to allow other elements to respond.

          render();
        },
        // dragsize
        updateSelection: function updateSelection(ctrl) {
          var x = ctrl.tools.xscale;
          var rect = ctrl.figure.select("svg.plotArea").select(".selection");
          var lowerBound = Number(rect.attr("x"));
          var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"));
          var selectedRange = [x.invert(lowerBound), x.invert(upperBound)];
          var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val);
          dbsliceData.data.histogramSelectedRanges[dimId] = selectedRange; // Update the filter

          cfUpdateFilters(dbsliceData.data);
        },
        // updateSelection
        updateBrush: function updateBrush(ctrl) {
          var h = cfD3Histogram.addInteractivity.addBrush; // First get the scale

          var svg = ctrl.figure.select("svg.plotArea");
          var rect = svg.select(".selection");
          var x = ctrl.tools.xscale; // Now get the values that are supposed to be selected.

          var xMin = Number(rect.attr("xMin"));
          var xMax = Number(rect.attr("xMax")); // Update teh rect.

          rect.attr("x", x(xMin)).attr("width", x(xMax) - x(xMin)); // Update the handles				

          svg.select(".brush").select(".handle--e").attr("x", x(xMax));
          svg.select(".brush").select(".handle--w").attr("x", x(xMin) - 10); // Update the handle decorations

          var handleData = h.assembleHandleData(rect);
          svg.select(".brush").select(".handle--decoration-e").attr("d", h.drawHandle(handleData[0]));
          svg.select(".brush").select(".handle--decoration-w").attr("d", h.drawHandle(handleData[1]));
        },
        // updateBrush
        assembleHandleData: function assembleHandleData(rect) {
          var height = Number(rect.attr("height"));
          var width = Number(rect.attr("width"));
          var xWest = Number(rect.attr("x"));
          var yWest = Number(rect.attr("y")) + height / 4;
          var xEast = xWest + width;
          var yEast = yWest;
          return [{
            x0: [xEast, yEast],
            height: height / 2,
            side: "e"
          }, {
            x0: [xWest, yWest],
            height: height / 2,
            side: "w"
          }];
        } // assembleHandleData

      },
      // addBrush
      addBinNumberControls: {
        make: function make(ctrl) {
          // GENERALISE THE GROUP TRANSFORM!!
          var h = cfD3Histogram.addInteractivity.addBinNumberControls;
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
          var h = cfD3Histogram.addInteractivity.addBinNumberControls; // First update the plotting tools.

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
          // Update the bin control markers. The white markers do not interfere with the axis ticks as those are added later in the main update method.
          var markers = ctrl.figure.select("svg.plotArea").select("g.markup").select("g.binControls").selectAll("polygon");
          markers.data(ctrl.view.thresholds).enter().append("polygon").attr("points", "0,0 10,12, -10,12").attr("transform", makeTranslate).attr("style", "fill:white;cursor:ew-resize");
          markers.transition().duration(ctrl.view.transitions.duration).attr("transform", makeTranslate);
          markers.exit().remove();

          function makeTranslate(d) {
            return "translate(" + ctrl.tools.xscale(d) + ",1)";
          } // makeTRanslate

        } // updateMarkers

      },
      // addBinNumberControls
      updatePlotTitleControls: function updatePlotTitleControls(element) {
        plotHelpers.removePlotTitleControls(element);
      } // updatePlotTitleControls

    },
    // setupInteractivity
    helpers: {
      createAxes: function createAxes(ctrl) {
        var svg = ctrl.figure.select("svg.plotArea");
        svg.select("g.axis--x").call(d3.axisBottom(ctrl.tools.xscale));
        /*
        var xLabelD3 = ctrl.svg.select("g.axis--x").selectAll("text.xAxisLabel")
        
        xLabelD3.data( [ctrl.view.xVar] ).enter()
        	.append("text")
        	  .attr("class", "xAxisLabel")
        	  .attr("fill", "#000")
        	  .attr("x", ctrl.svg.attr("plotWidth"))
        	  .attr("y", 30)
        	  .attr("text-anchor", "end")
        	  .style("font-weight", "bold")
        	  .text(function(d){return d});
          
        xLabelD3.text(function(d){return d});
        */
        // Y AXIS
        // Find the desirable tick locations - integers.

        var yAxisTicks = ctrl.tools.yscale.ticks().filter(function (d) {
          return Number.isInteger(d);
        });
        svg.select("g.axis--y").transition().duration(ctrl.view.transitions.duration).call(d3.axisLeft(ctrl.tools.yscale).tickValues(yAxisTicks).tickFormat(d3.format("d")));
        var yLabelD3 = svg.select("g.axis--y").selectAll("text.yAxisLabel");
        yLabelD3.data(["Number of tasks"]).enter().append("text").attr("class", "yAxisLabel").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -25).attr("text-anchor", "end").style("font-weight", "bold").style("font-size", 12).text(function (d) {
          return d;
        });
        yLabelD3.text(function (d) {
          return d;
        });
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
            colWidth: 4,
            width: undefined,
            height: 400,
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
            }
          }
        }; // ctrl

        var options = dbsliceData.data.dataProperties;
        ctrl.view.xVarOption = {
          name: "varName",
          val: options[0],
          options: options
        };
        return ctrl;
      },
      // createDefaultControl
      createLoadedControl: function createLoadedControl(plotData) {
        var ctrl = cfD3Histogram.helpers.createDefaultControl(); // If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.

        if (plotData.xProperty != undefined) {
          if (dbsliceData.data.dataProperties.includes(plotData.xProperty)) {
            ctrl.view.xVarOption.val = plotData.xProperty;
          } // if						

        } // if				


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
      // Functions for cross plot highlighting
      unhighlight: function unhighlight(ctrl) {
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll("rect").style("opacity", 0.2);
      },
      // unhighlight
      highlight: function highlight(ctrl, d) {
        // NOTE THAT THE TRANSITION EFFECTS CAUSE SLIGHT BUGS - THE MARKERS ARE CREATED BEFORE THE TRANSITION COMPLETES!
        // Find within which bar the point falls.
        var property = ctrl.view.xVarOption.val;
        var bars = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("rect");
        bars.each(function (barData, barInd) {
          // d3 connects each of the bars with its data! here 'barData' is an array containing all the data points relating to it, as well as the range of values it represents.
          // Pick the corresponding marker.
          var marker = ctrl.figure.select("svg.plotArea").select("g.markup").selectAll('.tempMarker[ind="' + barInd + '"]'); // If there is any data connected to this bar check if it needs to be highlighted.

          for (var i = 0; i < barData.length; i++) {
            // Check if the datapoint with the taskId is in this array. In this case check with a for loop (as opposed to forEach), as otherwise the x0 and x1 properties are interpreted as array elements too.
            if (d.taskId == barData[i].taskId) {
              // Find the height corresponding to 1 task.
              var h = this.height.baseVal.value / barData.length; // Get the marker rectangle, and update its attributes.

              if (marker.empty()) {
                // There is none, so append one.
                var n = 1;
                marker = ctrl.figure.select("svg.plotArea").select("g.markup").append("rect").attr("class", "tempMarker").attr("height", n * h).attr("transform", getTranslate(this, n, h)).attr("n", n).attr("ind", barInd).attr("width", this.width.baseVal.value).attr("opacity", 1).style("fill", "cornflowerblue");
              } else {
                // Add to the height.
                var n = Number(marker.attr("n")) + 1;
                marker.attr("height", n * h).attr("transform", getTranslate(this, n, h)).attr("n", n);
              } // if

            }
          }

          function getTranslate(barDOM, n, h) {
            var plotHeight = d3.select(barDOM.parentElement.parentElement).select("g.data").attr("height");
            var leftEdgeX = barDOM.transform.baseVal[0].matrix.e + 1;
            var topEdgeY = plotHeight - n * h;
            var t = "translate(" + leftEdgeX + "," + topEdgeY + ")";
            return t;
          } // getTranslate

        }); // each
      },
      // highlight
      defaultStyle: function defaultStyle(ctrl) {
        // Find within which bar the point falls.
        ctrl.figure.selectAll(".tempMarker").remove(); // Set opacity to the histogram bars.

        ctrl.figure.select("svg.plotArea").select("g.data").selectAll("rect").style("opacity", 1); // Rehighlight any manually selected tasks.

        crossPlotHighlighting.manuallySelectedTasks();
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
      var i = cfD3Scatter.addInteractivity;
      var hi = plotHelpers.setupInteractivity.twoInteractiveAxes; // Add the manual selection toggle to its title.

      hs.twoInteractiveAxes.updatePlotTitleControls(ctrl); // Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.

      hs.twoInteractiveAxes.setupPlotBackbone(ctrl); // Create the svg with all required children container groups and append it to the appropriate backbone div.

      hs.general.rescaleSvg(ctrl); // Add in the controls for the y axis.

      hs.general.appendVerticalSelection(ctrl.figure.select(".leftAxisControlGroup"), hi.onSelectChange.vertical(ctrl)); // Add in the controls for the x axis.

      hs.general.appendHorizontalSelection(ctrl.figure.select(".bottomAxisControlGroup"), hi.onSelectChange.horizontal(ctrl)); // Add teh button menu - in front of the update for it!

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
      cfD3Scatter.refresh(ctrl);
    },
    // update
    refresh: function refresh(ctrl) {
      // Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.
      var h = cfD3Scatter.helpers;
      var i = cfD3Scatter.addInteractivity; // Check to adjust the width of the plot in case of a redraw.

      plotHelpers.setupPlot.general.rescaleSvg(ctrl); // Accessor functions

      var accessor = h.getAccessors(ctrl); // Get the data to draw.

      var pointData = h.getPointData(ctrl); // Deal with the points

      var points = ctrl.figure.select("svg.plotArea").select(".data").selectAll("circle").data(pointData);
      points.enter().append("circle").attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", accessor.c).style("opacity", 1).attr("clip-path", "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")").attr("task-id", accessor.id).each(function (d) {
        i.addPointTooltip(ctrl, this);
      });
      points.transition().duration(ctrl.view.transitions.duration).attr("r", 5).attr("cx", accessor.x).attr("cy", accessor.y).style("fill", accessor.c).attr("task-id", accessor.id);
      points.exit().remove(); // Update the markup lines to follow on zoom

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
            event: h.buttonMenu.options.toggleAR
          }; // arOption
          // Make functionality options for the menu.

          var codedPlotOptions = [ctrl.view.cVarOption, ctrl.view.gVarOption, arOption];
          return codedPlotOptions;
        } // assembleButtonMenuOptions

      },
      // updateUiOptions
      updatePlotTitleControls: function updatePlotTitleControls(ctrl) {
        // Add the toggle to switch manual selection filter on/off
        var container = d3.select(ctrl.figure.node().parentElement).select(".plotTitle").select("div.ctrlGrp");

        var onClickEvent = function onClickEvent() {
          var currentVal = this.checked; // All such switches need to be activated.

          var allToggleSwitches = d3.selectAll(".plotWrapper[plottype='cfD3Line']").selectAll("input[type='checkbox']");
          allToggleSwitches.each(function () {
            this.checked = currentVal; // console.log("checking")
          }); // Update filters

          cfUpdateFilters(dbsliceData.data);
          render();
        }; // onClickEvent


        plotHelpers.setupPlot.general.appendToggle(container, onClickEvent);
      },
      // updatePlotTitleControls
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
    addInteractivity: {
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
        console.log(ctrl);

        function selectPoint(d) {
          // Toggle the selection
          var p = dbsliceData.data.manuallySelectedTasks; // Is this point in the array of manually selected tasks?

          var isAlreadySelected = p.indexOf(d.taskId) > -1;

          if (isAlreadySelected) {
            // The poinhas currently been selected, but must now be removed
            p.splice(p.indexOf(d.taskId), 1);
          } else {
            p.push(d.taskId);
          } // if


          console.log(d, p, dbsliceData.data.manuallySelectedTasks); // Highlight the manually selected options.

          crossPlotHighlighting.manuallySelectedTasks();
        } // selectPoint

      },
      // addSelecton
      // Custom options for dropup menu
      groupLine: {
        update: function update(ctrl) {
          // 'update' executes what 'make' lined up.
          // Shorthand handle
          var h = cfD3Scatter.addInteractivity.groupLine;

          switch (ctrl.view.gVarOption.action) {
            case "zoom":
              // Just update the lines
              h.updateLines(ctrl, ctrl.view.transitions.duration);
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
        make: function make(ctrl, varName) {
          // Options to cover
          var noLines = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").empty();
          var linesVarSame = ctrl.view.gVarOption.val == varName;

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

        },
        // make
        drawLines: function drawLines(ctrl, varName) {
          // Shorthand handles.
          var h = cfD3Scatter.addInteractivity.groupLine;
          var i = cfD3Scatter.addInteractivity; // Get the data to draw.

          var pointData = ctrl.plotFunc.helpers.getPointData(ctrl); // Retrieve all the series that are needed.

          var s = getUniqueArraySeries(pointData, varName); // Now draw a line for each of them.

          var paths = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").data(s).enter().append("path").attr("stroke", "black").attr("stroke-width", "2").attr("fill", "none").attr("clip-path", "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")").each(function (d) {
            i.addLineTooltip(ctrl, this);
          }); // Update transitions:

          ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated(); // Do the actual drawing of it in the update part.

          h.updateLines(ctrl, ctrl.view.transitions.duration); // Update the tooltips. These can be missing if new data is added.

          ctrl.plotFunc.addInteractivity.addLineTooltip(ctrl); // HELPER

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
          console.log("replaceLines");
          var h = cfD3Scatter.addInteractivity.groupLine; // Update transitions:

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

                ctrl.plotFunc.addInteractivity.addLineTooltip(ctrl);
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
            path.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(ctrl.view.transitions.duration).ease(d3.easeLinear).attr("stroke-dashoffset", 0);
          });
        } // updateLines

      } // groupLine

    },
    // addInteractivity
    helpers: {
      // Initialisation
      createDefaultControl: function createDefaultControl() {
        var ctrl = {
          plotFunc: cfD3Scatter,
          figure: undefined,
          view: {
            viewAR: undefined,
            dataAR: undefined,
            xVarOption: undefined,
            yVarOption: undefined,
            cVarOption: undefined,
            gVarOption: undefined,
            lineTooltip: undefined,
            pointTooltip: undefined,
            transitions: {
              duration: 500,
              updateDelay: 0,
              enterDelay: 0
            },
            t: undefined
          },
          tools: {
            xscale: undefined,
            yscale: undefined,
            cscale: undefined
          },
          format: {
            title: "Edit title",
            colWidth: 4,
            width: undefined,
            height: 400,
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
            }
          }
        }; // ctrl
        // Initialise the options straight away.

        var i = cfD3Scatter.addInteractivity;
        var hs = plotHelpers.setupPlot.twoInteractiveAxes;
        var options = dbsliceData.data.dataProperties;
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
        ctrl.view.cVarOption = {
          name: "Colour",
          val: undefined,
          options: dbsliceData.data.metaDataProperties,
          event: hs.buttonMenu.options.groupColor
        }; // Custom option.

        ctrl.view.gVarOption = {
          name: "Line",
          val: undefined,
          options: dbsliceData.data.metaDataProperties,
          event: i.groupLine.make,
          action: undefined
        };
        return ctrl;
      },
      // createDefaultControl
      createLoadedControl: function createLoadedControl(plotData) {
        var ctrl = cfD3Scatter.helpers.createDefaultControl(); // If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.

        if (plotData.xProperty != undefined) {
          if (dbsliceData.data.dataProperties.includes(plotData.xProperty)) {
            ctrl.view.xVarOption.val = plotData.xProperty;
          } // if						

        } // if


        if (plotData.yProperty != undefined) {
          if (dbsliceData.data.dataProperties.includes(plotData.yProperty)) {
            ctrl.view.yVarOption.val = plotData.yProperty;
          } // if						

        } // if


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
          var xAxis = d3.axisBottom(ctrl.tools.xscale).ticks(5);
          var yAxis = d3.axisLeft(ctrl.tools.yscale);
          ctrl.figure.select("svg.plotArea").select(".axis--x").call(xAxis);
          ctrl.figure.select("svg.plotArea").select(".axis--y").call(yAxis);
          cfD3Scatter.helpers.axes.updateTicks(ctrl);
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
      getAccessors: function getAccessors(ctrl) {
        return {
          x: function xAccessor(d) {
            return ctrl.tools.xscale(d[ctrl.view.xVarOption.val]);
          },
          y: function yAccessor(d) {
            return ctrl.tools.yscale(d[ctrl.view.yVarOption.val]);
          },
          c: function cAccessor(d) {
            return ctrl.tools.cscale(d[ctrl.view.cVarOption.val]);
          },
          id: function idAccessor(d) {
            return d.taskId;
          }
        };
      },
      // getAccessors
      getPointData: function getPointData(ctrl) {
        var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val);
        var dim = dbsliceData.data.dataDims[dimId];
        var pointData = dim.top(Infinity);
        return pointData;
      },
      // getPointData
      // Functions for cross plot highlighting:
      unhighlight: function unhighlight(ctrl) {
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle").style("opacity", 0.2);
      },
      // unhighlight
      highlight: function highlight(ctrl, d) {
        // Find the circle corresponding to the data point. Look for it by taskId.
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle").filter(function (d_) {
          return d_.taskId == d.taskId;
        }).style("opacity", 1.0).attr("r", 7);
      },
      // highlight
      defaultStyle: function defaultStyle(ctrl) {
        // Find all the circles, style them appropriately.
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle").style("opacity", 1).attr("r", 5); // Rehighlight any manually selected tasks.

        crossPlotHighlighting.manuallySelectedTasks();
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
      cfData.manuallySelectedTasks = []; // Populate the metaDims and metaDataUniqueValues.

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

  var importExportFunctionality = {
    // This object controls all the behaviour exhibited when loading in data or session layouts, as well as all behaviour when saving the layout.
    // The loading of sessions and data must be available separately, and loading the session should include an option to load in a predefined dataset too.
    // It is possible that the session configuration and data will have incompatible variable names. In these cases the user should resolve the incompatibility, but the incompatibility should be presented to them!
    // Saving the session is done by downloading a created object. Therefore a session object should be written everytime the view is refreshed.
    // The views depending on "Plot Selected Tasks" to be pressed should be loaded in merely as configs in their plotrows, and the corresponding filtering values need to be loaded into their corresponding plots.
    importing: {
      // WIP: This has to be able to load in data from anywhere on the client computer, not just the server root.
      // WIP: It must be able to load in additional data. The user must be prompted to identify variables that are different in loaded, and to be loaded data.
      // DONE: It must be able to load both csv and json fle formats.
      // DONE/WIP: Must prompt the user if the variables don't include those in existing plots. Solution: does not prompt the user, but for now just removed any incompatible plots. The prompt for the user to resolve the incompatibility is the next step.
      metadata: function metadata(file, dataAction) {
        // Create convenient handles.
        var ld = importExportFunctionality.importing; // Split the name by the '.', then select the last part.

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
        // Handle the case based on the file type.


        switch (extension) {
          case "csv":
            d3.csv(url).then(function (metadata) {
              // All the numbers are read in as strings - convert them to strings straight away.
              data = [];
              metadata.forEach(function (d) {
                data.push(ld.helpers.convertNumbers(d));
              }); // Add the source file to tha data

              data.forEach(function (d) {
                d.file = file.name;
              }); // Process the metadata read in the csv format.

              var d = importExportFunctionality.importing.processor.csv2json(data); // Perform the requested internal storage assignment.

              actionOnInternalStorage(d);
              render();
            }); // d3.csv

            break;

          case "json":
            d3.json(url, function (metadata) {
              // Add the source file to tha data
              metadata.data.forEach(function (d) {
                d.file = file.name;
              }); // Change any backslashes with forward slashes

              metadata.data.forEach(function (d) {
                importExportFunctionality.importing.helpers.replaceSlashes(d, "taskId");
              }); // forEach
              // Store the data appropriately

              actionOnInternalStorage(metadata);
              render();
            }); // d3.json

            break;

          default:
            window.alert("Selected file must be either .csv or .json");
            break;
        }
      },
      // metadata
      session: function session(file) {
        // WIP: Must be able to load a session file from anywhere.
        // DONE: Must load in metadata plots
        // WIP: Must be able to load in data automatically. If the data is already loaded the loading of additional data must be ignored. Or the user should be asked if they want to add it on top.
        // WIP: Must be able to load without data.
        // DONE: Must only load json files.
        // WIP: Must prompt the user if the variables don't include those in loaded data.
        var h = importExportFunctionality.importing.helpers; // Split the name by the '.', then select the last part.

        var extension = file.name.split(".").pop(); // Create a url link to allow files to be loaded fromanywhere on the local machine.

        var url = window.URL.createObjectURL(file);

        switch (extension) {
          case "json":
            d3.json(url).then(function (sessionData) {
              h.assembleSession(sessionData);
            }); // d3.json

            break;

          default:
            window.alert("Selected file must be .json");
            break;
        }
      },
      // session
      // Move to importExportFunctionality
      processor: {
        csv2json: function csv2json(metadata) {
          // Create a short handle to the helpers
          var h = importExportFunctionality.importing.helpers; // Change this into the appropriate internal data format.

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
        csv2line: function csv2line(data) {
          // DECIDE HERE WHAT THE ACCESSOR FOR THIS FILE IS!
          // This means that the file will either have to have explicit variable pairs, or implicit variable pairs, and mixed files will produce errors. If mixed options are required an internal separation of mixed and non mixed variables needs to be stored and maintained.
          // csv2line takes the output response of 'd3.csv', and transforms it to a shape that is more efficient to use when plotting lines. It returns an object which contains an array of objects each representing an individual column in the original csv, the nesting tags available to the user (e.g. Height), and any nesting tags that are used by the code internally (e.g. ps/ss, x/y). It assumes that the incoming data can be processed into line data. 
          // The first element in the 'data' array is the first row of the csv file. Data also has a property 'colums', which lists all the column headers.
          var info = importExportFunctionality.importing.helpers.handlePropertyNames(data.columns); // Transform the data object from a row oriented to a column oriented. This will also reduce memory usage, as duplication of property names will be avoided. The transformation is done as a transformation of the information about the properties to the actual column property objects by fleshing out the 'info' object by numeric data from 'data'.

          info = csvRow2Column(data, info); // Implement the accessors, and handle the difference between split properties, and single properties! Note that if the file has any common options (ps/ss. x/y) then this is a split variable file. This should be used as the test!

          return info; // csv2line HELPERS

          function csvRow2Column(data, info) {
            // The transformation changes the default organisation of the data (array of objects representing a single row in the csv file) to the one that will be used in the central file booking. This is an array of objects each corresponding to a particular column of the csv file, with the data stored under 'vals', the flow property under 'varName', and other tags that maintain the nest structure added as well.
            // This is done by fleshing out the info object with the appropriate data structure.
            info.properties.forEach(function (p) {
              // Get the data. It is read in as a string, therefore it needs to be converted here!
              var vals = data.map(function (d) {
                return Number(d[p.val]);
              }); // Initiate the property data object for this particular file with the required properties. The variable name has been stored as a token, and will therefore be added dynamically.

              p.val = vals;
              p.range = [d3.min(vals), d3.max(vals)]; // If this property has a tag 'side', then reverse it's values for appropriate plotting if the lines will be joined. Since all of the properties will be reversed exactly once the outcome will be correct.

              if (p.side == "ss") {
                p.val = p.val.reverse();
              } // if

            }); // map

            return info;
          } // csvRow2Column

        } // csv2line

      },
      // processor
      helpers: {
        // METADATA
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
        // SESSION
        getPlottingFunction: function getPlottingFunction(string) {
          // This only creates a function when there are somne properties for that function to use.
          var isDataAvailable = dbsliceData.data.dataProperties.length > 0;
          var isMetadataAvailable = dbsliceData.data.metaDataProperties.length > 0;
          var isSliceDataAvailable = dbsliceData.data.sliceProperties.length > 0;
          var func;

          switch (string) {
            case "cfD3BarChart":
              func = isMetadataAvailable ? cfD3BarChart : undefined;
              break;

            case "cfD3Histogram":
              func = isDataAvailable ? cfD3Histogram : undefined;
              break;

            case "cfD3Scatter":
              func = isDataAvailable ? cfD3Scatter : undefined;
              break;

            case "cfD3Line":
              func = isSliceDataAvailable ? cfD3Line : undefined;
              break;

            default:
              func = undefined;
              break;
          }

          return func;
        },
        // getPlottingFunction
        assemblePlots: function assemblePlots(plotsData) {
          var h = importExportFunctionality.importing.helpers; // Assemble the plots.

          var plots = [];
          plotsData.forEach(function (plotData) {
            var f = h.getPlottingFunction(plotData.type);

            if (f != undefined) {
              var plotToPush = f.helpers.createLoadedControl(plotData);
              plots.push(plotToPush);
            } else {
              // The plotData type is not valid
              window.alert(plotData.type + " is not a valid plot type.");
            } // if

          }); // forEach

          return plots;
        },
        // assemblePlots
        assemblePlotRows: function assemblePlotRows(plotRowsData) {
          var h = importExportFunctionality.importing.helpers; // Loop over all the plotRows.

          var plotRows = [];
          plotRowsData.forEach(function (plotRowData) {
            var plotRowToPush = {
              title: plotRowData.title,
              plots: h.assemblePlots(plotRowData.plots),
              type: plotRowData.type,
              addPlotButton: true
            };
            plotRows.push(plotRowToPush);
          });
          return plotRows;
        },
        // assemblePlotRows
        assembleSession: function assembleSession(sessionData) {
          var h = importExportFunctionality.importing.helpers; // Check if it is a session file!

          if (sessionData.isSessionObject === "true") {
            // To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. Not the most elegant, but it gets the job done.
            // This is done here in case a file that is not a json is selected.
            d3.select("#" + dbsliceData.elementId).selectAll(".plotRow").remove();
            var plotRows = h.assemblePlotRows(sessionData.plotRows); // Finalise the session object.

            var session = {
              title: sessionData.title,
              plotRows: plotRows
            }; // Store into internal object

            dbsliceData.session = session; // Render!

            render();
          } else {
            window.alert("Selected file is not a valid session object.");
          }
        },
        // assembleSession
        // CFD3LINE
        handlePropertyNames: function handlePropertyNames(properties) {
          // NOTES
          // First of all it is important to observe that the _ separates both property name parts, as well as the variable name parts (e.g. it separates the units from the flow property names). This also means that once separated by _ the names can have different amounts of substrings.
          // Also note that the bl param file and the distribution files MUST specify bot hthe x and y coordinates of all lines (see notes above). Therefore it is relatively safe to assume that they will have an 'x' and 'y' token in their names. It is also likely that these will be the last tokens.
          // If it is assumed that all the properties follow the same naming structure, and that the hierarchy follows along: height - side - property - coordinate, then the variables can be handled after the split from radial file names has been made. This can be made if it is found that no tokens are the same.
          // For every nested part the flow variables should reappear n-times, where n is the number of different nesting parts. What if a property is missing from just a single height?
          // QUESTIONS:
          // NOTE: parsing all the files in a folder from the browser is not possible. A 'dir' file could be written, but it defeats the purpose. If file selection rules are created to access the files (taskId + token + token, ...) then any tasks without those files will produce errors on loading. Furthermore, appropriate files will have to be provided to include them, which will possibly become misleading. Furthermore, this complicates attempts to visualise tasks with slightly different file naming systems/folder structure.
          // Q: What should the files containe (e.g. each file a different line, each file a different variable at different locations, each file all variables at a single position)?
          // A: 
          // 1.) If each file contains a different line then the user will have to select the data to be loaded from a large list of possibilities, in this case 168. Thius could be simplified by allowing the user to pick parts of the name from a list, but that would be awkward. In essence, something like that is being done now anyway, but having the options moved to different controls.
          // 2 & 3.) Different file data separations would then require appropriate interpreters. This would also require even more entries into the metadata such that these files could be located. In this case there are already 6*23 files, and this is after (!) many of the files have been combined. Originally there were 19*23 files to pick from. If each line had an individual file there would be tens of thousands of them.
          // Q: Where should the data transformation take place (on load, after loading but before drawing, or on draw)?
          // A: 
          // On draw: The d3 process will assign data to the DOM object on the screen. If the dat ais transformed before the plotting it means that the entire transformed file data will be assigned to an individual line on plotting. This could end up using a lot of memory. It is therefore preferred if the data is already transformed when passed to the plotting, such that only the relevant data may be stored with the object.
          // After loading but before drawing: keeping the file in the original state is ideal if the same file should be used as a data source for several plotting functions. Alternately the functions should use the same input data format, which they kind of have to anyway. Another option is to just transform the data before it is passed to the drawing, but this requires a lot of redundant transforming, which would slow down the app. The issue of differentiating between the parameters is present anyway.
          // On loading: It is best to just transform the data upon load. The it is accessible for all the plotting functions immediately. The transofrmation should be general.
          // Tags could be identified by checking if all variables have them. If they don't a particular item is not a tag. The rule would therefore be that everything between tags belongs to a particular tag. Only 'x', and 'y' at the end would be needed to complete the rule.
          // METHOD
          // 1.) Create an array of name property objects. These should include the original name, and its parts split by '_'. Token indexes are allowed to facilitate different lengths of values between individual tokens.
          var properties_ = createPropertyObjects(properties); // 2.) Now that all the parts are know search for any tokens. A TOKEN is a common property name part. 'tokens' is an array of strings. 

          var userTokens = findUserTokens(properties_); // Also look for any expected common tokens that might not have been properly specified, like 'ps':'ss', or 'x','y'. These not need be parts of the variable name, if they are present in all of the properties. If they are not they will be left in the property names.
          // The common tokens need to be handled separately, as they allow more than one option for the position.
          // The common tokens cannot be added into the token array directly in this loop, as it is possible that one of the subsequent elements will have it missing. Also, what happens if the name for some reason includes more than one token of of the expected values? Just add all of them.

          var commonTokens = findCommonTokens(properties_); // 3.) With the tokens known, find their positions in each of the properties, and make the appropriate token options.

          properties_.forEach(function (p) {
            handleUserTokens(p, userTokens);
            handleCommonTokens(p, commonTokens); // The tokens have now been handled, now get the remainder of the variable name - this is expected to be the flow property.

            handleFlowPropertyName(p);
          }); // forEach
          // Change the common tokens into an array of string options.

          commonTokens = commonTokens.map(function (o) {
            return o.name;
          }); // Return the properties as split into the tokens etc., but also which additional options are available to the user, and which are common and handled internally.
          // Unique user token values ARE stored here. They only indicate which nests are available in the file. For now only one nest is specified, therefore combinations of different ones are not strictly needed, but it would expand the functionality of the code (for e.g. boundary layer profile plotting, or velocity profiles in general)
          // IMPORTANT NOTE: If a particular subnest does not branch into exactly all of the possibilities of the other subnests, then the order of selecting the tags becomes very important, as it can hide some of the data from the user!!
          // Common tokens are only stored so that the internal functionality might realise how the properties should be assembled when the data is being accessed for plotting

          var type = getVariableDeclarationType(commonTokens);
          removeRedundantPropertyFromObjectArray(properties_, "_parts");
          return {
            properties: properties_,
            userOptions: getTokenWithOptions(properties_, userTokens),
            commonOptions: getTokenWithOptions(properties_, commonTokens),
            varOptions: getFlowVarOptions(properties_, type),
            type: type
          }; // handlePropertyNames HELPER FUNCTIONS:

          function createPropertyObjects(properties) {
            // 'properties' is an array of strings. The output is an array of objects that will be the backbone of the file's data structure.
            return properties.map(function (p) {
              return {
                val: p,
                _parts: p.split("_")
              };
            });
          } // createPropertyObjects


          function findUserTokens(properties_) {
            // Input is the array produced by 'splitPropertyNames'. Output is a filter array of the same class.
            // The initial sample of possible tokens are the parts of the first name. Tokens MUST be in all the names, therefore loop through all of them, and retain only the ones that are in the following ones.
            var tokens = properties_[0]._parts;
            properties_.forEach(function (p) {
              tokens = tokens.filter(function (candidate) {
                return p._parts.includes(candidate);
              }); // forEach
            }); // forEach
            // There may be some tokens in there that are comment tokens. For now this is implemented to hande the decimal part of the height identifiers, which are '0%'.
            // Should this be more precise to look for percentage signs in the first and last places only?

            tokens = removeCommentTokens(tokens, ["%"]);
            return tokens;
          } // findUserTokens


          function removeCommentTokens(tokens, commentIdentifiers) {
            // Removes any tokens that include any character in the commentIdentifiers array of characters.
            commentIdentifiers.forEach(function (commentIdentifier) {
              // Perform the filter for this identifier.
              tokens = tokens.filter(function (token) {
                return !token.split("").includes(commentIdentifier);
              }); // filter
            }); // forEach

            return tokens;
          } // removeCommentTokens


          function findCommonTokens(properties_) {
            // Input is the array produced by 'splitPropertyNames'. Output is a filter array of the same class.
            // Common tokens allow a single line to be specified by several variables. 
            // The "ps"/"ss" aplit does not offer any particular advantage so far. 
            // The "x"/"y" split allows for hte lines to be specified explicitly, as opposed to relying on an implicit position variabhle. This is useful when the flow properties ofr a particular height or circumferential position are not calculated at the same positions (e.g. properties calculated on separate grids).
            // The common tokens are hardcoded here.
            var commonTokens = [{
              name: "side",
              value: ["ps", "PS", "ss", "SS"]
            }, {
              name: "axis",
              value: ["x", "X", "y", "Y"]
            }]; // Search for the common tokens

            properties_.forEach(function (p) {
              commonTokens = commonTokens.filter(function (token) {
                var containsPossibleValue = false;
                token.value.forEach(function (v) {
                  containsPossibleValue = containsPossibleValue | p._parts.includes(v);
                }); // forEach

                return containsPossibleValue;
              }); // forEach
            }); // forEach
            // Here the token is returned with the specified array of expected values. This allows the code to handle cases in which the specified common tokens are a mix of lower and upper case options.

            return commonTokens;
          } // findCommonTokens


          function getTokenWithOptions(properties_, tokens) {
            return tokens.map(function (token) {
              // Loop over the properties, and assemble all the possible values for this particular token. The options of the properties have to be read through their tokens array at the moment.
              var allVals = properties_.map(function (p) {
                // First find the appropriate token.
                return p[token];
              }); // map

              return {
                name: token,
                options: cfD3Line.helpers.unique(allVals)
              };
            });
          } // getUserTokens


          function handleUserTokens(p, tokens) {
            // For a given property object 'p', find where in the name the user specified tokens are, and which user specified values belong to them. Push the found name value pairs into p.tokens as an object.
            // Find the indices of the individual tokens.
            var ind = [];
            tokens.forEach(function (token) {
              ind.push(p._parts.indexOf(token));
            }); // Sort the indices - default 'sort' operates on characters. https://stackoverflow.com/questions/1063007/how-to-sort-an-array-of-integers-correctly

            ind.sort(function (a, b) {
              return a - b;
            }); // Indices are sorted smallest to largest, so now just go through the parts to assemble the tokens and the options.

            ind.forEach(function (ind_) {
              // 'i' is the index of a particular token in the parts of the variable, 'j' is the position of 'i' in the index array.
              // As we are splicing from the array for easier identification of the variable name later on, the index will have to be found again every time.
              var t = p.val.split("_")[ind_];
              var start = 0;

              var n = p._parts.indexOf(t); // Add teh appropriate properties to the property object.


              p[t] = p._parts.splice(start, n).join("_"); // Splice out the token name

              p._parts.splice(p._parts.indexOf(t), 1);
            });
          } // handleUserTokens


          function handleCommonTokens(p, tokens) {
            // Here the tokens that are found are converted to lower case for consistency.
            // Handle the commonly expected tokens.
            tokens.forEach(function (token) {
              var values = [];

              p._parts.forEach(function (v) {
                if (token.value.includes(v)) {
                  values.push(v.toLowerCase());
                } // if

              }); // forEach
              // Splice all the values out of the parts.


              values.forEach(function (v) {
                p._parts.splice(p._parts.indexOf(v), 1);
              }); // forEach
              // Here it is allowed that more than one common token value is present in a variable. This shouldn't happen, but it is present anyway.

              p[token.name] = values.join("_");
            }); // forEach
          } // handleCommonTokens


          function handleFlowPropertyName(p) {
            // Whatever is left of the parts is the variable name.
            p.varName = p._parts.join("_");
          } // getFlowPropertyName


          function removeRedundantPropertyFromObjectArray(A, property) {
            A.forEach(function (O) {
              delete O[property];
            });
          } // removeRedundantPropertyFromObjectArray


          function getVariableDeclarationType(commonTokens) {
            return commonTokens.includes("axis") ? "explicit" : "implicit";
          } // getVariableDeclarationType


          function getFlowVarOptions(properties_, type) {
            // 'getFlowVarOptions' sets up which properties this plot can offer to the x and y axes. This can also be used to assign the accessors to the data!
            var option = {};
            var varOptions = getTokenWithOptions(properties_, ["varName"]);
            varOptions = varOptions[0];

            switch (type) {
              case "implicit":
                // Implicit variables can be available on both axes.
                option = {
                  x: varOptions,
                  y: varOptions
                };
                break;

              case "explicit":
                // Explicit variables can be available on only one axes.
                var dummyOption = {
                  name: "x",
                  options: ["x"]
                };
                option = {
                  x: dummyOption,
                  y: varOptions
                };
                break;
            } // switch


            return option;
          } // getFlowVarOptions

        } // handlePropertyNames

      } // helpers

    },
    // loadData
    exporting: {
      session: {
        // USE JSON.stringify()? - in that case properties need to be selected, but the writing can be removed. This is more elegant.
        json: function json() {
          // This function should write a session file.
          // It should write which data is used, plotRows, and plots.
          // Should it also write the filter selections made?
          var sessionJson = '';
          write('{"isSessionObject": "true", ');
          write(' "title": "' + dbsliceData.session.title + '", ');
          write(' "plotRows": [');
          var plotRows = dbsliceData.session.plotRows;
          plotRows.forEach(function (plotRow, i) {
            var plotRowString = writePlotRow(plotRow);
            write(plotRowString);

            if (i < plotRows.length - 1) {
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
              // Let the plot write it's own entry.
              s = s + plot.plotFunc.helpers.writeControl(plot);

              if (i < plotRow.plots.length - 1) {
                s = s + ', ';
              } // if

            }); // forEach

            s = s + ']';
            s = s + '}';
            return s;
          } // writePlotRow


          return sessionJson; // HELPERS

        },
        // json
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

      },
      // session
      helpers: {} // helpers

    },
    // exporting
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
            plotProperties.push(metadataPlot.view.xVarOption.val);

            if (metadataPlot.view.yVarOption !== undefined) {
              plotProperties.push(metadataPlot.view.yVarOption.val);
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
              return incompatibleProperties.includes(plot.view.xVarOption.val) || incompatibleProperties.includes(plot.data.yVarOption.val);
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

  var cfD3Line = {
    name: "cfD3Line",
    make: function make(ctrl) {
      // This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
      var hs = plotHelpers.setupPlot;
      var hi = plotHelpers.setupInteractivity.twoInteractiveAxes;
      var i = cfD3Line.addInteractivity; // Add the manual selection toggle to its title.

      hs.twoInteractiveAxes.updatePlotTitleControls(ctrl); // Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.

      hs.twoInteractiveAxes.setupPlotBackbone(ctrl); // Create the svg with all required children container groups and append it to the appropriate backbone div.

      hs.general.rescaleSvg(ctrl); // Add in the controls for the y axis.

      hs.general.appendVerticalSelection(ctrl.figure.select(".leftAxisControlGroup"), hi.onSelectChange.vertical(ctrl)); // Add in the controls for the x axis.

      hs.general.appendHorizontalSelection(ctrl.figure.select(".bottomAxisControlGroup"), hi.onSelectChange.horizontal(ctrl)); // General interactivity

      hi.addZooming(ctrl);
      i.createLineTooltip(ctrl); // Scaling of the axes

      hi.addAxisScaling(ctrl); // Button menu custom functionality. On first make it should host the slice id options.

      var sliceOption = {
        name: "Slice Id",
        val: undefined,
        options: dbsliceData.data.sliceProperties,
        event: function event(ctrl, d) {
          ctrl.view.sliceId = d;
        }
      }; // sliceOption

      hs.twoInteractiveAxes.buttonMenu.make(ctrl);
      hs.twoInteractiveAxes.buttonMenu.update(ctrl, [sliceOption]); // But it will try to draw when this is updated...
    },
    // make
    update: function update() {// Only launch refresh if necessary? How to make that one work smoothly?
    },
    // update
    update_: function update_(ctrl) {
      // This function re-intialises the plots based on the data change that was initiated by the user.
      // Remove all the previously stored promises, so that only the promises required on hte last redraw are retained.
      ctrl.data.promises = []; // GETDATAINFO should be launched when new data is loaded for it via the 'refresh' button, and when a different height is selected for it. Otherwise it is just hte data that gets loaded again.

      cfD3Line.helpers.getLineDataInfo(ctrl); // The data must be retrieved here. First initialise the options.

      cfD3Line.setupPlot.updateUiOptions(ctrl); // Ah, no, the data will have to be retrieved first so that the plot tools can be established!!
      // I also need an array with 23 elements - but that could also simply be the compatible array.... If I make the array of property arrays I also need to figure out how to store the taskId again. Just use the file for the assignment, and use appropriate accessors etc.
      // The ranges are accessed directly from the properties.
      // Then rescale teh svg.
      // Check to adjust the width of the plot in case of a redraw.

      plotHelpers.setupPlot.general.rescaleSvg(ctrl); // Setup the scales for plotting. THIS SHOULD NOW WORK - ONLY FINDDOMAINDIMENSIONS WAS CHANGED!!
      // PLOT TOOLS REQURIES A LINE FUNCTION AS WELL!!
      // THIS RESETS THE AXIS LIMITS EVERY TIME!! IT SHOULD BE CALLE ONLY ON DATA REFRESH!! OR AN EXTERNAL FUNCTION SHOULD HANDLE THE DRAW AND UPDATE

      plotHelpers.setupTools.go(ctrl); // Call the refresh function which readjust the plot elements.

      cfD3Line.refresh(ctrl);
    },
    // update
    refresh: function refresh(ctrl) {
      // Trigger the redraw if the conditions for it are met.
      if (ctrl.data.compatible.length > 0) {
        cfD3Line.refresh_(ctrl);
      } // if

    },
    // refresh
    refresh_: function refresh_(ctrl) {
      // Update the axes
      cfD3Line.helpers.axes.update(ctrl); // If this is a split variable case then the accessors need to return the appropriate array. If not they can just return the values.
      // It was assumed that the d3 data join process only stores the reference to the data, and therefore to minimise memory usage the original underlying data is used to join to the elements, meaning that the accessor needs to do the final transform before the plotting.

      function draw(d) {
        return ctrl.tools.line(cfD3Line.helpers.getLineDataVals(d, ctrl));
      } // draw


      function getTaskId(d) {
        return d.task.taskId;
      } // getTaskId


      function color(d) {
        return ctrl.tools.cscale(d.task[ctrl.view.cVarOption.val]);
      } // color


      var clipPath = "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")"; // Make the required line tool too!
      // The d3.line expects an array of points, and will then connect it. Therefore the data must be in some form of: [{x: 0, y:0}, ...]

      ctrl.tools.line = d3.line().x(function (d) {
        return ctrl.tools.xscale(d.x);
      }).y(function (d) {
        return ctrl.tools.yscale(d.y);
      }); // Assign the data

      var allSeries = ctrl.figure.select("svg.plotArea").select("g.data").selectAll(".plotSeries").data(ctrl.data.compatible); // Enter/update/exit

      allSeries.enter().each(function () {
        var series = d3.select(this);
        var seriesLine = series.append("g").attr("class", "plotSeries").attr("task-id", getTaskId).attr("clip-path", clipPath).append("path").attr("class", "line").attr("d", draw).style("stroke", color).style("fill", "none").style("stroke-width", "2.5px"); // Add a tooltip to this line

        cfD3Line.addInteractivity.addLineTooltip(ctrl, seriesLine.node()); // Add the option to select this line manually.

        cfD3Line.addInteractivity.addSelection(seriesLine.node());
      }); // update: A bit convoluted as the paths have a wrapper containing some information for ease of user inspection in dev tools.

      allSeries.each(function () {
        var series = d3.select(this).attr("task-id", getTaskId);
      });
      allSeries.selectAll("path.line").transition().duration(ctrl.view.transitions.duration).attr("d", draw).style("stroke", color);
      allSeries.exit().remove();
    },
    // refresh_
    rescale: function rescale(ctrl) {
      // What should happen if the window is resized?
      // 1.) The svg should be resized appropriately
      plotHelpers.setupPlot.general.rescaleSvg(ctrl); // 2.) The plot tools need to be updated

      plotHelpers.setupTools.go(ctrl); // 3.) The plot needs to be redrawn

      cfD3Line.refresh_(ctrl);
    },
    // rescale
    setupPlot: {
      // This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
      updateUiOptions: function updateUiOptions(ctrl) {
        // The current view options may differ from the available data options. Therefore update the corresponding elements here.
        ctrl.data.intersect.userOptions.forEach(function (dataOption) {
          // For each different option that can be queried in the available compatible data, check if an option in the view is already selected, what it's value is, and update the value if it is not in the new set.
          var viewOption = cfD3Line.helpers.findObjectByAttribute(ctrl.view.options, "name", [dataOption.name], true);

          if (viewOption.length == 0) {
            ctrl.view.options.push({
              name: dataOption.name,
              val: dataOption.options[0],
              options: dataOption.options
            });
          } else {
            updateOption(viewOption, dataOption);
          } // if

        }); // forEach
        // Do the same for the x and y axis options

        if (ctrl.view.xVarOption == undefined) {
          ctrl.view.xVarOption = ctrl.data.intersect.varOptions.x;
        } else {
          updateOption(ctrl.view.xVarOption, ctrl.data.intersect.varOptions.x);
        } // if


        if (ctrl.view.yVarOption == undefined) {
          ctrl.view.yVarOption = ctrl.data.intersect.varOptions.y;
        } else {
          updateOption(ctrl.view.yVarOption, ctrl.data.intersect.varOptions.y);
        } // if
        // Handle the options corresponding to fixed UI elements.


        var gh = plotHelpers.setupPlot.general;
        var h = plotHelpers.setupPlot.twoInteractiveAxes;
        gh.updateVerticalSelection(ctrl);
        gh.updateHorizontalSelection(ctrl); // Handle the options of the 'button menu'
        // Manually create the color option.

        if (ctrl.view.cVarOption == undefined) {
          ctrl.view.cVarOption = {
            name: "Color",
            val: "none",
            options: dbsliceData.data.metaDataProperties,
            event: h.buttonMenu.options.groupColor
          }; // cVarOption
        } // if
        // HERE UPDATE THE BUTTON HARMONICA OPTIONS TOO!!	


        h.buttonMenu.update(ctrl, assembleButtonMenuOptions()); // Helpers

        function updateOption(viewOption, dataOption) {
          // If the option does exist, then just update it.
          if (!dataOption.options.includes(viewOption.val)) {
            // The new options do not include the previously selected option value. Initialise a new one.
            viewOption.val = dataOption.options[0];
          } // if


          viewOption.options = dataOption.options;
        } // updateOption


        function assembleButtonMenuOptions() {
          // The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
          // Make a custom option that fires an aspect ratio readjustment.
          var arOption = {
            name: "AR",
            val: undefined,
            options: ["User / Unity"],
            event: h.buttonMenu.options.toggleAR
          }; // arOption
          // Make functionality options for the menu.

          var codedPlotOptions = [ctrl.view.cVarOption, arOption];
          return codedPlotOptions.concat(ctrl.view.options);
        } // assembleButtonMenuOptions

      },
      // updateUiOptions
      // Functionality required to setup the tools.
      findPlotDimensions: function findPlotDimensions(svg) {
        return {
          x: [0, Number(svg.select("g.data").attr("width"))],
          y: [Number(svg.select("g.data").attr("height")), 0]
        };
      },
      // findPlotDimensions
      findDomainDimensions: function findDomainDimensions(ctrl) {
        // The series are now an array of data for each of the lines to be drawn. They possibly consist of more than one array of values. Loop over all to find the extent of the domain.
        var h = cfD3Line.helpers;
        var seriesExtremes = ctrl.data.compatible.map(function (file) {
          var plotData = h.getLineDataVals(file, ctrl);
          return {
            x: [d3.min(plotData, function (d) {
              return d.x;
            }), d3.max(plotData, function (d) {
              return d.x;
            })],
            y: [d3.min(plotData, function (d) {
              return d.y;
            }), d3.max(plotData, function (d) {
              return d.y;
            })]
          };
        }); // map

        var xExtremesSeries = h.collectObjectArrayProperty(seriesExtremes, "x");
        var yExtremesSeries = h.collectObjectArrayProperty(seriesExtremes, "y");
        return {
          x: [d3.min(xExtremesSeries), d3.max(xExtremesSeries)],
          y: [d3.min(yExtremesSeries), d3.max(yExtremesSeries)]
        }; // Helpers
      } // findDomainDimensions

    },
    // setupPlot
    addInteractivity: {
      // Tooltips
      createLineTooltip: function createLineTooltip(ctrl) {
        // The tooltips are shared among the plots, therefore check if the tooltip is already available first.
        if (ctrl.view.lineTooltip == undefined) {
          ctrl.view.lineTooltip = createTip();
        } // if


        function createTip() {
          // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
          var tip = d3.tip().attr('class', 'd3-tip').attr("type", "cfD3LineLineTooltip").offset([-15, 0]).html(function (d) {
            return "<span>" + d.task.label + "</span>";
          });
          ctrl.figure.select("svg.plotArea").call(tip);
          return tip;
        } // createTip

      },
      // createLineTooltip
      addLineTooltip: function addLineTooltip(ctrl, lineDOM) {
        // This controls al the tooltip functionality.
        var lines = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("g.plotSeries");
        lines.on("mouseover", tipOn).on("mouseout", tipOff);

        function tipOn(d) {
          lines.style("opacity", 0.2);
          d3.select(this).style("opacity", 1.0).style("stroke-width", "4px");
          var anchorPoint = ctrl.figure.select("svg.plotArea").select("g.background").select(".anchorPoint").attr("cx", d3.mouse(this)[0]).attr("cy", d3.mouse(this)[1]);
          ctrl.view.lineTooltip.show(d, anchorPoint.node());
          crossPlotHighlighting.on(d, "cfD3Line");
        }

        function tipOff(d) {
          lines.style("opacity", 1.0);
          d3.select(this).style("stroke-width", "2.5px");
          ctrl.view.lineTooltip.hide();
          crossPlotHighlighting.off(d, "cfD3Line");
        }
      },
      // addLineTooltip
      // Legacy
      addSelection: function addSelection(lineDOM) {
        // This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
        d3.select(lineDOM).on("click", selectLine);

        function selectLine(d) {
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
        } // selectPoint

      } // addSelecton

    },
    // addInteractivity
    helpers: {
      // Initialisation
      createDefaultControl: function createDefaultControl() {
        // data:

        /* 
        	.promises are the promises which were completed before drawing the graphics.
        	.requested is an array of urls whose data are requested by the plotting tool. These need not be the same as the data in promises as those are loaded on user prompt!
        	.available is an array of urls which were found in the central booking,
        	.missing is an array of urls which were NOT found in the central booking.
        	.dataProperties is a string array containing the properties found in the data.
        	.data is an array of n-data arrays corresponding to the n-task slice files.
        */
        var ctrl = {
          plotFunc: cfD3Line,
          figure: undefined,
          svg: undefined,
          data: {
            promises: [],
            requested: [],
            available: [],
            duplicates: [],
            missing: [],
            compatible: [],
            incompatible: [],
            intersect: [],
            series: [],
            processor: importExportFunctionality.importing.processor.csv2line
          },
          view: {
            sliceId: undefined,
            options: [],
            viewAR: undefined,
            dataAR: undefined,
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
            yscale: undefined,
            cscale: undefined
          },
          format: {
            title: "Edit title",
            colWidth: 4,
            width: undefined,
            height: 400,
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
            }
          }
        }; // ctrl

        return ctrl;
      },
      // createDefaultControl
      createLoadedControl: function createLoadedControl(plotData) {
        var ctrl = cfD3Line.helpers.createDefaultControl(); // If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.

        if (plotData.sliceId != undefined) {
          if (dbsliceData.data.sliceProperties.includes(plotData.sliceId)) {
            ctrl.view.sliceId = plotData.sliceId;
          } // if

        } // if
        // When the session is loaded all previously existing plots would have been removed, and with them all on demand loaded data. Therefore the variables for this plot cannot be loaded, as they will depend on the data.


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
          var xAxis = d3.axisBottom(ctrl.tools.xscale).ticks(5);
          var yAxis = d3.axisLeft(ctrl.tools.yscale);
          ctrl.figure.select("svg.plotArea").select(".axis--x").call(xAxis);
          ctrl.figure.select("svg.plotArea").select(".axis--y").call(yAxis);
          cfD3Line.helpers.axes.updateTicks(ctrl);
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
      // Data retrieval
      getLineDataProperties: function getLineDataProperties(file, ctrl) {
        // 'getLineDataProperties' applies the filters selected by the user to the array of properties under file.properties, and retrieves the ones relevant to the currently selected view.
        // Retrieve the properties
        var properties = file.data.properties; // Handle other user properties.	

        ctrl.view.options.forEach(function (option) {
          properties = cfD3Line.helpers.findObjectByAttribute(properties, option.name, [option.val], false);
        }); // Handle flow variable selection.
        // properties = cfD3Line.helpers.findObjectByAttribute( properties, "varName", [ctrl.view.yVarOption.val], false)

        return properties;
      },
      // getLineDataProperties
      getLineData: function getLineData(file, ctrl) {
        // Assemble an array that can be plotted using d3.line. This must be an array with an element in it corresponding to each point.
        var properties = cfD3Line.helpers.getLineDataProperties(file, ctrl); // Start on suction side, and then add onto it the pressure side. The appropriate rotation should already have been made.

        var xVals = assembleParameterValues(properties, "x");
        var yVals = assembleParameterValues(properties, "y"); // Now weave these together into an array of objects that contains both x and y properties.

        var plotData = [];

        for (var i = 0; i < xVals.length; i++) {
          plotData.push({
            x: xVals[i],
            y: yVals[i]
          });
        } // for


        return plotData;

        function assembleParameterValues(properties, axis) {
          // 'assembleParameterValues' takes the properties belonging to a flo parameter, and assembles them as per the expected hardcoded format.
          // It expects properties is an array of 4 properties corresponding to the ss_x, ss_y, ps_x, ps_y properties, in that order. It then assembles then ss + ps, assuming the ps values have already been reversed
          var h = cfD3Line.helpers.findObjectByAttribute;
          var axisProperties = h(properties, "axis", [axis], false);
          var ssProperty = h(axisProperties, "side", ["ss"], true);
          var psProperty = h(axisProperties, "side", ["ps"], true);
          return ssProperty.val.concat(psProperty.val);
        } // assembleParameterValues

      },
      // getLineData
      getLineDataVals: function getLineDataVals(file, ctrl) {
        // Make a distinction between accessing explicit and implicit data files.
        // Properties after applying all hte options.
        var properties = cfD3Line.helpers.getLineDataProperties(file, ctrl); // For explicit variables this will return an empty array. For implicit variables it will return a single property in an array.

        var xProperties = cfD3Line.helpers.findObjectByAttribute(properties, "varName", [ctrl.view.xVarOption.val], false); // For implicit variables it will return a single property in an array.

        var yProperties = cfD3Line.helpers.findObjectByAttribute(properties, "varName", [ctrl.view.yVarOption.val], false);
        var xVals;
        var yVals;

        switch (file.data.type) {
          case "explicit":
            xVals = assembleParameterValues(yProperties, "x");
            yVals = assembleParameterValues(yProperties, "y");
            break;

          case "implicit":
            xVals = xProperties[0].val;
            yVals = yProperties[0].val;
            break;
        } // switch
        // Weave the x and y vals together into a format expected by 'd3.line'


        var plotData = [];

        for (var i = 0; i < xVals.length; i++) {
          plotData.push({
            x: xVals[i],
            y: yVals[i]
          });
        } // for


        return plotData;

        function assembleParameterValues(properties, axis) {
          // 'assembleParameterValues' takes the properties belonging to a flo parameter, and assembles them as per the expected hardcoded format.
          // It expects properties is an array of 4 properties corresponding to the ss_x, ss_y, ps_x, ps_y properties, in that order. It then assembles then ss + ps, assuming the ps values have already been reversed
          var h = cfD3Line.helpers.findObjectByAttribute;
          var axisProperties = h(properties, "axis", [axis], false);
          var ssProperty = h(axisProperties, "side", ["ss"], true);
          var psProperty = h(axisProperties, "side", ["ps"], true);
          return ssProperty.val.concat(psProperty.val);
        } // assembleParameterValues

      },
      // getLineDataVals
      getLineDataInfo: function getLineDataInfo(ctrl) {
        // Should duplicate plotting be allowed? If the user asks for it then it should, but a reminder should be given that some tasks have the same entry in this particular slice.
        // THE DATA PROCESSING SHGOULD BE RETHOUGHT SO THAT THE DATA IN THE MEMORY IS NOT DUPLICATED!!
        // Pair the available files with the takss that require them. In case two tasks call for the same file the task id's can be applied appropriately. Not sure where exactly this is useful, but it makes the functionality more user proof.
        // This would mean that either the data needs to be duplicated, the taskIds would overwrite themselves, or that an array of taskIds would be required.
        // The last option seems most sensible, 
        // The RRDPLCP2JSON transformation creates a new object -> duplication of data and memory usage. Would d3 nests be more useful? Nests will be more useful, and moreover - the data for the plotting can be removed after the scope finished. On next pass it'll have to be read again anyway.
        // IT MIGHT BE BEST for the plotting function to interpret the data by series, as in that way only a particular series would enter teh memory, and would subsequently be immediately deleted.
        // This plot plots the slices through the domains of all currently filtered tasks. It is only refreshed on user prompt to avoid loading too large amounts of data all the time, which would slow down other interactivity. Therefore at certain times it will not be showing data of all the tasks in the filter. Therefore also collect here all the files that the plot wants, but are unavailable.
        var requiredTasks = dbsliceData.data.dataDims[0].top(Infinity);
        var requiredUrls = requiredTasks.map(getUrl); // This is the set of urls of all files that have been loaded into internal storage that are required for this plot. The loaded files are not returned as that would mean they are logged into memory again.
        // Furthermore, also check which have failed upon loading. Those are the files that were not found, therefore the promise was rejected.

        var availableUrls = dbsliceData.flowData.filter(function (file) {
          var isUrlRequired = requiredUrls.includes(file.url);
          var wasPromiseResolved = file.data != undefined;
          return isUrlRequired && wasPromiseResolved;
        }).map(function (file) {
          return file.url;
        }); // Reverse reference the loaded files to find which required files are not available in the central storage. 

        var missingUrls = requiredUrls.filter(function (url) {
          return !availableUrls.includes(url);
        }); // Create 'file' responses detailing which files of which tasks were : 
        // 1.) requested:

        var requestedFiles = requiredTasks.map(returnFile); // 2.) available:

        var availableFiles = requiredTasks.filter(function (task) {
          return availableUrls.includes(getUrl(task));
        }).map(returnFile); // 3.) missing:

        var missingFiles = requiredTasks.filter(function (task) {
          return missingUrls.includes(getUrl(task));
        }).map(returnFile); // 4.) duplicated:

        var duplicatedFiles = requiredTasks.filter(function (task) {
          // Assume duplicate by default.
          var flag = true;

          if (requiredUrls.indexOf(getUrl(task)) == requiredUrls.lastIndexOf(getUrl(task))) {
            // The first element is also the last occurence of this value, hence it is a unique value. This is therefore not a duplicating element.
            flag = false;
          } // if


          return flag;
        }).map(returnFile); // NOTE: 'availableFiles' lists all the tasks for which the data is available, even if they are duplicated.
        // 5.)
        // CHECK FOR COMPATIBILITY OF NESTS!
        // The nests will have to be exactly the SAME, that is a prerequisite for compatibility. The options for these nests can be different, and the variables in these nests can be different. From these is the intersect calculated.

        var compatibilityAccessors = [getOptionNamesAccessor("userOptions"), getOptionNamesAccessor("commonOptions")];
        var c = chainCompatibilityCheck(availableFiles, compatibilityAccessors); // 6.)
        // FIND JUST THE COMMON DATA INTERSECTION - SAME NESTS, INTERSECT NEST VALUES, INTERSECT PROPERTIES

        /* /////////////////////////////////////////////
        
        YEEES, INSTEAD OF COMPATIBLE AND INCOMPATIBLE FIND THE INTERSECT OF THE DATA, AND PRESENT IT AS THE DATA AVAILABLE FOR PLOTTING!! KEEP A LOG OF CLASHES TO HELP THE USER?
        
        Have to look through all the user options there are, all the variables there are, and then output references to those.
        
        - Ensure that all the files have the same nests.
        - Collect all the nest options and find intersect ones
        - Collect all the variables and ensure they are in all the files. they don't all need to be the split type however, the plotting accessor will take care of that.
        
        Make a report showing which changes would yield largest gains?
        
        //////////////////////////////////////////// */
        // First find all the nest options. ASSUME that compatibility has already been established. The files also contain all the unique values already.
        // Compatibility ensures that all the files have exactly the same user tags available. Now check which of the options are itnersectiong.

        var intersect = undefined;

        if (c.compatibleFiles.length > 0) {
          intersect = getIntersectOptions(c.compatibleFiles);
        } // MAKE SURE ALL THE INTERSECT OPTIONS ACTUALLY HAVE SOME OPTIONS - OPTIONS ARE NOT EMPTY!!
        // MAYBE FOR VARIABLES IT SHOULD RETURN JUST THE SHARED VARIABLES AT A LATER POINT?
        // The data properties are only available after a particular subset of the data has been selected. Only then will the dropdown menus be updated.


        ctrl.data.promises = ctrl.data.promises;
        ctrl.data.requested = requestedFiles;
        ctrl.data.available = availableFiles;
        ctrl.data.duplicates = duplicatedFiles;
        ctrl.data.missing = missingFiles;
        ctrl.data.compatible = c.compatibleFiles;
        ctrl.data.incompatible = c.incompatibleFiles;
        ctrl.data.intersect = intersect; // HELPER FUNCTIONS

        function returnFile(task) {
          // 'returnFile' changes the input single task from the metadata, and returns the corresponding selected 'file'. The 'file' contains the url selected as per the slice selection made by the user, and the corresponding task. The task is required to allow cross plot tracking of all the data connected to this task, and the optional coloring by the corresponding metadata values.
          // This here should also package up all the metadata properties that would enable the coloring to fill them in.
          // dbsliceData.flowData.filter(function(file){return file.url == task[ctrl.view.sliceId]})[0].data
          var file = cfD3Line.helpers.findObjectByAttribute(dbsliceData.flowData, "url", [task[ctrl.view.sliceId]], true);
          return {
            task: task,
            url: task[ctrl.view.sliceId],
            data: file.data
          };
        } // returnFile


        function getUrl(task) {
          // 'getUrl' is just an accessor of a particular property.
          return task[ctrl.view.sliceId];
        } // getUrl


        function includesAll(A, B) {
          // 'includesAll' checks if array A includes all elements of array B. The elements of the arrays are expected to be strings.
          // Return element of B if it is not contained in A. If the response array has length 0 then A includes all elements of B, and 'true' is returned.
          var f = B.filter(function (b) {
            return !A.includes(b);
          });
          return f.length == 0 ? true : false;
        } // includesAll


        function checkCompatibility(files, accessor) {
          // 'checkCompatibility' checks if the properties retrieved using 'accessor( file )' are exactly the same. The comparison between two files is done on their arrays of properties obtained by the accessor. To check if the arrays are exactly the same all the contents of A have to be in B, and vice versa. 
          var target = [];

          if (files.length > 0) {
            target = accessor(files[0]);
          } // if


          var compatibleFiles = files.filter(function (file) {
            var tested = accessor(file); // Check if the tested array includes all target elements.

            var allExpectedInTested = includesAll(tested, target); // Check if the target array includes all test elements.

            var allTestedInExpected = includesAll(target, tested);
            return allExpectedInTested && allTestedInExpected;
          });
          var compatibleUrls = compatibleFiles.map(function (file) {
            return file.url;
          }); // Remove any incompatible files from available files.

          var incompatibleFiles = availableFiles.filter(function (file) {
            return !compatibleUrls.includes(file.url);
          });
          return {
            compatibleFiles: compatibleFiles,
            incompatibleFiles: incompatibleFiles
          };
        } // checkCompatibility


        function chainCompatibilityCheck(files, accessors) {
          var compatible = files;
          var incompatible = []; // The compatibility checks are done in sequence.

          accessors.forEach(function (accessor) {
            var c = checkCompatibility(compatible, accessor);
            compatible = c.compatibleFiles;
          });
          return {
            compatibleFiles: compatible,
            incompatibleFiles: incompatible
          };
        } // chainCompatibilityCheck


        function getIntersectOptions(files) {
          // 'getIntersectOptions' returns the intersect of all options available. The compatibility checks established that the files have exactly the same option names available, now the intersect of option options is determined.
          // Three different options exist.
          // 1.) User options (tags such as 'height', "circumference"...)
          // 2.) Var options (possibilities for the x and y axes)
          // 3.) Common options - to cater for explicit variable declaration. These are not included for the intersect as the user will not be allowed to select from them for now.
          // First select the options for which the intersect is sought for. It assumes that all the files will have the same userOptions. This should be guaranteed by the compatibility check.
          // 'calculateOptionIntersect' is geared to deal with an array of options, therefore it returns an array of intersects. For x and y options only 1 option is available, therefore the array wrapper is removed here.
          var xVarIntersect = calculateOptionIntersect(files, xVarOptionAccessor);
          var yVarIntersect = calculateOptionIntersect(files, yVarOptionAccessor);
          return {
            userOptions: calculateOptionIntersect(files, userOptionAccessor),
            varOptions: {
              x: xVarIntersect[0],
              y: yVarIntersect[0]
            } // varOptions

          }; // intersectOptions
          // Helpers

          function userOptionAccessor(file) {
            return file.data.userOptions;
          } // userOptionAccessor


          function xVarOptionAccessor(file) {
            return [file.data.varOptions.x];
          } // varOptionAccessor


          function yVarOptionAccessor(file) {
            return [file.data.varOptions.y];
          } // varOptionAccessor


          function calculateOptionIntersect(files, optionsAccessor) {
            // 'calculateOptionIntersect' takes teh array of files 'files' and returns all options stored under the attribute files.data[<optionsName>] that all the files have.
            // The first file is selected as teh seed. Only the options that occur in all files are kept, so the initialisation makes no difference on the end result.
            var seedOptions = optionsAccessor(files[0]);
            var intersectOptions = seedOptions.map(function (seedOption) {
              // The options of the seed user options will be the initial intersect options for this particular option.
              var intersectOptions = seedOption.options; // For each of the options loop through all the files, and see which options are included. Only keep those that are at every step.

              files.forEach(function (file) {
                // For this particular file fitler all the options for this particular user option.
                intersectOptions = intersectOptions.filter(function (option) {
                  // It is expected that only one option of the same name will be present. Pass in an option that only one element is required - last 'true' input.
                  var fileOptions = cfD3Line.helpers.findObjectByAttribute(optionsAccessor(file), "name", [seedOption.name], true);
                  return fileOptions.options.includes(option);
                }); // filter
              }); // forEach

              return {
                name: seedOption.name,
                val: intersectOptions[0],
                options: intersectOptions
              };
            }); // map

            return intersectOptions;
          } // calculateOptionIntersect

        } // getIntersectOptions


        function getOptionNamesAccessor(optionsName) {
          // This returns an accessor function.
          var f = function f(file) {
            return file.data[optionsName].map(function (o) {
              return o.name;
            });
          };

          return f;
        } // getOptionNamesAccessor

      },
      // getLineDataInfo
      // Manual functionality
      updateManualSelections: function updateManualSelections(ctrl) {
        var g = ctrl.figure.select("svg.plotArea").select("g.data"); // Set back to default style.

        g.selectAll("path.line").style("stroke", "cornflowerblue"); // Color in selected circles.

        dbsliceData.data.manuallySelectedTasks.forEach(function (d) {
          g.selectAll("g.plotSeries[task-id='" + d + "']").select("path.line").style("stroke", "rgb(255, 127, 14)").style("stroke-width", 4);
        }); //forEach
      },
      // updateManualSelections
      // General helpers
      unique: function unique(d) {
        // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        } // unique


        return d.filter(onlyUnique);
      },
      // unique
      findObjectByAttribute: function findObjectByAttribute(A, attribute, values, flag) {
        // This function returns the objects in an object array 'A', which have an attribute 'attribute', with the value 'value'. If they do not an empty set is returned. In cases when a single item is selected the item is returned as the object, without the wrapping array.
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
        // collectObjectArrayProperty take input object array 'A', collect all of the object members attribute 'attribute', and flattens the array of arrays into a single array of values once.
        var C = A.map(function (a) {
          return a[attribute];
        });
        return [].concat.apply([], C);
      },
      // collectObjectArrayProperty
      // Functions supporting cross plot highlighting
      unhighlight: function unhighlight(ctrl) {
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll(".line").style("opacity", 0.2);
      },
      // unhighlight
      highlight: function highlight(ctrl, d) {
        // Find the line corresponding to the data point. Look for it by taskId.
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll('.plotSeries[task-id="' + d.taskId + '"]').selectAll(".line").style("opacity", 1.0).style("stroke-width", "4px");
      },
      // highlight
      defaultStyle: function defaultStyle(ctrl) {
        // Revert the opacity and width.
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll(".line").style("opacity", 1.0).style("stroke-width", "2.5px"); // Rehighlight any manually selected tasks.

        crossPlotHighlighting.manuallySelectedTasks();
      } // defaultStyle

    } // helpers

  }; // cfD3Line

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
              val: "cfD3Line",
              text: "Line"
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
              data: {
                xProperty: undefined,
                yProperty: undefined
              }
            }; // new plot config

            break;

          case "plotter":
            // axis labels should come from the data!
            // slices contains any previously added slices.
            config.newPlot = {
              plotFunc: undefined,
              data: {
                slice: undefined
              },
              slices: []
            }; // new plot config

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
            plotCtrl = cfD3BarChart.helpers.createDefaultControl();
            plotCtrl.view.yVarOption.val = config.newPlot.data.xProperty;
            break;

          case "cfD3Histogram":
            plotCtrl = cfD3Histogram.helpers.createDefaultControl();
            plotCtrl.view.xVarOption.val = config.newPlot.data.xProperty;
            break;

          case "cfD3Scatter":
            // Custom functionality for the d3interactive2axes imposter function is here. The idea is that the ctrl is hidden in 'layout'.
            plotCtrl = cfD3Scatter.helpers.createDefaultControl();
            plotCtrl.view.xVarOption.val = config.newPlot.data.xProperty;
            plotCtrl.view.yVarOption.val = config.newPlot.data.yProperty;
            break;

          case "cfD3Line":
            // The user selected variable to plot is stored in config.newPlot.data, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
            // Store the currently selected slice, then push everything forward.
            plotCtrl = cfD3Line.helpers.createDefaultControl();
            plotCtrl.view.sliceId = config.newPlot.data.slice;
            break;
        }

        return plotCtrl;
      },
      // copyNewPlot
      clearNewPlot: function clearNewPlot(config) {
        switch (config.ownerPlotRowType) {
          case "metadata":
            config.newPlot.plotFunc = undefined;
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
            var isConfigValid = config.newPlot.data.xProperty === undefined && config.newPlot.data.yProperty !== undefined;

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

          case "cfD3Line":
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

            case "cfD3Line":
              // Menu offering different slices.
              config.newPlot.plotFunc = cfD3Line; // slice is required.

              h.addUpdateMenuItemObject(config, config.sliceMenuId, config.sliceVariables);
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
            // Maybe move the line plots into the filtering? That goes against the data hierarchy separation. Leave in the plotter, and deal with clashes when contours will be reintroduced.
            // The keys are the variable names in 'metadata', which are prefixed with 's_' for splice. This allows the user to select which data to compare when setting up the metadata. More flexibility is gained this way, as no hardcoded templating needs to be introduced, and no clumsy user interfaces.
            // Make a pysical copy of the object. This function also includes the functionality in which the 'line' plot
            var plotToPush = addMenu.addPlotControls.copyNewPlot(config);
            dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots.push(plotToPush);
            break;
        }
        // Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
        // var plotRowIndex = d3.select(this).attr("plot-row-index")
        // console.log(element)
        // Redraw the screen.

        render(); // Clear newPlot to be ready for the next addition.

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
            console.log(dbsliceData.session.plotRows[plotRowIndex].plots.length); // If necesary also remove the corresponding ctrl from the plotter rows.

            if ('ctrl' in dbsliceData.session.plotRows[plotRowIndex]) {
              dbsliceData.session.plotRows[plotRowIndex].ctrl.sliceIds.splice(plotIndex, 1);
            }
            // Remove also the htmls element accordingly.

            this.parentElement.parentElement.parentElement.parentElement.remove();
            render();
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

        dbsliceData.session.plotRows.push(plotRowToPush); //

        render(); // Reset the plot row type menu selection.

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

          render();
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
          config.buttonActivationFunction(config);
        });
      },
      //addVariableChangeEent
      enableDisableAllButtons: function enableDisableAllButtons() {
        // This functionality decides which buttons should be enabled.
        var isDataInFilter = dbsliceData.filteredTaskIds.length !== undefined && dbsliceData.filteredTaskIds.length > 0; // For the data to be loaded some records should have been assigned to the crossfilter.

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
        arrayEnableDisable(refreshTasksButton, isDataInFilter); // GROUP 3: ADDING/REMOVING PLOTS/ROWS
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

  function render() {
    var element = d3.select("#" + dbsliceData.elementId);

    if (dbsliceData.filteredTaskIds !== undefined) {
      element.select(".filteredTaskCount").select("p").html("Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length);
    } else {
      element.select(".filteredTaskCount").select("p").html("<p> Number of Tasks in Filter = All </p>");
    }
    // Remove all d3-tip elements because they end up cluttering the DOM.
    // d3.selectAll(".d3-tip").remove();

    console.log(dbsliceData); // THIS CAN CURRENTLY RESOLVE PROBLEMS F THE DATA IS INCOMPATIBLE.
    // This should work both when new data is loaded and when a new session is loaded.
    // importExportFunctionality.helpers.onDataAndSessionChangeResolve()

    var plotRows = element.selectAll(".plotRow").data(dbsliceData.session.plotRows); // HANDLE ENTERING PLOT ROWS!

    var newPlotRows = plotRows.enter().append("div").attr("class", "card bg-light plotRow").attr("style", "margin-bottom:20px").attr("plot-row-index", function (d, i) {
      return i;
    }).each(function (d) {
      d.element = this;
    }); // Add in the container for the title of the plotting section.
    // Make this an input box so that it can be change on te go!

    var newPlotRowsHeader = newPlotRows.append("div").attr("class", "card-header plotRowTitle").attr("type", function (d) {
      return d.type;
    });
    newPlotRowsHeader.append("h3").attr("style", "display:inline").html(function (data) {
      return data.title;
    }).attr("spellcheck", "false").attr("contenteditable", true);
    newPlotRowsHeader.selectAll("h3").each(function () {
      this.addEventListener("input", function () {
        var newTitle = this.innerText;
        d3.select(this).each(function (plotRow) {
          plotRow.title = newTitle;
        });
      }, false);
    }); // each
    // Give all entering plot rows a body to hold the plots.

    var newPlotRowsBody = newPlotRows.append("div").attr("class", "row no-gutters plotRowBody").attr("plot-row-index", function (d, i) {
      return i;
    }).attr("type", function (d) {
      return d.type;
    }); // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.

    var newPlots = newPlotRowsBody.selectAll(".plot").data(function (d) {
      return d.plots;
    }).enter().each(plotHelpers.setupPlot.general.makeNewPlot); // UPDATE EXISTING PLOT ROWS!!
    // Based on the existing plotRowBodies, select all the plots in them, retrieve all the plotting data associated with this particular plot row, and assign it to the plots in the row. Then make any entering ones.

    var plots = plotRows.selectAll(".plotRowBody").selectAll(".plot").data(function (d) {
      return d.plots;
    });
    plots.enter().each(plotHelpers.setupPlot.general.makeNewPlot); // Update the previously existing plots.

    plots.each(function (plotCtrl) {
      plotCtrl.plotFunc.update(plotCtrl);
    }); // Handle exiting plots before updating the existing ones.

    plots.exit().remove(); // This updates the headers of the plots because the titles might have changed.

    var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper").data(function (d) {
      return d.plots;
    }).each(function (plotCtrl, index) {
      var plotWrapper = d3.select(this);
      var plotTitle = plotWrapper.select(".plotTitle").select("div").html(plotCtrl.format.title);
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

    var dataReplace = createFileInputElement(importExportFunctionality.importing.metadata, "replace");
    d3.select("#replaceData").on("click", function () {
      dataReplace.click();
    }); // ADD TO CURRENT DATA OPTION:

    var dataInput = createFileInputElement(importExportFunctionality.importing.metadata, "add");
    d3.select("#addData").on("click", function () {
      dataInput.click();
    }); // REMOVE SOME CURRENT DATA OPTION:
    // This requires a popup. The popup needs to be opened on clicking the option. Upon submitting a form the underlying functionality is then called.

    addMenu.removeDataControls.make("removeData"); // LOAD SESSION Button

    var sessionInput = createFileInputElement(importExportFunctionality.importing.session);
    d3.select("#loadSession").on("click", function () {
      sessionInput.click();
    }); // Control all button and menu activity;

    addMenu.helpers.enableDisableAllButtons(); // HELPER FUNCTIONS:

    function createFileInputElement(loadFunction, dataAction) {
      // This button is already created. Just add the functionaity.
      var dataInput = document.createElement('input');
      dataInput.type = 'file'; // When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.

      dataInput.onchange = function (e) {
        // BE CAREFULT HERE: file.name IS JUST THE local name without any path!
        var file = e.target.files[0]; // importExportFunctionality.importing.handler(file);

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
        d3.select(this).append("button").attr("class", "btn btn-danger float-right removePlotButton").html("x").on("click", function () {
          // Remove the plot row from the state
          var ownerPlotRow = d3.select(this.parentNode.parentNode).each(function (clickedPlotRowCtrl) {
            dbsliceData.session.plotRows = dbsliceData.session.plotRows.filter(function (plotRowCtrl) {
              return plotRowCtrl != clickedPlotRowCtrl;
            }); // filter  
          }); // each
          // Remove from DOM

          ownerPlotRow.remove(); // render();
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
      var filters = crossfilter.manuallySelectedTasks;

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
    make: function make(ctrl) {
      // Remove any controls in the plot title.
      // cfD3BarChart.addInteractivity.updatePlotTitleControls(element)
      plotHelpers.setupPlot.general.setupPlotBackbone(ctrl);
      plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl);
      plotHelpers.setupPlot.general.rescaleSvg(ctrl); // Handle the select.

      var i = cfD3BarChart.addInteractivity.onSelectChange;
      plotHelpers.setupPlot.general.appendVerticalSelection(ctrl.figure.select(".leftAxisControlGroup"), i.vertical(ctrl));
      plotHelpers.setupPlot.general.updateVerticalSelection(ctrl);
      cfD3BarChart.setupPlot.setupPlotTools(ctrl);
      cfD3BarChart.update(ctrl);
    },
    // make
    update: function update(ctrl) {
      // Create some common handles.
      var svg = ctrl.figure.select("svg.plotArea"); // Get the items to plot.

      var items = cfD3BarChart.helpers.getItems(ctrl.view.yVarOption.val);

      function getHeight(d) {
        return ctrl.tools.yscale.bandwidth();
      }

      function getWidth(d) {
        return ctrl.tools.xscale(d.value);
      }

      function getPosition(d) {
        return ctrl.tools.yscale(d.key);
      }

      function getColor(d) {
        return ctrl.tools.cscale(d.key);
      }

      function getLabelPosition(d) {
        return getPosition(d) + 0.5 * getHeight();
      }

      function getLabel(d) {
        return d.key;
      } // Handle the entering/updating/exiting of bars.


      var bars = svg.select("g.data").selectAll("rect").data(items);
      bars.enter().append("rect").attr("height", getHeight).attr("width", 0).attr("x", 0).attr("y", getPosition).style("fill", getColor).attr("opacity", 1).transition().attr("width", getWidth);
      bars.transition().attr("height", getHeight).attr("width", getWidth).attr("y", getPosition);
      bars.exit().remove(); // Handle the entering/updating/exiting of bar labels.

      var keyLabels = svg.select("g.markup").selectAll(".keyLabel").data(items);
      keyLabels.enter().append("text").attr("class", "keyLabel").attr("x", 0).attr("y", getLabelPosition).attr("dx", 5).attr("dy", ".35em").attr("text-anchor", "start").text(getLabel);
      keyLabels.transition().attr("y", getLabelPosition).text(getLabel);
      keyLabels.exit().remove(); // Handle the axes.

      cfD3BarChart.helpers.createAxes(ctrl); // Add interactivity:

      cfD3BarChart.addInteractivity.addOnMouseOver(svg);
      cfD3BarChart.addInteractivity.addOnMouseClick(ctrl);
    },
    // update
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
        /* The x and y axis tools need to be set up here, as well as the potential color scale. 
        
        
        */
        // Get the items to plot. This is done on all the data here, and the scales are created here as well. This will make the axes fixed, and the bars move accordingly. This can be changed if needed by adjusting the xscale domain appropriately
        var property = ctrl.view.yVarOption.val;
        var g = ctrl.figure.select("svg.plotArea").select("g.data");
        var width = g.attr("width");
        var height = g.attr("height"); // TEMPORARY

        var dimId = dbsliceData.data.metaDataProperties.indexOf(property);
        var group = dbsliceData.data.metaDims[dimId].group();
        var items = group.all(); // Remove any bars with no entries.

        items = items.filter(function (item) {
          return item.value > 0;
        }); // Add the property to it for convenience.

        items.forEach(function (d) {
          d.keyProperty = property;
        });
        var items = cfD3BarChart.helpers.getItems(ctrl.view.yVarOption.val); // The scale that will control the property used to visually convey numeric information.

        ctrl.tools.xscale = d3.scaleLinear().range([0, width]).domain([0, d3.max(items, function (v) {
          return v.value;
        })]); // 'd2.scaleBand' does the division of the plotting area into separate bands based on input categorical values, and returns the number corresponding to the position of the band, and to the width of the band by calling '<scale>()', and '<scale>.bandwidth()' respectively.
        // 'padding' sets the amount of space between the bands (innerPadding), and before and after the bands (outerPadding), to the same value.
        // 'align' controls how the outer padding is distributed between both ends of the band range.

        ctrl.tools.yscale = d3.scaleBand().range([0, height]).domain(items.map(function (d) {
          return d.key;
        })).padding([0.2]).align([0.5]); // The internal color scale might change due to the user changing hte data, but this should not reset the color scale.

        if (ctrl.tools.cscale == undefined) {
          ctrl.tools.cscale = function () {
            return "cornflowerblue";
          };
        } // if

      } // setupPlotTools

    },
    // setupPlot
    addInteractivity: {
      onSelectChange: {
        vertical: function vertical(ctrl) {
          // Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
          return function () {
            var selectedVar = this.value; // Perform the regular task for y-select.

            plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar); // Perform tasks required by both the vertical and horizontal select on change events.

            plotHelpers.setupInteractivity.general.onSelectChange.common(ctrl);
          }; // return
        } // vertical

      },
      // onSelectChange
      addOnMouseClick: function addOnMouseClick(ctrl) {
        // Add the mouse click event
        var property = ctrl.view.yVarOption.val;
        var svg = ctrl.figure.select("svg.plotArea");
        svg.selectAll("rect").on("click", onClick); // Add the associated transition effects.

        svg.selectAll("rect").transition().attr("width", transitionWidthEffects).attr("y", transitionYEffects).attr("height", transitionHeightEffects).attr("opacity", transitionOpacityEffects);

        function onClick(d) {
          var dimId = dbsliceData.data.metaDataProperties.indexOf(property); // Initialise filter if necessary

          if (dbsliceData.data.filterSelected[dimId] === undefined) {
            dbsliceData.data.filterSelected[dimId] = [];
          } // if
          // check if current filter is already active


          if (dbsliceData.data.filterSelected[dimId].indexOf(d.key) !== -1) {
            // Already active filter, let it remove this item from view.
            var ind = dbsliceData.data.filterSelected[dimId].indexOf(d.key);
            dbsliceData.data.filterSelected[dimId].splice(ind, 1);
          } else {
            // Filter not active, add the item to view.
            dbsliceData.data.filterSelected[dimId].push(d.key);
          } // if


          cfUpdateFilters(dbsliceData.data); // Everything needs to b rerendered as the plots change depending on one another according to the data selection.

          render(); // Adjust the styling: first revert back to default, then apply the mouseover.
          //crossPlotHighlighting.off(d, "cfD3BarChart");
          //crossPlotHighlighting.on(d, "cfD3BarChart");
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
          // Get the new width;
          return ctrl.tools.xscale(v.value);
        } // transitionWidthEffects


        function transitionHeightEffects() {
          return ctrl.tools.yscale.bandwidth();
        } // transitionHeightEffects


        function transitionYEffects(v) {
          // Get the new width;
          return ctrl.tools.yscale(v.key);
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
      } // addOnMouseOver

    },
    // addInteractivity
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
            colWidth: 4,
            width: undefined,
            height: 400,
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
            }
          }
        }; // ctrl

        var options = dbsliceData.data.metaDataProperties;
        ctrl.view.yVarOption = {
          name: "varName",
          val: options[0],
          options: options
        };
        return ctrl;
      },
      // createDefaultControl
      createLoadedControl: function createLoadedControl(plotData) {
        var ctrl = cfD3BarChart.helpers.createDefaultControl(); // If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.

        if (plotData.xProperty != undefined) {
          if (dbsliceData.data.dataProperties.includes(plotData.xProperty)) {
            ctrl.view.yVarOption.val = plotData.xProperty;
          } // if						

        } // if				


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
      createAxes: function createAxes(ctrl) {
        var svg = ctrl.figure.select("svg.plotArea");
        var xAxis = svg.select("g.axis--x");
        var yAxis = svg.select("g.axis--y");

        if (xAxis.select("text").empty()) {
          xAxis.append("text").attr("class", "txt-horizontal-axis").attr("fill", "#000").attr("x", svg.select("g.data").attr("width")).attr("y", ctrl.format.axesMargin.bottom).attr("text-anchor", "end").text("Number of Tasks");
        }
        // Control the tick values, and make sure they only display integeers.

        var xAxisTicks = ctrl.tools.xscale.ticks().filter(function (d) {
          return Number.isInteger(d);
        });
        xAxis.transition().call(d3.axisBottom(ctrl.tools.xscale).tickValues(xAxisTicks).tickFormat(d3.format("d")));
        yAxis.transition().call(d3.axisLeft(ctrl.tools.yscale).tickValues([]));
      },
      // createAxes
      // Functions supporting cross plot highlighting
      unhighlight: function unhighlight(ctrl) {
        ctrl.figure.select("svg.plotArea").select("g.data").selectAll("rect").attr("stroke", "none").attr("stroke-width", 3);
      },
      // unhighlight
      highlight: function highlight(ctrl, d) {
        // Turn the text bold
        var labels = ctrl.figure.select("svg.plotArea").select("g.markup").selectAll('.keyLabel')._groups[0];

        labels.forEach(function (labelDOM) {
          if (labelDOM.innerHTML == d[ctrl.view.yVarOption.val]) {
            // Turn the text bold.
            labelDOM.style.fontWeight = 'bold';
          } // if

        }); // forEach
      },
      // highlight
      defaultStyle: function defaultStyle(ctrl) {
        // Remove the text bolding.
        ctrl.figure.select("svg.plotArea").select("g.markup").selectAll('.keyLabel').style("font-weight", ""); // Rehighlight any manually selected tasks.

        crossPlotHighlighting.manuallySelectedTasks();
      } // defaultStyle

    } // helpers

  }; // cfD3BarChart

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

  function refreshTasksInPlotRows() {
    // Collect all files that need to be loaded, create promises for them and store them into plot promise arrays that can be used to signal to the plot functions when they can update themselves.
    // It is expected that the individual plot controls have the sliceId specified in 'ctrl.view.sliceId', and that they have the promises stored under 'ctrl.data.promises'.
    // 'dbsliceData.flowData' will contain references to all promises created, and will keep track of the individual file promises. 'plotPromise' is an array of promises constructed for individual plots, and should trigger the redraw on completion of promise.
    // First do an inventory check of the central booking, and clear out unnecessary items.
    // Collect all the files that need to be loaded. Note that the files are individual properties of the records in the crossfilter.
    var filteredTasks = dbsliceData.data.dataDims[0].top(Infinity); // Collect all the required, and loaded files, and identify which, if any, files in the central booking will be redundant, and clear them out.

    var allRequiredUrls = collectAllRequiredFiles(filteredTasks);
    var allLoadedUrls = dbsliceData.flowData.map(function (file) {
      return file.url;
    });
    var redundantFiles = dbsliceData.flowData.filter(function (loadedFile) {
      // Files are redundant if the refresh does not need them, or if their data could not be loaded, in which case a repeated attempt to laod them should be launched.
      var urlNoLongerRequired = !allRequiredUrls.includes(loadedFile.url);
      var urlWasRejected = loadedFile.data == undefined;
      return urlNoLongerRequired || urlWasRejected;
    }); // Clear the redundant files out of central booking.

    redundantFiles.forEach(function (redundantFile) {
      var redundantFileInd = indexOfAttr(dbsliceData.flowData, "url", redundantFile.url);
      dbsliceData.flowData.splice(redundantFileInd, 1);
    }); // redundantUrls
    // Create the actual promises to be stored in the central booking. This is a duplicative loop over the existing promises because the plot ctrl assigns the data processor function, which 'collectAllRequiredFiles' does not collect.

    dbsliceData.session.plotRows.forEach(function (plotRowCtrl, i) {
      // Only consider plots for loading if the plot row is a "plotter". In future this could be moved to the actual plot ctrl's themselves and they could say whether they're expecting data from outside or not.
      if (plotRowCtrl.type == "plotter") {
        plotRowCtrl.plots.forEach(function (plotCtrl, j) {
          // Loop over all the files that will be required for this plot.
          var sliceId = plotCtrl.view.sliceId;
          var requiredFiles = filteredTasks.map(function (d) {
            return d[sliceId];
          }); // For this particular plot all promises must be made, and a record tracked.
          var file = undefined;
          requiredFiles.forEach(function (url, k) {
            // The loaded files must be updated to prevent duplicate loading.
            file = undefined;
            var loadedFiles = dbsliceData.flowData.map(function (d) {
              return d.url;
            }); // Check if a promise to this file has already been created.

            var fileIndex = loadedFiles.indexOf(url);

            if (fileIndex < 0) {
              console.log("loading: " + url); // Promise for this file does not yet exist. Create it, store a reference in 'dbsliceData.flowData', and another in the 'plotCtrl.data.promises'. The storing into 'dbsliceData.flowData' is done in the makeFilePromise already. The storing in the plot ctrl is done to allow the plotting function itself to identify any differences between the plotted state and the tasks selected in hte filter. This is useful if the plots should communicate to the user that they need to be updated.

              file = makeFilePromise(url, plotCtrl.data.processor);
            } else {
              file = dbsliceData.flowData[fileIndex];
            } // if


            plotCtrl.data.promises.push(file.promise);
          }); // forEach
          // If a file is not found a rejected promise is stored. Therefore, if dbslice couldn't find the file, it will not look for it again. If it would instead search for it every time the refresh button is clicked, missing file issues could be resolved on the fly. However, if data is missing in the files the app must be reloaded so that the promises are cleared, so that on next load the new data is loaded too.
          // It is important that the promises log themselves immediately, and remain in place in order to ensure no additional loading is scheduled. Therefore the central booking must clear out the rejected files AFTER all the promises have been processed. This is done when the "Plot Selected Tasks" button is pressed again. 
          // Now that all the plot promises have been assembled, attach the event to run after their completion.

          addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j);
        }); // forEach
      } // if

    }); // forEach

    function makeFilePromise(url, processor) {
      // Has to return an object {url: url, promise: Promise(url)}. Furthermore, the completion of the promise should store the data into this same object.
      var file = {
        url: url,
        promise: undefined,
        data: undefined
      };
      file.promise = d3.csv(url).then(function (data) {
        // The data contents are kept in the original state by the internal storage, and it is the job of individual plotting functions to adjust the structure if necessary.
        // It has been decided that the data is transformed after all, as internal transformations would be often, and they would require additional memory to be occupied. The transformation function needs to be supplied by the plotting function.
        // The extents of the series will be valuable information when trying to create a plot containing data from different files. Alternately a dummy scale can be created, that has it's domain updated on plotting the dta, but then the data needs to be readjusted anyway, which duplicates the process.
        // Store the data.
        file.data = processor(data);
      })["catch"](function () {
        // This catch does nothing for now, but it is here to ensure the rest of the code continues running.
        // On catch the default file object is not updated with data, and is not pushed into the central storage. It is not stored as the file might become available, and therefore dbslice should try to retrieve it again.
        console.log("Loading of a file failed.");
      }); // Store the file into the central booking location.

      dbsliceData.flowData.push(file);
      return file;
    } // makeFilePromise


    function addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j) {
      Promise.all(plotCtrl.data.promises).then(function () {
        // The data has been loaded, start the plotting. How to pass in special parameters?
        console.log("Started plotting slice: " + sliceId + " ( plotRow:" + i + ", plot: " + j + ")"); // INCORPORATE CALL TO DRAWING FUNCTION HERE
        // Replace the redundant inputs with just the relevant plot control object. The control object should know which function it needs to invoke.
        // DUMMY FUNCTIONALITY!
        // In the real version this should call either render, or simply the function update, depending on what happens upon plot configure. If plot configure already creates an empty plot this could just call the update. Otherwise this would call render directly.

        plotCtrl.plotFunc.update_(plotCtrl);
      });
    } // addUpdateOnPromiseCompletion


    function collectAllRequiredFiles(filteredTasks) {
      var requiredUrls = [];
      dbsliceData.session.plotRows.forEach(function (plotRowCtrl) {
        plotRowCtrl.plots.forEach(function (plotCtrl) {
          // Loop over all the files that will be required for this plot.
          if (plotCtrl.view.sliceId != undefined) {
            requiredUrls = requiredUrls.concat(filteredTasks.map(function (d) {
              return d[plotCtrl.view.sliceId];
            }));
          } // if

        }); // forEach
      }); // forEach

      return requiredUrls;
    } // collectAllRequiredFiles


    function indexOfAttr(array, attr, value) {
      for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
          return i;
        }
      }

      return -1;
    } // indexOfAttr

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
    sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#").attr("id", "saveSession").html("Save session");
    sessionTitle.append("br");
    sessionTitle.append("br");
    $("#refreshTasksButton").on("click", function () {
      refreshTasksInPlotRows();
    }); // Solves the previous hack of updating the session file ready for download.

    d3.select("#saveSession").on("click", function () {
      // Get the string to save
      var s = importExportFunctionality.exporting.session.json(); // Make the blob

      var b = importExportFunctionality.exporting.session.makeTextFile(s); // Download the file.

      var lnk = document.createElement("a");
      lnk.setAttribute("download", "test_session.json");
      lnk.setAttribute("href", b);
      var m = d3.select(document.getElementById("sessionOptions").parentElement).select(".dropdown-menu").node();
      m.appendChild(lnk);
      lnk.click();
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


    render();
  } // initialise

  exports.addMenu = addMenu;
  exports.cfD3BarChart = cfD3BarChart;
  exports.cfD3Histogram = cfD3Histogram;
  exports.cfD3Line = cfD3Line;
  exports.cfD3Scatter = cfD3Scatter;
  exports.cfDataManagement = cfDataManagement;
  exports.cfUpdateFilters = cfUpdateFilters;
  exports.crossPlotHighlighting = crossPlotHighlighting;
  exports.d3Contour2d = d3Contour2d;
  exports.importExportFunctionality = importExportFunctionality;
  exports.initialise = initialise;
  exports.makeSessionHeader = makeSessionHeader;
  exports.plotHelpers = plotHelpers;
  exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
  exports.render = render;

  return exports;

}({}));
