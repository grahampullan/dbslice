var dbslice = (function (exports) {
'use strict';

var threeSurf3d = {

	make: function make(element, geometry, layout) {

		threeSurf3d.update(element, geometry, layout);
	},

	update: function update(element, geometry, layout) {

		if (geometry.newData == false) {
			return;
		}

		if (layout.vScale === undefined) {
			var vScale = geometry.vScale;
		} else {
			var vScale = layout.vScale;
		}

		var color = d3.scaleLinear().domain(vScale).interpolate(function () {
			return d3.interpolateRdBu;
		});

		geometry.faces.forEach(function (face, index) {
			face.vertexColors[0] = new THREE.Color(color(geometry.faceValues[index][0]));
			face.vertexColors[1] = new THREE.Color(color(geometry.faceValues[index][1]));
			face.vertexColors[2] = new THREE.Color(color(geometry.faceValues[index][2]));
		});

		var container = d3.select(element);

		container.select(".plotArea").remove();

		var div = container.append("div").attr("class", "plotArea");

		var width = container.node().offsetWidth,
		    height = layout.height;

		// Compute normals for shading
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		// Use MeshPhongMaterial for a reflective surface
		var material = new THREE.MeshPhongMaterial({
			side: THREE.DoubleSide,
			color: 0xffffff,
			vertexColors: THREE.VertexColors,
			specular: 0x0,
			shininess: 100.,
			emissive: 0x0
		});

		// Initialise threejs scene
		var scene = new THREE.Scene();

		// Add background colour
		scene.background = new THREE.Color(0xefefef);

		// Add Mesh to scene
		scene.add(new THREE.Mesh(geometry, material));

		// Create renderer
		var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(width, height);

		// Set target DIV for rendering
		//var container = document.getElementById( elementId );
		div.node().appendChild(renderer.domElement);

		// Define the camera
		var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
		camera.position.z = 2;

		// Add controls 
		var controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.addEventListener('change', function () {
			renderer.render(scene, camera); // re-render if controls move/zoom 
		});
		controls.enableZoom = true;

		var ambientLight = new THREE.AmbientLight(0xaaaaaa);
		scene.add(ambientLight);

		var lights = [];
		lights[0] = new THREE.PointLight(0xffffff, 1, 3);
		lights[1] = new THREE.PointLight(0xffffff, 1, 3);
		lights[2] = new THREE.PointLight(0xffffff, 1, 3);
		lights[3] = new THREE.PointLight(0xffffff, 1, 3);
		lights[4] = new THREE.PointLight(0xffffff, 1, 3);
		lights[5] = new THREE.PointLight(0xffffff, 1, 3);

		lights[0].position.set(0, 2, 0);
		lights[1].position.set(1, 2, 1);
		lights[2].position.set(-1, -2, -1);
		lights[3].position.set(0, 0, 2);
		lights[4].position.set(0, 0, -2);
		lights[5].position.set(0, -2, 0);

		lights.forEach(function (light) {
			scene.add(light);
		});

		// Make initial call to render scene
		renderer.render(scene, camera);

		geometry.newData = false;
	}

};

function threeMeshFromStruct(data) {
  var x, y, z, v, n, m;

  var xMinAll = d3.min(data.surfaces[0].x);
  var yMinAll = d3.min(data.surfaces[0].y);
  var zMinAll = d3.min(data.surfaces[0].z);
  var vMinAll = d3.min(data.surfaces[0].v);

  var xMaxAll = d3.max(data.surfaces[0].x);
  var yMaxAll = d3.max(data.surfaces[0].y);
  var zMaxAll = d3.max(data.surfaces[0].z);
  var vMaxAll = d3.max(data.surfaces[0].v);

  var nDataSets = data.surfaces.length;

  for (var nds = 1; nds < nDataSets; ++nds) {
    xMinAll = d3.min(data.surfaces[nds].x) < xMinAll ? d3.min(data.surfaces[nds].x) : xMinAll;
    yMinAll = d3.min(data.surfaces[nds].y) < yMinAll ? d3.min(data.surfaces[nds].y) : yMinAll;
    zMinAll = d3.min(data.surfaces[nds].z) < zMinAll ? d3.min(data.surfaces[nds].z) : zMinAll;
    vMinAll = d3.min(data.surfaces[nds].v) < vMinAll ? d3.min(data.surfaces[nds].v) : vMinAll;
    xMaxAll = d3.max(data.surfaces[nds].x) > xMaxAll ? d3.max(data.surfaces[nds].x) : xMaxAll;
    yMaxAll = d3.max(data.surfaces[nds].y) > yMaxAll ? d3.max(data.surfaces[nds].y) : yMaxAll;
    zMaxAll = d3.max(data.surfaces[nds].z) > zMaxAll ? d3.max(data.surfaces[nds].z) : zMaxAll;
    vMaxAll = d3.max(data.surfaces[nds].v) > vMaxAll ? d3.max(data.surfaces[nds].v) : vMaxAll;
  }

  var xrange = xMaxAll - xMinAll;
  var yrange = yMaxAll - yMinAll;
  var zrange = zMaxAll - zMinAll;

  var xmid = 0.5 * (xMinAll + xMaxAll);
  var ymid = 0.5 * (yMinAll + yMaxAll);
  var zmid = 0.5 * (zMinAll + zMaxAll);

  var scalefac = 1. / d3.max([xrange, yrange, zrange]);

  // Use d3 for color scale 
  // vMinAll=0.4;
  // vMaxAll=1.1;
  // var color = d3.scaleLinear()
  //	.domain( [ vMinAll, vMaxAll ] )
  //	.interpolate(function() { return d3.interpolateRdBu; });

  // Initialise threejs geometry
  var geometry = new THREE.Geometry();
  geometry.faceValues = [];
  geometry.vScale = [vMinAll, vMaxAll];

  var noffset = 0;
  for (nds = 0; nds < nDataSets; ++nds) {
    x = data.surfaces[nds].x;
    y = data.surfaces[nds].y;
    z = data.surfaces[nds].z;
    v = data.surfaces[nds].v;
    m = data.surfaces[nds].size[0];
    n = data.surfaces[nds].size[1];

    var nverts = n * m;

    // Add grid vertices to geometry
    for (var k = 0; k < nverts; ++k) {
      var newvert = new THREE.Vector3((x[k] - xmid) * scalefac, (y[k] - ymid) * scalefac, (z[k] - zmid) * scalefac);
      geometry.vertices.push(newvert);
    }

    // Add cell faces (2 traingles per cell) to geometry
    for (var j = 0; j < m - 1; j++) {
      for (var i = 0; i < n - 1; i++) {
        var n0 = j * n + i;
        var n1 = n0 + 1;
        var n2 = (j + 1) * n + i + 1;
        var n3 = n2 - 1;
        var face1 = new THREE.Face3(n0 + noffset, n1 + noffset, n2 + noffset);
        var face2 = new THREE.Face3(n2 + noffset, n3 + noffset, n0 + noffset);
        // face1.vertexColors[0] = new THREE.Color( color( v[n0] ) );
        // face1.vertexColors[1] = new THREE.Color( color( v[n1] ) );
        // face1.vertexColors[2] = new THREE.Color( color( v[n2] ) );
        // face2.vertexColors[0] = new THREE.Color( color( v[n2] ) );
        // face2.vertexColors[1] = new THREE.Color( color( v[n3] ) );
        // face2.vertexColors[2] = new THREE.Color( color( v[n0] ) );
        geometry.faces.push(face1);
        geometry.faces.push(face2);
        var faceValue1 = [];
        var faceValue2 = [];
        faceValue1.push(v[n0]);
        faceValue1.push(v[n1]);
        faceValue1.push(v[n2]);
        faceValue2.push(v[n2]);
        faceValue2.push(v[n3]);
        faceValue2.push(v[n0]);
        geometry.faceValues.push(faceValue1);
        geometry.faceValues.push(faceValue2);
      }
    }
    noffset = noffset + nverts;
  }

  return geometry;
}

var d3ContourStruct2d = {

    make: function make(element, data, layout) {

        d3ContourStruct2d.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        if (data.newData == false) {
            return;
        }

        var x, y, v, n, m;

        var marginDefault = { top: 20, right: 10, bottom: 20, left: 10 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        container.select("svg").remove();

        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight);

        var plotArea = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");

        var xMinAll = d3.min(data.surfaces[0].x);
        var yMinAll = d3.min(data.surfaces[0].y);
        var vMinAll = d3.min(data.surfaces[0].v);

        var xMaxAll = d3.max(data.surfaces[0].x);
        var yMaxAll = d3.max(data.surfaces[0].y);
        var vMaxAll = d3.max(data.surfaces[0].v);

        var nDataSets = data.surfaces.length;

        for (var nds = 1; nds < nDataSets; ++nds) {
            xMinAll = d3.min(data.surfaces[nds].x) < xMinAll ? d3.min(data.surfaces[nds].x) : xMinAll;
            yMinAll = d3.min(data.surfaces[nds].y) < yMinAll ? d3.min(data.surfaces[nds].y) : yMinAll;
            vMinAll = d3.min(data.surfaces[nds].v) < vMinAll ? d3.min(data.surfaces[nds].v) : vMinAll;
            xMaxAll = d3.max(data.surfaces[nds].x) > xMaxAll ? d3.max(data.surfaces[nds].x) : xMaxAll;
            yMaxAll = d3.max(data.surfaces[nds].y) > yMaxAll ? d3.max(data.surfaces[nds].y) : yMaxAll;
            vMaxAll = d3.max(data.surfaces[nds].v) > vMaxAll ? d3.max(data.surfaces[nds].v) : vMaxAll;
        }

        // set x and y scale to maintain 1:1 aspect ratio  
        var domainAspectRatio = (yMaxAll - yMinAll) / (xMaxAll - xMinAll);
        var rangeAspectRatio = height / width;

        if (rangeAspectRatio > domainAspectRatio) {
            var xscale = d3.scaleLinear().domain([xMinAll, xMaxAll]).range([0, width]);
            var yscale = d3.scaleLinear().domain([yMinAll, yMaxAll]).range([domainAspectRatio * width, 0]);
        } else {
            var xscale = d3.scaleLinear().domain([xMinAll, xMaxAll]).range([0, height / domainAspectRatio]);
            var yscale = d3.scaleLinear().domain([yMinAll, yMaxAll]).range([height, 0]);
        }

        if (layout.vScale !== undefined) {
            vMinAll = layout.vScale[0];
            vMaxAll = layout.vScale[1];
        }

        // array of threshold values 
        var thresholds = d3.range(vMinAll, vMaxAll, (vMaxAll - vMinAll) / 21);

        // color scale  
        var color = d3.scaleLinear().domain(d3.extent(thresholds)).interpolate(function () {
            return d3.interpolateRdBu;
        });

        var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        for (var nds = 0; nds < nDataSets; ++nds) {
            x = data.surfaces[nds].x;
            y = data.surfaces[nds].y;
            v = data.surfaces[nds].v;
            m = data.surfaces[nds].size[0];
            n = data.surfaces[nds].size[1];

            // configure a projection to map the contour coordinates returned by
            // d3.contours (px,py) to the input data (xgrid,ygrid)
            var projection = d3.geoTransform({
                point: function point(px, py) {
                    var xfrac, yfrac, xnow, ynow;
                    var xidx, yidx, idx0, idx1, idx2, idx3;
                    // remove the 0.5 offset that comes from d3-contour
                    px = px - 0.5;
                    py = py - 0.5;
                    // clamp to the limits of the xgrid and ygrid arrays (removes "bevelling" from outer perimeter of contours)
                    px < 0 ? px = 0 : px;
                    py < 0 ? py = 0 : py;
                    px > n - 1 ? px = n - 1 : px;
                    py > m - 1 ? py = m - 1 : py;
                    // xidx and yidx are the array indices of the "bottom left" corner
                    // of the cell in which the point (px,py) resides
                    xidx = Math.floor(px);
                    yidx = Math.floor(py);
                    xidx == n - 1 ? xidx = n - 2 : xidx;
                    yidx == m - 1 ? yidx = m - 2 : yidx;
                    // xfrac and yfrac give the coordinates, between 0 and 1,
                    // of the point within the cell 
                    xfrac = px - xidx;
                    yfrac = py - yidx;
                    // indices of the 4 corners of the cell
                    idx0 = xidx + yidx * n;
                    idx1 = idx0 + 1;
                    idx2 = idx0 + n;
                    idx3 = idx2 + 1;
                    // bilinear interpolation to find projected coordinates (xnow,ynow)
                    // of the current contour coordinate
                    xnow = (1 - xfrac) * (1 - yfrac) * x[idx0] + xfrac * (1 - yfrac) * x[idx1] + yfrac * (1 - xfrac) * x[idx2] + xfrac * yfrac * x[idx3];
                    ynow = (1 - xfrac) * (1 - yfrac) * y[idx0] + xfrac * (1 - yfrac) * y[idx1] + yfrac * (1 - xfrac) * y[idx2] + xfrac * yfrac * y[idx3];
                    this.stream.point(xscale(xnow), yscale(ynow));
                }
            });

            // initialise contours
            var contours = d3.contours().size([n, m]).smooth(true).thresholds(thresholds);

            // make and project the contours
            plotArea.selectAll("path").data(contours(v)).enter().append("path").attr("d", d3.geoPath(projection)).attr("fill", function (d) {
                return color(d.value);
            });
        }

        function zoomed() {
            var t = d3.event.transform;
            plotArea.attr("transform", t);
        }

        data.newData = false;
    }
};

var d3LineSeries = {

    make: function make(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");

        d3LineSeries.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        if (data.newData == false) {
            return;
        }

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var nseries = data.series.length;

        var xmin = d3.min(data.series[0].data, function (d) {
            return d.x;
        });
        var xmax = d3.max(data.series[0].data, function (d) {
            return d.x;
        });
        var ymin = d3.min(data.series[0].data, function (d) {
            return d.y;
        });
        var ymax = d3.max(data.series[0].data, function (d) {
            return d.y;
        });

        for (var n = 1; n < nseries; ++n) {
            var xminNow = d3.min(data.series[n].data, function (d) {
                return d.x;
            });
            xminNow < xmin ? xmin = xminNow : xmin = xmin;
            var xmaxNow = d3.max(data.series[n].data, function (d) {
                return d.x;
            });
            xmaxNow > xmax ? xmax = xmaxNow : xmax = xmax;
            var yminNow = d3.min(data.series[n].data, function (d) {
                return d.y;
            });
            yminNow < ymin ? ymin = yminNow : ymin = ymin;
            var ymaxNow = d3.max(data.series[n].data, function (d) {
                return d.y;
            });
            ymaxNow > ymax ? ymax = ymaxNow : ymax = ymax;
        }

        if (layout.xscale == "time") {
            var xscale = d3.scaleTime();
            var xscale0 = d3.scaleTime();
        } else {
            var xscale = d3.scaleLinear();
            var xscale0 = d3.scaleLinear();
        }

        xscale.range([0, width]).domain([xmin, xmax]);

        xscale0.range([0, width]).domain([xmin, xmax]);

        var yscale = d3.scaleLinear().range([height, 0]).domain([ymin, ymax]);

        var yscale0 = d3.scaleLinear().range([height, 0]).domain([ymin, ymax]);

        var colour = d3.scaleOrdinal(d3.schemeCategory20c);

        var line = d3.line().x(function (d) {
            return xscale(d.x);
        }).y(function (d) {
            return yscale(d.y);
        });

        var plotArea = svg.select(".plotArea");

        var clip = svg.append("clipPath").attr("id", "clip").append("rect").attr("width", width).attr("height", height);

        var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        var allSeries = plotArea.selectAll(".plotSeries").data(data.series);

        allSeries.enter().each(function () {
            var series = d3.select(this);
            var seriesLine = series.append("g").attr("class", "plotSeries").attr("series-name", function (d) {
                return d.name;
            }).append("path").attr("class", "line").attr("d", function (d) {
                return line(d.data);
            }).style("stroke", function (d) {
                return colour(d.name);
            }).style("fill", "none").style("stroke-width", "2px").attr("clip-path", "url(#clip)").on("mouseover", tipOn).on("mouseout", tipOff);
        });

        allSeries.each(function () {
            var series = d3.select(this);
            var seriesLine = series.select("path.line");
            seriesLine.transition().attr("d", function (d) {
                return line(d.data);
            });
        });

        allSeries.exit().remove();

        var xAxis = d3.axisBottom(xscale).ticks(5);
        var yAxis = d3.axisLeft(yscale);

        var gX = plotArea.select(".axis--x");
        if (gX.empty()) {
            gX = plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "axis--x").call(xAxis);
            gX.append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom).attr("text-anchor", "end").text(layout.xAxisLabel);
        } else {
            gX.transition().call(xAxis);
        }

        var gY = plotArea.select(".axis--y");
        if (gY.empty()) {
            gY = plotArea.append("g").attr("class", "axis--y").call(yAxis);
            gY.append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -margin.left + 15).attr("text-anchor", "end").text(layout.yAxisLabel);
        } else {
            gY.transition().call(yAxis);
        }

        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".line").attr("d", function (d) {
                return line(d.data);
            });
        }

        function tipOn() {
            plotArea.selectAll(".line").style("opacity", 0.2);
            d3.select(this).style("opacity", 1.0).style("stroke-width", "4px");
        }

        function tipOff() {
            plotArea.selectAll(".line").style("opacity", 1.0);
            d3.select(this).style("stroke-width", "2px");
        }

        data.newData = false;
    }
};

