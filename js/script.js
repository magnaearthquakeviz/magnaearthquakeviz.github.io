
let outline = d3.json('Resources/Utah_State_Boundary.geojson');
let quakes = d3.json('Data/earthquake_data.geojson');
let outline2 = d3.json('Resources/Utah_Lakes_NHD.geojson');
let faults = d3.json('Data/utah-qfaults_2017.geojson');
let stations = d3.json('Data/station_info.json');

Promise.all([outline, quakes, outline2, faults, stations]).then(combinedData => {
    console.log(combinedData);

    // add map for the first panel on the overview of the mainshock
    let map12 = new Maps(combinedData, 1, 2)
    let svg12 = map12.drawUtahBaseMap()
    map12.addLakes(svg12)
    map12.addFaults(svg12)
    map12.addMainShock(svg12)

    // add map for the second panel on the intensity of the mainshock
    let map21 = new Maps(combinedData, 2, 1)
    let svg21 = map21.drawUtahBaseMap()
    map21.addSeismometers(svg21)
    map21.addMainShock(svg21)

    // add map for the second panel on the intensity of the mainshock
    let map31 = new Maps(combinedData, 3, 2)
    map31.drawGoogleMap();
});
