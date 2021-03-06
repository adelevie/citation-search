var fs = require('fs');
var _ = require('underscore');
var xml2js = require('xml2js');
require('citation');

var parser = new xml2js.Parser();

var endsWithExtension = function(filename, extension) {
  return filename.split('.').reverse()[0] === extension;
};

var endsWithXml = function(filename) {
  return endsWithExtension(filename, 'xml');
};

var filenames = _.filter(fs.readdirSync('../courtlistener'), endsWithXml).reverse();

var citationsFromOpinion = function(opinion) {
  var text = opinion['_'];
  return Citation.find(text, {excerpt:200})['citations'];
};

var saveCitationsFromFilename = function(filename) {
  var allCitations;
  var path = '../courtlistener/' + filename;
  fs.readFile(path, function(err, data) {
    var newFilename = filename.split('.xml')[0] + '.json';
    parser.parseString(data, function(err, result) {
      opinions = result['opinions']['opinion'];
      allCitations = _.map(opinions, function(opinion) {
        var citations = citationsFromOpinion(opinion);
        var uscCitations = _.filter(citations, function(citation) {
          return citation['type'] === 'usc';
        });
        var uscAndCfrCitations = _.filter(citations, function(citation) {
          return citation['type'] === 'usc' || citation['type'] === 'cfr';
        });
        return _.map(uscCitations, function(citation) {
          citation['case_name'] = opinion['$']['case_name'];
          citation['case_id'] = opinion['$']['id'];
          var year = filename.split('-')[1].split('.xml')[0];
          citation['case_year'] = year;
          citation['courtlistener_path'] = opinion['$']['path'];

          return citation;
        });
      });
    });

    var output = JSON.stringify(allCitations);
    //var newFilename = filename.split('.xml')[0] + '.json';
    fs.writeFile(newFilename, output, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log('The file was saved!');
      }
    });
  });
};

_.each(filenames, function(filename) {
  saveCitationsFromFilename(filename);
});