var d3Scatter = {

    make: function make(element, data, layout) {

        console.log(data);

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");

        d3Scatter.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var xscale = d3.scaleLinear().range([0, width]).domain(d3.extent(data.points, function (d) {
            return d.x;
        }));
        var yscale = d3.scaleLinear().range([height, 0]).domain(d3.extent(data.points, function (d) {
            return d.y;
        }));

        var colour = d3.scaleOrdinal(d3.schemeCategory20c);

        var plotArea = svg.select(".plotArea");

        var points = plotArea.selectAll("circle").data(data.points);

        points.enter().append("circle").attr("r", 5).attr("cx", function (d) {
            return xscale(d.x);
        }).attr("cy", function (d) {
            return yscale(d.y);
        }).style("fill", function (d) {
            return colour(d.colField);
        });
        //.style( "fill-opacity", 1e-6)
        //.transition()
        //    .style( "fill-opacity", 1);

        points.transition()
        //.duration(5000)
        .attr("r", 5).attr("cx", function (d) {
            return xscale(d.x);
        }).attr("cy", function (d) {
            return yscale(d.y);
        }).style("fill", function (d) {
            return colour(d.colField);
        });

        points.exit().remove();

        var xAxis = plotArea.select(".xAxis");
        if (xAxis.empty()) {
            plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "xAxis").call(d3.axisBottom(xscale)).append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom).attr("text-anchor", "end").text(layout.xAxisLabel);
        } else {
            xAxis.attr("transform", "translate(0," + height + ")").transition().call(d3.axisBottom(xscale));
        }

        var yAxis = plotArea.select(".yAxis");
        if (yAxis.empty()) {
            plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(yscale)).append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -margin.left + 15).attr("text-anchor", "end").text(layout.yAxisLabel);
        } else {
            yAxis.transition().call(d3.axisLeft(yscale));
        }
    }

};

