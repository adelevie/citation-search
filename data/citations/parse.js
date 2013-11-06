var fs = require('fs');
var _ = require('underscore');
var xml2js = require('xml2js');
require('citation');

var parser = new xml2js.Parser();

var filenames = _.filter(fs.readdirSync('../courtlistener'), function(f) {
  return f !== 'download.sh';
});

var citationsFromOpinion = function(opinion) {
  var text = opinion['_'];
  return Citation.find(text)['citations'];
};

var saveCitationsFromFilename = function(filename) {
  var allCitations;
  var path = '../courtlistener/' + filename;
  fs.readFile(path, function(err, data) {
    parser.parseString(data, function(err, result) {
      opinions = result['opinions']['opinion'];
      allCitations = _.map(opinions, function(opinion) {
        var citations = citationsFromOpinion(opinion);
        var uscCitations = _.filter(citations, function(citation) {
          return citation['type'] === 'usc';
        });
        return _.map(uscCitations, function(citation) {
          citation['case_name'] = opinion['$']['case_name'];
          citation['case_id'] = opinion['$']['id'];

          return citation;
        });
      });
    });

    var output = JSON.stringify(allCitations);
    var newFilename = filename.split('.xml')[0] + '.json';
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