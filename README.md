# dbslice

**Looking for the [dbslice v3 development branch](https://github.com/grahampullan/dbslice/tree/v3)?**

---

<a href="https://dbslice.org"><img src="/img/dbslice-logo.svg" width="180" height="180" align="left" hspace="10" vspace="6"></a>

[**dbslice**](https://www.dbslice.org) is a web app for data exploration. The core principle is that the data to be visualized is hierarchical. [**dbslice**](http://www.dbslice.org) expects data items (called `tasks`) to be chracterised by high-level properties (referred to as meta-data) and also to be associated with several low-level, detailed data types (such as line data, surface data, 3D data). [**dbslice**](http://www.dbslice.org) allows the user to interactively filter the meta-data and then request detailed data for the subset of interest.

**dbslice** is built on the [d3.js](https://d3js.org) , [crossfilter.js](https://github.com/crossfilter/crossfilter) and [three.js](https://threejs.org) libraries.

## Demonstrations

There are several live [demonstrations](https://www.dbslice.org/demos) at the dbslice web site.

---

## Documentation

* [Step-by-step tutorial](#step-by-step)
* [Session specification](#session-specification)
  * [Plots](#plots)
    * [Meta-data plots](#meta-data-plots)
      * [Bar chart](#bar-chart)
      * [Scatter plot](#scatter-plot)
      * [Histogram](#histogram)
      * [Grouped vertical bar chart](#grouped-vertical-bar-chart)
      * [Circle pack plot](#circle-pack-plot)
      * [Response surface scatter plot](#response-surface-scatter-plot)
    * [Detailed data plots](#detailed-data-plots)
      * [Line plot](#line-plot)
      * [Surface plot from unstructured data](#surface-plot-from-unstructured-data)

---

## Step-by-step tutorial
This guide shows describes how to use **dbslice** to visuliase the [testbox](https://www.dbslice.org/demos/testbox) demonstration data. The data files needed are [here](https://github.com/grahampullan/dbslice/tree/master/test) and are structured as follows:

```
|-- index.html
|-- session.json
|__ data
      |-- metaData.csv
      |-- case_0
      |     |-- f_line_xmid.json
      |     |-- f_area_2d_xstart.json
      |-- case_1
      |-- case_2
```

`index.html` is the web page that will display the data. The `session.json` file tells **dbslice** how to to display the data. The data itself is in the `data` folder; this contains a `metaData.csv` file for the high level meta-data, and separate folders (`case_0`, `case_1`, etc), for each row of `metaData.csv`, that store the detailed data for each `task`.

**dbslice** runs in a web browser and needs to be hosted by a web server. We can use Python to run a web server locally, i.e. navigate to the folder containing `index.html` and type (Python 2)

```
python -m simpleHTTPserver 8000
```

or (Python 3):
```
python3 -m http.server 8000
```

This will start a web server on port 8000 so you can open the visulisation in your browser by going to:

```
http://localhost:8000
```
This will automatically open the `index.html` page. This page contains the following html:

```html
<div class="container-fluid" id="target"> </div>
<script src="https://cdn.jsdelivr.net/npm/dbslice/build/dbslice.min.js"></script>
<script>
    dbslice.start( "target" , "session.json");
</script>
```

The `index.html` page loads the latest `dbslice.js` from the `jsdelivr` service and then starts dbslice (in the element with `id="target"`) using the file `session.json` to configure the view. Note that **dbslice** treats the string `"session.json"` as a URL and our local Python web server delivers this file to **dbslice**.

Let's have a look at the `session.json` file. Here is the top of the file:

```javascript
{
  "title": "3D box of data demo",
  "metaDataConfig": {
    "metaDataUrl": "data/metaData.csv",
    "metaDataCsv": true,
    "generateTaskIds": true,
    "taskIdRoot": "case_",
    "taskIdFormat": "d",
    "setLabelsToTaskIds": true
  },
  "uiConfig": {
    "plotTasksButton": true,
    "saveTasksButton": false
  }
```

After the `title` of the visualisation there are two objects: `metaDataConfig` and `uiConfig`.

The following are set in `metaDataConfig`:

* `metaDataUrl` - URL of the meta-data table
* `metaDataCsv` - `true` if the meta-data is in csv format, otherwise the meta-data is assumed to be in json format
* `generateTaskIds` - the `taskId` is a unique identifier for each row ("task") of the meta-data table. The `taskId` is used as part of the URL of the detailed data. `generateTaskIds` is `true` if **dbslice** should generate the `taskId` from the row number of the meta-data table, otherwise `taskId` must be specified in the meta-data.
* `taskIdRoot` - the first part of the `taskId` to be generated
* `taskIdFormat` - the format for the meta-data row number that will be appended to `taskIdRoot`
* `setLabelsToTaskIds` - the `label` of each `task` will be displayed on mouse-over events. This can be set in the meta-data, or set `setLabelsToTaskIds` to `true` if the `label` is to be made the same as the `taskId`

In `uiConfig`:

* `plotTasksButton` - `true` if **dbslice** shows a "Plot Selected Tasks" button. The user presses this button to fetch the detailed data associated with each task that is currently part of the filtered meta-data subset.

The remainder of the `session.json` file contains the configuration of the plots themselves. Plots are placed in containers called `plotRow`s (a `plotRow` can contain more than one row of plots). Here is the start of the `plotRows` array, containing the first `plotRow` and the first `plot` within that `plotRow`:

```javascript
"plotRows": [
    {
      "title": "3D box database",
      "plots": [
        {
          "plotType": "cfD3BarChart",
          "data": {
            "property": "Simulation type"
          },
          "layout": {
            "title": "Simulation",
            "colWidth": 3,
            "height": 300,
            "highlightTasks": true
          }
        },
```

Each item in the `plotRows` array is a `plotRow`. Each `plotRow` has a `title` and a `plots` array, each element of which is a `plot`. A powerful feature of **dbslice** is that a `plotRow` can generate its own plots; in this case, the `plots` array in the `session.json` file would be empty and a `ctrl` object is added to the `plotRow` to specify how the plots are generated.

Each `plot` has a `plotType` (the kind of plot to be generated), a `data` object (the data to be displayed) and a `layout` object (how the plot should look) object. The `plot` can also contain, optionally, a `fetchData` object which tells **dbslice** how to fetch and process the data that will then form the `plot.data` object.

The data defining the first `plot` in the first `plotRow` is:

* `plotType` - the type of plot. In this case, "cfD3BarChart" is a bar chart that is produced from the meta-data.

The `data` object:

* `property` - the meta-data bar chart only requires the name of one meta-data property (column in the meta-data file).

The `layout` object:

* `title` - title of this individual plot
* `colWidth` - width of the plot (full width is `colWidth:12`)
* `height` - height of this plot in px
* `highlightTasks` - set `true` if mousing over a task (e.g. scatter plot point) causes same task to be highlighted in all plots.

The second plot is similar, but since it is a scatter plot of meta-data, we need to specify 3 properties in the `data` object:

```javascript
"data": {
    "xProperty": "Average f",
    "yProperty": "Std dev f",
    "cProperty": "Model type"
}
```

* `xProperty` - meta-data property name for the x-axis
* `yProperty` - meta-data property name for the y-axis
* `zProperty` - meta-data property name for colour of the point

The third plot is a histogram. We only need one property for this:

```javascript
"data": {
    "property": "Average f"
}
```

* `property` - name of the meta-data property from which to create the histogram bins

The second `plotRow` in this `session.json` shows line plots. In each plot, we would like a line or each `task` in the current meta-data filter to be shown. The data for these plots is stored in json files (we could also use csv files) in sub-folders (one per `task`) of the data folder. We use the `fetchData` object to tell **dbslice** where to find these files and how to process them to create the `data` object for each plot.

```javascript
"fetchData": {
    "urlTemplate": "data/${taskId}/f_line_xstart.json",
    "tasksByFilter": true,
    "autoFetchOnFilterChange": true,
    "maxTasks": 50,
    "dataFilterType": "lineSeriesFromLines",
    "dataFilterConfig": {
    	"cProperty": "Model type"
    }
}
```
* `urlTemplate` - template used to generate the URL for each `task`. The `${taskId}` is replaced by each `taskId` to form the URL
* `tasksByFilter` - `true` if the `task`s in the current meta-data filter are used to produce the plot
* `autoFetchOnFilterChange` - `true` if the plot is refreshed every time the meta-data filter is adjusted. This is a good option for small data files but causes latency if large files are being accessed
* `maxTasks` - can be used to set the maximum number of `tasks` (lines in this case) that will be plotted
* `dataFilterType` - name of a function used to process the raw data files. In this case, the filter just combines the line data from json files for all the `tasks` into one collection ready for plotting
* `dataFilterConfig` - object that is passed to the filter function. In this case we set the colour of the lines.

In the next `plotRow` we would like **dbslice** to generate the plots. We set `plots=[]` and specify a `ctrl` object:


```javascript
"plots": [],
"ctrl": {
    "plotType": "d3ContourStruct2d",
    "layout": {
        "colWidth": 3,
        "height": 300,
        "vScale": [
            -0.1,
            1.2
        ],
        "highlightTasks": true
    },
    "fetchData": {
        "urlTemplate": "data/${taskId}/f_area2d_xstart.json",
        "tasksByFilter": true,
        "maxTasks": 20
    }
}
```
This `ctrl` object will generate an individual contour plot per `task`. Each plot will have `plotType` specified by `ctrl.plotType` and `layout` by `ctrl.layout`. The `data` for each plot will be obtained using `ctrl.fetchData`.

The final `plotRow` in the `session.json` file also uses a `ctrl` object to generate plots automatically. Again, one plot (this time, a 3D surface plot) is generated for each `task` in the meta-data filter. 


---
## Session specification

A `json` file is used to specify all the parameters needed for a **dbslice** session. This file is usally called `session.json`. An example [session.json](https://github.com/grahampullan/dbslice/blob/master/test/session.json) file is contained in the `test` directory of the **dbslice** GitHub repository.

### Plots

All plots require a `layout` object and either a `data` or a `fetchData` object. `layout` contains information on how the plot should be displayed (size, optional settings, etc). `data` contains the data to be plotted, or `fetchData` tells **dbslice** where to obtain this data.

### Meta-data plots

For Meta-data plots, the data to be displayed is obtained from the meta-data itself (not from additional sources, so `fetchData` is never used). This means that the `data` object in each plot definition is typically a property name from the meta-data (i.e. a column from the meta-data table).

#### Bar chart

Example of a minimal `plot` object for a bar chart:

```javascript
{
  "plotType": "cfD3BarChart",
  "data": {
    "property": "Prop1"
  },
  "layout": {
    "title": "Prop1 bar chart",
    "colWidth": 3,
    "height": 300
  }
}
```

| Parameter | Description |
|---|---|
| plotType | Set to `cfD3BarChart` for a bar chart |
| property | Name of meta-data property to be used. Must be a member of `categoricalProperties` |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |


Optional `layout` parameters:

| Parameter | Description |
|---|---|
| highlightTasks | set `true` to show which bar contains the current selected task |
| addSelectablePropertyToTitle | set `true` to add a dropdown selector for `data.property` |
| selectableOptions | list of properties to be used in dropdown selector (must be members of `categoricalProperties`). If `selectableOptions` is not set, all of `categoricalProperties` are used |
| removeZeroBar | set `true` to completely remove bars with zero members (likely due settings of other filters) from the chart |
| colourByProperty | set `true` to colour bars by the value of `property` |
| colourMap | use to set the colour map. If not set, `d3.schemeCategory10` is used |

#### Scatter plot

Example of a minimal `plot` object for a scatter:

```javascript
{
  "plotType": "cfD3Scatter",
  "data": {
    "xProperty": "Prop1",
    "yProperty": "Prop2",
    "cProperty": "Prop3"
  },
  "layout": {
    "title": "Prop2-Prop1 scatter plot",
    "colWidth": 3,
    "height": 300
  }
}
```

| Parameter | Description |
|---|---|
| plotType | Set to `cfD3Scatter` for a scatter plot |
| xProperty | Name of meta-data property for the x-axis. Must be a member of `continuousProperties` |
| yProperty | Name of meta-data property for the y-axis. Must be a member of `continuousProperties` |
| cProperty | Name of meta-data property used to colour the scatter points. Must be a member of `categoricalProperties` |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |

Optional `layout` parameters:

| Parameter | Description |
|---|---|
| highlightTasks | set `true` to show the scatter point of the current selected task |
| xRange | set to `[xMin, xMax]` to set the limits of the x-axis. If not set, x-axis will auto scale during filtering |
| yRange | set to `[yMin, yMax]` to set the limits of the y-axis. If not set, y-axis will auto scale during filtering |
| colourMap | use to set the colour map. If not set, `d3.schemeCategory10` is used |
| opacity | set the opacity of the points (number between 0 and 1). If not set, a default value of 1 is used |
| groupBy | set to list of property names, e.g. `[Prop1, Prop2]`, where each property is a member of `categoricalProperties`. Points will be grouped according to their membership of `Prop1`, `Prop2` etc. Points beloning to each group will be joined by a line. |
| orderBy | if `groupBy` is set, `orderBy` can be used to define the order in which the points of a group are joined by the line. `orderBy` must be a membor of `continuousProperties`. If `orderBy` is not set, the default is `xProperty` |

#### Histogram

Example of a minimal `plot` object for a histogram:

```javascript
{
  "plotType": "cfD3Histogram",
  "data": {
    "property": "Prop1"
  },
  "layout": {
    "title": "Prop1 histogram",
    "colWidth": 3,
    "height": 300
  }
}
```
| Parameter | Description |
|---|---|
| plotType | Set to `cfD3Histogram` for a histogram |
| property | Name of meta-data property to be used. Must be a member of `continuousProperties` |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |

Optional `layout` parameters:

| Parameter | Description |
|---|---|
| highlightTasks | set `true` to show which histogram bar contains the current selected task |
| addSelectablePropertyToTitle | set `true` to add a dropdown selector for `data.property` |
| selectableOptions | list of properties to be used in dropdown selector (must be members of `continuousProperties`). If `selectableOptions` is not set, all of `continuouslProperties` are used |
| colour | set to specify the colour of the histogram bars. If not set, `cornflowerblue` is used. |


#### Grouped vertical bar chart

Example of a minimal `plot` object for a grouped vertical bar chart:

```javascript
{
  "plotType": "cfD3GroupedVertBarChart",
  "data": {
    "xProperty": "Prop1",
    "yProperty": "Prop2",
    "zProperty": "Prop3"
  },
  "layout": {
    "title": "Prop1-Prop2-Prop3 bar chart",
    "colWidth": 3,
    "height": 300
  }
}
```
| Parameter | Description |
|---|---|
| plotType | Set to `cfD3GroupedVertBarChart for a grouped vertical bar chart |
| xProperty | Name of meta-data property for the primary x-axis property. Must be a member of `categoricalProperties` |
| yProperty | Name of meta-data property for the y-axis property. Must be a member of `continuousProperties` |
| zProperty | Name of meta-data property for the secondary x-axis property. Must be a member of `categoricalProperties` |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |

Optional `layout` parameters:

| Parameter | Description |
|---|---|
| yRange | set to `[yMin, yMax]` to set the limits of the y-axis. If not set, y-axis will auto scale during filtering |
| filterBy | Set to an object `{Prop:value}` to apply an additional filter to the tasks that are currently selected in the main filters. Only those tasks which have property `Prop` equal to `value` will be included in the chart. |

#### Circle pack plot

Example of a minimal `plot` object for a circle pack hierarchy diagram:

```javascript
{
  "plotType": "cfD3CirclePack",
  "data": {
    "property": "Prop1"
  },
  "layout": {
    "title": "Prop1, Prop2 hierarchy",
    "colWidth": 3,
    "height": 300,
    "groupBy":["Prop1","Prop2"]
  }
}
```

| Parameter | Description |
|---|---|
| plotType | Set to `cfD3CirclePack` for a circle pack diagram |
| property | Set to the primary property by which the tasks are grouped (the outer-most circles). Must be a member of `categoricalProperties` |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |
| groupBy | List of properties `[Prop1, Prop2, Prop3]` defining the hierarchy of the groups (outer-most to inner-most circles) |

Optional `layout` parameters:

| Parameter | Description |
|---|---|
| colourByProperty | set `true` to colour bars by the value of `property` |
| colourMap | use to set the colour map. If not set, `d3.schemeCategory10` is used |


#### Response surface scatter plot

Example of a minimal `plot` object for a scatter plot that shows the quality of a response surface fit:
```javascript
{
  "plotType": "cfD3ResSurfScatter",
  "data": {
    "xProperty": "Prop1",
    "inputProperties": ["Prop2", "Prop3", "Prop4"],
    "cProperty": "Prop5",
    "model": "quadDiag"
  },
  "layout": {
    "title": "Response surface fit for Prop1",
    "colWidth": 3,
    "height": 300
  }
}
```

| Parameter | Description |
|---|---|
| plotType | Set to `cfD3ResSurfScatter` for a response surface scatter plot |
| xProperty | Name of the property to be fitted (the output property, or *dependent variable*). Must be a member of `continuousProperties` |
| inputProperties | A list of the properties used as inputs (*independent variables*) to the fit. Must be members of `continuousProperties` |
| cProperty | Name of meta-data property used to colour the scatter points. Must be a member of `categoricalProperties` |
| model | Set to `linear` to use linear combination of inputs in the fit. Set to `quadDiag` to use linear and quadratic terms (i.e. diagonal terms only, not cross terms). The fit is re-calculated every time the filter is changed. |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |


Optional `layout` parameters:

| Parameter | Description |
|---|---|
| highlightTasks | set `true` to show the scatter point of the current task |
| xRange | set to `[xMin, xMax]` to set the limits of the x-axis. If not set, x-axis will auto scale during filtering |
| colourMap | use to set the colour map. If not set, `d3.schemeCategory10` is used |
| opacity | set the opacity of the points (number between 0 and 1). If not set, a default value of 1 is used |

### Detailed data plots

For detailed data plots, the data to be displayed is requested via a web server (could be from a remote server or from the local machine) using the `fetchData` object. Filter functions can be used to translate the data into the form required by **dbslice**.

#### Line plot

**Data format** The `d3LineSeries` plot will draw one or more lines of data. The format of this collection of lines is an **array of line series obejcts** where each line series object contains:
```javascript
{
  label : "this curve label",
  taskId : taskIdNow,
  data : [{"x":0.1, "y":0.2}, {"x":0.2, "y":0.15}, {"x":0.3, "y":0.1}]
}
```
| Parameter | Description |
|---|---|
| label | The mouseover label for this line |
| taskId | The taskId associated with this line |
| data | An array of `{"x":xpt, "y":ypt}` objects, one per data point |

The `lineSeriesFromLines` and `lineSeriesFromCsv` filters can be used to assemble the requried data format from a series of individual `json` or `csv` files for each `task`.

Example of a minimal `plot` object for a line plot (usually used with one line for each `task` in the current filter):
```javascript
{
  "plotType": "d3LineSeries",
  "fetchData": {
    "urlTemplate": "data/${taskId}/line_data.json",
    "tasksByFilter": true,
    "dataFilterType": "lineSeriesFromLines",
    "dataFilterConfig": {
      "cProperty": "Prop1"
    }
  },
  "layout": {
    "title": "Line plots",
    "colWidth": 3,
    "height": 300,
    "cSet": "Prop1"
  }
}
```         

| Parameter | Description |
|---|---|
| plotType | Set to `d3LineSeries` for a plot with one or more lines |
| urlTemplate | Template for the location of the data for each line. The `${taskId}` is replaced with the `taskId` of each `task` in the current filter. |
| tasksByFilter | Set to `true` so that the `task`s in the current filter are used. |
| dataFilterType | The filter `lineSeriesFromLines` has been chosen here. This filter simply assembles the files for each `task` into one collection, ready for plotting. Each file is already in the correct format, an array of coordinates, e.g. `[{"x":0.1, "y":0.2}, {"x":0.2, "y":0.15}, {"x":0.3, "y":0.1}]`. Another common filter for line plots is `lineSeriesFromCsv` - see below.|
| dataFilterConfig | An object with additional config information for the filter. In this case, we specify `"cProperty": "Prop1"` so that `Prop1` (a meta-data property that is a member of `categoricalProperties`) is used to colour the lines. |
| title | Title of the chart |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |
| cSet | The meta-data property used as the colour scale for the lines. Must be a member of `categoricalProperties`.

Optional `layout` parameters:

| Parameter | Description |
|---|---|
| highlightTasks | set `true` to show the line of the current selected task |
| xAxisLabel | use to specify the x-axis label |
| yAxisLabel | use to specify the y-axis label |

Example of `fetchData` object when using the `lineSeriesFromCsv` filter to read standard `.csv` files:

```javascript
"fetchData": {
  "urlTemplate": "data/${taskId}/line_data.csv",
  "text": true,
  "tasksByFilter": true,
	"autoFetchOnFilterChange": true,
  "maxTasks": 100,
  "dataFilterType": "lineSeriesFromCsv",
  "dataFilterConfig": {
    "skipCommentLines": true,
    "xProperty": "x_data",
    "yProperty": "y_data",
    "cProperty": "Prop1"
  }
}
```

| Parameter | Description |
|---|---|
| text | set `true` for `csv` file |
| autoFetchOnFilterChange | set `true` if the data for this plot should be re-fetched as soon as the filter is changed (i.e. without waiting for the user to click the `Plot selected tasks` button) |
| maxTasks | to limit the number of files fetched, set this to an integer |
| dataFilterType | `lineSeriesFromCsv` will read multiple `csv` files and convert to the required **dbslice** format for line plots |
| skipCommentLines | set `true` to ignore lines at the start of the `csv` file that start with a `#`.
| xProperty | the `csv` column name that will be used for the x co-ordinate.
| yProperty | the `csv` column name that will be used for the y co-ordinate.
| cProperty | the meta-data property to be used for line colouring (must be a member of `categoricalProperties`).

#### Surface plot from unstructured data

**Data format** The `threeTriMesh` plot will visualise a collection of surfaces in 2D or 3D. The format is a binary buffer (`.tm3` file) that has the structure as if written by the following Python code:
```python
import numpy as np
f = open("surfaces.tm3","wb")

f.write(np.int32(len(steps)).tobytes())  # number of snapshots in time (32 bit integer)
f.write(np.int32(len(surfaces)).tobytes())  # number of surfaces (32 bit integer)

for step in steps:  # loop over snapshots
  for surface in sufaces  # loop over surfaces
    f.write(np.array(surface_name,dtype='S96').tobytes())  # name of surface, in a padded 96 character string
    f.write(nverts.tobytes())  # number of vertices in this surface (32 bit integer)
    f.write(ntris.tobytes())  # number of triangles in this surface  (32 bit integer)
    f.write(np.int32(1).tobytes())  # number of properties at each vertices (other than coordinates) - set = 1 in current version
    f.write(rmax.tobytes())  # radius of sphere enclosing all vertices in this surface (can be approximate) (32 bit float)
    f.write(xrange.tobytes())  # 1-D array with x limits of vertices in this surface [x_min, x_max] (32 bit floats)
    f.write(yrange.tobytes())  # 1-D array with y limits of vertices in this surface [y_min, y_max] (32 bit floats)
    f.write(zrange.tobytes())  # 1-D array with z limits of vertices in this surface [z_min, z_max] (32 bit floats)
    f.write(vertices.tobytes())  # 1-D array of vertices, nverts*3 elements: [x1,y1,z1,x2,y2,z2,...] (32 bit floats)
    f.write(indices.tobytes())  # 1-D array of triangle indices, ntris*3 elements. For each triangle in turn, gives the index of each of the 3 vertices (32 bit integers)
    f.write(np.array(prop_name,dtype='S96').tobytes())  # name of property, in a padded 96 character string
    f.write(prange.tobytes())  # 1-D array with limits of property in this surface [p_min, p_max] (32 bit floats)
    f.write(values.tobytes())  # 1-D array of property values, nverts elements (32 bit floats)

f.close()
```

A helper code to convert `vtk` files to the above `tm3` format is availabe [here](https://github.com/grahampullan/dbslice/blob/master/python_utils/vtk_to_tm3.py).

It is common to have a separate surface plot for each `task`. To enable this we configure a `plotRow` (a container for our plots) and use the `ctrl` object to populate the `plots` array:

```javascript
{ 
  "title" : "3-D Surface plots",
  "plots" : [] ,
  "ctrl" : { 
    "plotType" : "threeTriMesh" ,  
    "fetchData" : {
      "urlTemplate" : "data/${taskId}/surface.tm3" ,
      "buffer" : true ,
      "tasksByFilter" : true ,
      "maxTasks" : 8
    }
    "layout" : { 
      "colWidth" : 3 , 
      "height" : 350 
    }  
  }
}
```
| Parameter | Description |
|---|---|
| title | Title of this `plotRow` container |
| plots | We initialise the plots array to be empty |
| plotType | Set to `threeTriMesh` to plot `.tm3` format surfaces |
| urlTemplate | Templare for location where each surface is stored. `${taskId}` will be replaced by `taskId` of each `task` in the current filter |
| buffer | Set to `true` because `.tm3` files are binary buffers |
| tasksByFilter | Set to `true` to tell **dbsluce** to obtain `task`s from the current filter |
| maxTasks | Limit on nunber of surface plots |
| colWidth | Width of the chart, integer between 1 and 12 |
| height | Height of the chart in pixels |

Optional `layout` parameters:

| Parameter | Description |
|---|---|
| highlightTasks | set `true` to highlight the plot of the current selected `task` |
| cameraSync | set `true` to synchronise the view of all the surface plots in the current `plotRow` container |