function makeNewPlot(plotData, index) {

    var plot = d3.select(this).append("div").attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper").append("div").attr("class", "card");

    var plotHeader = plot.append("div").attr("class", "card-header plotTitle").html(plotData.layout.title);

    var plotBody = plot.append("div").attr("class", "plot");

    plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout);
}

function updatePlot(plotData, index) {

    var plot = d3.select(this); // this is the plotBody selection

    //var plotHeader = plot.append( "div" ).attr( "class", "card-header plotTitle")
    //	 .html( `${plotData.layout.title}` );

    //var plotBody = plot.append( "div" ).attr( "class", "plot");

    plotData.plotFunc.update(plot.node(), plotData.data, plotData.layout);
}

function update(elementId, session) {

  var element = d3.select("#" + elementId);

  if (session.filteredTaskIds !== undefined) {
    element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = " + session.filteredTaskIds.length + "</p>");
  } else {
    element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
  }

  var plotRows = element.selectAll(".plotRow").data(session.plotRows);

  var newPlotRows = plotRows.enter().append("div").attr("class", "card bg-light plotRow").attr("style", "margin-bottom:20px");

  var newPlotRowsHeader = newPlotRows.append("div").attr("class", "card-header plotRowTitle").call(function (selection) {
    selection.html(function (d) {
      return "<h3 style='display:inline'>" + d.title + "</h3>";
    });
  });

  var newPlotRowsBody = newPlotRows.append("div").attr("class", "row no-gutters plotRowBody");

  var newPlots = newPlotRowsBody.selectAll(".plot").data(function (d) {
    return d.plots;
  }).enter().each(makeNewPlot);

  plotRows.selectAll(".plotRowBody").selectAll(".plot").data(function (d) {
    return d.plots;
  }).enter().each(makeNewPlot);

  var plotRowPlots = plotRows.selectAll(".plot").data(function (d) {
    return d.plots;
  }).each(updatePlot);

  var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper").data(function (d) {
    return d.plots;
  }).each(function (plotData, index) {
    var plotWrapper = d3.select(this);
    var plotTitle = plotWrapper.select(".plotTitle").html(plotData.layout.title);
  });

  plotRows.exit().remove();
  plotRowPlotWrappers.exit().remove();
}

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var DbsliceData = function DbsliceData() {
  classCallCheck(this, DbsliceData);
};

