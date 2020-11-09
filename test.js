d3.json('resources/utah.geojson').then(data => {

    let width, height;
    width = height = 500;

    let projection = d3.geoConicConformal()
        .parallels([40 + 43 / 60, 41 + 47 / 60])
        .rotate([111 + 30 / 60, 0])
        .fitSize([width, height], data);

    let path = d3.geoPath().projection(projection);

    // Add the map.
    d3.select('#panel1-2 > div.visArea')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .selectAll('path')
        .data([data.geometry])
        .join('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', '1px');
});