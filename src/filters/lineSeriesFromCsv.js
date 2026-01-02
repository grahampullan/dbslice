import * as d3 from "d3v7";

// Convert per-item CSV responses (either raw text or parsed rows) into LineSeries data.
// Each CSV is expected to have x/y columns (defaults to the first two columns).
// config: {
//   xProperty, yProperty,
//   itemLabels, cPropertyValues,
//   skipFirstLine, skipFirstNLines, skipCommentLines, skipCommentChar, spaceSeparated
// }
function lineSeriesFromCsv(rawData, itemsOnPlot = [], config = {}) {
  const series = [];

  rawData.forEach((rows, index) => {
    let csvRows = rows;

    // Allow raw text with preprocessing options.
    if (typeof rows === "string") {
      let dataTextLines = rows.split("\n");
      if (config.skipFirstLine) dataTextLines = dataTextLines.slice(1);
      if (config.skipFirstNLines !== undefined) dataTextLines = dataTextLines.slice(config.skipFirstNLines);
      if (config.skipCommentLines) {
        const commentChar = config.skipCommentChar ?? "#";
        let nSlice = 0;
        for (let i = 0; i < dataTextLines.length; i++) {
          if (dataTextLines[i][0] === commentChar) nSlice++;
          else break;
        }
        dataTextLines = dataTextLines.slice(nSlice);
      }
      let dataTextClean;
      if (config.spaceSeparated) {
        dataTextClean = dataTextLines.map((l) => l.split(" ").filter((d) => d.length > 0).join()).join("\n");
      } else {
        if (dataTextLines.length) {
          dataTextLines[0] = dataTextLines[0].split(",").map((d) => d.trim()).join();
        }
        dataTextClean = dataTextLines.join("\n");
      }
      csvRows = d3.csvParse(dataTextClean);
    }

    if (!csvRows || !csvRows.length) return;

    const keys = Object.keys(csvRows[0]);
    const xKey = config.xProperty || keys[0];
    const yKey = config.yProperty || keys[1] || keys[0];

    const line = csvRows.map((row) => ({
      x: +row[xKey],
      y: +row[yKey],
    }));

    const itemId = itemsOnPlot[index] ?? index;
    const label = config.itemLabels?.[index] ?? itemId;
    const cKey = config.cPropertyValues?.[index];
    const seriesEntry = { label, data: line, itemId };
    if (cKey !== undefined) seriesEntry.cKey = cKey;
    series.push(seriesEntry);
  });

  return { series };
}

export { lineSeriesFromCsv };