var dbsliceData = new DbsliceData();

function makePlotsFromPlotRowCtrl(ctrl) {

  var plotPromises = [];

  var slicePromises = [];

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

      var plotPromise = fetch(url).then(function (response) {

        return response.json();
      }).then(function (responseJson) {

        var plot = {};

        if (ctrl.formatDataFunc !== undefined) {

          plot.data = ctrl.formatDataFunc(responseJson);
        } else {

          plot.data = responseJson;
        }

        plot.layout = Object.assign({}, ctrl.layout);

        plot.plotFunc = ctrl.plotFunc;

        plot.layout.title = title;

        plot.data.newData = true;

        return plot;
      });

      plotPromises.push(plotPromise);
    }
  } else {

    ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {

      var slicePromisesPerPlot = [];

      var nTasks = ctrl.taskIds.length;

      for (var index = 0; index < nTasks; ++index) {

        var url = ctrl.urlTemplate.replace("${taskId}", ctrl.taskIds[index]).replace("${sliceId}", sliceId);

        var slicePromise = fetch(url).then(function (response) {

          return response.json();
        });

        slicePromisesPerPlot.push(slicePromise);
      }

      slicePromises.push(slicePromisesPerPlot);

      var plotPromise = Promise.all(slicePromises[sliceIndex]).then(function (responseJson) {

        var plot = {};

        if (ctrl.formatDataFunc !== undefined) {

          plot.data = ctrl.formatDataFunc(responseJson);
        } else {

          plot.data = responseJson;
        }

        plot.layout = Object.assign({}, ctrl.layout);

        plot.plotFunc = ctrl.plotFunc;

        plot.layout.title = sliceId;

        plot.data.newData = true;

        return plot;
      });

      plotPromises.push(plotPromise);
    });
  }

  return Promise.all(plotPromises);
}

