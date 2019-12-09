This is a branch of the original dbslice project (https://github.com/grahampullan/dbslice).

It reduces the plotting functionality to three basic plot types: bar, histogram, and scatter plots. 

It adds the functionality that allows the user to dynamically add or remove: 
plots
plotting rows
data

The functionality to load in predefined session alyouts has been introduced.

The titles the session header, individual plot rows, plots can now be interactively changed.

Known bugs and missing desired behaviour:
- Histograms have their y-axis labels hidden
- On passing a filtered subset to neighbouring plot on delete actions the full data is displayed on the moved plot as opposed to the filtered subset.
- When adding scatter plots color coding property can not be selected
- Scatter plots do not have points remain selected when clicked
- If the layout is loaded before data an error is thrown as there is no data for any plots.


Getting the minimal working example going:
- Download the repository
- in it's folder initialise a local server. Install the 'http-server' package from 'npm' locally in this folder, or install it globally. Then initialise the server by e.g. 'http-server -p 1234'. 
- Open a browser, and type 'localhost/examples/comp3row/index.html' into the address bar, and the example should appear.
