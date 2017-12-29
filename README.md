# dbslice
[**dbslice**](http://www.dbslice.org) is a JavaScript library for web-based data exploration. A collection of data instances (Tasks)  can be interactively filtered, based on high-level descriptors, to obtain a selection of Tasks for deeper exploration. The selected Tasks are then compared using scatter, line, contour and 3D surface plots, generated on demand.

**dbslice** is built on the [d3.js](https://d3js.org) , [crossfilter.js](https://github.com/crossfilter/crossfilter) and [three.js](https://threejs.org) libraries.

## Installing
The latest **dbslice** library is available here

```html
<script src="http://dbslice.org/dbslice.js"></script>
```

## Concept
**dbslice** provides an interactive interface to a remote collection of data. The data is assumed to be organised by *Tasks*, where a *Task* an individual subset of data that has some descriptor, or combination of descriptors, in common. Different data types can be associated with each Task (e.g. points, lines and surfaces). It is also possible to look at different parts of a Task by specifying a *Slice* identifier.

In the browser, **dbslice** works with high-level descriptors of all of the available Tasks. The user filters these (via bar charts, histograms, etc) until the desired selection of Tasks is obtained. **dbslice**  then requests specified data from the selected Tasks for further, deeper, plotting as required by the user. In this way, plots are generated, on demand, for detailed comparisons of equivalent data.

## Example
### Tasks
In this example, each Task is a 3D array of data. The data is some property *f* that varies in the *x,y,z* coordinate directions. 

### Meta Data 
Each Task is described, at a high-level, by its *Meta Data*. This is the data that is transferred to the browser to allow the user to filter the available Tasks down to a selection of interest.

In this example, each Tasks has two Meta Data Properties and two Data Properties. The Meta Data Properties (strings) are `Simulation type` and `Model type`. The Data Properties (floats) are `Average f` and `Std dev f`. An object is required with these descriptor key names (`header`) and the values for each Task (`data`):

```javascript
var metaData = {
	header : { 
		metaDataProperties : [ "Simulation type" , "Model type" ] ,
		dataProperties : [ "Average f" , "Std dev f" ]
	} ,
	data : [
		{ taskId : 0, "Simulation type" : "Blue" , "Model type" : "Basic" , "Average f" : 0.9827, "Std dev f" : 0.0129 } , 
		{ taskId : 1, "Simulation type" : "Blue" , "Model type" : "Std"   , "Average f" : 1.2352, "Std dev f" : 0.0389 } ,
		{ taskId : 2, "Simulation type" : "Red"  , "Model type" : "Std"   , "Average f" : 2.6352, "Std dev f" : 0.0221 } ,
		...
	]
};
```
The above contains `data` for the first three Tasks. The `taskId` field is a unique identifier for each Task. This object is translated into the data structure required by **dbslice** using the `cfInit` function (in **dbslice**, *cf* denotes a function interacting with the [crossfilter.js](https://github.com/crossfilter/crossfilter) library:

```javascript
var cfData = dbslice.cfInit( metaData );
```

**dbslice** can now generate plots using the `cfData` object. These plots are configured into a **dbslice** `session` using `plots` and `plotRows`.

### Sessions, Plots and Plot Rows
The `session` object defines the plots that are shown in the browser. Plots are organised in `plotRows`. Each `plot` in a `plotRow` can either be individual and distinct (this is normally the case for the filter plots that generate the selected Tasks of interest) or they can all be of the same type (used to compare the selected Tasks). 

We start by defining a `session` with one `plotRow` containing three `plots`:

```javascript
var session = {
	title : "3D box of data demo" ,
	plotRows : [
		{ title : "3D box database" ,  // plotRow of charts for filtering
		  plots : [
		  	{ plotFunc : dbslice.cfD3BarChart ,  // bar chart
		  	  data : { cfData : cfData , property : "Simulation type" } ,
		  	  layout : { title : "Simulation" , colWidth : 4 , height : 300 } } ,
		  	{ plotFunc : dbslice.cfD3BarChart ,  // bar chart
		  	  data : { cfData : cfData , property : "Model type" } ,
		  	  layout : { title : "Model" , colWidth : 4 , height : 300 } } ,
		  	{ plotFunc : dbslice.cfD3Histogram ,  // histogram
		  	  data : { cfData : cfData , property : "Average f" } ,
		  	  layout : { title : "Average" , colWidth : 4 , height : 300 } } 
		   ] 
		} ]
};
```

The `plotRows` array contains a single plotRow object; the `plots` array within this plotRow contains three plot elements. A plot is defined by the function required to produce it `plotFunc`, the `data` to be accessed by this function, and any `layout` attributes that are required. All plots in **dbslice** are defined in this way.

The `session` is rendered using:

```javascript
dbslice.render( target , session );
```
where `target` is the id of the html div element in which the **dbslice** session is to be rendered.

The `session` defined above will provide 3 plots that update interactively as the user selects a bar on the bar chart or adjusts the selected range on the histogram. **dbslice** is using [crossfilter.js](https://github.com/crossfilter/crossfilter) to provide the current selection, and [d3.js](https://d3js.org) to generate and update the plots.

We now add an additional plotRow to the `session` that will, when requested by the user, get additional data for the current selection of Tasks and generate comparative plots.

```javascript
var linePlotRow = {
	title : "f(y) at z=0"
	plots : [] ,
	ctrl : { plotFunc : dbslice.d3LineSeries ,  // multiple lines on a single plot with d3
	         layout : { colWidth : 3 , height : 300 } ,
	         urlTemplate : "http://dbslice.org/demos/testbox/data/f_line_${sliceId}_task_${taskId}.json" ,
	         tasksByFilter : true ,  // get taskIds array from current filter selection
	         sliceIds : [ "xstart" , "xmid" , "xend" ] , 
	         formatDataFunc : function( rawData ) {
	         	var series = [];
	         	rawData.forEach( function( line, index ) { series.push( { name : index , data : line } ) } );
	         	return { series : series };
	       }
};
session.plotRows.push( linePlotRow );
```
The `plots` array for this plotRow is empty. **dbslice** will automatically populate the `plots` array using the information in the `ctrl` object. The `ctrl` object specifies the plot function `plotFunc`, the root of the location of the data `urlTemplate`, an instruction to obtain the taskId's from the current filter `tasksByFilter : true` and two optional keys: a list of `sliceIds` and a function to reformat the data received from the url into the structure needed by `plotFunc`.  The placeholders `${taskId}` (required) and `${sliceId}` (optional) in `urlTemplate` are replaced by the current sliceId and taskId before the url is accessed. `formatDataFunc` allows data from many sources to be used by **dbslice**.

We add two more plotRows to our session:

```javascript 
var contourPlotRow = {
	title : "f at x=0"
	plots : [] ,
	ctrl : { plotFunc : dbslice.d3ContourStruct2d ,  // contour plot with d3
	         layout : { colWidth : 3 , height : 300 } , 
	         urlTemplate : "http://dbslice.org/demos/testbox/data/f_area2d_xstart_task_${taskId}.json" ,
	         tasksByFilter : true 
};
session.plotRows.push( contourPlotRow );

var surfacePlotRow = {
	title : "f at x=0, x=mid, x=end"
	plots : [] ,
	ctrl : { plotFunc : dbslice.d3ContourStruct2d ,  // surface plot with threejs
	         layout : { colWidth : 4 , height : 400 } , 
	         urlTemplate : "http://dbslice.org/demos/testbox/data/f_area3d_task_${taskId}.json" ,
	         tasksByFilter : true ,
	         formatDataFunc : function (rawData) { return dbslice.threeMeshFromStruct( rawData )}
};
session.plotRows.push( surfacePlotRow );
```