function refreshTasksInPlotRows() {

	var plotRows = dbsliceData.session.plotRows;

	var plotRowPromises = [];

	plotRows.forEach(function (plotRow) {

		if (plotRow.ctrl !== undefined) {

			var ctrl = plotRow.ctrl;

			if (ctrl.plotFunc !== undefined) {

				if (ctrl.tasksByFilter) {

					ctrl.taskIds = dbsliceData.session.filteredTaskIds;
					ctrl.taskLabels = dbsliceData.session.filteredTaskLabels;
				}

				if (ctrl.tasksByList) {

					ctrl.taskIds = dbsliceData.session.manualListTaskIds;
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

		render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
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
	var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { plotTasksButton: false };


	dbsliceData.session = session;
	dbsliceData.elementId = elementId;
	dbsliceData.config = config;

	var element = d3.select("#" + elementId);

	var sessionHeader = element.select(".sessionHeader");

	if (sessionHeader.empty()) makeSessionHeader(element, session.title, session.subtitle, config);

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
  });

  // update crossfilter with the items selected at the histograms
  crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
    // first reset all filters
    crossfilter.dataDims[i].filterAll();
    if (selectedRange.length !== 0) {
      crossfilter.dataDims[i].filter(function (d) {
        return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
      });
    }
  });

  var currentMetaData = crossfilter.metaDims[0].top(Infinity);

  dbsliceData.session.filteredTaskIds = currentMetaData.map(function (d) {
    return d.taskId;
  });

  if (currentMetaData[0].label !== undefined) {

    dbsliceData.session.filteredTaskLabels = currentMetaData.map(function (d) {
      return d.label;
    });
  } else {

    dbsliceData.session.filteredTaskLabels = currentMetaData.map(function (d) {
      return d.taskId;
    });
  }

  //render( dbsliceData.elementId , dbsliceData.session , dbsliceData.config );
}

var cfD3BarChart = {

    make: function make(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 20 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var dimId = data.cfData.metaDataProperties.indexOf(data.property);

        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea").attr("dimId", dimId);

        cfD3BarChart.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 20 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");

        var dim = data.cfData.metaDims[dimId];
        var group = dim.group();
        //var items = group.top( Infinity );
        var items = group.all();

        var x = d3.scaleLinear().range([0, width]).domain([0, d3.max(items, function (v) {
            return v.value;
        })]);

        var y = d3.scaleBand().range([0, height]).domain(items.map(function (d) {
            return d.key;
        })).padding([0.2]).align([0.5]);

        var colour = d3.scaleOrdinal(d3.schemeCategory20c);

        var bars = plotArea.selectAll("rect").data(items, function (v) {
            return v.key;
        });

        bars.enter().append("rect").on("click", function (selectedItem) {

            if (data.cfData.filterSelected[dimId] === undefined) {
                data.cfData.filterSelected[dimId] = [];
            }

            // check if current filter is already active
            if (data.cfData.filterSelected[dimId].indexOf(selectedItem.key) !== -1) {

                // already active
                var ind = data.cfData.filterSelected[dimId].indexOf(selectedItem.key);
                data.cfData.filterSelected[dimId].splice(ind, 1);
            } else {

                data.cfData.filterSelected[dimId].push(selectedItem.key);
            }

            cfUpdateFilters(data.cfData);
            render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
        }).attr("height", y.bandwidth()).attr("y", function (v) {
            return y(v.key);
        }).style("fill", function (v) {
            return colour(v.key);
        }).transition().attr("width", function (v) {
            return x(v.value);
        })
        // initialise opacity for later transition
        .attr("opacity", 1);

        // updating the bar chart bars
        bars.transition().attr("width", function (v) {
            return x(v.value);
        })
        // change colour depending on whether the bar has been selected
        .attr("opacity", function (v) {

            // if no filters then all are selected
            if (data.cfData.filterSelected[dimId] === undefined || data.cfData.filterSelected[dimId].length === 0) {

                return 1;
            } else {

                return data.cfData.filterSelected[dimId].indexOf(v.key) === -1 ? 0.2 : 1;
            }
        });

        var xAxis = plotArea.select(".xAxis");
        if (xAxis.empty()) {
            plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "xAxis").call(d3.axisBottom(x)).append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom).attr("text-anchor", "end").text("Number of Tasks");
        } else {
            xAxis.attr("transform", "translate(0," + height + ")").transition().call(d3.axisBottom(x));
        }

        var yAxis = plotArea.select(".yAxis");
        if (yAxis.empty()) {
            plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(y).tickValues([]));
        } else {
            yAxis.transition().call(d3.axisLeft(y).tickValues([]));
        }

        var keyLabels = plotArea.selectAll("keyLabel").data(items, function (v) {
            return v.key;
        });

        keyLabels.enter().append("text").attr("class", "keyLabel").attr("x", 0).attr("y", function (v) {
            return y(v.key) + 0.5 * y.bandwidth();
        }).attr("dx", 5).attr("dy", ".35em").attr("text-anchor", "start").text(function (v) {
            return v.key;
        });

        // updating meta Labels
        keyLabels.text(function (v) {
            return v.key;
        });
    }
};

