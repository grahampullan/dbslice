This is a branch of the original dbslice project (https://github.com/grahampullan/dbslice).

It reduces the plotting functionality to three basic plot types: bar, histogram, and scatter plots. 

It adds the functionality that allows the user to dynamically add or remove:
- plots
- plotting rows
- data

The functionality to load in predefined session layouts has been introduced.

The title texts of:
- the session header
- individual plot rows
- individual plots
can now be interactively changed.

Data can now be tracked across the plots.

Known bugs and missing desired behaviour:
- On passing a filtered subset to neighbouring plot on delete actions the full data is displayed on the moved plot as opposed to the filtered subset.
- Color coding has not yet been implemented
- Scatter plots do not have points remain selected when clicked
- Flow field plots do not yet adjust to filtering actions on metadata plots
- Session cannot be saved
- Data can nly be loaded from folders from the root down

Getting the minimal working example going:
- Download the repository
- Initialise a local server in the repository folder. E.g. Install the 'http-server' package from 'npm' locally in this folder, or install it globally, and then initialise the server by 'http-server -p 1234'. 
- Open a browser, and type 'localhost/examples/comp3row/index.html' into the address bar, and the example should appear.
