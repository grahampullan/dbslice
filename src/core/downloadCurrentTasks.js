import { dbsliceData } from '../core/dbsliceData.js';

function downloadCurrentTasks() {

    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(dbsliceData.filteredTaskIds)], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "taskIds.json";
    a.click();

}

export { downloadCurrentTasks };