var cfD3Histogram = {

    make: function make(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var dimId = data.cfData.dataProperties.indexOf(data.property);

        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight);

        var plotArea = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea").attr("dimId", dimId);

        var dim = data.cfData.dataDims[dimId];
        var items = dim.top(Infinity);

        var xDomMax = d3.max(items, function (d) {
            return d[data.property];
        }) * 1.1;
        plotArea.attr("xDomMax", xDomMax);

        var xDomMin = d3.min(items, function (d) {
            return d[data.property];
        }) * 0.9;
        plotArea.attr("xDomMin", xDomMin);

        var x = d3.scaleLinear().domain([xDomMin, xDomMax]).rangeRound([0, width]);

        plotArea.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));

        var brush = d3.brushX().extent([[0, 0], [width, height]]).on("start brush end", brushmoved);

        var gBrush = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "brush").call(brush);

        // style brush resize handle
        // https://github.com/crossfilter/crossfilter/blob/gh-pages/index.html#L466
        var brushResizePath = function brushResizePath(d) {
            var e = +(d.type == "e"),
                x = e ? 1 : -1,
                y = height / 2;
            return "M" + .5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + .5 * x + "," + 2 * y + "Z" + "M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8);
        };

        var handle = gBrush.selectAll("handleCustom").data([{ type: "w" }, { type: "e" }]).enter().append("path").attr("class", "handleCustom").attr("stroke", "#000").attr("cursor", "ewResize").attr("d", brushResizePath);

        var brushInit = true;
        gBrush.call(brush.move, x.domain().map(x));
        brushInit = false;

        function brushmoved() {
            var s = d3.event.selection;
            if (s == null) {
                handle.attr("display", "none");
                data.cfData.histogramSelectedRanges[dimId] = [];
                cfUpdateFilters(data.cfData);
                if (brushInit == false) render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
            } else {
                var sx = s.map(x.invert);
                handle.attr("display", null).attr("transform", function (d, i) {
                    return "translate(" + [s[i], -height / 4] + ")";
                });
                data.cfData.histogramSelectedRanges[dimId] = sx;
                cfUpdateFilters(data.cfData);
                if (brushInit == false) render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
            }
        }

        cfD3Histogram.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");
        var dim = data.cfData.dataDims[dimId];
        var property = data.property;

        var formatCount = d3.format(",.0f");

        var items = dim.top(Infinity);

        var xDomMax = plotArea.attr("xDomMax");
        var xDomMin = plotArea.attr("xDomMin");
        var x = d3.scaleLinear().domain([xDomMin, xDomMax]).rangeRound([0, width]);

        var histogram = d3.histogram().value(function (d) {
            return d[property];
        }).domain(x.domain()).thresholds(x.ticks(20));

        var bins = histogram(items);

        var y = d3.scaleLinear().domain([0, d3.max(bins, function (d) {
            return d.length;
        })]).range([height, 0]);

        var bars = plotArea.selectAll("rect").data(bins);

        bars.enter().append("rect").attr("transform", function (d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        }).attr("x", 1).attr("width", function (d) {
            return x(d.x1) - x(d.x0) - 1;
        }).attr("height", function (d) {
            return height - y(d.length);
        }).style("fill", "steelblue").attr("opacity", "1");

        bars.transition().attr("transform", function (d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        }).attr("x", 1).attr("width", function (d) {
            return x(d.x1) - x(d.x0) - 1;
        }).attr("height", function (d) {
            return height - y(d.length);
        });

        bars.exit().remove();

        var yAxis = plotArea.select(".yAxis");
        if (yAxis.empty()) {
            plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(y));
        } else {
            yAxis.transition().call(d3.axisLeft(y));
        }

        var yAxisLabel = plotArea.select(".yAxis").select(".yAxisLabel");
        if (yAxisLabel.empty()) {
            plotArea.select(".yAxis").append("text").attr("class", "yAxisLabel").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -25).attr("text-anchor", "end").text("Number of tasks");
        }

        var xAxisLabel = plotArea.select(".yAxis").select(".xAxisLabel");
        if (xAxisLabel.empty()) {
            plotArea.select(".yAxis").append("text").attr("class", "xAxisLabel").attr("fill", "#000").attr("x", width).attr("y", height + margin.bottom).attr("text-anchor", "end").text(property);
        }
    }

};

