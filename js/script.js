
let outline = d3.json('Resources/Utah_State_Boundary.geojson');
let quakes = d3.json('Data/earthquake_data.geojson');
let lakes = d3.json('Resources/Utah_Lakes_NHD.geojson');
let faults = d3.json('Data/utah-qfaults_2017.geojson');
let stations = d3.json('Data/station_info.json');
let feltReports = d3.json('Data/felt_reports_zipcodes.geojson')
let xsec = d3.csv('Data/xsec_projection_updated.csv')
let googleMapStyles = d3.json("Resources/google-map-style.json")

Promise.all([outline, quakes, lakes, faults, stations, feltReports, xsec, googleMapStyles]).then(combinedData => {
    console.log(combinedData);

    // add map for the first panel on the overview of the mainshock
    let map12 = new Maps(combinedData, 1, 2)
    map12.drawBaseGoogleMap(combinedData[7], 6.5, [39.321000, -111.093700]);
    map12.createFaultlineOverlay();
    map12.createMainShockOverlay();

    // add map for the second panel on the intensity of the mainshock
    let map21 = new Maps(combinedData, 2, 1)
    map21.drawBaseGoogleMap(combinedData[7], 6.5, [39.321000, -111.093700]);
    map21.addIntensityDataGMap();

    // add map for the third panel that shows all the aftershocks
    let map32 = new Maps(combinedData, 3, 2);
    map32.drawBaseGoogleMap(combinedData[7], 10.5, [40.751, -112.078]);
    map32.createEarthquakeOverlay();
    map32.createXSectionOverlay();

    let axisOptions = ['time', 'mag', 'depth', 'lat', 'lon'];

    let scatter41 = new Scatter(combinedData[1], 4, 1);
    scatter41.drawPlot('time', 'mag', 'depth');

    let widget42 = new Widget(4, 2);
    widget42.drawWidget();

    scatter41.addDropdownAndSlider(axisOptions);

    let scatter52 = new Scatter(combinedData[6], 5, 2, xsec=true);
    scatter52.drawPlot('x', 'depth', 'mag');
    scatter52.addDropdownAndSlider(['x', 'depth', 'mag', 'time'])
});
