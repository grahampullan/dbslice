# dbslice
[**dbslice**](http://www.dbslice.org) is a JavaScript library for web-based data exploration. A collection of data instances (Tasks)  can be interactively filtered, based on high-level descriptors, to obtain a selection of Tasks for deeper exploration. The selected Tasks are then compared using scatter, line, contour and 3D surface plots, generated on demand.

**dbslice** is built on the [d3.js](https://d3js.org) , [crossfilter.js](https://github.com/crossfilter/crossfilter) and [three.js](https://threejs.org) libraries.

## Installing
The latest **dbslice** library is available here

```html
<script src="http://www.dbslice.org/dbslice.js"></script>
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
myMetaData = {
	header : { 
		metaDataProperties : [ 'Simulation type' , 'Model type' ] ,
		dataProperties : [ 'Average f' , 'Std dev f' ]
	} ,
	data : [
		{ taskId : 0, 'Simulation type' : 'Blue' , 'Model type' : 'Basic' , 'Average f' : 0.9827, 'Std dev f' : 0.0129 } , 
		{ taskId : 1, 'Simulation type' : 'Blue' , 'Model type' : 'Std'   , 'Average f' : 1.2352, 'Std dev f' : 0.0389 } ,
		{ taskId : 2, 'Simulation type' : 'Red'  , 'Model type' : 'Std'   , 'Average f' : 2.6352, 'Std dev f' : 0.0221 } ,
		...
	]
}
```
The above contains `data` for the first three Tasks. The `taskId` field is a unique identifier for each Task. This object is translated into the data structure required by **dbslice** using the `cfInit` function:

```javascript
var cfData = dbslice.cfInit( myMetaData );
```

**dbslice** can now generate plots using the `cfData` object. These plots are configured into a **dbslice** `session` using `plots` and `plotRows`.

### Sessions, Plots and Plot Rows
The `session` object defines the plots that are shown in the browser. Plots are organised in `plotRows`. Each `plot` in a `plotRow` can either be individual and distinct (this is normally the case for the filter plots that generate the selected Tasks of interest) or they can all be of the same type (used to compare the selected Tasks). 