var cfD3Scatter = {

    make: function make(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var dimId = data.cfData.dataProperties.indexOf(data.xProperty);

        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea").attr("dimId", dimId);

        cfD3Scatter.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
        var margin = layout.margin === undefined ? marginDefault : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");

        var xProperty = data.xProperty;
        var yProperty = data.yProperty;
        var cProperty = data.cProperty;

        var dim = data.cfData.dataDims[dimId];
        var pointData = dim.top(Infinity);

        var xscale = d3.scaleLinear().range([0, width]).domain(d3.extent(pointData, function (d) {
            return d[xProperty];
        }));

        var xscale0 = d3.scaleLinear().range([0, width]).domain(d3.extent(pointData, function (d) {
            return d[xProperty];
        }));

        var yscale = d3.scaleLinear().range([height, 0]).domain(d3.extent(pointData, function (d) {
            return d[yProperty];
        }));

        var yscale0 = d3.scaleLinear().range([height, 0]).domain(d3.extent(pointData, function (d) {
            return d[yProperty];
        }));

        var colour = d3.scaleOrdinal(d3.schemeCategory20c);

        var plotArea = svg.select(".plotArea");

        var clip = svg.append("clipPath").attr("id", "clip").append("rect").attr("width", width).attr("height", height);

        var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        var points = plotArea.selectAll("circle").data(pointData);

        points.enter().append("circle").attr("r", 5).attr("cx", function (d) {
            return xscale(d[xProperty]);
        }).attr("cy", function (d) {
            return yscale(d[yProperty]);
        }).style("fill", function (d) {
            return colour(d[cProperty]);
        }).attr("clip-path", "url(#clip)").on("mouseover", tipOn).on("mouseout", tipOff);

        points.transition().attr("r", 5).attr("cx", function (d) {
            return xscale(d[xProperty]);
        }).attr("cy", function (d) {
            return yscale(d[yProperty]);
        }).style("fill", function (d) {
            return colour(d[cProperty]);
        });

        points.exit().remove();

        var xAxis = d3.axisBottom(xscale);
        var yAxis = d3.axisLeft(yscale);

        var gX = plotArea.select(".axis--x");
        if (gX.empty()) {
            gX = plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "axis--x").call(xAxis);
            gX.append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom - 2).attr("text-anchor", "end").text(xProperty);
        } else {
            gX.transition().call(xAxis);
        }

        var gY = plotArea.select(".axis--y");
        if (gY.empty()) {
            gY = plotArea.append("g").attr("class", "axis--y").call(yAxis);
            gY.append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -margin.left + 15).attr("text-anchor", "end").text(yProperty);
        } else {
            gY.transition().call(yAxis);
        }

        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll("circle").attr("cx", function (d) {
                return xscale(d[xProperty]);
            }).attr("cy", function (d) {
                return yscale(d[yProperty]);
            });
        }

        function tipOn() {
            plotArea.selectAll("circle").style("opacity", 0.2);
            d3.select(this).style("opacity", 1.0).attr("r", 7);
        }

        function tipOff() {
            plotArea.selectAll("circle").style("opacity", 1.0);
            d3.select(this).attr("r", 5);
        }
    }
};

