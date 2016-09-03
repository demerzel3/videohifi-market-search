var fs = require('fs');
var moment = require('moment');
var casper = require('casper').create({
    clientScripts: [
        'node_modules/moment/min/moment.min.js',
    ],
});

function readDiscussions() {
    var UPDATED_AT_DATE_FORMAT = 'MMMM D hh:mmA';

    var items = $('.DataList.Discussions .Item');
    var discussions = [];

    for (var i = 0; i < items.length; i++) {
        var item = $(items[i]);
        var discussionAnchor = item.find('.ItemContent.Discussion .Title');
        var discussionUrl = discussionAnchor[0].href;
        var authorAnchor = item.find('.ShowDiscussionAuthor a');
        var meta = item.find('.Meta');
        var lastCommentDateString = meta.find('.LastCommentDate').text().trim();
        var viewsCount = parseInt(item.find('.ViewsBox').children().remove().end().text().trim());
        var commentsCount = parseInt(item.find('.AnswersBox').children().remove().end().text().trim());

        // The text content of .Meta contains the updated at date.
        var updatedAtString = meta.clone().children().remove().end().text().trim();
        var updatedAt = moment(updatedAtString, UPDATED_AT_DATE_FORMAT);
        var lastCommentYear = lastCommentDateString.match(/\d{4}/);
        if (lastCommentYear && lastCommentYear[0]) {
            updatedAt.year(parseInt(lastCommentYear[0]));
        }

        discussions.push({
            id: parseInt(discussionUrl.match(/discussion\/(\d+)\//)[1]),
            title: discussionAnchor.text(),
            url: discussionUrl,
            isClosed: item.find('.Meta .Closed').length > 0,
            author: {
                username: authorAnchor.text(),
                profileUrl: authorAnchor[0].href,
            },
            viewsCount: viewsCount,
            commentsCount: commentsCount,
            updatedAt: updatedAt.format(),
        });
    }

    return discussions;
}

function findNextPageUrl() {
    var nextPageAnchor = $('.Pager a.Next');

    if (nextPageAnchor.length > 0) {
        return nextPageAnchor[0].href;
    } else {
        return null;
    }
}

const maxPages = 1000;
var nPages = 0;
var discussions = [];

casper.start('http://forum.videohifi.com/categories/mkt-cuffie-e-complementi');

casper.then(function scrapePage() {
    this.echo('Scraping page: ' + this.getTitle());

    discussions = discussions.concat(this.evaluate(readDiscussions));
    this.echo(discussions.length);

    ++nPages;

    var nextPageUrl = this.evaluate(findNextPageUrl);
    this.echo('nextPageUrl is ' + nextPageUrl);
    if (nextPageUrl && nPages < maxPages) {
        this.thenOpen(nextPageUrl, scrapePage);
    }
});

casper.then(function() {
    fs.write('discussions.json', JSON.stringify(discussions), 'w');
    this.echo('done.');
});

casper.run();