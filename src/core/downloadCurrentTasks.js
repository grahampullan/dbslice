import { dbsliceData } from '../core/dbsliceData.js';

function downloadCurrentTasks() {

    const cfData = dbsliceData.session.cfData;
    const dimId = cfData.categoricalProperties.indexOf( "taskId" );
    const dim = cfData.categoricalDims[ dimId ];
    const currentMetaData = dim.top(Infinity);

    const header = Object.keys(currentMetaData[0]).join(',');
    const csv = currentMetaData.map((row) => {
        return Object.values(row).join(',');
    });
    csv.unshift(header);
    const csvOut = csv.join('\n');

    const blob = new Blob([csvOut], { type: 'text/csv;charset=utf-8;' });

    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "currentMetaData.csv";
    a.click();

}

export { downloadCurrentTasks };