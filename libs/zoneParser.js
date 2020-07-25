const parser = require('xml2js').Parser();
const fs = require('fs');

exports.parse = async (fileName) => {
    const data = fs.readFileSync(__dirname + `/../public/${fileName}`);
    const result = await parser.parseStringPromise(data);
    const coordinates = result.kml.Document[0].Folder[0].Placemark.map(p => {
        const coordinates = p.Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates[0].replace(/\n/gi, '').replace(/ /gi, '').split(',0').filter(c => c !== '').map(c => {
            const coords = c.split(',');
            return [parseFloat(coords[1]), parseFloat(coords[0])];
        });
        return {
            coordinates,
            name: p.name[0]
        };
    });
    return coordinates;
};