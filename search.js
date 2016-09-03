var _ = require('lodash');
var fs = require('fs');
var lunr = require('lunr');

var discussions = JSON.parse(fs.readFileSync('discussions.json', 'utf8'));
var discussionsById = _.keyBy(discussions, 'id');

var index = lunr(function () {
    this.field('title', { boost: 10 });
    this.field('url');
    this.ref('id')
});

discussions
    .filter(function (discussion) { return !discussion.isClosed })
    .forEach(function (discussion) { index.add(discussion) })
;

var results = index.search(process.argv[2]);
var resultantDiscussions = results.map(function (result) {
    return discussionsById[result.ref];
    return {
        discussion: discussionsById[result.ref],
        score: result.score
    };
});
console.log(resultantDiscussions);