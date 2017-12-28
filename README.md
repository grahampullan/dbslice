# dbslice
[**dbslice**](http://www.dbslice.org) is a JavaScript library for web-based data exploration. A collection of data instances (Tasks)  can be interactively filtered, based on high-level descriptors, to obtain a selection of Tasks for deeper exploration. The selected Tasks are then compared using scatter, line, contour and 3D surface plots, generated on demand.

**dbslice** is built on the [d3.js](https://d3js.org) , [crossfilter.js](https://github.com/crossfilter/crossfilter) and [three.js](https://threejs.org) libraries.

## Concept
**dbslice** provides an interactive interface to a remote collection of data. The data is assumed to be organised by *Tasks*, where a *Task* an individual subset of data that has some descriptor, or combination of descriptors, in common. Different data types can be associated with each Task (e.g. points, lines and surfaces). It is also possible to look at different parts of a Task by specifying a *Slice* identifier.

In the browser, **dbslice** works with high-level descriptors of all of the available Tasks. The user filters these (via bar charts, histograms, etc) until the desired selection of Tasks is obtained. **dbslice**  then requests specified data from the selected Tasks for further, deeper, plotting as required by the user. In this way, plots are generated, on demand, for detailed comparisons of equivalent data.

## Example
### Tasks
In this example, each Task is a 3D array of data. The data is some property *f* that varies in the *x,y,z* coordinate directions. 

### Meta Data 
Each Task is described, at a high-level, by its *Meta Data*. This is the data that is transferred to the browser to allow the user to filter the available Tasks down to a selection of interest.

In this example, we define two Meta Data Properties and two Data Properties that will be available for filtering. The Meta Data Properties (strings) `Simulation type` and `Model type`. The Data Properties (floats) are `Average f` and `Std dev f`. 