var cfLeafletMapWithMarkers = {

    make: function make(element, data, layout) {

        cfLeafletMapWithMarkers.update(element, data, layout);
    },

    update: function update(element, data, layout) {

        //var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        //var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var width = container.node().offsetWidth,
            height = layout.height;

        container.select(".plotArea").remove();

        // always make a new map
        var mapDiv = container.append("div").attr("id", "mapnow").style("width", width + 'px').style("height", height + 'px').attr("class", "plotArea");

        var dimId = data.cfData.dataProperties.indexOf(data.property);

        var property = data.property;

        var dim = data.cfData.metaDims[dimId];
        var items = dim.top(Infinity);

        var map = L.map('mapnow');

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        var markers = [];
        items.forEach(function (item) {
            var marker = L.marker([item[property].lat, item[property].long]);
            if (item.label != undefined) {
                marker.bindPopup(item.label);
            }
            markers.push(marker);
        });

        var markerGroup = L.featureGroup(markers).addTo(map);
        map.fitBounds(markerGroup.getBounds().pad(0.5));
    }
};

function cfInit(metaData) {

   var cfData = {};

   //cfData.metaData = metaData;

   cfData.metaDataProperties = metaData.header.metaDataProperties;

   cfData.dataProperties = metaData.header.dataProperties;

   cfData.cf = crossfilter(metaData.data);

   cfData.metaDims = [];

   cfData.metaDataProperties.forEach(function (property, i) {

      cfData.metaDims.push(cfData.cf.dimension(function (d) {
         return d[property];
      }));
   });

   cfData.dataDims = [];

   cfData.dataProperties.forEach(function (property, i) {

      cfData.dataDims.push(cfData.cf.dimension(function (d) {
         return d[property];
      }));
   });

   cfData.filterSelected = [];

   cfData.histogramSelectedRanges = [];

   return cfData;
}

exports.threeSurf3d = threeSurf3d;
exports.threeMeshFromStruct = threeMeshFromStruct;
exports.d3ContourStruct2d = d3ContourStruct2d;
exports.d3LineSeries = d3LineSeries;
exports.d3Scatter = d3Scatter;
exports.cfD3BarChart = cfD3BarChart;
exports.cfD3Histogram = cfD3Histogram;
exports.cfD3Scatter = cfD3Scatter;
exports.cfLeafletMapWithMarkers = cfLeafletMapWithMarkers;
exports.render = render;
exports.update = update;
exports.makeNewPlot = makeNewPlot;
exports.updatePlot = updatePlot;
exports.cfInit = cfInit;
exports.cfUpdateFilters = cfUpdateFilters;
exports.makePlotsFromPlotRowCtrl = makePlotsFromPlotRowCtrl;
exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
exports.makeSessionHeader = makeSessionHeader;

return exports;

}({}));
