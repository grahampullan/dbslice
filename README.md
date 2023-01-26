# dbslice

<a href="https://dbslice.org"><img src="/img/dbslice-180.png" align="left" hspace="10" vspace="6"></a>

[**dbslice**](https://www.dbslice.org) is a web app for data exploration. The core principle is that the data to be visualized is hierarchical. [**dbslice**](http://www.dbslice.org) expects data items (called `tasks`) to be chracterised by high-level properties (referred to as meta-data) and also to be associated with several low-level, detailed data types (such as line data, surface data, 3D data). [**dbslice**](http://www.dbslice.org) allows the user to interactively filter the meta-data and then request detailed data for the subset of interest.

**dbslice** is built on the [d3.js](https://d3js.org) , [crossfilter.js](https://github.com/crossfilter/crossfilter) and [three.js](https://threejs.org) libraries.

## Demonstrations

There are several live [demonstrations](https://www.dbslice.org/demos) at the dbslice web site.

---

## Documentation

* [Step-by-step](#step-by-step)

---

## Step-by-step 
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









