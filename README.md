This is a branch of the original dbslice project (https://github.com/grahampullan/dbslice).

It reduces the plotting functionality to three basic plot types: bar, histogram, and scatter plots. 

It adds the functionality that allows the user to dynamically add or remove:
- plots
- plotting rows
- data

The functionality to load in predefined session layouts has been introduced, as well as loading in and removing data.

The title texts of:
- the session header
- individual plot rows
- individual plots
can now be interactively changed.

Data can now be tracked across the plots.

Known bugs and missing desired behaviour:
- Color coding has not yet been implemented
- Saving the session


Getting the minimal working example going:
- Download the repository
- Initialise a local server in the repository folder. E.g. Install the 'http-server' package from 'npm' locally in this folder, or install it globally, and then initialise the server by 'http-server -p 1234'. 
- Open a browser, and type 'localhost/examples/comp3row/index.html' into the address bar, and the example should appear.
