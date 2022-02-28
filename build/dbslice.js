(function (exports) {
    'use strict';

    class DbsliceData { }

    let dbsliceData = new DbsliceData();

    function makeNewPlot( plotData, index ) {

    	
    	let plotRowIndex = d3.select(this._parent).attr("plot-row-index");
    	console.log(plotRowIndex);

        var plot = d3.select( this )
        	.append( "div" ).attr( "class", "col-md-"+plotData.layout.colWidth+" plotWrapper" )
        	.append( "div" ).attr( "class", "card" );

        plot.append( "div" )
            .attr( "class", "card-header plotTitle")
            .style("padding","2px")
            .style("padding-left","5px")
        	.html( plotData.layout.title );

        var plotBody = plot.append( "div" )
        	.attr( "class", "plot")
        	.attr( "plot-row-index", plotRowIndex)
        	.attr( "plot-index", index);

        plotData.plotFunc.make(plotBody.node(),plotData.data,plotData.layout);

    }

    function updatePlot( plotData, index ) {

        var plot = d3.select( this ); // this is the plotBody selection

        //var plotHeader = plot.append( "div" ).attr( "class", "card-header plotTitle")
        //	 .html( `${plotData.layout.title}` );

        //var plotBody = plot.append( "div" ).attr( "class", "plot");

        plotData.plotFunc.update(plot.node(),plotData.data,plotData.layout);

    }

    function update( elementId, session ) {

    	var element = d3.select( "#" + elementId );

        if (dbsliceData.filteredTaskIds !== undefined){
            element.select(".filteredTaskCount")
                .html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>" );
        } else {
            element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
        }

        var plotRows = element.selectAll( ".plotRow" )
        	.data( session.plotRows ); 

        var newPlotRows = plotRows.enter()
        	.append( "div" ).attr( "class", "card bg-light plotRow" )
        	.attr( "style" , "margin-bottom:20px")
            .attr( "plot-row-index", function(d, i) { return i; } );


        newPlotRows	
        	.append( "div" ).attr( "class", "card-header plotRowTitle" )
        	.call( function(selection) {
        		selection.html( function(d) {
                    let html = "<h3 style='display:inline'>" + d.title + "</h3>";
                    if ( d.headerButton !== undefined ){
                        html += "<button class='btn btn-success float-right' id='" + d.headerButton.id + "'>" + d.headerButton.label +"</button>";
                    }
                    return html;
                });
            });

        var newPlotRowsBody = newPlotRows
        	.append( "div" ).attr( "class", "row no-gutters plotRowBody" )
            .attr ("plot-row-index", function(d, i) { return i; });

        newPlotRowsBody.selectAll( ".plot")
        	.data( function( d ) { return d.plots; } ) 
        	.enter().each( makeNewPlot );

        plotRows.selectAll( ".plotRowBody" ).selectAll( ".plot" )
    		.data( function( d ) { return d.plots; } )
    		.enter().each( makeNewPlot );

        plotRows.selectAll( ".plot" )
        	.data( function( d ) { return d.plots; } )
        	.each( updatePlot );

       	var plotRowPlotWrappers = plotRows.selectAll( ".plotWrapper")
       		.data( function( d ) { return d.plots; } )
       		.each( function( plotData, index ) {
       			var plotWrapper = d3.select (this);
       			plotWrapper.select(".plotTitle")
        	 	.html( plotData.layout.title );
       		});

        plotRows.exit().remove();
        plotRowPlotWrappers.exit().remove();



    }

    function makePlotsFromPlotRowCtrl( ctrl ) {

    	var plotPromises = [];

    	if ( ctrl.sliceIds === undefined ) {

    		var nTasks = ctrl.taskIds.length;

    		if ( ctrl.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.maxTasks );

    		for ( var index = 0; index < nTasks; ++index ) {

    			if ( ctrl.urlTemplate == null ) {

    				var url = ctrl.taskIds[ index ];

    			} else {

    				var url = ctrl.urlTemplate.replace( "${taskId}", ctrl.taskIds[ index ] );

    			}

    			var title = ctrl.taskLabels[ index ];

           		var plotPromise = makePromiseTaskPlot( ctrl, url, title, ctrl.taskIds[ index ] ); 

            	plotPromises.push( plotPromise );

            }

        } else {

        	ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

        		var plotPromise = makePromiseSlicePlot ( ctrl, sliceId, sliceIndex );

        		plotPromises.push( plotPromise );

        	});
        }

    	return Promise.all(plotPromises);

    }


    function makePromiseTaskPlot( ctrl, url, title, taskId ) { 

    	return fetch(url)

    	.then(function( response ) {

            if ( ctrl.csv === undefined ) {

                return response.json();

            }

            if ( ctrl.csv == true ) {

                return response.text() ;

            }

        })

        .then(function( responseJson ) {

            if ( ctrl.csv == true ) {

                responseJson = d3.csvParse( responseJson );

            }

        	var plot = {};

        	if (ctrl.formatDataFunc !== undefined) {

        		plot.data = ctrl.formatDataFunc( responseJson, taskId ); 

        	} else {

        		plot.data = responseJson;

            }

            plot.layout = Object.assign( {}, ctrl.layout );

            plot.plotFunc = ctrl.plotFunc;

            plot.layout.title = title;

            plot.layout.taskId = taskId;

            plot.data.newData = true;

            return plot;

        } );

    }

    function makePromiseSlicePlot( ctrl, sliceId, sliceIndex ) {

    	var slicePromisesPerPlot = [];
        var tasksOnPlot = [];

    	var nTasks = ctrl.taskIds.length;

    	if ( ctrl.maxTasks !== undefined ) Math.min( nTasks, ctrl.maxTasks );

    	for ( var index = 0; index < nTasks; ++index ) {

            tasksOnPlot.push( ctrl.taskIds[index] );

    		var url = ctrl.urlTemplate
    			.replace( "${taskId}", ctrl.taskIds[ index ] )
    			.replace( "${sliceId}", sliceId );

                //console.log(url);

    			var slicePromise = fetch(url).then( function( response ) {

    				if ( ctrl.csv === undefined ) {

                        return response.json();

                    }

                    if ( ctrl.csv == true ) {

                        return response.text() ;

                    }

    			});

    		slicePromisesPerPlot.push( slicePromise );

    	}

        // slicePromises.push( slicePromisesPerPlot );

        return Promise.all( slicePromisesPerPlot ).then( function ( responseJson ) {

            if ( ctrl.csv == true ) {

                var responseCsv = [];

                responseJson.forEach( function(d) {

                    responseCsv.push( d3.csvParse(d) );

                });

                responseJson = responseCsv;

            }

        	var plot = {};

        	if (ctrl.formatDataFunc !== undefined) {

        		plot.data = ctrl.formatDataFunc( responseJson, tasksOnPlot );

        	} else {

        		plot.data = responseJson;

        	}

        	plot.layout = Object.assign({}, ctrl.layout);

            plot.layout.title = sliceId;

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

            if (ctrl.layout.xAxisLabel !== undefined) {

                if ( Array.isArray(ctrl.layout.xAxisLabel) ) {

                    plot.layout.xAxisLabel = ctrl.layout.xAxisLabel[sliceIndex];

                }

            }

            if (ctrl.layout.yAxisLabel !== undefined) {

                if ( Array.isArray(ctrl.layout.yAxisLabel) ) {

                    plot.layout.yAxisLabel = ctrl.layout.yAxisLabel[sliceIndex];

                }

            }

            if (ctrl.layout.title !== undefined) {

                if ( Array.isArray(ctrl.layout.title) ) {

                    plot.layout.title = ctrl.layout.title[sliceIndex];

                }

            }

        	plot.plotFunc = ctrl.plotFunc;

        	plot.data.newData = true;

        	return plot;

        });

    }

    function refreshTasksInPlotRows() {

    	var plotRows = dbsliceData.session.plotRows;

    	var plotRowPromises = [];

    	plotRows.forEach( function( plotRow ) {

    		if (plotRow.ctrl !== undefined ) {

    			var ctrl = plotRow.ctrl;

    			if (ctrl.plotFunc !== undefined ) {

    				if ( ctrl.tasksByFilter ) {

    					ctrl.taskIds = dbsliceData.filteredTaskIds;
    					ctrl.taskLabels = dbsliceData.filteredTaskLabels;
    					
    				}

    				if ( ctrl.tasksByList ) {

    					ctrl.taskIds = dbsliceData.manualListTaskIds;

    				}

    				var plotRowPromise = makePlotsFromPlotRowCtrl( ctrl ).then( function ( plots ){
    					plotRow.plots = plots;
    				});

    				plotRowPromises.push( plotRowPromise );

    			}

    		}

    	});

    	Promise.all( plotRowPromises ).then( function() {

    		//console.log("rendering....");

    		render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );

    	});



    }

    function makeSessionHeader( element, title, subtitle, config ) {

    	element.append( "div" )
    		.attr( "class" , "row sessionHeader" )
    		.append( "div" )
    			.attr( "class" , "col-md-12 sessionTitle" );

    	var titleHtml = "<br/><h1 style='display:inline'>" + title + "</h1>";

    	if ( config.plotTasksButton ) {

    		titleHtml += "<button class='btn btn-success float-right' id='refreshTasks'>Plot Selected Tasks</button><br/>";

    	} else {
    		titleHtml += "<br/>";
    	} 

    	if ( subtitle === undefined ) {

    		titleHtml += "<br/>";

    	} else {

    		titleHtml += "<p>" + subtitle + "</p>";

    	}

    	element.select( ".sessionTitle" )
    		.html( titleHtml )
    		.append( "div" )
    			.attr( "class" , "filteredTaskCount" );	


    	$( "#refreshTasks" ).on( "click" , function() { refreshTasksInPlotRows(); } );

    }

    function render( elementId, session, config = { plotTasksButton : false } ) {

    	dbsliceData.session = session;
    	dbsliceData.elementId = elementId;
    	dbsliceData.config = config;

    	var element = d3.select( "#" + elementId );

    	var sessionHeader = element.select(".sessionHeader");

        if ( sessionHeader.empty() ) makeSessionHeader( element, session.title, session.subtitle, config );

    	update( elementId, session );

    }

    const threeSurf3d = {

    	make : function ( element, geometry, layout ) {

    		threeSurf3d.update ( element, geometry, layout );

    	},

    	update : function (element, geometry, layout ) {

    		var container = d3.select(element);

    		if ( layout.highlightTasks == true ) {

                if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                    container.style("outline-width","0px");
     
                } else {

                    container.style("outline-width","0px");

                    dbsliceData.highlightTasks.forEach( function (taskId) {

                    	console.log(layout.taskId);

                        if ( taskId == layout.taskId ) {
                        
                            container
                                .style("outline-style","solid")
                                .style("outline-color","red")
                                .style("outline-width","4px")
                                .style("outline-offset","4px")
                                .raise();

                        }

                    });
                }
            }

    		if (geometry.newData == false) {
                return
            }

            if (layout.vScale === undefined) {
            	var vScale = geometry.vScale;
            } else {
            	var vScale = layout.vScale;
            }


            var color = ( layout.colourMap === undefined ) ? d3.scaleSequential( d3.interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
            color.domain( vScale );

            geometry.faces.forEach(function(face, index) {
            	face.vertexColors[0] = new THREE.Color( color( geometry.faceValues[index][0] ) );
            	face.vertexColors[1] = new THREE.Color( color( geometry.faceValues[index][1] ) );
            	face.vertexColors[2] = new THREE.Color( color( geometry.faceValues[index][2] ) );
            });

    		container.select(".plotArea").remove();

            var div = container.append("div")
            	.attr("class", "plotArea")
            	.on( "mouseover", tipOn )
                .on( "mouseout", tipOff );


    		var width = container.node().offsetWidth,
    			height = layout.height;

    		// Compute normals for shading
    		geometry.computeFaceNormals();
    		geometry.computeVertexNormals();
        
    		// Use MeshPhongMaterial for a reflective surface
    		var material = new THREE.MeshPhongMaterial( {
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
    		scene.background = new THREE.Color( 0xefefef );
        
    		// Add Mesh to scene
    		scene.add( new THREE.Mesh( geometry, material ) );
        
    		// Create renderer
    		var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); 
    		renderer.setPixelRatio( window.devicePixelRatio );
    		renderer.setSize( width , height );

    		// Set target DIV for rendering
    		//var container = document.getElementById( elementId );
    		div.node().appendChild( renderer.domElement );

    		// Define the camera
    		var camera = new THREE.PerspectiveCamera( 60, 1, 0.1, 10 );
    		camera.position.z = 2; 

    		// Add controls 
    		var controls = new THREE.OrbitControls( camera, renderer.domElement );
    		controls.addEventListener( 'change', function(){
        		renderer.render(scene,camera); // re-render if controls move/zoom 
    		} ); 
    		controls.enableZoom = true; 
     

    		var ambientLight = new THREE.AmbientLight( 0xaaaaaa );
    		scene.add( ambientLight );

    		var lights = [];
    		lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 3 );
    		lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 3 );
    		lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 3 );
    		lights[ 3 ] = new THREE.PointLight( 0xffffff, 1, 3 );
    		lights[ 4 ] = new THREE.PointLight( 0xffffff, 1, 3 );
    		lights[ 5 ] = new THREE.PointLight( 0xffffff, 1, 3 );

    		lights[ 0 ].position.set( 0, 2, 0 );
    		lights[ 1 ].position.set( 1, 2, 1 );
    		lights[ 2 ].position.set( - 1, - 2, -1 );
    		lights[ 3 ].position.set( 0, 0, 2 );
    		lights[ 4 ].position.set( 0, 0, -2 );
    		lights[ 5 ].position.set( 0, -2, 0 );

    		lights.forEach(function(light){scene.add(light);});

      
    		// Make initial call to render scene
    		renderer.render( scene, camera );

    		function tipOn() {
                if ( layout.highlightTasks == true ) {
                    container
                        .style("outline-style","solid")
                        .style("outline-color","red")
                        .style("outline-width","4px")
                        .style("outline-offset","-4px")
                        .raise();
                    dbsliceData.highlightTasks = [layout.taskId];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

            function tipOff() {
                if ( layout.highlightTasks == true ) {
                    container.style("outline-width","0px");
                    dbsliceData.highlightTasks = [];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

    		geometry.newData = false;

    	}

    };

    function threeMeshFromStruct ( data ) {
    	var x, y, z, v, n, m;
       
        var xMinAll = d3.min( data.surfaces[0].x );
    	var yMinAll = d3.min( data.surfaces[0].y );
    	var zMinAll = d3.min( data.surfaces[0].z );
    	var vMinAll = d3.min( data.surfaces[0].v );


    	var xMaxAll = d3.max( data.surfaces[0].x );
    	var yMaxAll = d3.max( data.surfaces[0].y );
    	var zMaxAll = d3.max( data.surfaces[0].z );
    	var vMaxAll = d3.max( data.surfaces[0].v );

    	var nDataSets = data.surfaces.length;

    	for (var nds = 1; nds < nDataSets; ++nds ) {
    		xMinAll = ( d3.min( data.surfaces[nds].x ) < xMinAll ) ? d3.min( data.surfaces[nds].x ) : xMinAll;
    		yMinAll = ( d3.min( data.surfaces[nds].y ) < yMinAll ) ? d3.min( data.surfaces[nds].y ) : yMinAll;
    		zMinAll = ( d3.min( data.surfaces[nds].z ) < zMinAll ) ? d3.min( data.surfaces[nds].z ) : zMinAll;
    		vMinAll = ( d3.min( data.surfaces[nds].v ) < vMinAll ) ? d3.min( data.surfaces[nds].v ) : vMinAll;
    		xMaxAll = ( d3.max( data.surfaces[nds].x ) > xMaxAll ) ? d3.max( data.surfaces[nds].x ) : xMaxAll;
    		yMaxAll = ( d3.max( data.surfaces[nds].y ) > yMaxAll ) ? d3.max( data.surfaces[nds].y ) : yMaxAll;
    		zMaxAll = ( d3.max( data.surfaces[nds].z ) > zMaxAll ) ? d3.max( data.surfaces[nds].z ) : zMaxAll;
    	 	vMaxAll = ( d3.max( data.surfaces[nds].v ) > vMaxAll ) ? d3.max( data.surfaces[nds].v ) : vMaxAll;	
        }

    	var xrange = xMaxAll - xMinAll;
    	var yrange = yMaxAll - yMinAll;
    	var zrange = zMaxAll - zMinAll;

    	var xmid = 0.5 * ( xMinAll + xMaxAll );
    	var ymid = 0.5 * ( yMinAll + yMaxAll );
    	var zmid = 0.5 * ( zMinAll + zMaxAll );

    	var scalefac = 1./d3.max( [ xrange, yrange, zrange ] );

    	// Use d3 for color scale 
    	// vMinAll=0.4;
    	// vMaxAll=1.1;
    	// var color = d3.scaleLinear()
        //	.domain( [ vMinAll, vMaxAll ] )
        //	.interpolate(function() { return d3.interpolateRdBu; });
        
    	// Initialise threejs geometry
    	var geometry = new THREE.Geometry();
    	geometry.faceValues = []; 
    	geometry.vScale = [ vMinAll, vMaxAll ];

    	var noffset = 0;
    	for ( nds = 0; nds < nDataSets; ++nds ) {
    		x = data.surfaces[nds].x;
        	y = data.surfaces[nds].y;
        	z = data.surfaces[nds].z;
        	v = data.surfaces[nds].v;
        	m = data.surfaces[nds].size[0];
        	n = data.surfaces[nds].size[1];

        	var nverts = n * m;

        	// Add grid vertices to geometry
    		for (var k = 0; k < nverts; ++k) {
        		var newvert= new THREE.Vector3( ( x[k] - xmid) * scalefac, ( y[k] - ymid) * scalefac, (z[k] - zmid) * scalefac);
        		geometry.vertices.push(newvert);
    		}

    		// Add cell faces (2 traingles per cell) to geometry
    		for (var j = 0; j < m-1; j++){
        		for (var i = 0; i < n-1; i++){ 
            		var n0 = j*n + i;
            		var n1 = n0 + 1;
            		var n2 = (j+1)*n + i + 1;
            		var n3 = n2 - 1;
            		var face1 = new THREE.Face3( n0 + noffset, n1 + noffset, n2 + noffset );
            		var face2 = new THREE.Face3( n2 + noffset, n3 + noffset, n0 + noffset );
            		// face1.vertexColors[0] = new THREE.Color( color( v[n0] ) );
            		// face1.vertexColors[1] = new THREE.Color( color( v[n1] ) );
            		// face1.vertexColors[2] = new THREE.Color( color( v[n2] ) );
            		// face2.vertexColors[0] = new THREE.Color( color( v[n2] ) );
            		// face2.vertexColors[1] = new THREE.Color( color( v[n3] ) );
            		// face2.vertexColors[2] = new THREE.Color( color( v[n0] ) );
            		geometry.faces.push( face1 );
            		geometry.faces.push( face2 );
            		var faceValue1 = [];
            		var faceValue2 = [];
            		faceValue1.push( v[n0] );
            		faceValue1.push( v[n1] );
            		faceValue1.push( v[n2] );
            		faceValue2.push( v[n2] );
            		faceValue2.push( v[n3] );
            		faceValue2.push( v[n0] );
            		geometry.faceValues.push( faceValue1 );
            		geometry.faceValues.push( faceValue2 );
        		}
    		}
    		noffset = noffset + nverts;
    	}
        
        return geometry;

    }

    const d3ContourStruct2d = {

        make : function ( element, data, layout ) {

            d3ContourStruct2d.update ( element, data, layout );

        },

        update : function ( element, data, layout ) {

            var container = d3.select(element);

            if ( layout.highlightTasks == true ) {

                if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                    container.style("outline-width","0px");
     
                } else {

                    container.style("outline-width","0px");

                    dbsliceData.highlightTasks.forEach( function (taskId) {

                        if ( taskId == layout.taskId ) {
                        
                            container
                                .style("outline-style","solid")
                                .style("outline-color","red")
                                .style("outline-width","4px")
                                .style("outline-offset","-4px")
                                .raise();

                        }

                    });
                }
            }


            if (data.newData == false) {
                return
            }

            var x, y, v, n, m;

            var marginDefault = {top: 20, right: 65, bottom: 20, left: 10};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var svgWidth = container.node().offsetWidth,
    		    svgHeight = layout.height;

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            container.select("svg").remove();

            var svg = container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .on( "mouseover", tipOn )
                .on( "mouseout", tipOff );

            var plotArea = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .append("g")
                    .attr("class", "plotArea");

            var scaleMargin = { "left" : svgWidth - 60, "top" : margin.top};

            var scaleArea = svg.append("g")
                .attr("class", "scaleArea")
                .attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")");

            var xMinAll = d3.min( data.surfaces[0].x );
            var yMinAll = d3.min( data.surfaces[0].y );
            var vMinAll = d3.min( data.surfaces[0].v );

            var xMaxAll = d3.max( data.surfaces[0].x );
            var yMaxAll = d3.max( data.surfaces[0].y );
            var vMaxAll = d3.max( data.surfaces[0].v );

            var nDataSets = data.surfaces.length;

            for (var nds = 1; nds < nDataSets; ++nds ) {
                xMinAll = ( d3.min( data.surfaces[nds].x ) < xMinAll ) ? d3.min( data.surfaces[nds].x ) : xMinAll;
                yMinAll = ( d3.min( data.surfaces[nds].y ) < yMinAll ) ? d3.min( data.surfaces[nds].y ) : yMinAll;
                vMinAll = ( d3.min( data.surfaces[nds].v ) < vMinAll ) ? d3.min( data.surfaces[nds].v ) : vMinAll;
                xMaxAll = ( d3.max( data.surfaces[nds].x ) > xMaxAll ) ? d3.max( data.surfaces[nds].x ) : xMaxAll;
                yMaxAll = ( d3.max( data.surfaces[nds].y ) > yMaxAll ) ? d3.max( data.surfaces[nds].y ) : yMaxAll;
                vMaxAll = ( d3.max( data.surfaces[nds].v ) > vMaxAll ) ? d3.max( data.surfaces[nds].v ) : vMaxAll;
            }

            var xRange = xMaxAll - xMinAll;
            var yRange = yMaxAll - yMinAll;

            // set x and y scale to maintain 1:1 aspect ratio  
            var domainAspectRatio = yRange / xRange;
            var rangeAspectRatio = height / width;
      
            if (rangeAspectRatio > domainAspectRatio) {
                var xscale = d3.scaleLinear()
                    .domain( [ xMinAll , xMaxAll ] )
                    .range( [ 0 , width ] );
                var yscale = d3.scaleLinear()
                    .domain( [ yMinAll , yMaxAll ] )
                    .range( [ domainAspectRatio * width , 0 ] );
            } else {
                var xscale = d3.scaleLinear()
                    .domain( [ xMinAll , xMaxAll ] )
                    .range( [ 0 , height / domainAspectRatio ] );
                var yscale = d3.scaleLinear()
                    .domain( [ yMinAll , yMaxAll ] ) 
                    .range( [ height , 0 ] );
            }

            if (layout.vScale !== undefined) {
                vMinAll = layout.vScale[0];
                vMaxAll = layout.vScale[1];
            }

            // array of threshold values 
            var thresholds = d3.range( vMinAll , vMaxAll , ( vMaxAll - vMinAll ) / 21 );

            // colour scale 
            var colour = ( layout.colourMap === undefined ) ? d3.scaleSequential( d3.interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
            colour.domain(d3.extent(thresholds));

            var zoom = d3.zoom()
                .scaleExtent([0.5, Infinity])
                .on("zoom", zoomed);

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
                var projection = d3.geoTransform( {
                    point: function( px, py ) {
                        var xfrac, yfrac, xnow, ynow;
                        var xidx, yidx, idx0, idx1, idx2, idx3;
                        // remove the 0.5 offset that comes from d3-contour
                        px = px - 0.5;
                        py = py - 0.5;
                        // clamp to the limits of the xgrid and ygrid arrays (removes "bevelling" from outer perimeter of contours)
                        px < 0 ? px = 0 : px;
                        py < 0 ? py = 0 : py;
                        px > ( n - 1 ) ? px = n - 1 : px;
                        py > ( m - 1 ) ? py = m - 1 : py;
                        // xidx and yidx are the array indices of the "bottom left" corner
                        // of the cell in which the point (px,py) resides
                        xidx = Math.floor(px);
                        yidx = Math.floor(py); 
                        xidx == ( n - 1 ) ? xidx = n - 2 : xidx;
                        yidx == ( m - 1 ) ? yidx = m - 2 : yidx;
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
                        xnow = (1-xfrac)*(1-yfrac)*x[idx0] + xfrac*(1-yfrac)*x[idx1] + yfrac*(1-xfrac)*x[idx2] + xfrac*yfrac*x[idx3];
                        ynow = (1-xfrac)*(1-yfrac)*y[idx0] + xfrac*(1-yfrac)*y[idx1] + yfrac*(1-xfrac)*y[idx2] + xfrac*yfrac*y[idx3];
                        this.stream.point(xscale(xnow), yscale(ynow));
                    }
                });

                // initialise contours
                var contours = d3.contours()
                    .size([n, m])
                    .smooth(true)
                    .thresholds(thresholds);

                // make and project the contours
                plotArea.selectAll("path")
                    .data(contours(v))
                    .enter().append("path")
                        .attr("d", d3.geoPath(projection))
                        .attr("fill", function(d) { return colour(d.value); });        

            }

            // colour scale 
            var scaleHeight = svgHeight/2;
            var colourScale = ( layout.colourMap === undefined ) ? d3.scaleSequential( d3.interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
            colourScale.domain( [0, scaleHeight]);

            scaleArea.selectAll(".scaleBar")
                .data(d3.range(scaleHeight), function(d) { return d; })
                .enter().append("rect")
                    .attr("class", "scaleBar")
                    .attr("x", 0 )
                    .attr("y", function(d, i) { return scaleHeight - i; })
                    .attr("height", 1)
                    .attr("width", 20)
                    .style("fill", function(d, i ) { return colourScale(d); });

            var cscale = d3.scaleLinear()
                .domain( d3.extent(thresholds) )
                .range( [scaleHeight, 0]);

            var cAxis = d3.axisRight( cscale ).ticks(5);

            scaleArea.append("g")
                .attr("transform", "translate(20,0)")
                .call(cAxis);


            function zoomed() {
                var t = d3.event.transform;
                plotArea.attr( "transform", t );
            }

            function tipOn() {
                if ( layout.highlightTasks == true ) {
                    container
                        .style("outline-style","solid")
                        .style("outline-color","red")
                        .style("outline-width","4px")
                        .style("outline-offset","-4px")
                        .raise();
                    dbsliceData.highlightTasks = [layout.taskId];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

            function tipOff() {
                if ( layout.highlightTasks == true ) {
                    container.style("outline-width","0px");
                    dbsliceData.highlightTasks = [];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

            data.newData = false;
        }
    };

    const d3LineSeries = {

        make : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr( "class", "plotArea" );

            d3LineSeries.update( element, data, layout );

        },

        update : function ( element, data, layout ) {

            var container = d3.select(element);
            var svg = container.select("svg");
            var plotArea = svg.select(".plotArea");

            var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
            if ( layout.cSet !== undefined) colour.domain( layout.cSet );

            var lines = plotArea.selectAll(".line");

            if ( layout.highlightTasks == true ) {
                if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
                    lines
                        //.style( "opacity" , 1.0 )
                        .style( "stroke-width", "2.5px" )
                        .style( "stroke", function( d ) { return colour( d.cKey ); } );   
                } else {
                    lines
                        //.style( "opacity" , 0.2)
                        .style( "stroke-width", "2.5px" )
                        .style( "stroke", "#d3d3d3" ); 
                    dbsliceData.highlightTasks.forEach( function (taskId) {
                        lines.filter( (d,i) => d.taskId == taskId)
                            //.style( "opacity" , 1.0)
                            .style( "stroke", function( d ) { return colour( d.cKey ); } ) 
                            .style( "stroke-width", "4px" )
                            .each(function() {
                                this.parentNode.parentNode.appendChild(this.parentNode);
                            });
                    });
                }
            }

            if (data.newData == false) {
                return
            }

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            let plotRowIndex = container.attr("plot-row-index");
            let plotIndex = container.attr("plot-index");
            let clipId = "clip-"+plotRowIndex+"-"+plotIndex; 

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            var nseries = data.series.length;

            var xmin = d3.min( data.series[0].data, function(d) { return d.x; } );
            var xmax = d3.max( data.series[0].data, function(d) { return d.x; } );
            var ymin = d3.min( data.series[0].data, function(d) { return d.y; } );
            var ymax = d3.max( data.series[0].data, function(d) { return d.y; } );

            for (var n = 1; n < nseries; ++n) {
                var xminNow =  d3.min( data.series[n].data, function(d) { return d.x; } );
                ( xminNow < xmin ) ? xmin = xminNow : xmin = xmin;
                var xmaxNow =  d3.max( data.series[n].data, function(d) { return d.x; } );
                ( xmaxNow > xmax ) ? xmax = xmaxNow : xmax = xmax;
                var yminNow =  d3.min( data.series[n].data, function(d) { return d.y; } );
                ( yminNow < ymin ) ? ymin = yminNow : ymin = ymin;
                var ymaxNow =  d3.max( data.series[n].data, function(d) { return d.y; } );
                ( ymaxNow > ymax ) ? ymax = ymaxNow : ymax = ymax;
            }

            if ( layout.xRange === undefined ) {
                var xRange = [xmin, xmax];
            } else {
                var xRange = layout.xRange;
            }

            if ( layout.yRange === undefined ) {
                var yRange = [ymin, ymax];
            } else {
                var yRange = layout.yRange;
            }

            if ( layout.xscale == "time" ) {
                var xscale = d3.scaleTime(); 
                var xscale0 = d3.scaleTime();        
            } else {
                var xscale = d3.scaleLinear();
                var xscale0 = d3.scaleLinear();
            }

            xscale.range( [0, width] )
                  .domain( xRange );

            xscale0.range( [0, width] )
                  .domain( xRange );

            var yscale = d3.scaleLinear()
                .range( [height, 0] )
                .domain( yRange );

            var yscale0 = d3.scaleLinear()
                .range( [height, 0] )
                .domain( yRange );

            //var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
            //if ( layout.cSet !== undefined) colour.domain( layout.cSet );

            var line = d3.line()
                .x( function( d ) { return xscale( d.x ); } )
                .y( function( d ) { return yscale( d.y ); } );

            svg.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("width", width)
                    .attr("height", height);

            var zoom = d3.zoom()
               .scaleExtent([0.5, Infinity])
                .on("zoom", zoomed);

            svg.transition().call(zoom.transform, d3.zoomIdentity);
            svg.call(zoom);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function( d ) {
                    return "<span>"+d.label+"</span>";
            });

            svg.call(tip);

            var focus = plotArea.append("g")
                .style("display","none")
                .append("circle")
                    .attr("r",1);

            var allSeries = plotArea.selectAll( ".plotSeries" ).data( data.series );

            allSeries.enter()
                .each( function() {
                    var series = d3.select( this );
                    series.append( "g" )
                        .attr( "class", "plotSeries")
                        .attr( "series-name", function( d ) { return d.label; } )
                        .attr( "clip-path", "url(#"+clipId+")")
                        .append( "path" )
                            .attr( "class", "line" )
                            .attr( "d", function( d ) { return line( d.data ); } )
                            .style( "stroke", function( d ) { return colour( d.cKey ); } )    
                            .style( "fill", "none" )
                            .style( "stroke-width", "2.5px" )
                            //.attr( "clip-path", "url(#clip)")
                            .on( "mouseover", tipOn )
                            .on( "mouseout", tipOff );
            } );

            allSeries.each( function() {
                var series = d3.select( this );
                var seriesLine = series.select( "path.line" );
                seriesLine.transition()
                    .attr( "d", function( d ) { return line( d.data ); } )
                    .style( "stroke", function( d ) { return colour( d.cKey ); } )  ;
            } );

            allSeries.exit().remove();

            var xAxis = d3.axisBottom( xscale ).ticks(5);
            var yAxis = d3.axisLeft( yscale );

            var gX = plotArea.select(".axis--x");
            if ( gX.empty() ) {
                gX = plotArea.append("g")
                    .attr( "transform", "translate(0," + height + ")" )
                    .attr( "class", "axis--x")
                    .call( xAxis );
                gX.append("text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text(layout.xAxisLabel);
            } else {
                gX.transition().call( xAxis );
            }

            var gY = plotArea.select(".axis--y");
            if ( gY.empty() ) {
                gY = plotArea.append("g")
                    .attr( "class", "axis--y")
                    .call( yAxis );
                gY.append("text")
                        .attr("fill", "#000")
                        .attr("transform", "rotate(-90)")
                        .attr("x", 0)
                        .attr("y", -margin.left + 15)
                        .attr("text-anchor", "end")
                        .text(layout.yAxisLabel);
            } else {
                gY.transition().call( yAxis );
            }

            function zoomed() {
                var t = d3.event.transform;
                xscale.domain(t.rescaleX(xscale0).domain());
                yscale.domain(t.rescaleY(yscale0).domain());
                gX.call(xAxis);
                gY.call(yAxis);
                plotArea.selectAll(".line").attr( "d", function( d ) { return line( d.data ); } );
            }

            function tipOn( d ) {
                lines.style( "opacity" , 0.2);
                d3.select(this)
                    .style( "opacity" , 1.0)
                    .style( "stroke-width", "4px" );
                focus
                    .attr( "cx" , d3.mouse(this)[0] )
                    .attr( "cy" , d3.mouse(this)[1] );
                tip.show( d , focus.node() );
                if ( layout.highlightTasks == true ) {
                    dbsliceData.highlightTasks = [ d.taskId ];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

            function tipOff() {
                lines.style( "opacity" , 1.0);
                d3.select(this)
                    .style( "stroke-width", "2.5px" );
                tip.hide();
                if ( layout.highlightTasks == true ) {
                    dbsliceData.highlightTasks = [];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

            data.newData = false;
        }
    };

    const d3Scatter = {

        make : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr( "class", "plotArea" );

            d3Scatter.update (element, data, layout);

        },

        update : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svg = container.select("svg");

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            var xscale = d3.scaleLinear()
                .range( [0, width] )
                .domain( d3.extent( data.points, function (d) { return d.x; } ) );
            var yscale = d3.scaleLinear()
                .range( [height, 0] )
                .domain( d3.extent( data.points, function (d) { return d.y; } ) );

            var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );

            var plotArea = svg.select(".plotArea");

            var points = plotArea.selectAll( "circle" )
                .data( data.points );

            points.enter()
                .append( "circle" )
                .attr( "r", 5 )
                .attr( "cx", function( d ) { return xscale( d.x ); } )
                .attr( "cy", function( d ) { return yscale( d.y ); } )
                .style( "fill", function( d ) { return colour( d.colField ); } );
                //.style( "fill-opacity", 1e-6)
                //.transition()
                //    .style( "fill-opacity", 1);

            points.transition()
                //.duration(5000)
                .attr( "r", 5 )
                .attr( "cx", function( d ) { return xscale( d.x ); } )
                .attr( "cy", function( d ) { return yscale( d.y ); } )
                .style( "fill", function( d ) { return colour( d.colField ); } ); 

            points.exit().remove();

            var xAxis = plotArea.select(".xAxis");
            if ( xAxis.empty() ) {
                plotArea.append("g")
                    .attr( "transform", "translate(0," + height + ")" )
                    .attr( "class", "xAxis")
                    .call( d3.axisBottom( xscale ) )
                    .append("text")
                        .attr("fill", "#000")
                        .attr("x", width)
                        .attr("y", margin.bottom)
                        .attr("text-anchor", "end")
                        .text(layout.xAxisLabel);
            } else {
                xAxis.attr( "transform", "translate(0," + height + ")" ).transition().call( d3.axisBottom( xscale ) );
            }

            var yAxis = plotArea.select(".yAxis");
            if ( yAxis.empty() ) {
                plotArea.append("g")
                    .attr( "class", "yAxis")
                    .call( d3.axisLeft( yscale ) )
                    .append("text")
                        .attr("fill", "#000")
                        .attr("transform", "rotate(-90)")
                        .attr("x", 0)
                        .attr("y", -margin.left + 15)
                        .attr("text-anchor", "end")
                        .text(layout.yAxisLabel);
            } else {
                yAxis.transition().call( d3.axisLeft( yscale ) );
            }

        }

    };

    function cfUpdateFilters( crossfilter ) {

    	// update crossfilter with the filters selected at the bar charts
        crossfilter.filterSelected.forEach( ( filters, i ) => {

          // if the filters array is empty: ie. all are selected, then reset the dimension
          if ( filters.length === 0 ) {
            //reset filter
            crossfilter.metaDims[ i ].filterAll();
          } else {
            crossfilter.metaDims[ i ].filter( ( d ) => filters.indexOf( d ) > -1 );
          }
        } );

        // update crossfilter with the items selected at the histograms
        crossfilter.histogramSelectedRanges.forEach( ( selectedRange, i ) => {
          // first reset all filters
          crossfilter.dataDims[ i ].filterAll();
          if ( selectedRange.length !== 0 ) {
            crossfilter.dataDims[ i ].filter( d => d >= selectedRange[ 0 ] && d <= selectedRange[ 1 ] ? true : false );
          }
        } );


        var currentMetaData = crossfilter.metaDims[0].top(Infinity);


        dbsliceData.filteredTaskIds = currentMetaData.map(function(d){return d.taskId});

        if ( currentMetaData[0].label !== undefined ) {

            dbsliceData.filteredTaskLabels = currentMetaData.map(function(d){return d.label});

        } else {

            dbsliceData.filteredTaskLabels = currentMetaData.map(function(d){return d.taskId});
        }


        //render( dbsliceData.elementId , dbsliceData.session , dbsliceData.config );

    }

    const cfD3BarChart = {

        make : function( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            var dimId = data.cfData.metaDataProperties.indexOf( data.property );

            container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr( "class", "plotArea" )
                    .attr( "dimId", dimId);

            cfD3BarChart.update( element, data, layout );

        }, 

        update : function ( element, data, layout ) {
         
            var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svg = container.select("svg");

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            var plotArea = svg.select(".plotArea");
            var dimId = plotArea.attr("dimId");
            var dim = data.cfData.metaDims[ dimId ];

            var bars = plotArea.selectAll("rect");

            if ( layout.highlightTasks == true ) {

                if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                    bars.style( "stroke-width", "0px" );
                          
                } else {

                    bars
                        .style( "stroke-width", "0px" )
                        .style( "stroke", "red" ); 
                    dbsliceData.highlightTasks.forEach( function (taskId) {
                    	let keyNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][data.property];
                    	bars.filter( (d,i) => d.key == keyNow)
                            .style( "stroke-width", "4px" );
                    });

                }

            } 

            data.cfData.cf;
            var property = data.property;

            //var dim = data.cfData.metaDims[ dimId ];
            var group = dim.group();
            
            //var items = group.top( Infinity );
            var items = group.all();

            var removeZeroBar = ( layout.removeZeroBar === undefined ) ? false : layout.removeZeroBar;
            if ( removeZeroBar ) items = items.filter( item => item.value > 0);

            var x = d3.scaleLinear()
                .range( [0, width] )
                .domain( [ 0, d3.max( items, v => v.value ) ] );

            var y = d3.scaleBand()
                .range( [0, height] )
                .domain(items.map(function(d){ return d.key; }))
                .padding( [0.2] )
                .align([0.5]);

            var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal().range( ["cornflowerblue"] ) : d3.scaleOrdinal( layout.colourMap );
            colour.domain( data.cfData.metaDataUniqueValues[ property ] );

            bars = plotArea.selectAll( "rect" )
                .data( items, v => v.key );

            bars.enter()
                .append( "rect" )
                .on( "click", ( selectedItem ) => {

                    if ( data.cfData.filterSelected[ dimId ] === undefined ) {
                         data.cfData.filterSelected[ dimId ] = [];
                    }

                    // check if current filter is already active
                    if ( data.cfData.filterSelected[ dimId ].indexOf( selectedItem.key ) !== -1 ) {

                        // already active
                        var ind = data.cfData.filterSelected[ dimId ].indexOf( selectedItem.key );
                        data.cfData.filterSelected[ dimId ].splice( ind, 1 );

                    } else {

                        data.cfData.filterSelected[ dimId ].push( selectedItem.key );

                    }

                    cfUpdateFilters(data.cfData);
                    render( dbsliceData.elementId , dbsliceData.session , dbsliceData.config );

                })
                .attr( "height", y.bandwidth() )
                .attr( "y", v => y(v.key) )
                .style( "fill", v => colour(v.key) )
                .transition()
                    .attr( "width", v => x( v.value ) )
                    // initialise opacity for later transition
                    .attr( "opacity", 1 );

            // updating the bar chart bars
            bars.transition()
                .attr( "width", v => x( v.value ) )
                .attr( "y", v => y(v.key) )
                .attr( "height", y.bandwidth() )
                // change colour depending on whether the bar has been selected
                .attr( "opacity", ( v ) => {

                    // if no filters then all are selected
                    if ( data.cfData.filterSelected[ dimId ] === undefined || data.cfData.filterSelected[ dimId ].length === 0 ) {

                        return 1;

                    } else {

                        return data.cfData.filterSelected[ dimId ].indexOf( v.key ) === -1 ? 0.2 : 1;

                    }

                } );

            bars.exit().transition()
                .attr( "width", 0)
                .remove();

            var xAxis = plotArea.select(".xAxis");
            if ( xAxis.empty() ) {
                plotArea.append("g")
                    .attr( "transform", "translate(0," + height + ")" )
                    .attr( "class", "xAxis")
                    .call( d3.axisBottom( x ) )
                    .append("text")
                        .attr("fill", "#000")
                        .attr("x", width)
                        .attr("y", margin.bottom-2)
                        .attr("text-anchor", "end")
                        .text("Number of Cases");
            } else {
                xAxis.attr( "transform", "translate(0," + height + ")" ).transition().call( d3.axisBottom( x ) );
            }

            var yAxis = plotArea.select(".yAxis");
            if ( yAxis.empty() ) {
                plotArea.append("g")
                    .attr( "class", "yAxis")
                    .call( d3.axisLeft( y ).tickValues( [] ) );
            } else {
                yAxis.transition().call( d3.axisLeft( y ).tickValues( []) );
            }

            var keyLabels = plotArea.selectAll( ".keyLabel" )
                .data( items, v => v.key );

            keyLabels.enter()
                .append( "text" )
                .attr( "class", "keyLabel" )
                .attr( "x", 0 )
                .attr( "y", v => y(v.key) + 0.5*y.bandwidth() )
                .attr( "dx", 5 )
                .attr( "dy", ".35em" )
                .attr( "text-anchor", "start" )
                .text( v => v.key );

            // updating meta Labels
            keyLabels.transition()
                 .attr( "y", v => y(v.key) + 0.5*y.bandwidth() )
                 .text( v => v.key );

            keyLabels.exit()
                .remove();

        }
    };

    const cfD3Histogram = {

        make : function( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            var dimId = data.cfData.dataProperties.indexOf( data.property );

            var svg = container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight);

            var plotArea = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" )
                .attr( "dimId", dimId);

            var dim = data.cfData.dataDims[ dimId ];       
            var items = dim.top( Infinity );

            var xDomMax = d3.max( items, d => d[ data.property ] ) * 1.03; 
            plotArea.attr( "xDomMax", xDomMax);

            var xDomMin = d3.min( items, d => d[ data.property ] ) * 0.97;
            plotArea.attr( "xDomMin", xDomMin);

            var x = d3.scaleLinear()
                .domain( [ xDomMin, xDomMax ] )
                .rangeRound( [ 0, width ] );

            plotArea.append( "g" )
                .attr( "class", "xAxis")
                .attr( "transform", "translate(0," + height + ")" )
                .call( d3.axisBottom( x ) );


            var brush = d3.brushX()
                .extent( [
                    [ 0, 0 ],
                    [ width, height ]
                ] )
                .on( "start brush end", brushmoved );

            var gBrush = svg.append( "g" )
                .attr( "transform", "translate(" + margin.left + "," + margin.top + ")" )
                .attr( "class", "brush" )
                .call( brush );


            // style brush resize handle
            // https://github.com/crossfilter/crossfilter/blob/gh-pages/index.html#L466
            function brushResizePath( d ) {
                var e = +( d.type == "e" ),
                    x = e ? 1 : -1,
                    y = height / 2;
                return "M" + ( .5 * x ) + "," + y + "A6,6 0 0 " + e + " " + ( 6.5 * x ) + "," + ( y + 6 ) + "V" + ( 2 * y - 6 ) + "A6,6 0 0 " + e + " " + ( .5 * x ) + "," + ( 2 * y ) + "Z" + "M" + ( 2.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 ) + "M" + ( 4.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 );
            }

            var handle = gBrush.selectAll( "handleCustom" )
                .data( [ { type: "w" } , { type: "e" } ] )
                .enter().append( "path" )
                    .attr( "class", "handleCustom" )
                    .attr( "stroke", "#000" )
                    .attr( "cursor", "ewResize" )
                    .attr( "d", brushResizePath );


            var brushInit = true;
            gBrush.call( brush.move, x.domain().map( x ) );
            brushInit = false;


            function brushmoved() {
                var s = d3.event.selection;
                if ( s == null ) {
                    handle.attr( "display", "none" );
                    data.cfData.histogramSelectedRanges[ dimId ] = [];
                    cfUpdateFilters(data.cfData);
                    if ( brushInit == false ) render( dbsliceData.elementId , dbsliceData.session , dbsliceData.config );
                } else {
                    var sx = s.map( x.invert );
                    handle.attr( "display", null ).attr( "transform", function( d, i ) {
                        return "translate(" + [ s[ i ], -height / 4 ] + ")";
                    } );
                    data.cfData.histogramSelectedRanges[ dimId ] = sx;
                    cfUpdateFilters(data.cfData);
                    if ( brushInit == false ) render( dbsliceData.elementId , dbsliceData.session , dbsliceData.config );
                }
            }


            cfD3Histogram.update( element, data, layout );

        }, 

        update : function ( element, data, layout ) {
         
            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svg = container.select("svg");

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            var plotArea = svg.select(".plotArea");
            var dimId = plotArea.attr("dimId");
            var dim = data.cfData.dataDims[ dimId ];
            data.cfData.cf;
            var property = data.property;

            var bars = plotArea.selectAll("rect");

            if ( layout.highlightTasks == true ) {

                if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                    bars.style( "stroke-width", "0px" );
                          
                } else {

                    bars
                        .style( "stroke-width", "0px" )
                        .style( "stroke", "red" ); 
                    dbsliceData.highlightTasks.forEach( function (taskId) {
                        let valueNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][data.property];
                        bars.filter( (d,i) => (d.x0 <= valueNow && d.x1 > valueNow) )
                            .style( "stroke-width", "4px" );
                    });

                }

            } 

            d3.format( ",.0f" );

            var items = dim.top( Infinity );

            var xDomMax = plotArea.attr("xDomMax");
            var xDomMin = plotArea.attr("xDomMin");

            if ( layout.reBin == true ) {

                xDomMax = d3.max( items, d => d[ data.property ] ) * 1.03; 
                xDomMin = d3.min( items, d => d[ data.property ] ) * 0.97;
            
            }

            var x = d3.scaleLinear()
                .domain( [ xDomMin, xDomMax] )
                .rangeRound( [ 0, width ] );

            var histogram = d3.histogram()
                .value( d => d[ property ] )
                .domain( x.domain() )
                .thresholds( x.ticks( 20 ) );

            var bins = histogram( items );

            var y = d3.scaleLinear()
                .domain( [ 0, d3.max( bins, d => d.length ) ] )
                .range( [ height, 0 ] );

            bars = plotArea.selectAll( "rect" )
                .data( bins );

            var colour = ( layout.colour === undefined ) ? "cornflowerblue" : layout.colour;

            bars.enter()
                .append( "rect" )
                    .attr( "transform", d => "translate(" + x( d.x0 ) + "," + y( d.length ) + ")" )
                    .attr( "x", 1 )
                    .attr( "width", d => x(d.x1)-x(d.x0)-1 )
                    .attr( "height", d => height - y( d.length ) )
                    .style( "fill", colour )
                    .attr( "opacity", "1" );

            bars.transition()
                .attr( "transform", d => "translate(" + x( d.x0 ) + "," + y( d.length ) + ")" )
                .attr( "x", 1 )
                .attr( "width", d => x(d.x1)-x(d.x0)-1 )
                .attr( "height", d => height - y( d.length ) );

            bars.exit().remove();

            var yAxis = plotArea.select(".yAxis");
            if ( yAxis.empty() ) {
                plotArea.append("g")
                    .attr( "class", "yAxis")
                    .call( d3.axisLeft( y ) );
            } else {
                yAxis.transition().call( d3.axisLeft( y ) );
            }

            if ( layout.reBin == true ) {
                var xAxis = plotArea.select(".xAxis");
                if ( xAxis.empty() ) {
                    plotArea.append("g")
                        .attr( "class", "xAxis")
                        .attr( "transform", "translate(0," + height + ")" )
                        .call( d3.axisBottom( x ) );
                } else {
                    xAxis.transition().call( d3.axisBottom( x ) );
                }
            }


            var yAxisLabel = plotArea.select(".yAxis").select(".yAxisLabel");
            if ( yAxisLabel.empty() ) {
                 plotArea.select(".yAxis").append("text")
                    .attr("class", "yAxisLabel")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -25)
                    .attr("text-anchor", "end")
                    .text("Number of tasks");
                }

            var xAxisLabel = plotArea.select(".yAxis").select(".xAxisLabel");
            if ( xAxisLabel.empty() ) {
                plotArea.select(".yAxis").append("text")
                    .attr("class", "xAxisLabel")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", height+margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text(property);
            }

             


        }

    };

    const cfD3Scatter = {

        make : function( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            var dimId = data.cfData.dataProperties.indexOf( data.xProperty );

            container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr( "class", "plotArea" )
                    .attr( "dimId", dimId);

            cfD3Scatter.update( element, data, layout );

        }, 

        update : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            let plotRowIndex = container.attr("plot-row-index");
            let plotIndex = container.attr("plot-index");
            let clipId = "clip-"+plotRowIndex+"-"+plotIndex;

            var svg = container.select("svg");

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            var plotArea = svg.select(".plotArea");
            var dimId = plotArea.attr("dimId");

            data.cfData.cf;
            var xProperty = data.xProperty;
            var yProperty = data.yProperty;
            var cProperty = data.cProperty;

            var dim = data.cfData.dataDims[ dimId ];
            var pointData = dim.top( Infinity );

            if ( layout.xRange === undefined) {
                var xMin = d3.min( pointData, function (d) { return d[ xProperty ]; } );
                var xMax = d3.max( pointData, function (d) { return d[ xProperty ]; } );
                var xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                var xRange = [xMin, xMax];
            } else {
                var xRange = layout.xRange;
            }

            if ( layout.yRange === undefined) {
                var yMin = d3.min( pointData, function (d) { return d[ yProperty ]; } );
                var yMax = d3.max( pointData, function (d) { return d[ yProperty ]; } );
                var yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                var yRange = [yMin, yMax];
            } else {
                var yRange = layout.yRange;
            }

            var xscale = d3.scaleLinear()
                .range( [0, width] )
                .domain( xRange );

            var xscale0 = d3.scaleLinear()
                .range( [0, width] )
                .domain( xRange );

            var yscale = d3.scaleLinear()
                .range( [height, 0] )
                .domain( yRange );

            var yscale0 = d3.scaleLinear()
                .range( [height, 0] )
                .domain( yRange );

            var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
            colour.domain( data.cfData.metaDataUniqueValues[ cProperty ] );

            var opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

            var plotArea = svg.select(".plotArea");

            svg.append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("width", width)
                    .attr("height", height);

            var zoom = d3.zoom()
                .scaleExtent([0.01, Infinity])
                .on("zoom", zoomed);

            svg.transition().call(zoom.transform, d3.zoomIdentity);
            svg.call(zoom);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function( d ) {
                    return "<span>"+d.label+"</span>";
            });

            svg.call(tip);

            var points = plotArea.selectAll( "circle" )
                .data( pointData );

            points.enter()
                .append( "circle" )
                .attr( "r", 5 )
                .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
                .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
                .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
                .style( "opacity", opacity )
                .attr( "clip-path", "url(#"+clipId+")")
                .attr( "task-id", function( d ) { return d.taskId; } )
                .on( "mouseover", tipOn )
                .on( "mouseout", tipOff );
     
            points
                .attr( "r", 5 )
                .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
                .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
                .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
                .attr( "task-id", function( d ) { return d.taskId; } );

            points.exit().remove();

            var xAxis = d3.axisBottom( xscale );
            var yAxis = d3.axisLeft( yscale );

            var gX = plotArea.select(".axis--x");
            if ( gX.empty() ) {
                gX = plotArea.append("g")
                    .attr( "transform", "translate(0," + height + ")" )
                    .attr( "class", "axis--x")
                    .call( xAxis );
                gX.append("text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text(xProperty);
            } else {
                gX.transition().call( xAxis );
            }

            var gY = plotArea.select(".axis--y");
            if ( gY.empty() ) {
                gY = plotArea.append("g")
                    .attr( "class", "axis--y")
                    .call( yAxis );
                gY.append("text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -margin.left + 15)
                    .attr("text-anchor", "end")
                    .text(yProperty);
            } else {
                gY.transition().call( yAxis );
            }


            if ( layout.highlightTasks == true ) {
                if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
                    points
                        .style( "opacity" , opacity )
                        .style( "stroke-width", "0px")
                        .style( "fill", function( d ) { return colour( d[ cProperty ] ); } );
                } else {
                    //points.style( "opacity" , 0.2);
                    points.style( "fill" , "#d3d3d3");
                    dbsliceData.highlightTasks.forEach( function (taskId) {
                        points.filter( (d,i) => d.taskId == taskId)
                            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
                            .style( "opacity" , opacity)
                            .style( "stroke", "red")
                            .style( "stroke-width", "2px")
                            .raise();
                    });
                }
            }


            function zoomed() {
                var t = d3.event.transform;
                xscale.domain(t.rescaleX(xscale0).domain());
                yscale.domain(t.rescaleY(yscale0).domain());
                gX.call(xAxis);
                gY.call(yAxis);
                plotArea.selectAll("circle")
                    .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
                    .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } );
            }

            function tipOn( d ) {
                console.log("mouse on");
                points.style( "opacity" , 0.2);
                //points.style( "fill" , "#d3d3d3");
                d3.select(this)
                    .style( "opacity" , 1.0)
                    .attr( "r", 7 );
                tip.show( d );
                if ( layout.highlightTasks == true ) {
                    dbsliceData.highlightTasks = [ d.taskId ];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }

            function tipOff() {
                points.style( "opacity" , opacity );
                d3.select(this)
                    .attr( "r", 5 );
                tip.hide();
                if ( layout.highlightTasks == true ) {
                    dbsliceData.highlightTasks = [];
                    render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
                }
            }
        }
    };

    const cfLeafletMapWithMarkers = {

        make : function( element, data, layout ) {

            cfLeafletMapWithMarkers.update( element, data, layout );

        }, 

        update : function ( element, data, layout ) {
         
            //var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
            //var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var width = container.node().offsetWidth,
                height = layout.height;

            container.select(".plotArea").remove();

            // always make a new map
            container.append("div")
                .attr("id", "mapnow")
                .style("width", width+'px')
                .style("height", height+'px')
                .attr("class", "plotArea");

            var dimId = data.cfData.dataProperties.indexOf( data.property );

            data.cfData.cf;
            var property = data.property;

            var dim = data.cfData.metaDims[ dimId ];
            var items = dim.top( Infinity );

            var map = L.map('mapnow');

            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var markers=[];
            items.forEach( function (item) {
                var marker = L.marker([ item[ property ].lat, item[ property ].long ]);
                if (item.label != undefined) {
                    marker.bindPopup( item.label );
                }
                markers.push(marker);
            });

            var markerGroup = L.featureGroup(markers).addTo(map);
            map.fitBounds(markerGroup.getBounds().pad(0.5));

     

        }
    };

    const cfAddPlot = {

        make : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr( "class", "plotArea" );

            cfAddPlot.update (element, data, layout);

        },

        update : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svg = container.select("svg");

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            svg.select(".plotArea");

            container.append("input")
                .attr("type" ,"button")
                .attr("class", "btn btn-success")
                .attr("type", "button")
                .attr("value", "test button");


        }

    };

    function cfInit( metaData ) {

    	var cfData = {};

    	cfData.metaDataProperties = metaData.header.metaDataProperties;

    	cfData.dataProperties = metaData.header.dataProperties;

        cfData.cf = crossfilter( metaData.data );

        cfData.metaDims = [];

        cfData.metaDataUniqueValues = {};

        cfData.metaDataProperties.forEach( ( property, i ) => {

        	cfData.metaDims.push( cfData.cf.dimension( d => d[ property ] ) );

            cfData.metaDataUniqueValues[property] = Array.from( new Set(metaData.data.map( d => d[property]) ) );

        } );

        cfData.metaDims.forEach( dim => dim.filterAll() );

        cfData.dataDims = [];

        cfData.dataProperties.forEach( ( property, i ) => {

        	cfData.dataDims.push ( cfData.cf.dimension( d => d[ property ] ) );

        } );

        cfData.dataDims.forEach( dim => dim.filterAll() );

        cfData.filterSelected = [];

        cfData.histogramSelectedRanges = [];

        var taskIds = [];

        metaData.data.forEach( ( task, i ) => {

            taskIds.push( task.taskId );

        });

        dbsliceData.filteredTaskIds = taskIds;

        return cfData;

    }

    function getFilteredTaskIds() {

    	return dbsliceData.filteredTaskIds;

    }

    function getFilteredTaskLabels() {

    	return dbsliceData.filteredTaskLabels;

    }

    const triMesh2dRender = {

    	make : function ( element, data, layout ) {

    		const container = d3.select(element);

            const width = container.node().offsetWidth;
            const height = width; // force square plots for now

            container.append("canvas")
                .attr("width", width)
                .attr("height", height)
                .style("width", width+"px")
                .style("height", height+"px");

            container.append("svg")
        		.attr("class","svg-overlay")
        		.style("position","absolute")
        		.style("z-index",2)
        		.style("top","0px")
        		.style("left","0px")
        		.attr("width", width)
        		.attr("height", height);
      
    		triMesh2dRender.update ( element, data, layout );

    	},

    	update : function (element, data, layout ) {

    		const container = d3.select(element);
    		const width = container.node().offsetWidth;
            const height = width; // force square plots for now

    		const canvas = container.select("canvas");

    		const gl = canvas.node().getContext("webgl", {antialias: true, depth: false});
    		twgl.addExtensionsToContext(gl);
    		const programInfo = twgl.createProgramInfo(gl, [triMesh2dRender.vertShader, triMesh2dRender.fragShader]);

    		const tm = data.triMesh;

    		const nTris = tm.indices.length/3;

    		let values, vertices;

    		const nVerts = ( data.nVerts === undefined ) ? tm.values.length : data.nVerts;

    		if ( layout.highlightTasks == true ) {
       
                if (!Array.isArray(dbsliceData.highlightTasks)) {

                	values = new Float32Array(tm.values.buffer,0,nVerts);
                	vertices = new Float32Array(tm.vertices.buffer,0,2*nVerts);
                
                } else if (dbsliceData.highlightTasks.length != 0) {
         
         			let taskId = dbsliceData.highlightTasks[0];
         			let nOffset;

         			if ( data.taskIdMap === undefined) {

         				nOffset = taskId;

         			} else {

         				nOffset = data.taskIdMap[taskId];

         			}

                	values = new Float32Array(tm.values.buffer,4*nOffset*nVerts,nVerts);

                	if ( layout.updateVertices ) {

                		vertices = new Float32Array(tm.vertices.buffer,4*2*nOffset*nVerts,2*nVerts);

                	} else {

                		vertices = tm.vertices;

                	}

                	
                } else {

                	return;
                }

            }

    		const arrays = {
         		a_position: {numComponents: 2, data: vertices},
         		a_val: {numComponents: 1, data: values},
         		indices: {numComponents: 3, data: tm.indices}
      		};
      		const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      		const viewDefault = {xMin: -1., xMax: 1., yMin: -1., yMax: 1};
      		const view = ( layout.view === undefined ) ? viewDefault : layout.view;
      
      		const vScaleDefault = [0.,1.];
      		const vScale = ( layout.vScale === undefined ) ? vScaleDefault : layout.vScale;

      		const projectionMatrix = glMatrix.mat4.create();
      		glMatrix.mat4.ortho(projectionMatrix, view.xMin, view.xMax, view.yMin, view.yMax, 0, 1.);
      		
      		const cmap = new Uint8Array([158, 1, 66, 255, 185, 31, 72, 255, 209, 60, 75, 255, 228, 86, 73, 255, 240, 112, 74, 255, 248, 142, 83, 255, 252, 172, 99, 255, 253, 198, 118, 255, 254, 221, 141, 255, 254, 238, 163, 255, 251, 248, 176, 255, 241, 249, 171, 255, 224, 243, 160, 255, 200, 233, 159, 255, 169, 220, 162, 255, 137, 207, 165, 255, 105, 189, 169, 255, 78, 164, 176, 255, 66, 136, 181, 255, 74, 108, 174, 255, 94, 79, 162, 255]); //spectral
      		const cmapTex = twgl.createTexture(gl, {mag: gl.LINEAR, min:gl.LINEAR, src: cmap, width:21, height:1} );
      		const uniforms = {u_matrix: projectionMatrix, u_cmap: cmapTex, u_cmin: vScale[0], u_cmax:vScale[1]};
      
      		gl.useProgram(programInfo.program);
      		twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      		twgl.setUniforms(programInfo, uniforms);
      		gl.drawElements(gl.TRIANGLES, nTris*3, gl.UNSIGNED_INT, 0);

      		const overlay = container.select(".svg-overlay");
      		const scaleMargin = { "left" : width - 50, "top" : height/2 - 50};
      		overlay.select(".scaleArea").remove();
      		const scaleArea = overlay.append("g")
        		.attr("class","scaleArea")
        		.attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")");

        	let scaleHeight = 100;
        	let colourScale = d3.scaleSequential( d3.interpolateSpectral );
            colourScale.domain( [0, scaleHeight]);
            scaleArea.selectAll(".scaleBar")
                .data(d3.range(scaleHeight), function(d) { return d; })
                .enter().append("rect")
                    .attr("class", "scaleBar")
                    .attr("x", 0 )
                    .attr("y", function(d, i) { return scaleHeight - i; })
                    .attr("height", 1)
                    .attr("width", 20)
                    .style("fill", function(d, i ) { return colourScale(d); });

            const cscale = d3.scaleLinear()
                .domain( vScale )
                .range( [scaleHeight, 0]);

            const cAxis = d3.axisRight( cscale ).ticks(5);

            scaleArea.append("g")
                .attr("transform", "translate(20,0)")
                .call(cAxis);
    	}, 

    	vertShader : `attribute vec2 a_position;
attribute float a_val;
uniform mat4 u_matrix;
varying float v_val;
void main() {
  gl_Position = u_matrix*vec4(a_position,0,1);
  v_val = a_val;
}
` ,

    	fragShader : `precision highp float;
uniform sampler2D u_cmap;
uniform float u_cmin, u_cmax;
varying float v_val;
void main() {
  gl_FragColor = texture2D(u_cmap, vec2( (v_val-u_cmin)/(u_cmax-u_cmin) ,0.5));
}
` ,

    	


    };

    const triMesh2dRenderXBar = {

    	make : function ( element, data, layout ) {

    		const container = d3.select(element);

        container.style("position","relative");

            const width = container.node().offsetWidth;
            const height = width; // force square plots for now

            container.append("canvas")
                .attr("width", width)
                .attr("height", height)
                .style("width", width+"px")
                .style("height", height+"px");

            container.append("svg")
        		.attr("class","svg-overlay")
        		.style("position","absolute")
        		.style("z-index",2)
        		.style("top","0px")
        		.style("left","0px")
        		.attr("width", width)
        		.attr("height", height);
      
    		triMesh2dRenderXBar.update ( element, data, layout );

    	},

    	update : function (element, data, layout ) {


    		const container = d3.select(element);
    		const width = container.node().offsetWidth;
            const height = width; // force square plots for now

    		const canvas = container.select("canvas");

    		const gl = canvas.node().getContext("webgl", {antialias: true, depth: false});
    		twgl.addExtensionsToContext(gl);
    		const programInfo = twgl.createProgramInfo(gl, [triMesh2dRenderXBar.vertShader, triMesh2dRenderXBar.fragShader]);

    		const tm = data.triMesh;

    		const nTris = tm.indices.length/3;

    		let values, vertices;

    		const nVerts = ( data.nVerts === undefined ) ? tm.values.length : data.nVerts;

    		if ( layout.highlightTasks == true ) {
       
                if (!Array.isArray(dbsliceData.highlightTasks)) {

                	values = new Float32Array(tm.values.buffer,0,nVerts);
                	vertices = new Float32Array(tm.vertices.buffer,0,2*nVerts);
                
                } else if (dbsliceData.highlightTasks.length != 0) {
         
         			let taskId = dbsliceData.highlightTasks[0];
         			let nOffset;

         			if ( data.taskIdMap === undefined) {

         				nOffset = taskId;

         			} else {

         				nOffset = data.taskIdMap[taskId];

         			}

                	values = new Float32Array(tm.values.buffer,4*nOffset*nVerts,nVerts);

                	if ( layout.updateVertices ) {

                		vertices = new Float32Array(tm.vertices.buffer,4*2*nOffset*nVerts,2*nVerts);

                	} else {

                		vertices = tm.vertices;

                	}

                	
                } else {

                	return;
                }

            }

    		  const arrays = {
         		a_position: {numComponents: 2, data: vertices},
         		a_val: {numComponents: 1, data: values},
         		indices: {numComponents: 3, data: tm.indices}
      		};
      		const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      		const viewDefault = {xMin: -1., xMax: 1., yMin: -1., yMax: 1};
      		const view = ( layout.view === undefined ) ? viewDefault : layout.view;
      
      		const vScaleDefault = [0.,1.];
      		const vScale = ( layout.vScale === undefined ) ? vScaleDefault : layout.vScale;

      		const projectionMatrix = glMatrix.mat4.create();
      		glMatrix.mat4.ortho(projectionMatrix, view.xMin, view.xMax, view.yMin, view.yMax, 0, 1.);
      	
      		const cmap = new Uint8Array([158, 1, 66, 255, 185, 31, 72, 255, 209, 60, 75, 255, 228, 86, 73, 255, 240, 112, 74, 255, 248, 142, 83, 255, 252, 172, 99, 255, 253, 198, 118, 255, 254, 221, 141, 255, 254, 238, 163, 255, 251, 248, 176, 255, 241, 249, 171, 255, 224, 243, 160, 255, 200, 233, 159, 255, 169, 220, 162, 255, 137, 207, 165, 255, 105, 189, 169, 255, 78, 164, 176, 255, 66, 136, 181, 255, 74, 108, 174, 255, 94, 79, 162, 255]); //spectral
      		const cmapTex = twgl.createTexture(gl, {mag: gl.LINEAR, min:gl.LINEAR, src: cmap, width:21, height:1} );
      		const uniforms = {u_matrix: projectionMatrix, u_cmap: cmapTex, u_cmin: vScale[0], u_cmax:vScale[1]};
      
      		gl.useProgram(programInfo.program);
      		twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      		twgl.setUniforms(programInfo, uniforms);
      		gl.drawElements(gl.TRIANGLES, nTris*3, gl.UNSIGNED_INT, 0);

      		const overlay = container.select(".svg-overlay");
      		const scaleMargin = { "left" : width - 50, "top" : height/2 - 50};
      		overlay.select(".scaleArea").remove();
      		const scaleArea = overlay.append("g")
        		.attr("class","scaleArea")
        		.attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")");

        	let scaleHeight = 100;
        	let colourScale = d3.scaleSequential( d3.interpolateSpectral );
            colourScale.domain( [0, scaleHeight]);
            scaleArea.selectAll(".scaleBar")
                .data(d3.range(scaleHeight), function(d) { return d; })
                .enter().append("rect")
                    .attr("class", "scaleBar")
                    .attr("x", 0 )
                    .attr("y", function(d, i) { return scaleHeight - i; })
                    .attr("height", 1)
                    .attr("width", 20)
                    .style("fill", function(d, i ) { return colourScale(d); });

            const cscale = d3.scaleLinear()
                .domain( vScale )
                .range( [scaleHeight, 0]);

            const cAxis = d3.axisRight( cscale ).ticks(5);

            scaleArea.append("g")
                .attr("transform", "translate(20,0)")
                .call(cAxis);

            let zpCut = layout.zpCut;

            let xScale = d3.scaleLinear()
              .domain([view.xMin, view.xMax])
              .range([0,width]);

            d3.scaleLinear()
              .domain([view.yMin, view.yMax])
              .range([height,0]); 

            let barCoords = [[xScale(zpCut),0],[xScale(zpCut),height]];
            let barPath = overlay.select(".bar");
            if (barPath.empty()) {
              overlay.append("path")
                .attr("class","bar")
                .attr("fill", "none")
                .attr("stroke", "Gray")
                .attr("stroke-width", 5)
                .style("opacity",0.8)
                .style("cursor","ew-resize")
                .attr("d",d3.line()(barCoords))
                .call(d3.drag().on("drag", dragged));     
            } else {
                barPath.attr("d",d3.line()(barCoords));
            }

           function dragged(d) {
              zpCut = xScale.invert(d3.event.x);
              layout.zpCut = zpCut;
              barCoords = [[xScale(zpCut),0],[xScale(zpCut),height]];
              d3.select(this).attr("d",d3.line()(barCoords));
              const thisLine = getCut ({indices:tm.indices, vertices, values}, zp, zpCut);
              dbsliceData.xCut=thisLine.map(d=>d.map(e=>([e[1],e[2]])));
              render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );

           }

            
            const zp=new Float32Array(nVerts);
            for (let i=0; i<nVerts; i++) {
              zp[i]=vertices[2*i];  // x values
            } 


            const thisLine = getCut ({indices:tm.indices, vertices, values}, zp, zpCut);
            dbsliceData.xCut=thisLine.map(d=>d.map(e=>([e[1],e[2]])));

            function getCut( tm, zp, zpCut) {
              let cutTris = findCutTrisLine(data.qTree,zpCut);
              let line = getLineFromCutTris(tm, zp, zpCut, cutTris);
              return line;
            }



            function findCutTrisLine(tree, zpCut) {
              const cutTris=[];
              tree.visit(function(node,x1,x2,y1,y2) {
                if (!node.length) {
                  do {
                    let d = node.data;
                    let triIndx = d.i;
                    let triCut = (d.zpMin <= zpCut) && (d.zpMax >= zpCut);
                    if ( triCut ) { cutTris.push(triIndx); }
                  } while (node = node.next);
                }
                return (x1 > zpCut || y2 < zpCut) ;
              });
              return cutTris;
            }


            function getLineFromCutTris(tm, zp, zpCut, cutTris) {
      
              let lineSegments = [];

              const cutEdgeCases = [
                [ [0,1] , [0,2] ],
                [ [0,1] , [0,2] ],
                [ [0,1] , [1,2] ],
                [ [0,2] , [1,2] ],
                [ [0,2] , [1,2] ],
                [ [0,1] , [1,2] ],
                [ [0,1] , [0,2] ],
                [ [0,1] , [0,2] ]  
              ];
      
              cutTris.forEach( itri => {
                let verts = getVerts(itri, tm, zp);
                let t0 = verts[0][0] <= zpCut;
                let t1 = verts[1][0] <= zpCut;
                let t2 = verts[2][0] <= zpCut;  
                let caseIndx= t0<<0 | t1<<1 | t2<<2;
                let cutEdges = cutEdgeCases[caseIndx];
                let vertA = cutEdge(verts, cutEdges[0], zpCut);
                let vertB = cutEdge(verts, cutEdges[1], zpCut);
                let lineSegment = [];
                vertA.shift();
                vertB.shift();
                lineSegment.push(vertA);
                lineSegment.push(vertB);
                lineSegments.push(lineSegment);
              });

              return lineSegments;
            }

            function getVerts(itri,tm,zp) {
              let verts = [];
              for (let i=0; i<3; i++) {
                let ivert = tm.indices[itri*3 + i];
                let vert = [];
                vert.push(zp[ivert]);
                vert.push(tm.vertices[ivert*2]);
                vert.push(tm.vertices[ivert*2+1]);
                vert.push(tm.values[ivert]);
                verts.push(vert);
              }
            return verts;
            }

            function cutEdge(verts, edge, zpcut) {
              let i0 = edge[0];
              let i1 = edge[1];
              let zp0 = verts[i0][0];
              let zp1 = verts[i1][0];
              let frac = (zpcut-zp0)/(zp1-zp0);
              let frac1 = 1.-frac;
              let vert = [];
              let nvals = verts[0].length;
              for (let n=0; n<nvals; n++) {
                let cutVal = frac1*verts[i0][n] + frac*verts[i1][n];
                vert.push(cutVal);
              }
              return vert;
            }
            

    	}, 

    	vertShader : `attribute vec2 a_position;
attribute float a_val;
uniform mat4 u_matrix;
varying float v_val;
void main() {
  gl_Position = u_matrix*vec4(a_position,0,1);
  v_val = a_val;
}
` ,

    	fragShader : `precision highp float;
uniform sampler2D u_cmap;
uniform float u_cmin, u_cmax;
varying float v_val;
void main() {
  gl_FragColor = texture2D(u_cmap, vec2( (v_val-u_cmin)/(u_cmax-u_cmin) ,0.5));
}
` ,

    	


    };

    const d3CutLine = {

        make : function ( element, data, layout ) {

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            var container = d3.select(element);

            var svgWidth = container.node().offsetWidth,
                svgHeight = layout.height;

            svgWidth - margin.left - margin.right;
            svgHeight - margin.top - margin.bottom;

            container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr( "class", "plotArea" );

            d3CutLine.update( element, data, layout );

        },

        update : function ( element, data, layout ) {

            var container = d3.select(element);
            var svg = container.select("svg");
            var plotArea = svg.select(".plotArea");

            //if (data.newData == false) {
            //    return
            //}

            var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
            var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

            let plotRowIndex = container.attr("plot-row-index");
            let plotIndex = container.attr("plot-index");
            let clipId = "clip-"+plotRowIndex+"-"+plotIndex; 

            var svgWidth = svg.attr("width");
            var svgHeight = svg.attr("height");

            var width = svgWidth - margin.left - margin.right;
            var height = svgHeight - margin.top - margin.bottom;

            const cutLine=dbsliceData.xCut;

            const xData = cutLine.map(d => d[0][0]);
            const yData = cutLine.map(d => d[0][1]);

            if ( layout.xRange === undefined ) {
                var xRange = d3.extent(xData);
            } else {
                var xRange = layout.xRange;
            }

            if ( layout.yRange === undefined ) {
                var yRange = d3.extent(yData);
            } else {
                var yRange = layout.yRange;
            }

            if ( layout.xscale == "time" ) {
                var xscale = d3.scaleTime(); 
                var xscale0 = d3.scaleTime();        
            } else {
                var xscale = d3.scaleLinear();
                var xscale0 = d3.scaleLinear();
            }

            xscale.range( [0, width] )
                  .domain( xRange );

            xscale0.range( [0, width] )
                  .domain( xRange );

            var yscale = d3.scaleLinear()
                .range( [height, 0] )
                .domain( yRange );

            var yscale0 = d3.scaleLinear()
                .range( [height, 0] )
                .domain( yRange );

            //var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
            //if ( layout.cSet !== undefined) colour.domain( layout.cSet );

            var line = d3.line()
                .x( function( d ) { return xscale( d.x ); } )
                .y( function( d ) { return yscale( d.y ); } );

            function segLine(lineSegs) {
                let path="";
                lineSegs.forEach(d => {
                    let seg=[{x:d[0][0], y:d[0][1]},{x:d[1][0],y:d[1][1]}];
                    path += line(seg);
                });
                return path;
            }

            svg.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("width", width)
                    .attr("height", height);

            var zoom = d3.zoom()
               .scaleExtent([0.5, Infinity])
                .on("zoom", zoomed);

            svg.transition().call(zoom.transform, d3.zoomIdentity);
            svg.call(zoom);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function( d ) {
                    return "<span>"+d.label+"</span>";
            });

            svg.call(tip);

            plotArea.append("g")
                .style("display","none")
                .append("circle")
                    .attr("r",1);

            let linePath = plotArea.select(".line");
            if (linePath.empty()) {
                plotArea.append("path")
                    .attr("class","line")
                    .datum(cutLine)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 2)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("d", segLine);
            } else {
                linePath.datum(cutLine).attr("d",segLine);
            }


            var xAxis = d3.axisBottom( xscale ).ticks(5);
            var yAxis = d3.axisLeft( yscale );

            var gX = plotArea.select(".axis--x");
            if ( gX.empty() ) {
                gX = plotArea.append("g")
                    .attr( "transform", "translate(0," + height + ")" )
                    .attr( "class", "axis--x")
                    .call( xAxis );
                gX.append("text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text(layout.xAxisLabel);
            } else {
                gX.transition().call( xAxis );
            }

            var gY = plotArea.select(".axis--y");
            if ( gY.empty() ) {
                gY = plotArea.append("g")
                    .attr( "class", "axis--y")
                    .call( yAxis );
                gY.append("text")
                        .attr("fill", "#000")
                        .attr("transform", "rotate(-90)")
                        .attr("x", 0)
                        .attr("y", -margin.left + 15)
                        .attr("text-anchor", "end")
                        .text(layout.yAxisLabel);
            } else {
                gY.transition().call( yAxis );
            }



            function zoomed() {
                var t = d3.event.transform;
                xscale.domain(t.rescaleX(xscale0).domain());
                yscale.domain(t.rescaleY(yscale0).domain());
                gX.call(xAxis);
                gY.call(yAxis);
                //plotArea.selectAll(".line").attr( "d", function( d ) { return line( d.data ); } );
                plotArea.select(".line").datum(cutLine).attr("d",segLine);
            }


            data.newData = false;
        }
    };

    exports.cfAddPlot = cfAddPlot;
    exports.cfD3BarChart = cfD3BarChart;
    exports.cfD3Histogram = cfD3Histogram;
    exports.cfD3Scatter = cfD3Scatter;
    exports.cfInit = cfInit;
    exports.cfLeafletMapWithMarkers = cfLeafletMapWithMarkers;
    exports.cfUpdateFilters = cfUpdateFilters;
    exports.d3ContourStruct2d = d3ContourStruct2d;
    exports.d3CutLine = d3CutLine;
    exports.d3LineSeries = d3LineSeries;
    exports.d3Scatter = d3Scatter;
    exports.getFilteredTaskIds = getFilteredTaskIds;
    exports.getFilteredTaskLabels = getFilteredTaskLabels;
    exports.makeNewPlot = makeNewPlot;
    exports.makePlotsFromPlotRowCtrl = makePlotsFromPlotRowCtrl;
    exports.makeSessionHeader = makeSessionHeader;
    exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
    exports.render = render;
    exports.threeMeshFromStruct = threeMeshFromStruct;
    exports.threeSurf3d = threeSurf3d;
    exports.triMesh2dRender = triMesh2dRender;
    exports.triMesh2dRenderXBar = triMesh2dRenderXBar;
    exports.update = update;
    exports.updatePlot = updatePlot;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=dbslice.js.map
