var imgHH = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('HH');

//var image = ee.Image(ee.ImageCollection('COPERNICUS/S1_GRD')

var elevationVis = {
  min: -50.0,
  max: 1000.0,
  palette: ['0d13d8', '60e1ff', 'ffffff']
};

var desc = imgHH.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc = imgHH.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var ja = ee.Filter.date('2018-01-01', '2018-01-30');
var ma = ee.Filter.date('2018-05-01', '2018-05-30');
var aa = ee.Filter.date('2018-08-01', '2018-08-30');

var aChange = ee.Image.cat(
        asc.filter(ma).merge(desc.filter(ma)).mean(),
        asc.filter(aa).merge(desc.filter(aa)).mean(),
        asc.filter(ja).merge(desc.filter(ja)).mean());


var greenland = aChange.clip(roi);
Map.addLayer(greenland, {min: -25, max: 5}, 'ROI 2018', true);

var greenland1 = aChange.clip(roi1);
Map.addLayer(greenland1, {min: -25, max: 5}, 'RPI-1 2018', true);


// Merge features

var newfc = drysnow.merge(wetsnow).merge(water).merge(ice)

// TRAIN/TEST Data


//var bands = ['HH','VH','angle'];

var bands = ['HH','HH_1','HH_2'];
var training = aChange.select(bands).sampleRegions({
 collection:newfc,
 properties:['landcover'],
 scale:30
}).randomColumn();

//PARTITION OF TRAINING DATA

// Approximately 70% of our training data
var trainingPartition = training.filter(ee.Filter.lt('random', 0.7));

// Approximately 30% of our training data
var testingPartition = training.filter(ee.Filter.gte('random', 0.7));

// Export the training and testing data to TFRecord format

var outputFeatures = Array.from(bands);
outputFeatures.push('LC');

var link = '1uTqSIo5wbvuYzYYgxTpf60jveKPkX1qb'; //unique ID
//var link = '9a26cef21ab34f6257d0a250882124fc'; //unique ID
var train_desc = 'tf_trainFinal_' + link;
var test_desc = 'tf_testFinal_' + link;



Export.table.toDrive({
 collection: trainingPartition, 
 description: train_desc, 
 fileFormat: 'TFRecord', 
 selectors: outputFeatures
});
Export.table.toDrive({
 collection: testingPartition, 
 description: test_desc, 
 fileFormat: 'TFRecord', 
 selectors: outputFeatures
});


var evaluation = aChange.select(bands);
var image_desc = 'tf_image_' + link;


Export.image.toDrive({
  image: evaluation,
  description: image_desc,
  scale: 30,
  fileFormat: 'TFRecord',
  region: roi1,
  formatOptions: {
    'patchDimensions': [256, 256],
    maxFileSize: 104857600,
    compressed: true,
  },
});